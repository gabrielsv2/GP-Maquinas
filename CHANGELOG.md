# Changelog - GP Máquinas e Serviços

## [2025-08-13] - Correções de Erros de API

### 🔧 Correções Implementadas

#### 1. Melhorias no Tratamento de Erros da API
- **Problema**: API retornava HTML em vez de JSON, causando erro de parsing
- **Solução**: Adicionada verificação de Content-Type antes de fazer parse JSON
- **Arquivo**: `script.js` - função `apiRequest()`

#### 2. Logs de Debug Melhorados
- **Adicionado**: Logs detalhados para todas as requisições API
- **Inclui**: URL, status da resposta, headers e conteúdo da resposta
- **Benefício**: Facilita identificação de problemas de comunicação

#### 3. Verificação de Autenticação Robusta
- **Nova função**: `checkAuthStatus()` para verificar token antes das requisições
- **Implementado**: Verificação automática em `displayStoreReport()` e `displayServices()`
- **Benefício**: Previne erros 401 e melhora experiência do usuário

#### 4. Tratamento de Erros Específicos
- **Diferenciação**: Erros de sessão expirada vs erros de comunicação
- **Mensagens**: Mais claras e específicas para cada tipo de erro
- **Ação**: Logout automático quando necessário

#### 5. Botão "Tentar Novamente"
- **Adicionado**: Botão na seção de relatórios para retry em caso de erro
- **Funcionalidade**: Permite tentar carregar relatório novamente sem recarregar página
- **Arquivos**: `index.html` e `script.js`

#### 6. Função de Recarregamento
- **Nova função**: `reloadPage()` para recarregar página com cache limpo
- **Nova função**: `handleAuthError()` para tratamento centralizado de erros de auth

### 🧪 Arquivo de Teste
- **Criado**: `test-api.html` para testar conectividade e endpoints da API
- **Funcionalidades**: 
  - Teste de health check
  - Teste de login
  - Teste de relatórios
  - Logs de debug em tempo real

### 📋 Como Testar

1. **Abra o arquivo de teste**: `test-api.html`
2. **Execute os testes em sequência**:
   - Health Check (deve passar)
   - Login (use admin/admin123)
   - Teste de Relatórios (após login)
3. **Verifique os logs** para identificar problemas específicos

### 🔍 Diagnóstico de Problemas

Se ainda houver erros:

1. **Verifique o console do navegador** para logs detalhados
2. **Use o arquivo `test-api.html`** para testar endpoints específicos
3. **Verifique se o servidor está online**: https://gp-maquinas-backend.onrender.com/api/health

### 🚀 Próximos Passos

- Monitorar logs para identificar padrões de erro
- Implementar retry automático para falhas temporárias
- Adicionar indicador de status de conexão
- Considerar implementar cache local para dados críticos
