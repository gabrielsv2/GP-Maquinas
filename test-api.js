// Script de teste para a API GP Máquinas
// Testa as principais funcionalidades da API

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Configuração do axios
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Função para testar health check
async function testHealthCheck() {
    try {
        console.log('🔍 Testando health check...');
        const response = await api.get('/health');
        console.log('✅ Health check:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Health check falhou:', error.message);
        return false;
    }
}

// Função para testar login
async function testLogin() {
    try {
        console.log('🔍 Testando login...');
        const loginData = {
            username: 'admin',
            password: 'admin123'
        };
        
        const response = await api.post('/auth/login', loginData);
        console.log('✅ Login bem-sucedido');
        return response.data.token;
    } catch (error) {
        console.error('❌ Login falhou:', error.response?.data || error.message);
        return null;
    }
}

// Função para testar criação de serviço
async function testCreateService(token) {
    if (!token) {
        console.log('⚠️ Token não disponível, pulando teste de criação de serviço');
        return false;
    }
    
    try {
        console.log('🔍 Testando criação de serviço...');
        
        const serviceData = {
            machineCode: 'TEST001',
            machineType: 'Compressor',
            storeId: 'GPTaboão',
            location: 'Pátio',
            serviceTypeId: 'other',
            technicianId: 3,
            serviceDate: '2025-08-28',
            description: 'Teste de API',
            cost: 0.50,
            status: 'completed',
            notes: 'Teste automatizado'
        };
        
        const response = await api.post('/services', serviceData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Serviço criado com sucesso:', response.data);
        return response.data.service.service_id;
    } catch (error) {
        console.error('❌ Criação de serviço falhou:', error.response?.data || error.message);
        return false;
    }
}

// Função para testar busca de serviços
async function testSearchServices(token) {
    if (!token) {
        console.log('⚠️ Token não disponível, pulando teste de busca');
        return false;
    }
    
    try {
        console.log('🔍 Testando busca de serviços...');
        
        const response = await api.get('/services/search?machineCode=TEST001', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Busca bem-sucedida:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Busca falhou:', error.response?.data || error.message);
        return false;
    }
}

// Função principal de teste
async function runTests() {
    console.log('🚀 Iniciando testes da API GP Máquinas...\n');
    
    // Teste 1: Health check
    const healthOk = await testHealthCheck();
    if (!healthOk) {
        console.log('❌ Servidor não está respondendo, abortando testes');
        return;
    }
    
    console.log('');
    
    // Teste 2: Login
    const token = await testLogin();
    
    console.log('');
    
    // Teste 3: Criação de serviço
    const serviceCreated = await testCreateService(token);
    
    console.log('');
    
    // Teste 4: Busca de serviços
    const searchOk = await testSearchServices(token);
    
    console.log('');
    console.log('📊 Resumo dos testes:');
    console.log(`   Health Check: ${healthOk ? '✅' : '❌'}`);
    console.log(`   Login: ${token ? '✅' : '❌'}`);
    console.log(`   Criação de Serviço: ${serviceCreated ? '✅' : '❌'}`);
    console.log(`   Busca de Serviços: ${searchOk ? '✅' : '❌'}`);
    
    if (healthOk && token && serviceCreated && searchOk) {
        console.log('\n🎉 Todos os testes passaram!');
    } else {
        console.log('\n⚠️ Alguns testes falharam. Verifique os logs acima.');
    }
}

// Executar testes se o arquivo for executado diretamente
if (require.main === module) {
    runTests().catch(error => {
        console.error('❌ Erro durante os testes:', error.message);
        process.exit(1);
    });
}

module.exports = {
    testHealthCheck,
    testLogin,
    testCreateService,
    testSearchServices,
    runTests
};
