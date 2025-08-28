# Configuração das Variáveis de Ambiente no Render

## 🚀 Configuração para Produção (Render + Neon)

Para que o sistema funcione corretamente em produção, você precisa configurar as seguintes variáveis de ambiente no painel do Render.

## 📋 Variáveis Obrigatórias

### 1. **Configurações do Banco Neon**
```
NEON_HOST=ep-cool-forest-123456.us-east-2.aws.neon.tech
NEON_PORT=5432
NEON_DATABASE=gp_maquinas_db
NEON_USERNAME=seu_usuario_neon
NEON_PASSWORD=sua_senha_neon
```

### 2. **Configurações de Segurança**
```
JWT_SECRET=sua_chave_secreta_muito_segura_aqui
```

### 3. **Configurações da Aplicação**
```
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://gp-services.netlify.app
```

## 🔧 Como Configurar no Render

### Passo 1: Acessar o Painel do Render
1. Acesse: https://dashboard.render.com
2. Faça login na sua conta
3. Clique no seu serviço `gp-maquinas-backend`

### Passo 2: Configurar Variáveis de Ambiente
1. No menu lateral, clique em **"Environment"**
2. Clique em **"Add Environment Variable"**
3. Adicione cada variável uma por vez:

#### Exemplo de configuração:
| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `NEON_HOST` | `ep-cool-forest-123456.us-east-2.aws.neon.tech` |
| `NEON_PORT` | `5432` |
| `NEON_DATABASE` | `gp_maquinas_db` |
| `NEON_USERNAME` | `seu_usuario_neon` |
| `NEON_PASSWORD` | `sua_senha_neon` |
| `JWT_SECRET` | `sua_chave_secreta_muito_segura_aqui` |
| `CORS_ORIGIN` | `https://gp-services.netlify.app` |

### Passo 3: Obter Credenciais do Neon
1. Acesse: https://console.neon.tech
2. Faça login na sua conta
3. Selecione seu projeto
4. Clique em **"Connection Details"**
5. Copie as informações de conexão

## 📊 Estrutura das Variáveis Neon

### Host
- Formato: `ep-[nome]-[regiao]-[id].aws.neon.tech`
- Exemplo: `ep-cool-forest-123456.us-east-2.aws.neon.tech`

### Database
- Nome do banco que você criou no Neon
- Exemplo: `gp_maquinas_db`

### Username
- Usuário criado no Neon
- Exemplo: `gabriel_user`

### Password
- Senha do usuário Neon
- **IMPORTANTE**: Use uma senha forte e única

## 🔐 JWT Secret

### Gerar uma Chave Segura
```bash
# No terminal (Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ou usar um gerador online
# https://generate-secret.vercel.app/64
```

### Exemplo de JWT Secret
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
```

## ✅ Verificação da Configuração

### 1. **Deploy Automático**
Após configurar as variáveis, o Render fará um novo deploy automaticamente.

### 2. **Verificar Logs**
Nos logs do Render, você deve ver:
```
🚀 Configurações de produção carregadas
🌐 Ambiente: Render + Neon
✅ Todas as variáveis de ambiente obrigatórias estão configuradas
🔗 Nova conexão estabelecida
✅ Conexão com banco de dados estabelecida
```

### 3. **Testar API**
```bash
# Testar health check
curl https://gp-maquinas-backend.onrender.com/api/health

# Deve retornar:
{
  "status": "OK",
  "timestamp": "2025-08-28T16:00:00.000Z",
  "environment": "production",
  "database": "connected"
}
```

## 🚨 Problemas Comuns

### Erro: "Variáveis de ambiente obrigatórias não configuradas"
- **Solução**: Verificar se todas as variáveis estão configuradas no Render
- **Verificar**: Nomes das variáveis (case sensitive)

### Erro: "Connection refused" ou "ECONNREFUSED"
- **Solução**: Verificar se as credenciais do Neon estão corretas
- **Verificar**: Host, usuário, senha e nome do banco

### Erro: "SSL connection required"
- **Solução**: O sistema já está configurado para usar SSL
- **Verificar**: Se as credenciais do Neon estão corretas

### Erro: "CORS" no frontend
- **Solução**: Verificar se `CORS_ORIGIN` está configurado corretamente
- **Valor correto**: `https://gp-services.netlify.app`

## 🔄 Após Configuração

1. **Deploy automático** será iniciado
2. **Aguardar** o deploy completar (2-5 minutos)
3. **Verificar logs** para confirmar conexão com banco
4. **Testar API** no frontend

## 📞 Suporte

Se ainda houver problemas:
1. Verificar logs no Render
2. Confirmar credenciais do Neon
3. Verificar se o banco Neon está ativo
4. Testar conexão manual com o Neon

---

**Status**: ⚠️ **CONFIGURAÇÃO NECESSÁRIA**
**Próximo passo**: Configurar variáveis no Render
