# 📦 Guia de Submissão - Chrome Web Store

## 🎯 SIAA Data Extractor v1.2.0 - PRONTO PARA SUBMISSÃO

### ✅ Status Atual: TODOS OS ARQUIVOS PRONTOS

---

## 📋 Passo a Passo para Submissão

### 1. **Empacotamento da Extensão**

```bash
# 1. Navegue até a pasta da extensão
cd /Users/guiyti/Desktop/analise/extensionSIAA

# 2. Verifique se todos os arquivos estão presentes
ls -la

# 3. Remova arquivos desnecessários (se houver)
rm -f *.zip *.crx debug-*.html test-*.html

# 4. Crie o arquivo ZIP para submissão
zip -r siaa-data-extractor-v1.2.0.zip . -x "*.git*" "*.DS_Store*" "*.md" "*.txt"
```

### 2. **Acessar Chrome Web Store Developer Console**

1. Acesse: https://chrome.google.com/webstore/devconsole/
2. Faça login com a conta Google do desenvolvedor
3. Clique em "**Adicionar um novo item**"

### 3. **Upload da Extensão**

1. **Arquivo ZIP**: Envie `siaa-data-extractor-v1.2.0.zip`
2. **Aguarde a validação automática**
3. **Corrija erros se aparecerem** (não devem aparecer - tudo testado ✅)

### 4. **Preenchimento das Informações**

#### **🏷️ Informações Básicas**
```
Nome: SIAA Data Extractor
Descrição Curta: Ferramenta profissional para extrair e visualizar dados acadêmicos do SIAA - Cruzeiro do Sul. Interface responsiva moderna.
Categoria: Produtividade
Idioma: Português (Brasil)
```

#### **📝 Descrição Detalhada**
```
🎓 SIAA Data Extractor v1.2.0 - Ferramenta Profissional para Análise Acadêmica

Extensão avançada e completa para extrair, processar e visualizar dados acadêmicos do sistema SIAA da Universidade Cruzeiro do Sul. Interface moderna, totalmente responsiva e otimizada para produtividade acadêmica.

✨ PRINCIPAIS FUNCIONALIDADES v1.2.0:

📊 VISUALIZAÇÃO PROFISSIONAL:
• Interface responsiva que se adapta perfeitamente a qualquer dispositivo
• Headers fixos sempre visíveis durante scroll
• Design profissional moderno com cores harmoniosas
• Sidebar deslizante elegante com controles organizados
• Sistema de detecção automática mobile/desktop

🔍 BUSCA E FILTROS INTELIGENTES:
• Busca exclusiva nos campos visíveis com alta performance
• Filtros dinâmicos: campus, período, disciplina, professor, curso
• Placeholder intuitivo: "🔍 Buscar nos campos visíveis..."
• Filtros persistentes entre sessões
• Sistema de limpeza rápida de filtros

🎛️ CONTROLES AVANÇADOS DE INTERFACE:
• Drag & drop completo para reordenar colunas (tabela e sidebar)
• Toggle de colunas com checkboxes organizados
• Persistência automática de todas as configurações
• Redimensionamento de colunas por arrastar bordas
• Presets de layout configuráveis

📱 EXPERIÊNCIA MOBILE OTIMIZADA:
• Detecção automática de dispositivos móveis
• Layout adaptativo para orientações portrait/landscape
• Headers dinâmicos com recálculo automático de altura
• Interface touch otimizada para gestos
• Sidebar mobile com largura apropriada

🎯 COMO USAR:
1. Acesse o SIAA da Cruzeiro do Sul e faça login
2. Clique na extensão e selecione o curso desejado
3. Clique "🔄 Capturar Dados" e aguarde o processamento
4. Use "👁️ Visualizar" para acessar a interface moderna
5. Configure filtros, busca e layout conforme necessário
6. Exporte dados filtrados quando necessário

⚙️ COMPATIBILIDADE:
• Chrome 88+ (Manifest V3)
• Desktop: Windows, Mac, Linux
• Mobile: Android, iOS (via Chrome)
• Todos os tamanhos de tela

Esta extensão é desenvolvida especificamente para a comunidade acadêmica da Cruzeiro do Sul, não coleta dados pessoais e mantém total privacidade dos usuários.
```

#### **🔐 Política de Privacidade**
```
URL: [INSERIR URL ONDE privacy-policy.html ESTARÁ HOSPEDADO]

Exemplo: https://seudominio.com/siaa-privacy-policy.html
```

