// Configuração do Sistema GP Máquinas e Serviços
// Para deploy na Netlify + Neon

let config;

// Detectar ambiente de produção (Render, Heroku, etc.)
const isProduction = process.env.NODE_ENV === 'production' || 
                    process.env.RENDER || 
                    process.env.HEROKU ||
                    process.env.PORT === '10000';

// Configurações específicas para desenvolvimento
if (!isProduction) {
    try {
        config = require('./config-dev');
        console.log('🔧 Configurações de desenvolvimento carregadas');
        console.log('📊 Banco:', config.database.host + ':' + config.database.port);
        console.log('🌍 Ambiente:', config.app.environment);
    } catch (error) {
        console.log('⚠️ Arquivo config-dev.js não encontrado, usando configurações padrão');
        config = {
            // Configurações do banco Neon
            database: {
                host: process.env.NEON_HOST || 'localhost',
                port: parseInt(process.env.NEON_PORT) || 5432,
                database: process.env.NEON_DATABASE || 'gp_maquinas_db',
                username: process.env.NEON_USERNAME || 'postgres',
                password: process.env.NEON_PASSWORD || '',
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                // Configurações adicionais para melhor estabilidade
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 10000,
                // Configurações de retry
                retryDelay: 1000,
                maxRetries: 3
            },
            
            // Configurações da aplicação
            app: {
                port: parseInt(process.env.PORT) || 3000,
                environment: process.env.NODE_ENV || 'development',
                sessionTimeout: 60 * 60 * 1000, // 1 hora em milissegundos
                corsOrigin: process.env.CORS_ORIGIN || '*'
            },
            
            // Configurações de segurança
            security: {
                jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
                bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
                maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
                lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 15 * 60 * 1000 // 15 minutos
            }
        };
    }
} else {
    // Configurações de produção (Render + Neon)
    console.log('🚀 Configurações de produção carregadas');
    console.log('🌐 Ambiente: Render + Neon');
    
    config = {
        // Configurações do banco Neon
        database: {
            host: process.env.NEON_HOST,
            port: parseInt(process.env.NEON_PORT) || 5432,
            database: process.env.NEON_DATABASE,
            username: process.env.NEON_USERNAME,
            password: process.env.NEON_PASSWORD,
            ssl: { rejectUnauthorized: false }, // SSL obrigatório para Neon
            // Configurações otimizadas para produção
            max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
            idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
            connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
            // Configurações de retry
            retryDelay: parseInt(process.env.DB_RETRY_DELAY) || 1000,
            maxRetries: parseInt(process.env.DB_MAX_RETRIES) || 3
        },
        
        // Configurações da aplicação
        app: {
            port: parseInt(process.env.PORT) || 10000,
            environment: 'production',
            sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 60 * 60 * 1000, // 1 hora
            corsOrigin: process.env.CORS_ORIGIN || 'https://gp-services.netlify.app'
        },
        
        // Configurações de segurança
        security: {
            jwtSecret: process.env.JWT_SECRET,
            bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
            maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
            lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 15 * 60 * 1000 // 15 minutos
        }
    };
    
    // Validar configurações obrigatórias em produção
    const requiredEnvVars = ['NEON_HOST', 'NEON_DATABASE', 'NEON_USERNAME', 'NEON_PASSWORD', 'JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Variáveis de ambiente obrigatórias não configuradas:', missingVars);
        console.error('🔧 Configure estas variáveis no painel do Render');
        process.exit(1);
    }
    
    console.log('✅ Todas as variáveis de ambiente obrigatórias estão configuradas');
}

module.exports = config;
