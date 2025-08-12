const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

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
} else {
  // Se não existir, responde com texto
  app.get('/', (req, res) => {
    res.send('🚀 API GP Máquinas rodando sem frontend.');
  });
}

// Outras rotas da API
// app.get('/servicos', (req, res) => { ... });

// Inicializa o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'desenvolvimento'}`);
});
