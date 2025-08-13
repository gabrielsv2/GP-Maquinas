const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'https://sistema-gp-maquinas.netlify.app',
    credentials: true
}));
app.use(express.json());

// Configuração do banco Neon
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Chave secreta para JWT
const JWT_SECRET = process.env.JWT_SECRET || 'gp-maquinas-secret-key-2024';

// Dados simulados das lojas (fallback se o banco não estiver disponível)
const stores = [
    { store_id: 'GPAnhaiaMello', store_name: 'GP Anhaia Mello', region: 'São Paulo' },
    { store_id: 'GPAricanduva', store_name: 'GP Aricanduva', region: 'São Paulo' },
    { store_id: 'GPCampoLimpo', store_name: 'GP Campo Limpo', region: 'São Paulo' },
    { store_id: 'GPCarrão', store_name: 'GP Carrão', region: 'São Paulo' },
    { store_id: 'GPCidadeDutra', store_name: 'GP Cidade Dutra', region: 'São Paulo' },
    { store_id: 'GPCotia', store_name: 'GP Cotia', region: 'São Paulo' },
    { store_id: 'GPCruzeirodoSul', store_name: 'GP Cruzeiro do Sul', region: 'São Paulo' },
    { store_id: 'GPDemarchi', store_name: 'GP Demarchi', region: 'São Paulo' },
    { store_id: 'GPEdgarFacó', store_name: 'GP Edgar Facó', region: 'São Paulo' },
    { store_id: 'GPGuarulhos', store_name: 'GP Guarulhos', region: 'São Paulo' },
    { store_id: 'GPInterlagos', store_name: 'GP Interlagos', region: 'São Paulo' },
    { store_id: 'GPJabaquara', store_name: 'GP Jabaquara', region: 'São Paulo' },
    { store_id: 'GPJundiaí', store_name: 'GP Jundiaí', region: 'São Paulo' },
    { store_id: 'GPLapa', store_name: 'GP Lapa', region: 'São Paulo' },
    { store_id: 'GPLimão', store_name: 'GP Limão', region: 'São Paulo' },
    { store_id: 'GPMboiMirim', store_name: 'GP M\'Boi Mirim', region: 'São Paulo' },
    { store_id: 'GPMogi', store_name: 'GP Mogi', region: 'São Paulo' },
    { store_id: 'GPMorumbi', store_name: 'GP Morumbi', region: 'São Paulo' },
    { store_id: 'GPOsasco', store_name: 'GP Osasco', region: 'São Paulo' },
    { store_id: 'GPRaguebChohfi', store_name: 'GP Ragueb Chohfi', region: 'São Paulo' },
    { store_id: 'GPRibeirãoPreto', store_name: 'GP Ribeirão Preto', region: 'São Paulo' },
    { store_id: 'GPRicardoJafet', store_name: 'GP Ricardo Jafet', region: 'São Paulo' },
    { store_id: 'GPSantoAndré', store_name: 'GP Santo André', region: 'São Paulo' },
    { store_id: 'GPTaboão', store_name: 'GP Taboão', region: 'São Paulo' }
];

// Middleware para validar token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso necessário' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
};

// Rota de login
app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Verificar se é admin
        if (username === 'admin' && password === 'admin') {
            const token = jwt.sign(
                { 
                    id: 0, 
                    username: 'admin', 
                    role: 'admin',
                    store: null
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.json({
                success: true,
                token,
                user: {
                    id: 0,
                    username: 'admin',
                    role: 'admin',
                    fullName: 'Administrador do Sistema',
                    store: null
                }
            });
        }

        // Verificar se é usuário de loja
        if (password === '123456') {
            const store = stores.find(s => s.store_id === username);
            if (store) {
                const token = jwt.sign(
                    { 
                        id: store.store_id, 
                        username: store.store_id, 
                        role: 'store',
                        store: store.store_id
                    },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return res.json({
                    success: true,
                    token,
                    user: {
                        id: store.store_id,
                        username: store.store_id,
                        role: 'store',
                        fullName: store.store_name,
                        store: store.store_id
                    }
                });
            }
        }

        // Login inválido
        return res.status(401).json({ 
            error: 'Usuário ou senha incorretos' 
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
});

// Verificar token
app.get('/auth/verify', authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: req.user
    });
});

// Rota para salvar serviços
app.post('/services', authenticateToken, async (req, res) => {
    try {
        const service = req.body;
        
        // Aqui você pode adicionar a lógica para salvar no banco de dados
        // Por enquanto, vamos apenas retornar sucesso
        console.log('Serviço recebido:', service);
        
        res.json({
            success: true,
            message: 'Serviço salvo com sucesso',
            service: service
        });
    } catch (error) {
        console.error('Erro ao salvar serviço:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
});

// Rota para buscar serviços
app.get('/services', authenticateToken, async (req, res) => {
    try {
        const { store } = req.query;
        
        // Aqui você pode adicionar a lógica para buscar do banco de dados
        // Por enquanto, vamos retornar dados simulados
        const mockServices = [
            {
                id: 1,
                machineCode: 'ELEV-001',
                machineType: 'Elevador 1',
                store: store || 'GPInterlagos',
                location: 'Setor A',
                serviceType: 'belt-replacement',
                serviceDate: '2024-08-12',
                technician: '1',
                description: 'Substituição de correia',
                cost: 150.00,
                status: 'completed',
                notes: 'Correia nova instalada',
                recordDate: '2024-08-12'
            }
        ];
        
        res.json(mockServices);
    } catch (error) {
        console.error('Erro ao buscar serviços:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
});

// Rota para buscar máquinas
app.get('/machines', authenticateToken, async (req, res) => {
    try {
        const { store } = req.query;
        
        // Aqui você pode adicionar a lógica para buscar do banco de dados
        // Por enquanto, vamos retornar dados simulados
        const mockMachines = [
            {
                id: 1,
                type: 'Elevador 1',
                provider: 'Martins',
                location: 'Setor A',
                serviceDate: '2024-08-12',
                registrationDate: '2024-08-12'
            }
        ];
        
        res.json(mockMachines);
    } catch (error) {
        console.error('Erro ao buscar máquinas:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
});

// Rota de health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
    });
});

module.exports.handler = serverless(app);
