# 🚀 GP Máquinas e Serviços - Sistema de Gerenciamento

Sistema completo de gerenciamento de serviços para a rede GP Máquinas, com interface web moderna e banco de dados PostgreSQL.

## ✨ Funcionalidades

- 🔐 **Sistema de Login** com JWT e controle de sessão
- 🏪 **Gestão de Lojas** com controle de acesso por região
- 🔧 **Registro de Serviços** unificado com código de máquina
- 👨‍🔧 **Controle de Técnicos** e especializações
- 📊 **Relatórios Avançados** por loja, período e tipo
- ⏰ **Timer de Inatividade** de 1 hora para segurança
- 📱 **Interface Responsiva** para todos os dispositivos
- 🛡️ **Segurança Robusta** com validação e rate limiting

## 🏗️ Arquitetura

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js + Express.js
- **Banco de Dados**: PostgreSQL (Neon)
- **Autenticação**: JWT + bcrypt
- **Deploy**: Netlify (Frontend) + Neon (Database)

## 🚀 Deploy na Netlify + Neon

### 1. Preparar o Banco Neon

1. **Criar conta no Neon**:
   - Acesse [neon.tech](https://neon.tech)
   - Crie uma conta gratuita
   - Crie um novo projeto

2. **Configurar o banco**:
   ```sql
   -- Execute o arquivo database.sql no seu projeto Neon
   -- Copie as credenciais de conexão
   ```

3. **Variáveis de ambiente necessárias**:
   ```bash
   NEON_HOST=your-project.neon.tech
   NEON_DATABASE=gp_maquinas_db
   NEON_USERNAME=your-username
   NEON_PASSWORD=your-password
   NEON_PORT=5432
   ```

### 2. Deploy na Netlify

#### Opção A: Deploy via Git (Recomendado)

1. **Fazer push para o GitHub**:
   ```bash
   git add .
   git commit -m "Sistema GP Máquinas pronto para deploy"
   git push origin main
   ```

2. **Conectar na Netlify**:
   - Acesse [netlify.com](https://netlify.com)
   - Clique em "New site from Git"
   - Conecte com seu repositório GitHub
   - Configure as variáveis de ambiente

3. **Configurar variáveis de ambiente**:
   - Vá em Site settings > Environment variables
   - Adicione todas as variáveis do Neon
   - Configure `NODE_ENV=production`
   - Configure `JWT_SECRET` com uma chave segura

#### Opção B: Deploy Manual

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Build do projeto**:
   ```bash
   npm run build
   ```

3. **Upload para Netlify**:
   - Arraste a pasta `public` para o Netlify
   - Configure as variáveis de ambiente

### 3. Configuração das Variáveis de Ambiente

Na Netlify, configure estas variáveis:

```bash
# Banco de Dados Neon
NEON_HOST=your-project.neon.tech
NEON_DATABASE=gp_maquinas_db
NEON_USERNAME=your-username
NEON_PASSWORD=your-password
NEON_PORT=5432

# Aplicação
NODE_ENV=production
CORS_ORIGIN=https://your-app.netlify.app

# Segurança
JWT_SECRET=sua-chave-super-secreta-aqui
```

## 🛠️ Desenvolvimento Local

### Pré-requisitos

- Node.js 18+
- PostgreSQL local ou Neon
- npm ou yarn

### Instalação

1. **Clonar o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/gp-maquinas.git
   cd gp-maquinas
   ```

2. **Instalar dependências**:
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente**:
   ```bash
   cp env.example .env
   # Edite o arquivo .env com suas configurações
   ```

4. **Executar o banco**:
   ```bash
   # Execute o arquivo database.sql no seu PostgreSQL
   ```

5. **Iniciar o servidor**:
   ```bash
   npm run dev
   ```

6. **Acessar a aplicação**:
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api

## 📁 Estrutura do Projeto

```
gp-maquinas/
├── public/                 # Frontend (HTML, CSS, JS)
│   ├── index.html         # Página principal
│   ├── styles.css         # Estilos
│   └── script.js          # JavaScript do frontend
├── routes/                 # Rotas da API
│   ├── auth.js            # Autenticação
│   ├── services.js        # Serviços
│   └── reports.js         # Relatórios
├── config.js              # Configurações
├── database.js            # Conexão com banco
├── server.js              # Servidor principal
├── package.json           # Dependências
├── netlify.toml          # Configuração Netlify
└── README.md              # Este arquivo
```

## 🔐 Credenciais de Teste

### Administrador
- **Usuário**: `admin`
- **Senha**: `admin`

### Lojas
- **Usuário**: `GPInterlagos` (ou qualquer código de loja)
- **Senha**: `123456`

## 📊 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verificar token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Perfil do usuário

### Serviços
- `GET /api/services` - Listar serviços
- `POST /api/services` - Criar serviço
- `PUT /api/services/:id` - Atualizar serviço
- `DELETE /api/services/:id` - Deletar serviço
- `GET /api/services/machine/:code` - Serviços por máquina

### Relatórios
- `POST /api/reports/store` - Relatório de loja
- `POST /api/reports/financial` - Relatório financeiro
- `POST /api/reports/technicians` - Relatório de técnicos
- `GET /api/reports` - Listar relatórios
- `GET /api/reports/:id` - Obter relatório específico

## 🛡️ Segurança

- **JWT** para autenticação
- **bcrypt** para hash de senhas
- **Rate limiting** para prevenir abuso
- **CORS** configurado
- **Helmet** para headers de segurança
- **Validação** de dados de entrada
- **Controle de acesso** por loja

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- 💻 Desktop
- 📱 Smartphones
- 📱 Tablets
- 🖥️ Todos os navegadores modernos

## 🔧 Manutenção

### Logs
- Logs de erro são exibidos no console
- Logs de queries são exibidos para debug

### Monitoramento
- Endpoint `/api/health` para health check
- Métricas de performance das queries

### Backup
- Configure backup automático no Neon
- Exporte dados regularmente

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**:
   - Verifique as variáveis de ambiente
   - Confirme se o Neon está ativo
   - Teste a conexão localmente

2. **Erro de CORS**:
   - Verifique `CORS_ORIGIN` nas variáveis
   - Confirme se o domínio está correto

3. **Erro de JWT**:
   - Verifique `JWT_SECRET`
   - Confirme se o token não expirou

4. **Erro de build na Netlify**:
   - Verifique se o Node.js 18+ está configurado
   - Confirme se todas as dependências estão no package.json

### Suporte

Para suporte técnico:
- 📧 Email: suporte@gpmaquinas.com
- 📱 WhatsApp: (11) 99999-9999
- 🌐 Site: www.gpmaquinas.com

## 📄 Licença

Este projeto é proprietário da GP Máquinas e Serviços.
Todos os direitos reservados.

---

**Desenvolvido com ❤️ para GP Máquinas e Serviços**
