const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware básico
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'https://sistema-gp-maquinas.netlify.app',
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota de teste
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Backend funcionando!'
    });
});

// Rota de teste de login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    // Login simples para teste
    if (username === 'admin' && password === 'admin') {
        res.json({
            success: true,
            token: 'test-token-123',
            user: {
                username: 'admin',
                role: 'admin'
            }
        });
    } else if (username === 'store' && password === '123456') {
        res.json({
            success: true,
            token: 'test-token-store',
            user: {
                username: username,
                role: 'store'
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Credenciais inválidas'
        });
    }
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para todas as outras páginas (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicializar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM recebido, fechando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT recebido, fechando servidor...');
    process.exit(0);
});
