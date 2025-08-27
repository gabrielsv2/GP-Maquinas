# 🚀 INSTRUÇÕES PARA IMPLEMENTAR OS NOVOS LOGINS

## 📋 **Resumo das Alterações**

✅ **Sistema de autenticação atualizado** para usar tabela de usuários no banco de dados
✅ **Novos usuários das lojas** com senhas individuais e seguras
✅ **Novo usuário ADMIN** com credenciais atualizadas

## 🔐 **Novos Logins**

### **ADMINISTRADOR**
- **Usuário:** `admGP`
- **Senha:** `778*GP`

### **LOJAS (23 usuários)**

| Loja | Usuário | Senha |
|------|---------|-------|
| GP Anhaia Mello | `gpanhaia` | `ab12` |
| GP Aricanduva | `gparicanduva` | `zx34` |
| GP Campo Limpo | `gpcampo` | `rt56` |
| GP Carrão | `gpcarrao` | `mn78` |
| GP Cidade Dutra | `gpdutra` | `pq90` |
| GP Cotia | `gpcotia` | `kl23` |
| GP Cruzeiro do Sul | `gpcruzeiro` | `uv45` |
| GP Demarchi | `gpdemarchi` | `cd67` |
| GP Edgar Facó | `gpedgar` | `op89` |
| GP Guarulhos | `gpguarulhos` | `gh12` |
| GP Interlagos | `gpinterlagos` | `ij34` |
| GP Jabaquara | `gpjabaquara` | `wx56` |
| GP Jundiaí | `gpjundiai` | `qr78` |
| GP Lapa | `gplapa` | `st90` |
| GP Limão | `gplimao` | `lm23` |
| GP M'Boi Mirim | `gpmboi` | `yz45` |
| GP Mogi | `gpmogi` | `de67` |
| GP Morumbi | `gpmorumbi` | `fg89` |
| GP Osasco | `gposasco` | `bn12` |
| GP Ragueb Chohfi | `gpragueb` | `cv34` |
| GP Ribeirão Preto | `gpribeirao` | `hk56` |
| GP Ricardo Jafet | `gpjafet` | `jp78` |
| GP Santo André | `gpsanto` | `qt90` |
| GP Taboão | `gptaboao` | `rw23` |

## 🗄️ **Arquivos Criados/Modificados**

### **1. Scripts SQL (escolha um):**
- **`add-users-table.sql`** - Versão completa com comentários
- **`add-users-table-clean.sql`** - Versão limpa sem acentos
- **`add-users-table-simple.sql`** - Versão dividida em partes menores

### **2. `routes/auth.js`** (MODIFICADO)
- Sistema de autenticação atualizado
- Login baseado em banco de dados
- Verificação de senha com bcrypt
- Perfil do usuário atualizado

### **3. `generate-passwords.js`**
- Script para gerar hashes das senhas
- Usado para criar o arquivo SQL

## 🚀 **Passos para Implementação**

### **Passo 1: Executar no Banco de Dados PostgreSQL**

**Opção A - Arquivo completo:**
```sql
-- No PostgreSQL (psql)
\i add-users-table.sql
```

**Opção B - Arquivo limpo:**
```sql
-- No PostgreSQL (psql)
\i add-users-table-clean.sql
```

**Opção C - Arquivo simples (recomendado):**
```sql
-- No PostgreSQL (psql)
\i add-users-table-simple.sql
```

**Opção D - Copiar e colar diretamente:**
```sql
-- Copiar o conteúdo de add-users-table-simple.sql
-- e colar diretamente no psql
```

### **Passo 2: Verificar Funcionamento**
1. **Testar login do ADMIN:**
   - Usuário: `admGP`
   - Senha: `778*GP`

2. **Testar login de uma loja:**
   - Usuário: `gpanhaia`
   - Senha: `ab12`

### **Passo 3: Verificar no Sistema**
- ✅ Login funcionando
- ✅ Perfil correto sendo exibido
- ✅ Acesso às funcionalidades da loja
- ✅ Permissões corretas

## 🔒 **Segurança**

- ✅ **Senhas criptografadas** com bcrypt (salt rounds: 12)
- ✅ **Usuários únicos** por loja
- ✅ **Controle de acesso** baseado em roles
- ✅ **Tokens JWT** com expiração de 24h

## ⚠️ **Importante**

- **Backup do banco** antes de executar as alterações
- **Testar em ambiente de desenvolvimento** primeiro
- **Verificar se as lojas existem** na tabela `stores`
- **IDs das lojas** devem corresponder aos `store_id` na tabela `users`
- **Sistema configurado para PostgreSQL** (não MySQL)
- **Se houver erro de sintaxe**, use o arquivo `add-users-table-simple.sql`

## 🧪 **Testes Recomendados**

1. **Login com credenciais corretas**
2. **Login com credenciais incorretas**
3. **Verificação de perfil**
4. **Acesso às funcionalidades específicas da loja**
5. **Logout e renovação de token**

## 🐘 **Diferenças PostgreSQL vs MySQL**

- ✅ **SERIAL** em vez de AUTO_INCREMENT
- ✅ **CHECK constraint** em vez de ENUM
- ✅ **Índices criados separadamente**
- ✅ **Sintaxe de comentários** específica do PostgreSQL

## 🆘 **Solução de Problemas**

### **Erro de sintaxe:**
- Use `add-users-table-simple.sql` (mais simples)
- Execute comandos um por vez se necessário
- Verifique se não há caracteres especiais

### **Erro de codificação:**
- Use `add-users-table-clean.sql` (sem acentos)
- Verifique se o arquivo está em UTF-8

---

**Status:** ✅ **PRONTO PARA IMPLEMENTAÇÃO NO POSTGRESQL**
**Arquivo recomendado:** `add-users-table-simple.sql`
**Próximo passo:** Executar o script SQL no banco PostgreSQL
