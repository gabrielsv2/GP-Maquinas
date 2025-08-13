const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

console.log('🚀 Iniciando Netlify Function para GP Máquinas - V3...');
console.log('🌐 CORS Origin:', process.env.CORS_ORIGIN || 'https://gp-services.netlify.app');
console.log('🔧 NODE_ENV:', process.env.NODE_ENV || 'development');

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'https://gp-services.netlify.app',
    credentials: true
}));
app.use(express.json());

// Configuração do banco Neon (comentada temporariamente)
// const pool = new Pool({
//     connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
//     ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
// });

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
    console.log('🔍 Verificando autenticação...');
    console.log('📋 URL da requisição:', req.url);
    console.log('📋 Método da requisição:', req.method);
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('📋 Header Authorization:', authHeader ? 'Presente' : 'Ausente');
    console.log('🔑 Token extraído:', token ? token.substring(0, 20) + '...' : 'NÃO');

    if (!token) {
        console.log('❌ Nenhum token fornecido');
        return res.status(401).json({ 
            error: 'Token de acesso necessário',
            message: 'É necessário fornecer um token de autenticação válido'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token válido, usuário:', decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.log('❌ Token inválido:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expirado',
                message: 'Seu token de acesso expirou. Faça login novamente.'
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ 
                error: 'Token inválido',
                message: 'Token de acesso inválido. Verifique suas credenciais.'
            });
        } else {
            return res.status(403).json({ 
                error: 'Erro de autenticação',
                message: 'Erro ao verificar token de acesso.'
            });
        }
    }
};

