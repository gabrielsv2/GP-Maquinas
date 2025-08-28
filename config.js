// Configuração do Sistema GP Máquinas e Serviços
// Para deploy na Netlify + Neon

let config;

// Configurações específicas para desenvolvimento
if (process.env.NODE_ENV === 'development') {
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
    // Configurações de produção
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

module.exports = config;