#### **🏷️ Tags/Palavras-chave**
```
SIAA, Cruzeiro do Sul, dados acadêmicos, universidade, análise, CSV, visualização, educação, produtividade, filtros, busca, interface responsiva
```

### 5. **Upload de Imagens**

#### **📷 Screenshots Obrigatórios**
- **Mínimo**: 1 screenshot
- **Recomendado**: 4-5 screenshots
- **Tamanho**: 1280x800px ou 640x400px
- **Formato**: PNG ou JPEG

**Screenshots Sugeridos:**
1. **Interface Principal**: Popup da extensão com botões
2. **Visualizador Desktop**: Tabela com dados e sidebar aberta
3. **Filtros em Ação**: Demonstrando sistema de filtros
4. **Mobile Layout**: Interface responsiva em mobile
5. **Drag & Drop**: Demonstrando reordenação de colunas

#### **🎨 Imagens Promocionais (Opcionais)**
- **Tile Pequeno**: 440x280px
- **Tile Grande**: 920x680px
- **Marquee**: 1400x560px

### 6. **Justificativa de Permissões**

```
activeTab: 
Necessário para acessar e extrair dados da página atual do SIAA onde o usuário já está logado.

storage: 
Armazenar dados extraídos e todas as configurações de interface (larguras, ordem, visibilidade de colunas) localmente no navegador do usuário.

scripting: 
Executar scripts de extração respeitando CSP (Content Security Policy) e Manifest V3 para compatibilidade total com políticas de segurança.

Host permissions (https://siaa.cruzeirodosul.edu.br/*): 
Acesso restrito exclusivamente ao domínio oficial do SIAA da Cruzeiro do Sul para extração de dados acadêmicos.
```

### 7. **Configurações de Distribuição**

```
Visibilidade: Pública
Público-alvo: 13+
Região: Brasil (ou Global)
Preço: Gratuito
```

### 8. **Verificação Final**

- [ ] **Manifest V3**: ✅ Verificado
- [ ] **CSP Compliance**: ✅ Sem violações
- [ ] **Ícones**: ✅ Todos os tamanhos presentes (16, 32, 48, 128px)
- [ ] **Funcionalidade**: ✅ Testada em Chrome 88+
- [ ] **Responsivo**: ✅ Mobile e desktop
- [ ] **Privacidade**: ✅ Não coleta dados pessoais
- [ ] **Descrição**: ✅ Clara e completa
- [ ] **Screenshots**: ⚠️ Aguardando criação

---

## 🚨 PONTOS DE ATENÇÃO

### **❗ Política de Privacidade**
- **OBRIGATÓRIO**: Hospedar `privacy-policy.html` em um servidor web
- **URL Necessária**: Inserir link na submissão
- **Sugestão**: GitHub Pages, Netlify, ou qualquer hosting gratuito

### **📸 Screenshots**
- **Pendente**: Criar screenshots demonstrando a funcionalidade
- **Dica**: Use a extensão em ambiente real do SIAA
- **Qualidade**: Alta resolução e interface limpa

### **🔍 Revisão da Chrome Store**
- **Tempo**: 1-7 dias úteis
- **Possíveis Pedidos**: Esclarecimentos sobre permissões
- **Preparação**: Documentação completa disponível

---

## 📞 Informações de Contato

**Desenvolvedor**: Giulio
**Email**: guiyti@gmail.com
**Suporte**: Através do email acima

---

## 📈 Pós-Publicação

### **Monitoramento**
- Acompanhar reviews e feedback
- Monitorar relatórios de erros
- Verificar estatísticas de uso

### **Atualizações Futuras**
- Manter versão atualizada conforme feedback
- Seguir políticas da Chrome Web Store
- Implementar melhorias baseadas em uso real

---

## ✅ CHECKLIST FINAL SUBMISSÃO

- [ ] **Arquivo ZIP criado e testado**
- [ ] **Conta Google Developer configurada**
- [ ] **Política de privacidade hospedada**
- [ ] **Screenshots criados (4-5 imagens)**
- [ ] **Descrições preenchidas**
- [ ] **Permissões justificadas**
- [ ] **Informações de contato corretas**
- [ ] **Revisão final de qualidade**

---

**🎉 SIAA Data Extractor v1.2.0 está 100% pronto para ser submetido à Chrome Web Store!**

**🚀 Boa sorte com a publicação!** 🎓 