// Rota de login
app.post('/auth/login', async (req, res) => {
    console.log('🔑 Tentativa de login recebida:', { username: req.body.username, password: req.body.password ? '***' : 'NÃO' });
    
    try {
        const { username, password } = req.body;

        console.log('📋 Dados recebidos:', { username, password: password ? '***' : 'NÃO' });

        // Verificar se é admin
        if (username === 'admin' && password === 'admin') {
            console.log('✅ Login de admin válido');
            
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

            console.log('🔐 Token gerado para admin');

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
            console.log('🏪 Tentativa de login de loja:', username);
            
            const store = stores.find(s => s.store_id === username);
            if (store) {
                console.log('✅ Loja encontrada:', store.store_name);
                
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

                console.log('🔐 Token gerado para loja:', store.store_id);

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
            } else {
                console.log('❌ Loja não encontrada:', username);
            }
        }

        // Login inválido
        console.log('❌ Login inválido para:', username);
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
    console.log('🔐 Verificação de token solicitada para usuário:', req.user);
    res.json({
        valid: true,
        user: req.user
    });
});

// Rota para salvar serviços
app.post('/services', authenticateToken, async (req, res) => {
    console.log('💾 Tentativa de salvar serviço recebida');
    console.log('👤 Usuário autenticado:', req.user);
    console.log('📋 Dados do serviço recebidos:', JSON.stringify(req.body, null, 2));
    
    try {
        const service = req.body;
        
        // Validações básicas
        if (!service) {
            console.log('❌ Dados do serviço não fornecidos');
            return res.status(400).json({
                error: 'Dados do serviço são obrigatórios'
            });
        }

        // Validar campos obrigatórios
        const requiredFields = ['machineCode', 'machineType', 'serviceType', 'serviceDate'];
        const missingFields = requiredFields.filter(field => !service[field]);
        
        if (missingFields.length > 0) {
            console.log('❌ Campos obrigatórios faltando:', missingFields);
            return res.status(400).json({
                error: 'Campos obrigatórios faltando',
                missingFields: missingFields
            });
        }

        // Validar se o usuário tem permissão para salvar na loja
        if (req.user.role === 'store' && service.store && service.store !== req.user.store) {
            console.log('❌ Usuário tentando salvar serviço em loja diferente:', {
                userStore: req.user.store,
                serviceStore: service.store
            });
            return res.status(403).json({
                error: 'Você só pode salvar serviços na sua própria loja'
            });
        }

        // Adicionar informações do usuário ao serviço
        const serviceToSave = {
            ...service,
            createdBy: req.user.username,
            createdAt: new Date().toISOString(),
            store: req.user.role === 'store' ? req.user.store : (service.store || 'GPInterlagos')
        };

        console.log('✅ Serviço validado e preparado para salvar:', JSON.stringify(serviceToSave, null, 2));
        
        // Aqui você pode adicionar a lógica para salvar no banco de dados
        // Por enquanto, vamos apenas retornar sucesso
        
        // Simular ID único
        const savedService = {
            ...serviceToSave,
            id: Date.now() // ID temporário baseado no timestamp
        };
        
        console.log('💾 Serviço salvo com sucesso, ID:', savedService.id);
        
        res.json({
            success: true,
            message: 'Serviço salvo com sucesso',
            service: savedService
        });
        
    } catch (error) {
        console.error('❌ Erro ao salvar serviço:', error);
        console.error('❌ Stack trace:', error.stack);
        
        res.status(500).json({
            error: 'Erro interno do servidor ao salvar serviço',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
        });
    }
});

// Rota para buscar serviços
app.get('/services', authenticateToken, async (req, res) => {
    console.log('🔍 Busca de serviços solicitada');
    console.log('👤 Usuário autenticado:', req.user);
    console.log('📋 Query parameters:', req.query);
    
    try {
        const { store } = req.query;
        
        // Determinar qual loja buscar
        let targetStore = store;
        if (req.user.role === 'store') {
            targetStore = req.user.store;
            console.log('🏪 Usuário de loja, buscando apenas serviços da loja:', targetStore);
        } else if (store) {
            targetStore = store;
            console.log('👑 Admin buscando serviços da loja:', targetStore);
        } else {
            targetStore = 'GPInterlagos'; // Loja padrão
            console.log('🏪 Nenhuma loja especificada, usando padrão:', targetStore);
        }
        
        // Aqui você pode adicionar a lógica para buscar do banco de dados
        // Por enquanto, vamos retornar dados simulados
        const mockServices = [
            {
                id: 1,
                machineCode: 'ELEV-001',
                machineType: 'Elevador 1',
                store: targetStore,
                location: 'Setor A',
                serviceType: 'belt-replacement',
                serviceDate: '2024-08-12',
                technician: '1',
                description: 'Substituição de correia',
                cost: 150.00,
                status: 'completed',
                notes: 'Correia nova instalada',
                recordDate: '2024-08-12',
                createdBy: 'admin',
                createdAt: '2024-08-12T10:00:00.000Z'
            }
        ];
        
        console.log('✅ Serviços encontrados:', mockServices.length);
        console.log('📋 Serviços retornados:', JSON.stringify(mockServices, null, 2));
        
        res.json(mockServices);
        
    } catch (error) {
        console.error('❌ Erro ao buscar serviços:', error);
        console.error('❌ Stack trace:', error.stack);
        
        res.status(500).json({
            error: 'Erro interno do servidor ao buscar serviços',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
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

// Rota de teste simples
app.get('/test', (req, res) => {
    console.log('🧪 Rota de teste simples acessada');
    res.json({
        message: '🎉 API funcionando perfeitamente!',
        timestamp: new Date().toISOString(),
        routes: {
            health: '/health',
            test: '/test',
            testServices: '/test/services',
            services: '/services (POST)',
            machines: '/machines'
        }
    });
});

// Rota de teste para serviços (sem autenticação para debug)
app.post('/test/services', (req, res) => {
    console.log('🧪 Teste de validação de serviço (sem autenticação)');
    console.log('📋 Dados recebidos:', JSON.stringify(req.body, null, 2));
    
    try {
        const service = req.body;
        
        // Validações básicas
        if (!service) {
            return res.status(400).json({
                error: 'Dados do serviço são obrigatórios'
            });
        }

        // Validar campos obrigatórios
        const requiredFields = ['machineCode', 'machineType', 'serviceType', 'serviceDate'];
        const missingFields = requiredFields.filter(field => !service[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: 'Campos obrigatórios faltando',
                missingFields: missingFields
            });
        }

        res.json({
            success: true,
            message: 'Serviço validado com sucesso (teste)',
            service: service
        });
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        res.status(500).json({
            error: 'Erro interno do servidor no teste'
        });
    }
});

// Rota de teste GET para navegador (sem autenticação para debug)
app.get('/test/services', (req, res) => {
    console.log('🧪 Teste GET de validação de serviço (navegador)');
    
    res.json({
        success: true,
        message: 'API funcionando! Rota de teste acessível via GET',
        timestamp: new Date().toISOString(),
        instructions: 'Use POST /test/services para testar com dados de serviço',
        example: {
            machineCode: "ELEV-001",
            machineType: "Elevador 1",
            serviceType: "belt-replacement",
            serviceDate: "2024-12-19"
        }
    });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
    console.log('❌ Rota não encontrada:', req.method, req.url);
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('❌ Erro global capturado:');
    console.error('❌ URL:', req.url);
    console.error('❌ Método:', req.method);
    console.error('❌ Headers:', req.headers);
    console.error('❌ Body:', req.body);
    console.error('❌ Erro:', err.message);
    console.error('❌ Stack trace:', err.stack);
    
    // Determinar o tipo de erro
    let statusCode = 500;
    let errorMessage = 'Erro interno do servidor';
    
    if (err.name === 'ValidationError') {
        statusCode = 400;
        errorMessage = 'Dados inválidos fornecidos';
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        errorMessage = 'Não autorizado';
    } else if (err.name === 'ForbiddenError') {
        statusCode = 403;
        errorMessage = 'Acesso negado';
    } else if (err.name === 'NotFoundError') {
        statusCode = 404;
        errorMessage = 'Recurso não encontrado';
    }
    
    res.status(statusCode).json({ 
        error: errorMessage,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
        timestamp: new Date().toISOString(),
        path: req.url,
        method: req.method
    });
});

module.exports.handler = serverless(app);
