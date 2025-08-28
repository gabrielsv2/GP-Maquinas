# Configuração do Ambiente de Desenvolvimento

## Pré-requisitos

### 1. Node.js
- Versão 18.0.0 ou superior
- Baixar em: https://nodejs.org/

### 2. PostgreSQL
- Versão 12 ou superior
- Baixar em: https://www.postgresql.org/download/

## Instalação do PostgreSQL no Windows

### Opção 1: Instalador Oficial
1. Baixe o instalador do PostgreSQL para Windows
2. Execute o instalador como administrador
3. Durante a instalação:
   - Defina a senha do usuário `postgres`
   - Mantenha a porta padrão (5432)
   - Instale todas as ferramentas (pgAdmin, etc.)

### Opção 2: Chocolatey (recomendado)
```powershell
# Instalar Chocolatey primeiro (se não tiver)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar PostgreSQL
choco install postgresql
```

### Opção 3: Docker
```bash
docker run --name postgres-dev -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=gp_maquinas_db -p 5432:5432 -d postgres:15
```

## Configuração do Banco

### 1. Conectar ao PostgreSQL
```bash
# Via psql (se instalado)
psql -U postgres -h localhost

# Via pgAdmin (interface gráfica)
# Abrir pgAdmin e conectar ao servidor local
```

### 2. Criar Banco de Dados
```sql
CREATE DATABASE gp_maquinas_db;
```

### 3. Executar Script de Criação das Tabelas
```bash
# No terminal, na pasta do projeto
psql -U postgres -d gp_maquinas_db -f database-postgresql.sql
```

## Configuração da Aplicação

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Ambiente
O arquivo `config-dev.js` já está configurado para desenvolvimento local.

### 3. Iniciar Servidor
```bash
npm start
```

### 4. Verificar Status
```bash
# Testar health check
curl http://localhost:3000/api/health

# Ou no PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET
```

## Testes

### 1. Executar Testes Automatizados
```bash
node test-api.js
```

### 2. Testar Manualmente
1. Abrir http://localhost:3000 no navegador
2. Tentar fazer login com usuário de teste
3. Testar criação de serviço

## Solução de Problemas

### Erro: "connection refused"
- Verificar se o PostgreSQL está rodando
- Verificar se a porta 5432 está livre
- Verificar se as credenciais estão corretas

### Erro: "database does not exist"
- Criar o banco de dados: `CREATE DATABASE gp_maquinas_db;`
- Executar o script de criação das tabelas

### Erro: "password authentication failed"
- Verificar a senha do usuário postgres
- Verificar se o usuário tem permissões adequadas

### Erro: "permission denied"
- Executar como administrador
- Verificar permissões de pasta

## Estrutura de Arquivos

```
public/
├── config-dev.js          # Configurações de desenvolvimento
├── database-postgresql.sql # Script de criação das tabelas
├── routes/
│   ├── auth.js           # Rotas de autenticação
│   └── services.js       # Rotas de serviços
├── server.js             # Servidor principal
├── database.js           # Configuração do banco
└── test-api.js           # Script de testes
```

## Comandos Úteis

### Verificar Status do PostgreSQL
```powershell
# Verificar se o serviço está rodando
Get-Service -Name "*postgres*"

# Verificar se a porta está em uso
netstat -an | findstr :5432
```

### Conectar ao Banco
```bash
psql -U postgres -d gp_maquinas_db -h localhost
```

### Listar Tabelas
```sql
\dt
```

### Ver Estrutura de uma Tabela
```sql
\d services
```

## Próximos Passos

1. **Configurar PostgreSQL**: Instalar e configurar o banco
2. **Criar Banco**: Executar script de criação das tabelas
3. **Testar Conexão**: Verificar se a aplicação consegue conectar
4. **Executar Testes**: Verificar se todas as funcionalidades estão funcionando
5. **Desenvolver**: Começar a desenvolver novas funcionalidades

## Suporte

Se encontrar problemas:

1. Verificar os logs do servidor
2. Verificar a conectividade com o banco
3. Executar os testes automatizados
4. Consultar a documentação de solução de problemas
