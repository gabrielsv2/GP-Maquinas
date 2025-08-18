const fs = require('fs');
const path = require('path');
const { query, testConnection } = require('./database');

async function setupDatabase() {
    try {
        console.log('🚀 Iniciando configuração do banco de dados...');
        
        // Testar conexão
        await testConnection();
        console.log('✅ Conexão com banco estabelecida');
        
        // Ler arquivo SQL
        const sqlFile = path.join(__dirname, 'database-postgresql.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        
        console.log('📖 Arquivo SQL lido:', sqlFile);
        
        // Dividir o SQL em comandos individuais
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        console.log(`🔧 Executando ${commands.length} comandos SQL...`);
        
        // Executar cada comando
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            if (command.trim()) {
                try {
                    console.log(`📝 Executando comando ${i + 1}/${commands.length}...`);
                    await query(command);
                    console.log(`✅ Comando ${i + 1} executado com sucesso`);
                } catch (error) {
                    console.error(`❌ Erro no comando ${i + 1}:`, error.message);
                    // Continuar com os próximos comandos
                }
            }
        }
        
        console.log('🎉 Configuração do banco de dados concluída!');
        
    } catch (error) {
        console.error('❌ Erro durante configuração:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    setupDatabase().then(() => {
        console.log('✅ Script finalizado');
        process.exit(0);
    }).catch((error) => {
        console.error('❌ Script falhou:', error.message);
        process.exit(1);
    });
}

module.exports = { setupDatabase };
