# Solução para Erro 500 - API GP Máquinas

## Problema Identificado

O erro 500 estava ocorrendo devido a:

1. **Campo obrigatório ausente**: A tabela `services` no PostgreSQL tem um campo `record_date` que é obrigatório, mas o código não estava enviando esse campo.

2. **Tratamento de erros inadequado**: O sistema não estava fornecendo detalhes suficientes sobre os erros, dificultando o debug.

3. **Configuração de banco inadequada**: Falta de configurações robustas para conexão e retry.

## Soluções Implementadas

### 1. Correção da Query de Inserção

**Arquivo**: `routes/services.js`

A query de inserção foi corrigida para incluir o campo `record_date`:

```sql
INSERT INTO services (
    machine_code, machine_type, store_id, location, service_type_id,
    technician_id, service_date, record_date, description, cost, status, notes,
    estimated_duration_hours, actual_duration_hours, parts_used, warranty_until,
    created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
```

### 2. Melhor Tratamento de Erros

**Arquivo**: `routes/services.js`

Implementado tratamento específico para diferentes tipos de erro do PostgreSQL:

- **23505**: Violação de unicidade
- **23503**: Violação de chave estrangeira  
- **23514**: Violação de constraint

Em desenvolvimento, o sistema retorna detalhes completos do erro.

### 3. Validação de Dados Melhorada

**Arquivo**: `routes/services.js`

Validação mais robusta dos dados de entrada:

```javascript
body('technicianId').isInt({ min: 1 }).withMessage('Técnico deve ser um ID válido'),
body('serviceDate').isISO8601().toDate().withMessage('Data do serviço deve ser uma data válida'),
body('status').optional().isIn(['completed', 'pending', 'cancelled', 'in_progress'])
```

### 4. Configuração de Banco Melhorada

**Arquivo**: `database.js`

- Implementado sistema de retry automático
- Melhor logging de erros
- Configurações de pool otimizadas
- Tratamento de reconexão automática

### 5. Configuração de Ambiente

**Arquivo**: `config.js` e `config-dev.js`

- Configurações específicas para desenvolvimento
- Valores padrão robustos
- Fallback para variáveis de ambiente

### 6. Tratamento de Erros no Servidor

**Arquivo**: `server.js`

- Middleware de erro melhorado
- Logging detalhado
- Graceful shutdown
- Tratamento de erros não capturados

## Como Testar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados

Para desenvolvimento local, crie um arquivo `config-dev.js` com suas configurações de banco.

### 3. Iniciar Servidor

```bash
npm start
```

### 4. Executar Testes

```bash
node test-api.js
```

## Estrutura da Tabela Services

A tabela `services` no PostgreSQL tem a seguinte estrutura:

```sql
CREATE TABLE services (
    service_id BIGSERIAL PRIMARY KEY,
    machine_code VARCHAR(100) NOT NULL,
    machine_type VARCHAR(100) NOT NULL,
    store_id VARCHAR(20) NOT NULL,
    location VARCHAR(200) NOT NULL,
    service_type_id VARCHAR(30) NOT NULL,
    technician_id INTEGER NOT NULL,
    service_date DATE NOT NULL,
    record_date DATE NOT NULL,  -- ← Campo obrigatório que estava faltando
    description TEXT NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    estimated_duration_hours INTEGER,
    actual_duration_hours INTEGER,
    parts_used TEXT,
    warranty_until DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Campos Obrigatórios

Para criar um serviço, os seguintes campos são obrigatórios:

- `machineCode`: Código da máquina
- `machineType`: Tipo da máquina
- `storeId`: ID da loja
- `location`: Localização
- `serviceTypeId`: Tipo de serviço
- `technicianId`: ID do técnico
- `serviceDate`: Data do serviço
- `description`: Descrição
- `cost`: Custo

## Campos Opcionais

- `status`: Status do serviço (padrão: 'completed')
- `notes`: Notas adicionais
- `estimatedDurationHours`: Duração estimada
- `actualDurationHours`: Duração real
- `partsUsed`: Peças utilizadas
- `warrantyUntil`: Data de garantia

## Logs e Debug

Em desenvolvimento, o sistema fornece logs detalhados:

- Configurações carregadas
- Status de conexão com banco
- Detalhes de queries executadas
- Erros com códigos PostgreSQL
- Status do pool de conexões

## Monitoramento

O sistema inclui endpoints de monitoramento:

- `/api/health`: Status geral do sistema
- Logs de saúde do pool de conexões
- Métricas de performance

## Próximos Passos

1. **Configurar banco de dados**: Certifique-se de que o PostgreSQL está rodando e acessível
2. **Executar migrações**: Use o arquivo `database-postgresql.sql` para criar as tabelas
3. **Testar API**: Use o script `test-api.js` para verificar funcionamento
4. **Monitorar logs**: Acompanhe os logs do servidor para identificar problemas

## Suporte

Se ainda houver problemas:

1. Verifique os logs do servidor
2. Confirme a conectividade com o banco
3. Valide a estrutura das tabelas
4. Execute os testes automatizados
