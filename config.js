// Configuração do Sistema GP Máquinas e Serviços
// Para deploy na Netlify + Neon

const config = {
    // Configurações do banco Neon
    database: {
        host: process.env.NEON_HOST || 'localhost',
        port: process.env.NEON_PORT || 5432,
        database: process.env.NEON_DATABASE || 'gp_maquinas_db',
        username: process.env.NEON_USERNAME || 'postgres',
        password: process.env.NEON_PASSWORD || '',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    },
    
    // Configurações da aplicação
    app: {
        port: process.env.PORT || 3000,
        environment: process.env.NODE_ENV || 'development',
        sessionTimeout: 60 * 60 * 1000, // 1 hora em milissegundos
        corsOrigin: process.env.CORS_ORIGIN || '*'
    },
    
    // Configurações de segurança
    security: {
        jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        bcryptRounds: 12,
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000 // 15 minutos
    }
};

// Configurações específicas para desenvolvimento
if (config.app.environment === 'development') {
    config.database.host = 'localhost';
    config.database.port = 5432;
    config.database.database = 'gp_maquinas_db';
    config.database.username = 'postgres';
    config.database.password = '';
    config.database.ssl = false;
}

module.exports = config;
