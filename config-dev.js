// Configuração de Desenvolvimento para GP Máquinas e Serviços
// Este arquivo é usado apenas em desenvolvimento local

const config = {
    // Configurações do banco para desenvolvimento
    database: {
        host: 'localhost',
        port: 5432,
        database: 'gp_maquinas_db',
        username: 'postgres',
        password: '',
        ssl: false,
        // Configurações de pool
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        // Configurações de retry
        retryDelay: 1000,
        maxRetries: 3
    },
    
    // Configurações da aplicação
    app: {
        port: 3000,
        environment: 'development',
        sessionTimeout: 60 * 60 * 1000, // 1 hora
        corsOrigin: '*'
    },
    
    // Configurações de segurança
    security: {
        jwtSecret: 'dev-secret-key-change-in-production',
        bcryptRounds: 12,
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000 // 15 minutos
    }
};

module.exports = config;
