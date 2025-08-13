# 🚀 Instruções de Deploy - GP Máquinas e Serviços

## 📋 Pré-requisitos

- Conta no [Netlify](https://netlify.com)
- Conta no [Neon](https://neon.tech) (banco PostgreSQL)
- Conta no [Render](https://render.com)

## 🌐 Deploy no Netlify

### 1. Conectar Repositório
- Faça push do código para o GitHub
- Conecte o repositório no Netlify
- Configure as variáveis de ambiente:

```bash
NODE_ENV=production
JWT_SECRET=sua-chave-secreta-aqui
CORS_ORIGIN=https://sistema-gp-maquinas.netlify.app
```

### 2. Configuração de Build
- **Build command:** `npm run build`
- **Publish directory:** `.`
- **Functions directory:** `functions`

### 3. Deploy
- O Netlify detectará automaticamente as configurações
- As funções serverless serão deployadas automaticamente

## 🗄️ Configuração do Banco Neon

### 1. Criar Banco
- Crie um novo projeto no Neon
- Copie a string de conexão

### 2. Variáveis de Ambiente
Adicione no Netlify:
```bash
DATABASE_URL=postgresql://user:password@host/database
NEON_DATABASE_URL=postgresql://user:password@host/database
```

### 3. Executar Scripts SQL
- Execute o arquivo `database-postgresql.sql` no banco Neon
- Isso criará as tabelas necessárias

## ⚙️ Deploy no Render (Backend)

### 1. Conectar Repositório
- Conecte o mesmo repositório no Render
- Configure como serviço web

### 2. Variáveis de Ambiente
```bash
NODE_ENV=production
PORT=10000
NEON_HOST=seu-host.neon.tech
NEON_PORT=5432
NEON_DATABASE=gp_maquinas_db
NEON_USERNAME=seu-usuario
NEON_PASSWORD=sua-senha
JWT_SECRET=sua-chave-secreta-aqui
CORS_ORIGIN=https://sistema-gp-maquinas.netlify.app
```

### 3. Comandos
- **Build Command:** `npm install`
- **Start Command:** `npm start`

## 🔧 Configuração do Frontend

### 1. URLs das APIs
O frontend já está configurado para usar:
- `/api/auth/login` - Login
- `/api/auth/verify` - Verificar token
- `/api/services` - Serviços
- `/api/machines` - Máquinas

### 2. CORS
O backend está configurado para aceitar requisições do Netlify

## 🧪 Testando o Sistema

### 1. Login Admin
- **Usuário:** `admin`
- **Senha:** `admin`

### 2. Login Loja
- **Usuário:** código da loja (ex: `GPInterlagos`)
- **Senha:** `123456`

### 3. Funcionalidades
- ✅ Login e autenticação
- ✅ Registro de serviços
- ✅ Visualização de relatórios
- ✅ Gerenciamento de máquinas

## 🚨 Troubleshooting

### Erro de CORS
- Verifique se `CORS_ORIGIN` está correto
- Certifique-se de que o domínio do Netlify está na lista

### Erro de Banco
- Verifique a string de conexão do Neon
- Teste a conexão localmente primeiro

### Erro de Funções Netlify
- Verifique se a pasta `functions` existe
- Certifique-se de que `serverless-http` está instalado

## 📞 Suporte

Para problemas técnicos, verifique:
1. Logs do Netlify (Functions)
2. Logs do Render (Backend)
3. Console do navegador
4. Network tab do DevTools
