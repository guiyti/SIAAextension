# 🚀 SIAA Data Extractor v1.1.0 - Chrome Web Store Submission

## 📋 Informações Básicas

### **Detalhes da Extensão**
- **Nome**: SIAA Data Extractor
- **Versão**: 1.1.0
- **Categoria**: Produtividade
- **Idioma**: Português (Brasil)
- **Manifest**: V3 (Moderno)

### **Descrição Curta (132 caracteres max)**
```
Extração e visualização avançada de dados acadêmicos do SIAA - Cruzeiro do Sul. Interface responsiva e headers fixos.
```

### **Descrição Detalhada**
```
🎓 SIAA Data Extractor v1.1.0 - Interface Responsiva Profissional

Extensão avançada para extrair e visualizar dados acadêmicos do sistema SIAA da Universidade Cruzeiro do Sul com interface moderna, responsiva e otimizada para todos os dispositivos.

✨ PRINCIPAIS FUNCIONALIDADES v1.1.0:

📊 VISUALIZAÇÃO AVANÇADA:
• Interface responsiva que se adapta a qualquer dispositivo
• Headers fixos - sempre visíveis durante scroll
• Design profissional estilo Windows com cores cinza elegantes
• Sidebar moderna deslizante com controles organizados

🔍 BUSCA INTELIGENTE:
• Busca apenas nos campos visíveis/exibidos
• Performance otimizada com debounce
• Placeholder intuitivo: "🔍 Buscar nos campos visíveis..."

🎛️ CONTROLES AVANÇADOS:
• Drag & drop para reordenar colunas (tabela e sidebar)
• Filtros dinâmicos: campus, período, disciplina, professor, curso
• Toggle de colunas com persistência de configurações
• Exportação de dados filtrados

📱 MOBILE FRIENDLY:
• Detecção automática de dispositivos móveis
• Layout adaptativo para portrait/landscape
• Headers dinâmicos com recálculo automático
• Interface touch otimizada

💾 GERENCIAMENTO DE DADOS:
• Storage universal (chrome.storage + localStorage fallback)
• Verificação de atualizações com relatório de mudanças
• Workflow em 3 etapas: Capturar → Visualizar → Exportar
• Persistência de configurações entre sessões

🔒 SEGURANÇA E PRIVACIDADE:
• CSP Compliance - JavaScript totalmente externo
• Nenhum dado enviado para servidores externos
• Processamento 100% local no navegador
• Compatível com políticas de segurança restritivas

🎯 COMO USAR:
1. Acesse o SIAA da Cruzeiro do Sul
2. Clique na extensão → "🔄 Capturar Dados"
3. Aguarde o processamento dos dados
4. Clique "👁️ Visualizar" para interface moderna
5. Use filtros, busca e drag & drop conforme necessário
6. Exporte dados filtrados quando pronto

⚙️ COMPATIBILIDADE:
• Chrome 88+ (Manifest V3)
• Desktop e Mobile
• Windows, Mac, Linux, Android

Esta extensão é desenvolvida especificamente para a comunidade acadêmica da Cruzeiro do Sul e não coleta dados pessoais dos usuários.
```

---

## 🖼️ Assets Visuais

### **Ícones Necessários** ✅
- `icons/icon16.png` (16x16px)
- `icons/icon32.png` (32x32px) 
- `icons/icon48.png` (48x48px)
- `icons/icon128.png` (128x128px)

### **Screenshots Recomendados**
**Desktop (1280x800px):**
1. Interface principal com dados carregados
2. Sidebar aberta mostrando filtros e controles
3. Drag & drop de colunas em ação
4. Busca funcionando com resultados

**Mobile (320x568px):**
1. Layout mobile com header adaptativo
2. Headers fixos durante scroll
3. Sidebar mobile touch-friendly

### **Promotional Images**
- **Tile pequeno**: 440x280px
- **Tile grande**: 920x680px  
- **Marquee**: 1400x560px

---

## 🔐 Permissões e Justificativas

### **Permissões Solicitadas**
```json
{
  "permissions": [
    "activeTab",    // Acesso à aba atual do SIAA
    "storage",      // Salvar dados e configurações localmente  
    "scripting"     // Execução de scripts (CSP compliance)
  ],
  "host_permissions": [
    "https://siaa.cruzeirodosul.edu.br/*"  // Acesso apenas ao SIAA
  ]
}
```

