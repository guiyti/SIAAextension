# 🔧 GUIA DE ATUALIZAÇÃO - SIAA Data Extractor v1.1

## 🚨 **PROBLEMA RESOLVIDO: CSP (Content Security Policy)**

A extensão foi completamente reestruturada para contornar o CSP restritivo do SIAA que estava bloqueando a execução de scripts.

## 🔄 **PRINCIPAIS MUDANÇAS**

### **1. Nova Arquitetura**
- ✅ **chrome.scripting.executeScript**: Substitui injeção inline de scripts
- ✅ **Permissão "scripting"**: Adicionada ao manifest.json
- ✅ **Background Script melhorado**: Gerencia toda a execução
- ✅ **Popup redesenhado**: Visual compatível com SIAA

### **2. Visual Atualizado**
- 🎨 **Gradiente SIAA**: Cores #ebb55e (dourado/laranja)
- 🎨 **Botões estilizados**: Seguem padrão do sistema
- 🎨 **Bordas temáticas**: Integração visual completa

### **3. Fluxo de Funcionamento**
```
Popup → Background Script → chrome.scripting → Página SIAA
```

## 📋 **PASSOS PARA ATUALIZAR**

### **1. Recarregar a Extensão**
1. Abra `chrome://extensions/`
2. Encontre "SIAA Data Extractor"
3. Clique no ícone de **recarregar** (🔄)
4. Ou **desabilite** e **habilite** novamente

### **2. Verificar Permissões**
- A extensão agora solicita permissão "scripting"
- Aceite quando solicitado

### **3. Testar Funcionamento**
1. Acesse: `https://siaa.cruzeirodosul.edu.br/novo-siaa/secure/core/home.jsf`
2. Clique no ícone da extensão
3. Deve aparecer: **"Pronto para extrair dados"** 🟢
4. Clique em **"🚀 Extrair Dados"**

## 🔍 **DIAGNÓSTICO DE PROBLEMAS**

### **Teste Manual no Console:**
```javascript
// Cole no console da página SIAA (F12 → Console)
console.log('Teste de permissões CSP');
```

### **Logs Esperados:**
- `🔧 SIAA Data Extractor - Background Script iniciado`
- `📍 Página carregada: [URL]`
- `✅ Página SIAA detectada - Extensão pronta para uso`

### **Se Ainda Não Funcionar:**

1. **Limpar Cache do Chrome:**
   ```
   chrome://settings/clearBrowserData
   → Selecionar "Dados de aplicativos hospedados"
   ```

2. **Recarregar Página SIAA:**
   - Pressione `Ctrl+F5` (hard refresh)
   - Ou `Ctrl+Shift+R`

3. **Verificar Console de Erros:**
   - F12 → Console
   - Procure por mensagens com 🚀 ❌ ✅

## ⚙️ **ARQUIVOS MODIFICADOS**

| Arquivo | Mudanças |
|---------|----------|
| `manifest.json` | + Permissão "scripting" |
| `popup.html` | Visual SIAA (gradiente #ebb55e) |
| `popup.js` | Comunicação com background |
| `background.js` | chrome.scripting.executeScript |
| `content.js` | Simplificado (sem injeção) |
| `injected.js` | Bordas SIAA nos overlays |

## 🎯 **BENEFÍCIOS DA ATUALIZAÇÃO**

✅ **Maior Compatibilidade**: Funciona com CSP restritivo  
✅ **Visual Integrado**: Combina com o design do SIAA  
✅ **Execução Robusta**: Menos chances de falha  
✅ **Melhor Performance**: Execução direta via Chrome API  
✅ **Logs Detalhados**: Facilita debugging  

## 🚀 **TESTE COMPLETO**

### **Cenário de Sucesso:**
1. ✅ Popup abre com visual SIAA
2. ✅ Status: "Pronto para extrair dados" 🟢
3. ✅ Clique "Extrair Dados" → Interface de seleção
4. ✅ Escolher curso → Iniciação da extração
5. ✅ Download automático do CSV

### **Indicadores Visuais:**
- 🔴 **Vermelho**: Página incorreta
- 🟢 **Verde**: Pronto para uso
- 🟡 **Amarelo**: Processando

## 📞 **SUPORTE**

Se ainda houver problemas:

1. **Verifique o Console** (F12)
2. **Anote mensagens de erro** exatas
3. **Confirme URL**: deve conter `home.jsf`
4. **Teste em aba privada**: para eliminar cache

---

**🎉 A extensão agora é mais robusta e visualmente integrada ao SIAA!** 