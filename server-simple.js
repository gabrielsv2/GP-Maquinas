const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// Importar rotas
const authRoutes = require('./routes/auth');
const servicesRoutes = require('./routes/services');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://sistema-gp-maquinas.netlify.app',
  credentials: true
}));
app.use(helmet({
  contentSecurityPolicy: false // Desabilitar CSP para desenvolvimento
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Caminho da pasta public
const publicPath = path.join(__dirname, 'public');

// Verifica se a pasta public existe
if (fs.existsSync(publicPath)) {
  // Se existir, serve arquivos estáticos
  app.use(express.static(publicPath));

  // Rota principal para index.html
  app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  // Rota para admin dashboard
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(publicPath, 'admin-dashboard.html'));
  });
} else {
  // Se não existir, responde com texto
  app.get('/', (req, res) => {
    res.send('🚀 API GP Máquinas rodando sem frontend.');
  });
}

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/reports', reportsRoutes);

// Rota de health check para o Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'GP Máquinas API está funcionando',
    timestamp: new Date().toISOString()
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Rota 404 para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Inicializa o servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'desenvolvimento'}`);
  console.log(`📁 Pasta public: ${fs.existsSync(publicPath) ? 'Encontrada' : 'Não encontrada'}`);
});
