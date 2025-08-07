# GP Máquinas e Serviços - Sistema de Gerenciamento Administrativo

## Visão Geral

Este sistema foi desenvolvido para permitir que administradores acessem relatórios de todas as lojas da rede GP Máquinas e Serviços de qualquer dispositivo, fornecendo uma interface web moderna e responsiva com funcionalidades completas de gerenciamento e relatórios.

## Características Principais

### 🔐 Autenticação Segura
- Sistema de login com sessões seguras
- Suporte a múltiplos dispositivos
- Controle de acesso baseado em roles
- Tokens de autenticação com expiração

### 📊 Dashboard Administrativo
- Visão geral com estatísticas em tempo real
- Gráficos interativos com Chart.js
- Indicadores de performance
- Atividades recentes

### 🏪 Gerenciamento de Lojas
- Visualização de todas as lojas da rede
- Filtros por região e status
- Estatísticas detalhadas por loja
- Informações de contato e localização

### ⚙️ Gerenciamento de Máquinas
- Inventário completo de máquinas
- Status de manutenção em tempo real
- Filtros por tipo, loja e status
- Informações detalhadas de cada equipamento

### 🔧 Histórico de Serviços
- Registro completo de serviços realizados
- Filtros por data, loja e técnico
- Custos e descrições detalhadas
- Status de cada serviço

### 📅 Agendamento de Manutenção
- Cronograma de manutenções preventivas
- Alertas de manutenção urgente
- Filtros por prioridade e prazo
- Visualização organizada por urgência

### 💰 Análise Financeira
- Relatórios financeiros detalhados
- Custos por loja e período
- Gráficos de análise de gastos
- Métricas de performance financeira

### 📋 Geração de Relatórios
- Relatórios personalizados
- Múltiplos formatos de saída
- Histórico de relatórios gerados
- Filtros avançados

## Estrutura do Projeto

```
public/
├── database.sql              # Schema do banco de dados
├── api.php                   # API backend em PHP
├── admin-dashboard.html      # Interface administrativa
├── admin-styles.css          # Estilos do dashboard
├── admin-dashboard.js        # JavaScript do dashboard
├── index.html               # Interface original
├── script.js                # JavaScript original
├── styles.css               # Estilos originais
└── README.md                # Documentação
```

## Requisitos do Sistema

### Servidor Web
- Apache/Nginx com suporte a PHP
- PHP 7.4 ou superior
- MySQL 5.7 ou superior (ou MariaDB 10.2+)

### Extensões PHP Necessárias
- PDO
- PDO_MySQL
- JSON
- OpenSSL (para geração de tokens)

### Navegador
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Instalação

### 1. Configuração do Banco de Dados

1. Crie um banco de dados MySQL:
```sql
CREATE DATABASE gp_maquinas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Importe o schema do banco de dados:
```bash
mysql -u seu_usuario -p gp_maquinas_db < database.sql
```

### 2. Configuração do PHP

1. Edite o arquivo `api.php` e configure as credenciais do banco de dados:
```php
$db_config = [
    'host' => 'localhost',
    'dbname' => 'gp_maquinas_db',
    'username' => 'seu_usuario_mysql',
    'password' => 'sua_senha_mysql',
    'charset' => 'utf8mb4'
];
```

2. Certifique-se de que o PHP tem permissões de escrita no diretório (para logs de sessão).

### 3. Configuração do Servidor Web

1. Configure o servidor web para servir os arquivos do diretório `public/`

2. Para Apache, adicione ao `.htaccess`:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api.php/$1 [L,QSA]
```

3. Para Nginx, adicione ao arquivo de configuração:
```nginx
location /api/ {
    try_files $uri $uri/ /api.php?$query_string;
}
```

### 4. Configuração de Segurança

1. Configure HTTPS para produção
2. Defina permissões adequadas nos arquivos
3. Configure firewall para restringir acesso se necessário

## Uso do Sistema

### Acesso Administrativo

