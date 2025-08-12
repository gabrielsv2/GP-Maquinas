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

// Servir arquivos estáticos da raiz
app.use(express.static(__dirname));

  // Rota principal para index.html
  app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

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
  console.log(`📁 Servindo arquivos estáticos da raiz`);
});
