# GP Máquinas e Serviços - Sistema de Gerenciamento

Sistema completo de gerenciamento de serviços para GP Máquinas, incluindo frontend e backend.

## 🚀 Deploy no Render

### Pré-requisitos
- Conta no Render.com
- Banco de dados PostgreSQL (recomendado: Neon)
- Variáveis de ambiente configuradas

### Passos para Deploy

1. **Fork/Clone este repositório**

2. **No Render Dashboard:**
   - Clique em "New +" → "Web Service"
   - Conecte seu repositório GitHub
   - Configure as seguintes variáveis de ambiente:

#### Variáveis de Ambiente Necessárias:
```env
NODE_ENV=production
PORT=10000
NEON_HOST=sua-host-neon
NEON_PORT=5432
NEON_DATABASE=seu-database-name
NEON_USERNAME=seu-username
NEON_PASSWORD=sua-senha
JWT_SECRET=sua-chave-secreta-jwt
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://sistema-gp-maquinas.netlify.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

3. **Configurações do Render:**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
   - **Plan:** Free (ou pago se necessário)

### Estrutura do Projeto

```
/
├── public/                 # Arquivos estáticos (frontend)
│   ├── index.html         # Página principal
│   ├── admin-dashboard.html # Dashboard administrativo
│   ├── styles.css         # Estilos principais
│   ├── admin-styles.css   # Estilos do admin
│   ├── script.js          # JavaScript principal
│   └── admin-dashboard.js # JavaScript do admin
├── routes/                # Rotas da API
│   ├── auth.js           # Autenticação
│   ├── services.js       # Serviços
│   └── reports.js        # Relatórios
├── server-simple.js      # Servidor principal
├── database.js           # Configuração do banco
├── config.js             # Configurações gerais
├── package.json          # Dependências
└── render.yaml           # Configuração do Render
```

### Endpoints da API

- `GET /` - Página principal
- `GET /admin` - Dashboard administrativo
- `GET /health` - Health check
- `POST /api/auth/login` - Login
- `GET /api/services` - Listar serviços
- `POST /api/services` - Criar serviço
- `GET /api/reports/store` - Relatório de loja

### Troubleshooting

#### Erro: "ENOENT: no such file or directory, stat '/opt/render/project/src/public/index.html'"

**Solução:** Verifique se:
1. A pasta `public/` existe no repositório
2. O arquivo `index.html` está dentro da pasta `public/`
3. O `server-simple.js` está configurado corretamente

#### Erro de Conexão com Banco

**Solução:** Verifique se:
1. Todas as variáveis de ambiente do banco estão configuradas
2. O banco Neon está ativo
3. As credenciais estão corretas

#### Erro de CORS

**Solução:** Verifique se:
1. A variável `CORS_ORIGIN` está configurada corretamente
2. O frontend está sendo servido do domínio correto

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Executar em produção
npm start
```

### Banco de Dados

O sistema usa PostgreSQL com Neon. Execute o script `database-postgresql.sql` para criar as tabelas necessárias.

### Segurança

- JWT para autenticação
- Bcrypt para hash de senhas
- Helmet para headers de segurança
- CORS configurado
- Rate limiting implementado

## 📞 Suporte

Para suporte técnico, entre em contato com a equipe de desenvolvimento.
