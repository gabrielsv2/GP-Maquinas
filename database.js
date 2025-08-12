const { Pool } = require('pg');
const config = require('./config');

// Pool de conexões PostgreSQL
const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.username,
    password: config.database.password,
    ssl: config.database.ssl,
    max: 20, // máximo de conexões no pool
    idleTimeoutMillis: 30000, // tempo limite de conexões ociosas
    connectionTimeoutMillis: 2000, // tempo limite para estabelecer conexão
});

// Testar conexão com o banco
async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Conexão com banco testada:', result.rows[0].now);
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar com banco:', error.message);
        throw error;
    }
}

// Executar query com pool
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('📊 Query executada:', { text, duration, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('❌ Erro na query:', error.message);
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
        throw error;
    } finally {
        client.release();
    }
}

// Fechar pool de conexões
async function closePool() {
    await pool.end();
    console.log('🔒 Pool de conexões fechado');
}

// Eventos do pool
pool.on('connect', (client) => {
    console.log('🔗 Nova conexão estabelecida');
});

pool.on('error', (err, client) => {
    console.error('❌ Erro inesperado no cliente do pool:', err);
});

pool.on('remove', (client) => {
    console.log('🔌 Cliente removido do pool');
});

module.exports = {
    pool,
    query,
    queryWithTransaction,
    testConnection,
    closePool
};
