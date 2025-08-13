const express = require('express');
const serverless = require('serverless-http');

const app = express();

console.log('🧪 Função de teste simples iniciada');

app.get('/', (req, res) => {
    console.log('✅ Rota raiz acessada');
    res.json({
        message: '🎉 Função de teste funcionando!',
        timestamp: new Date().toISOString(),
        function: 'test-simple'
    });
});

app.get('/test', (req, res) => {
    console.log('✅ Rota /test acessada');
    res.json({
        message: '🧪 Teste funcionando perfeitamente!',
        timestamp: new Date().toISOString(),
        routes: ['/', '/test']
    });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
    console.log('❌ Rota não encontrada:', req.method, req.url);
    res.status(404).json({ 
        error: 'Rota não encontrada',
        availableRoutes: ['/', '/test'],
        requestedUrl: req.url
    });
});

module.exports.handler = serverless(app);
