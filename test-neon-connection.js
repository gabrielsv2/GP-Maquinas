#!/usr/bin/env node

/**
 * Script para testar conexão com o banco Neon
 * Use este script para verificar se as credenciais estão corretas
 */

const { Client } = require('pg');

// Configurações do Neon (substitua pelos seus valores)
const config = {
    host: process.env.NEON_HOST || 'ep-cool-forest-123456.us-east-2.aws.neon.tech',
    port: parseInt(process.env.NEON_PORT) || 5432,
    database: process.env.NEON_DATABASE || 'gp_maquinas_db',
    user: process.env.NEON_USERNAME || 'seu_usuario_neon',
    password: process.env.NEON_PASSWORD || 'sua_senha_neon',
    ssl: { rejectUnauthorized: false }
};

async function testNeonConnection() {
    console.log('🔍 Testando conexão com banco Neon...\n');
    
    console.log('📊 Configurações:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    console.log(`   SSL: ${config.ssl ? 'Enabled' : 'Disabled'}\n`);
    
    const client = new Client(config);
    
    try {
        console.log('🔗 Conectando ao banco...');
        await client.connect();
        console.log('✅ Conexão estabelecida com sucesso!\n');
        
        // Testar query simples
        console.log('📝 Testando query...');
        const result = await client.query('SELECT NOW() as current_time, version() as db_version');
        console.log('✅ Query executada com sucesso!');
        console.log(`   Hora atual: ${result.rows[0].current_time}`);
        console.log(`   Versão do banco: ${result.rows[0].db_version}\n`);
        
        // Verificar se as tabelas existem
        console.log('🏗️ Verificando estrutura do banco...');
        const tablesResult = await client.query(`
            SELECT table_name, table_type 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        if (tablesResult.rows.length > 0) {
            console.log('✅ Tabelas encontradas:');
            tablesResult.rows.forEach(row => {
                console.log(`   - ${row.table_name} (${row.table_type})`);
            });
        } else {
            console.log('⚠️ Nenhuma tabela encontrada no banco');
            console.log('💡 Execute o script database-postgresql.sql para criar as tabelas');
        }
        
        console.log('\n🎉 Teste de conexão concluído com sucesso!');
        console.log('✅ O banco Neon está funcionando corretamente');
        
    } catch (error) {
        console.error('\n❌ Erro ao conectar com o banco Neon:');
        console.error(`   Mensagem: ${error.message}`);
        console.error(`   Código: ${error.code}`);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('\n🔍 Possíveis soluções:');
            console.error('   1. Verificar se o host está correto');
            console.error('   2. Verificar se a porta está correta');
            console.error('   3. Verificar se o banco Neon está ativo');
        } else if (error.code === '28P01') {
            console.error('\n🔍 Possíveis soluções:');
            console.error('   1. Verificar se o usuário está correto');
            console.error('   2. Verificar se a senha está correta');
        } else if (error.code === '3D000') {
            console.error('\n🔍 Possíveis soluções:');
            console.error('   1. Verificar se o nome do banco está correto');
            console.error('   2. Verificar se o banco existe no Neon');
        } else if (error.code === 'ENOTFOUND') {
            console.error('\n🔍 Possíveis soluções:');
            console.error('   1. Verificar se o host está correto');
            console.error('   2. Verificar se há problemas de DNS');
        }
        
        console.error('\n📋 Verifique:');
        console.error('   1. Credenciais do Neon Console');
        console.error('   2. Status do projeto Neon');
        console.error('   3. Configurações de rede');
        
    } finally {
        try {
            await client.end();
            console.log('\n🔌 Conexão fechada');
        } catch (closeError) {
            console.error('⚠️ Erro ao fechar conexão:', closeError.message);
        }
    }
}

// Função para solicitar credenciais interativamente
async function promptCredentials() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    console.log('🔐 Configuração das credenciais do Neon\n');
    
    const questions = [
        { key: 'NEON_HOST', prompt: 'Host do Neon (ex: ep-cool-forest-123456.us-east-2.aws.neon.tech): ' },
        { key: 'NEON_DATABASE', prompt: 'Nome do banco: ' },
        { key: 'NEON_USERNAME', prompt: 'Usuário: ' },
        { key: 'NEON_PASSWORD', prompt: 'Senha: ' }
    ];
    
    for (const question of questions) {
        const answer = await new Promise(resolve => {
            rl.question(question.prompt, resolve);
        });
        
        if (answer.trim()) {
            config[question.key.replace('NEON_', '').toLowerCase()] = answer.trim();
        }
    }
    
    rl.close();
    console.log('\n🔧 Credenciais configuradas, testando conexão...\n');
}

// Função principal
async function main() {
    try {
        // Se as variáveis de ambiente não estiverem configuradas, solicitar interativamente
        if (!process.env.NEON_HOST && !process.env.NEON_DATABASE) {
            await promptCredentials();
        }
        
        await testNeonConnection();
        
    } catch (error) {
        console.error('❌ Erro crítico:', error.message);
        process.exit(1);
    }
}

// Executar se o arquivo for executado diretamente
if (require.main === module) {
    main();
}

module.exports = { testNeonConnection };
