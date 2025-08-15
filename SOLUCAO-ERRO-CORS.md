# 🔧 Solução para Erro de CORS - GP Máquinas

## 🚨 Problema Identificado

O erro "Failed to fetch" ocorre porque você está abrindo o arquivo HTML diretamente no navegador (`file:///`), o que bloqueia requisições para APIs externas por questões de segurança.

## ✅ Soluções Implementadas

### 1. **Servidor Local para Desenvolvimento**

Criamos um servidor local que resolve problemas de CORS:

```bash
# Iniciar servidor local
node server-local.js
```

**Ou use o script batch (Windows):**
```bash
start-dev.bat
```

**Acesse:**
- http://localhost:3000 (aplicação principal)
- http://localhost:3000/test-api.html (teste da API)

### 2. **Arquivo de Teste Melhorado**

O `test-api.html` agora inclui:
- ✅ Diagnóstico automático de problemas
- ✅ Teste específico de CORS
- ✅ Logs detalhados
- ✅ Exportação de logs
- ✅ Indicador de status do sistema

### 3. **Configuração do Netlify**

O `netlify.toml` foi configurado para:
- ✅ Headers de segurança apropriados
- ✅ CORS configurado corretamente
- ✅ Proxy para API (se necessário)
- ✅ Content Security Policy adequado

## 🧪 Como Testar

### **Opção 1: Servidor Local (Recomendado)**
```bash
# 1. Inicie o servidor
node server-local.js

# 2. Abra no navegador
http://localhost:3000/test-api.html

# 3. Execute os testes
- Health Check
- Login (admin/admin123)
- Teste de Relatórios
```

### **Opção 2: Netlify (Produção)**
```bash
# 1. Faça deploy no Netlify
# 2. Acesse: https://seu-site.netlify.app/test-api.html
# 3. Execute os testes
```

### **Opção 3: Python (Alternativa)**
```bash
# Se não tiver Node.js
python -m http.server 8000
# Acesse: http://localhost:8000/test-api.html
```

## 🔍 Diagnóstico de Problemas

### **Se ainda houver "Failed to fetch":**

1. **Verifique se está usando servidor local:**
   - ❌ `file:///C:/Users/.../test-api.html` (não funciona)
   - ✅ `http://localhost:3000/test-api.html` (funciona)

2. **Verifique o console do navegador:**
   - Abra F12 → Console
   - Procure por erros específicos

3. **Teste a API diretamente:**
   ```bash
   curl https://gp-maquinas-backend.onrender.com/api/health
   ```

4. **Verifique logs do teste:**
   - Use o botão "Exportar Logs" no teste
   - Analise os logs para identificar problemas

## 🚀 Deploy no Netlify

### **Passo a Passo:**

1. **Conecte seu repositório ao Netlify**
2. **Configure as variáveis de ambiente (se necessário)**
3. **Deploy automático será feito**
4. **Acesse: https://seu-site.netlify.app**

### **Configurações Importantes:**

- ✅ **Build command:** (deixe vazio)
- ✅ **Publish directory:** `.` (ponto)
- ✅ **Node version:** 18 (se necessário)

## 🔧 Arquivos Modificados

1. **`test-api.html`** - Melhorado com diagnóstico completo
2. **`server-local.js`** - Servidor local para desenvolvimento
3. **`netlify.toml`** - Configuração do Netlify
4. **`start-dev.bat`** - Script para iniciar servidor (Windows)

## 📋 Checklist de Verificação

- [ ] Servidor local funcionando (http://localhost:3000)
- [ ] Health check passando
- [ ] Login funcionando (admin/admin123)
- [ ] Relatórios carregando
- [ ] Deploy no Netlify funcionando
- [ ] Aplicação principal funcionando

## 🆘 Suporte

Se ainda houver problemas:

1. **Execute o teste completo** em `test-api.html`
2. **Exporte os logs** e analise
3. **Verifique se o backend está online**: https://gp-maquinas-backend.onrender.com/api/health
4. **Teste em diferentes navegadores**

## 🎯 Resultado Esperado

Após seguir estas instruções, você deve ter:
- ✅ Aplicação funcionando localmente
- ✅ Aplicação funcionando no Netlify
- ✅ API conectada corretamente
- ✅ Relatórios carregando sem erros
- ✅ Sistema de autenticação funcionando

---

**💡 Dica:** Sempre use o servidor local para desenvolvimento e teste a aplicação no Netlify antes de considerar o problema resolvido.
