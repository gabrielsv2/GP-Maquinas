#!/usr/bin/env node

/**
 * Script de Setup do Banco de Dados GP Máquinas
 * Este script configura automaticamente o banco de dados para desenvolvimento
 */

const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Configurações de desenvolvimento
const config = {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '', // Será solicitada interativamente
    database: 'gp_maquinas_db'
};

// Função para ler o arquivo SQL
async function readSqlFile(filename) {
    try {
        const filePath = path.join(__dirname, filename);
        const content = await fs.readFile(filePath, 'utf8');
        return content;
    } catch (error) {
        console.error(`❌ Erro ao ler arquivo ${filename}:`, error.message);
        throw error;
    }
}

// Função para executar comandos SQL
async function executeSql(client, sql, description) {
    try {
        console.log(`🔍 ${description}...`);
        await client.query(sql);
        console.log(`✅ ${description} - OK`);
    } catch (error) {
        console.error(`❌ ${description} - FALHOU:`, error.message);
        throw error;
    }
}

// Função para verificar se o banco existe
async function databaseExists(client, dbName) {
    try {
        const result = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [dbName]
        );
        return result.rows.length > 0;
    } catch (error) {
        return false;
    }
}

// Função para verificar se as tabelas existem
async function tablesExist(client) {
    try {
        const result = await client.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('stores', 'service_types', 'technicians', 'services')
        `);
        return result.rows[0].count >= 4;
    } catch (error) {
        return false;
    }
}

// Função principal de setup
async function setupDatabase() {
    console.log('🚀 Iniciando setup do banco de dados GP Máquinas...\n');
    
    // Conectar ao PostgreSQL como superusuário
    const superClient = new Client({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: 'postgres' // Conectar ao banco padrão
    });
    
    try {
        // Conectar ao PostgreSQL
        console.log('🔗 Conectando ao PostgreSQL...');
        await superClient.connect();
        console.log('✅ Conectado ao PostgreSQL\n');
        
        // Verificar se o banco existe
        const dbExists = await databaseExists(superClient, config.database);
        
        if (!dbExists) {
            console.log('📊 Criando banco de dados...');
            await executeSql(
                superClient,
                `CREATE DATABASE "${config.database}"`,
                'Criação do banco de dados'
            );
            console.log('');
        } else {
            console.log('📊 Banco de dados já existe\n');
        }
        
        // Fechar conexão com superusuário
        await superClient.end();
        
        // Conectar ao banco específico
        const dbClient = new Client({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.database
        });
        
        await dbClient.connect();
        console.log('🔗 Conectado ao banco GP Máquinas\n');
        
        // Verificar se as tabelas existem
        const tablesExistResult = await tablesExist(dbClient);
        
        if (!tablesExistResult) {
            console.log('🏗️ Criando tabelas...');
            
            // Ler e executar script SQL
            const sqlContent = await readSqlFile('database-postgresql.sql');
            
            // Dividir o script em comandos individuais
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        // Executar cada comando
            for (const command of commands) {
            if (command.trim()) {
                try {
                        await dbClient.query(command);
                } catch (error) {
                        // Ignorar erros de tabelas já existentes
                        if (!error.message.includes('already exists')) {
                            throw error;
                        }
                    }
                }
            }
            
            console.log('✅ Tabelas criadas com sucesso\n');
        } else {
            console.log('🏗️ Tabelas já existem\n');
        }
        
        // Verificar dados iniciais
        console.log('📊 Verificando dados iniciais...');
        
        const storesCount = await dbClient.query('SELECT COUNT(*) as count FROM stores');
        const serviceTypesCount = await dbClient.query('SELECT COUNT(*) as count FROM service_types');
        const techniciansCount = await dbClient.query('SELECT COUNT(*) as count FROM technicians');
        
        console.log(`   Lojas: ${storesCount.rows[0].count}`);
        console.log(`   Tipos de Serviço: ${serviceTypesCount.rows[0].count}`);
        console.log(`   Técnicos: ${techniciansCount.rows[0].count}`);
        
        // Fechar conexão
        await dbClient.end();
        
        console.log('\n🎉 Setup do banco de dados concluído com sucesso!');
        console.log('\n📋 Próximos passos:');
        console.log('   1. Iniciar o servidor: npm start');
        console.log('   2. Testar a API: node test-api.js');
        console.log('   3. Abrir no navegador: http://localhost:3000');
        
    } catch (error) {
        console.error('\n❌ Erro durante o setup:', error.message);
        console.log('\n🔍 Possíveis soluções:');
        console.log('   - Verificar se o PostgreSQL está rodando');
        console.log('   - Verificar se as credenciais estão corretas');
        console.log('   - Verificar se a porta 5432 está livre');
        console.log('   - Executar como administrador se necessário');
        
        process.exit(1);
    }
}

// Função para solicitar senha interativamente
async function promptPassword() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question('🔐 Digite a senha do usuário postgres (ou pressione Enter se não houver senha): ', (password) => {
            rl.close();
            config.password = password;
            resolve();
        });
    });
}

// Função principal
async function main() {
    try {
        // Verificar se o PostgreSQL está rodando
        console.log('🔍 Verificando se o PostgreSQL está rodando...');
        
        try {
            const testClient = new Client({
                host: config.host,
                port: config.port,
                user: config.user,
                password: '',
                database: 'postgres',
                connectionTimeoutMillis: 5000
            });
            
            await testClient.connect();
            await testClient.end();
            console.log('✅ PostgreSQL está rodando\n');
        } catch (error) {
            console.error('❌ PostgreSQL não está rodando ou não está acessível');
            console.log('\n📋 Soluções:');
            console.log('   1. Instalar PostgreSQL: https://www.postgresql.org/download/');
            console.log('   2. Verificar se o serviço está rodando');
            console.log('   3. Verificar se a porta 5432 está livre');
            process.exit(1);
        }
        
        // Solicitar senha
        await promptPassword();
        
        // Executar setup
        await setupDatabase();
        
    } catch (error) {
        console.error('❌ Erro crítico:', error.message);
        process.exit(1);
    }
}

// Executar se o arquivo for executado diretamente
if (require.main === module) {
    main();
}

module.exports = { setupDatabase };
