const { Pool } = require('pg');
const config = require('./config');

// Pool de conexões PostgreSQL com configurações melhoradas
const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.username,
    password: config.database.password,
    ssl: config.database.ssl,
    max: config.database.max || 20,
    idleTimeoutMillis: config.database.idleTimeoutMillis || 30000,
    connectionTimeoutMillis: config.database.connectionTimeoutMillis || 10000,
    // Configurações adicionais para estabilidade
    allowExitOnIdle: false,
    // Configurações de retry
    retryDelay: config.database.retryDelay || 1000,
    maxRetries: config.database.maxRetries || 3
});

// Função de retry para operações do banco
async function withRetry(operation, maxRetries = config.database.maxRetries) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            
            // Se não for o último tentativa, aguardar antes de tentar novamente
            if (attempt < maxRetries) {
                console.log(`⚠️ Tentativa ${attempt} falhou, tentando novamente em ${config.database.retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, config.database.retryDelay));
            }
        }
    }
    
    throw lastError;
}

// Testar conexão com o banco
async function testConnection() {
    try {
        const client = await withRetry(async () => {
            const client = await pool.connect();
            const result = await client.query('SELECT NOW() as current_time, version() as db_version');
            client.release();
            return result;
        });
        
        console.log('✅ Conexão com banco testada:', client.rows[0].current_time);
        console.log('📊 Versão do banco:', client.rows[0].db_version);
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar com banco:', error.message);
        console.error('🔍 Detalhes do erro:', {
            code: error.code,
            detail: error.detail,
            hint: error.hint,
            position: error.position
        });
        throw error;
    }
}

// Executar query com pool e retry
async function query(text, params) {
    const start = Date.now();
    
    try {
        const result = await withRetry(async () => {
            return await pool.query(text, params);
        });
        
        const duration = Date.now() - start;
        console.log('📊 Query executada:', { 
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''), 
            duration, 
            rows: result.rowCount 
        });
        return result;
    } catch (error) {
        const duration = Date.now() - start;
        console.error('❌ Erro na query:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            duration,
            text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
        });
        throw error;
    }
}

// Executar query com transação
async function queryWithTransaction(queries) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const results = [];
        for (const { text, params } of queries) {
            const result = await client.query(text, params);
            results.push(result);
        }
        
        await client.query('COMMIT');
        return results;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro na transação:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Fechar pool de conexões
async function closePool() {
    try {
        await pool.end();
        console.log('🔒 Pool de conexões fechado');
    } catch (error) {
        console.error('❌ Erro ao fechar pool:', error.message);
        throw error;
    }
}

// Eventos do pool com melhor tratamento
pool.on('connect', (client) => {
    console.log('🔗 Nova conexão estabelecida');
});

pool.on('error', (err, client) => {
    console.error('❌ Erro inesperado no cliente do pool:', {
        message: err.message,
        code: err.code,
        detail: err.detail
    });
    
    // Se for um erro de conexão, tentar reconectar
    if (err.code === 'ECONNRESET' || err.code === 'ENOTFOUND') {
        console.log('🔄 Tentando reconectar...');
    }
});

pool.on('remove', (client) => {
    console.log('🔌 Cliente removido do pool');
});

// Função para verificar saúde do pool
async function checkPoolHealth() {
    try {
        const totalCount = pool.totalCount;
        const idleCount = pool.idleCount;
        const waitingCount = pool.waitingCount;
        
        console.log('📊 Status do pool:', {
            total: totalCount,
            idle: idleCount,
            waiting: waitingCount
        });
        
        return {
            total: totalCount,
            idle: idleCount,
            waiting: waitingCount,
            healthy: totalCount > 0 && idleCount >= 0
        };
    } catch (error) {
        console.error('❌ Erro ao verificar saúde do pool:', error.message);
        return { healthy: false, error: error.message };
    }
}

module.exports = {
    pool,
    query,
    queryWithTransaction,
    testConnection,
    closePool,
    checkPoolHealth,
    withRetry
};
