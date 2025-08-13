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
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: config.app.environment === 'development' ? err.message : 'Algo deu errado'
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
        console.log(`🔧 Porta: ${PORT}`);
        
        // Iniciar servidor primeiro
        app.listen(PORT, () => {
            console.log(`✅ Servidor rodando na porta ${PORT}`);
            console.log(`🔗 URL: http://localhost:${PORT}`);
            console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
        });
        
        // Tentar conectar com banco em background
        setTimeout(async () => {
            try {
                await db.testConnection();
                console.log('✅ Conexão com banco de dados estabelecida');
            } catch (error) {
                console.error('⚠️ Aviso: Não foi possível conectar com o banco de dados:', error.message);
                console.log('🔄 O servidor continuará funcionando e tentará reconectar...');
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erro crítico ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM recebido, fechando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT recebido, fechando servidor...');
    process.exit(0);
});
