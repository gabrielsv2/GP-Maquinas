const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const config = require('./config');
const db = require('./database');
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const reportRoutes = require('./routes/reports');

const app = express();

// Middleware de segurança
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite de 100 requests por IP
    message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use('/api/', limiter);

// Middleware
app.use(cors({
    origin: config.app.corsOrigin,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos (raiz do projeto)
app.use(express.static(path.join(__dirname)));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/reports', reportRoutes);

// Rota de health check
app.get('/api/health', async (req, res) => {
    try {
        // Tentar conectar com o banco
        await db.testConnection();
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            environment: config.app.environment,
            database: 'connected'
        });
    } catch (error) {
        console.error('❌ Erro na health check:', error);
        res.json({ 
            status: 'WARNING', 
            timestamp: new Date().toISOString(),
            environment: config.app.environment,
            database: 'disconnected',
            message: 'Servidor funcionando, mas banco não disponível'
        });
    }
});

// Rota principal - servir o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para todas as outras páginas (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('❌ Erro no servidor:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    
    // Se for um erro de validação do express-validator
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ 
            error: 'Dados inválidos',
            details: 'O corpo da requisição não é um JSON válido'
        });
    }
    
    // Se for um erro de limite de tamanho
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ 
            error: 'Dados muito grandes',
            details: 'O corpo da requisição excede o limite permitido'
        });
    }
    
    // Para desenvolvimento, retornar mais detalhes
    if (config.app.environment === 'development') {
        return res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: err.message,
            stack: err.stack
        });
    }
    
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Algo deu errado'
    });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Inicializar servidor
const PORT = config.app.port;

async function startServer() {
    try {
        console.log('🚀 Iniciando servidor...');
        console.log(`🌍 Ambiente: ${config.app.environment}`);
        console.log(`�� Porta: ${PORT}`);
        console.log(`📊 Configurações do banco: ${config.database.host}:${config.database.port}`);
        
        // Iniciar servidor primeiro
        const server = app.listen(PORT, () => {
            console.log(`✅ Servidor rodando na porta ${PORT}`);
            console.log(`🔗 URL: http://localhost:${PORT}`);
            console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
        });
        
        // Configurar timeout para o servidor
        server.timeout = 30000; // 30 segundos
        
        // Tentar conectar com banco em background
        setTimeout(async () => {
            try {
                await db.testConnection();
                console.log('✅ Conexão com banco de dados estabelecida');
                
                // Verificar saúde do pool
                await db.checkPoolHealth();
            } catch (error) {
                console.error('⚠️ Aviso: Não foi possível conectar com o banco de dados:', error.message);
                console.log('🔄 O servidor continuará funcionando e tentará reconectar...');
                
                // Tentar reconectar periodicamente
                setInterval(async () => {
                    try {
                        await db.testConnection();
                        console.log('✅ Reconexão com banco de dados bem-sucedida');
                    } catch (retryError) {
                        console.log('🔄 Tentativa de reconexão falhou, tentando novamente...');
                    }
                }, 30000); // Tentar a cada 30 segundos
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erro crítico ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🔄 SIGTERM recebido, fechando servidor...');
    try {
        await db.closePool();
        console.log('✅ Servidor fechado com sucesso');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao fechar servidor:', error.message);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    console.log('🔄 SIGINT recebido, fechando servidor...');
    try {
        await db.closePool();
        console.log('✅ Servidor fechado com sucesso');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao fechar servidor:', error.message);
        process.exit(1);
    }
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada não tratada:', reason);
    process.exit(1);
});