### **Justificativas das Permissões**
- **activeTab**: Necessário para acessar e extrair dados da página atual do SIAA
- **storage**: Armazenar dados extraídos e configurações de interface localmente
- **scripting**: Executar scripts de extração respeitando CSP (Content Security Policy)
- **host_permissions**: Acesso restrito apenas ao domínio oficial do SIAA

---

## 📊 Dados de Uso e Privacidade

### **Coleta de Dados**: NÃO
- ❌ Não coleta dados pessoais
- ❌ Não envia dados para servidores externos
- ❌ Não rastreia atividade do usuário
- ✅ Processa apenas dados acadêmicos públicos do SIAA
- ✅ Armazenamento 100% local

### **Uso de Dados**
- Extração de dados acadêmicos públicos (disciplinas, vagas, professores)
- Processamento local para geração de relatórios CSV
- Armazenamento local para visualização offline

### **Público-Alvo**
- Estudantes da Universidade Cruzeiro do Sul
- Administradores acadêmicos
- Coordenadores de curso
- Professores

---

## 🛠️ Detalhes Técnicos

### **Manifest V3 Compliance** ✅
- Service Worker background script
- chrome.scripting API para CSP compliance
- Permissões específicas e restritas
- Sem inline scripts ou eval()

### **Arquitetura**
```
popup.html/js     → Interface principal
background.js     → Service worker coordenador  
content.js        → Script de conteúdo
injected.js       → Script de extração
viewer.html/js    → Interface de visualização responsiva
```

### **Funcionalidades Técnicas**
- Manifest V3 moderno
- CSP (Content Security Policy) compliance
- Responsive design mobile-first
- Drag & drop nativo HTML5
- Storage API com fallbacks
- Performance otimizada com debounce
- Headers fixos com cálculo dinâmico

---

## 🎯 Palavras-Chave e Tags

### **Palavras-Chave**
```
SIAA, Cruzeiro do Sul, dados acadêmicos, extração de dados, CSV, 
visualização, responsivo, produtividade, universidade, disciplinas,
mobile-friendly, interface moderna, filtros, busca, educação
```

### **Tags Sugeridas**
- Produtividade
- Educação  
- Dados
- Universidade
- Visualização

---

## 📝 Política de Privacidade

**URL**: Incluir link para `privacy-policy.html` hospedado

**Resumo**:
- Extensão não coleta dados pessoais
- Processamento 100% local no navegador
- Sem transmissão de dados para servidores externos
- Armazenamento apenas local (chrome.storage/localStorage)

---

## 🚀 Release Notes v1.1.0

### **Principais Novidades**
- ✅ Interface responsiva profissional
- ✅ Headers fixos durante scroll
- ✅ Busca inteligente nos campos visíveis
- ✅ Design Windows moderno
- ✅ Mobile optimization completa
- ✅ CSP compliance total
- ✅ Drag & drop melhorado
- ✅ Storage universal

### **Correções**
- ✅ Problemas de layout mobile
- ✅ Headers com altura incorreta
- ✅ JavaScript inline CSP violations
- ✅ Busca em campos ocultos

---

## ✅ Checklist Pré-Submissão

### **Arquivos Obrigatórios**
- [x] manifest.json (v1.1.0)
- [x] Todos os ícones (16, 32, 48, 128px)
- [x] popup.html/js
- [x] background.js
- [x] content.js  
- [x] injected.js
- [x] viewer.html/js
- [x] privacy-policy.html
- [x] README.md atualizado

### **Testes Realizados**
- [x] Funciona no Chrome 88+
- [x] Manifest V3 compliance
- [x] CSP sem violações
- [x] Responsive em mobile/desktop
- [x] Headers fixos funcionais
- [x] Busca nos campos visíveis
- [x] Drag & drop operacional
- [x] Storage persistente
- [x] Sem console errors
- [x] Performance otimizada

### **Documentação**
- [x] README.md completo
- [x] RELEASE-NOTES.md
- [x] UPDATE-GUIDE.md
- [x] privacy-policy.html
- [x] install-guide.txt

---

## 🎉 Submissão Final

### **Versão**: 1.1.0
### **Status**: Pronto para Chrome Web Store
### **Destacar**: Interface Responsiva Profissional
### **Público**: Comunidade Cruzeiro do Sul
### **Categoria**: Produtividade/Educação

---

**🚀 SIAA Data Extractor v1.1.0 está pronto para revolucionar a experiência de dados acadêmicos na Cruzeiro do Sul!** 🎓 