1. Acesse `admin-dashboard.html` no navegador
2. Use as credenciais padrão:
   - **Usuário:** admin
   - **Senha:** admin

### Funcionalidades Principais

#### Dashboard
- Visualize estatísticas gerais do sistema
- Acompanhe atividades recentes
- Monitore indicadores de performance

#### Gerenciamento de Lojas
- Visualize todas as lojas da rede
- Filtre por região ou status
- Acesse estatísticas detalhadas

#### Gerenciamento de Máquinas
- Consulte o inventário completo
- Filtre por tipo, loja ou status
- Monitore manutenções programadas

#### Histórico de Serviços
- Visualize todos os serviços realizados
- Filtre por período, loja ou técnico
- Analise custos e descrições

#### Manutenção
- Acompanhe o cronograma de manutenções
- Identifique manutenções urgentes
- Organize por prioridade

#### Financeiro
- Analise custos por loja
- Visualize relatórios financeiros
- Monitore gastos por período

#### Relatórios
- Gere relatórios personalizados
- Escolha entre diferentes tipos
- Defina filtros específicos

## API Endpoints

### Autenticação
- `POST /api/login` - Login do usuário
- `POST /api/logout` - Logout do usuário

### Dashboard
- `GET /api/dashboard` - Dados do dashboard

### Lojas
- `GET /api/stores` - Lista todas as lojas
- `GET /api/store-summary` - Resumo das lojas

### Máquinas
- `GET /api/machines` - Lista máquinas com filtros

### Serviços
- `GET /api/services` - Lista serviços com filtros

### Manutenção
- `GET /api/maintenance-schedule` - Cronograma de manutenção

### Financeiro
- `GET /api/financial-summary` - Resumo financeiro

### Relatórios
- `GET /api/reports` - Lista relatórios
- `POST /api/reports` - Gera novo relatório

## Segurança

### Autenticação
- Tokens JWT para sessões
- Expiração automática de sessões
- Validação de permissões por endpoint

### Dados
- Prepared statements para prevenir SQL injection
- Validação de entrada em todos os endpoints
- Sanitização de dados de saída

### Sessões
- Tokens únicos por sessão
- Invalidação automática de sessões antigas
- Log de atividades de usuário

## Manutenção

### Backup do Banco de Dados
```bash
mysqldump -u usuario -p gp_maquinas_db > backup_$(date +%Y%m%d).sql
```

### Logs
- Logs de erro do PHP
- Logs de acesso do servidor web
- Logs de auditoria no banco de dados

### Monitoramento
- Verificar logs regularmente
- Monitorar performance do banco de dados
- Acompanhar uso de recursos

## Personalização

### Temas
- Edite `admin-styles.css` para personalizar cores e layout
- Modifique variáveis CSS para alterar o tema

### Funcionalidades
- Adicione novos endpoints na API
- Crie novos tipos de relatórios
- Implemente notificações personalizadas

### Dados
- Adicione novos campos nas tabelas
- Crie novas views para relatórios
- Implemente novos filtros

## Suporte

### Problemas Comuns

1. **Erro de conexão com banco de dados**
   - Verifique credenciais no `api.php`
   - Confirme se o MySQL está rodando
   - Teste conexão manualmente

2. **Erro de permissão**
   - Verifique permissões de arquivo
   - Confirme configuração do servidor web
   - Teste com usuário adequado

3. **Sessão expirada**
   - Faça login novamente
   - Verifique configuração de timezone
   - Confirme configuração de sessão PHP

### Contato
Para suporte técnico ou dúvidas sobre o sistema, entre em contato com a equipe de desenvolvimento.

## Licença

Este projeto é desenvolvido para uso interno da GP Máquinas e Serviços. Todos os direitos reservados.

## Changelog

### v1.0.0 (2024-01-XX)
- Lançamento inicial do sistema
- Dashboard administrativo completo
- API RESTful
- Sistema de autenticação
- Relatórios e análises
- Interface responsiva
