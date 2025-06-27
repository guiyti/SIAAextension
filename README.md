# 🎓 SIAA Data Extractor - Chrome Extension

Uma extensão avançada do Chrome para extrair e visualizar dados acadêmicos do sistema SIAA da Universidade Cruzeiro do Sul com interface moderna, responsiva e profissional.

![SIAA Logo](https://img.shields.io/badge/SIAA-Data%20Extractor-orange?style=for-the-badge&logo=google-chrome)
![Versão](https://img.shields.io/badge/version-1.2.0-blue?style=for-the-badge)
![Manifest](https://img.shields.io/badge/manifest-v3-green?style=for-the-badge)
![Status](https://img.shields.io/badge/status-PRONTO%20CHROME%20STORE-brightgreen?style=for-the-badge)

## ✨ Funcionalidades v1.2.0

### 🔄 Captura Inteligente de Dados
- **Verificação de Atualizações**: Compara dados existentes com novos dados automaticamente
- **Relatório de Mudanças**: Mostra adições, remoções e modificações detalhadas
- **Processamento em Lotes Otimizado**: Eficiente para grandes volumes de dados
- **Interface Minimalista**: Popup compacto e funcional
- **CSP Compliance Total**: Compatível com políticas de segurança modernas

### 📊 Visualização Profissional - RENOVADA v1.2.0!
- **Interface Responsiva Completa**: Design profissional que se adapta perfeitamente a qualquer dispositivo
- **Headers Fixos Inteligentes**: Headers da página e tabela sempre visíveis durante scroll
- **Busca Exclusiva nos Campos Visíveis**: Busca inteligente apenas nos dados exibidos
- **Filtros Dinâmicos Avançados**: Por campus, período, disciplina, professor e curso
- **Drag & Drop Sincronizado**: Reordene colunas arrastando na tabela ou sidebar
- **Toggle de Colunas Inteligente**: Mostre/oculte colunas com persistência automática
- **Exportação Filtrada**: Exporte apenas os dados visíveis e filtrados
- **Design Profissional**: Estilo moderno com cores harmoniosas

### 💾 Gerenciamento Inteligente de Dados
- **Storage Universal**: Funciona como extensão (chrome.storage) e arquivo local (localStorage)
- **Persistência Completa**: Larguras, ordem e visibilidade das colunas
- **Workflow Otimizado em 3 Etapas**:
  1. **🔄 Capturar**: Extrair e armazenar dados
  2. **📥 Baixar**: Download do CSV completo
  3. **👁️ Visualizar**: Interface web interativa

### 📱 Mobile Friendly - OTIMIZADO!
- **Layout Responsivo Inteligente**: Adaptação perfeita para dispositivos móveis
- **Detecção Automática**: Ajuste inteligente para portrait/landscape
- **Headers Adaptativos**: Recálculo automático de alturas em tempo real
- **Sidebar Touch**: Interface otimizada para gestos de toque
- **Performance Mobile**: Otimizações específicas para dispositivos móveis

## 🚀 Instalação

### Pré-requisitos
- Google Chrome (versão 88+)
- Acesso ao sistema SIAA da Cruzeiro do Sul

### 📦 Instalação via Chrome Web Store (Recomendado)
```
🔄 EM PROCESSO DE PUBLICAÇÃO NA CHROME WEB STORE
📅 Estimativa: Disponível em breve
✅ Extensão pronta e validada para submissão
```

### 🛠️ Instalação Manual (Desenvolvedores)

1. **Download dos Arquivos**
   ```bash
   # Clone ou baixe os arquivos da extensão
   git clone [repositório] siaa-extension
   cd siaa-extension
   ```

2. **Carregar no Chrome**
   - Abra `chrome://extensions/`
   - Ative o "Modo do desenvolvedor"
   - Clique em "Carregar sem compactação"
   - Selecione a pasta `extensionSIAA`

3. **Verificar Instalação**
   - Ícone da extensão deve aparecer na barra de ferramentas
   - Clique no ícone para abrir o popup

## 📖 Como Usar

### 1. Acesso ao Sistema
1. Navegue até: `https://siaa.cruzeirodosul.edu.br/novo-siaa/secure/core/home.jsf`
2. Faça login no sistema SIAA
3. O status da extensão deve mostrar "Pronto para extrair"

### 2. Captura de Dados
1. Selecione o curso desejado no dropdown
2. Clique em **"🔄 Capturar Dados"**
3. Se houver dados salvos, será perguntado sobre verificação de atualizações
4. Aguarde o processamento (pode levar alguns minutos)
5. Dados são salvos automaticamente no storage local

### 3. Verificação de Mudanças Automática
- **Adições**: Novas ofertas de disciplinas detectadas
- **Remoções**: Ofertas que não existem mais
- **Modificações**: Mudanças em vagas, professores, horários, etc.
- **Relatório Detalhado**: Mostra exatamente o que mudou

### 4. Download e Visualização
- **📥 Baixar CSV**: Download direto do arquivo CSV completo
- **👁️ Visualizar**: Abre interface web interativa moderna

## 🔍 Interface de Visualização - PROFISSIONAL v1.2.0!

### Layout Moderno e Responsivo
- **Header Fixo Inteligente**: Sempre visível com busca, título e estatísticas
- **Sidebar Deslizante Elegante**: Filtros e controles em painel lateral organizado
- **Tabela Responsiva**: Headers fixos e scroll otimizado
- **Design Profissional**: Cores harmoniosas e tipografia moderna

### Filtros Avançados Disponíveis
- **Campus**: Todos os campus da universidade
- **Período**: DIURNO, NOTURNO, etc.
- **Disciplina**: Todas as disciplinas oferecidas
- **Professor**: Todos os professores cadastrados
- **Curso**: Filtragem por curso específico

### Funcionalidades da Tabela
- **Busca Inteligente**: Digite para buscar exclusivamente nos campos visíveis
- **Ordenação Avançada**: Clique nos cabeçalhos para ordenar (indicadores visuais)
- **Drag & Drop Sincronizado**: Arraste colunas para reordenar na tabela ou sidebar
- **Toggle de Colunas**: Configure visibilidade com checkboxes organizados
- **Exportação Filtrada**: Exporte apenas dados filtrados e colunas visíveis
- **Redimensionamento**: Ajuste largura das colunas arrastando bordas

### Responsividade Mobile Profissional
- **Layout Adaptativo**: Header em coluna para mobile, horizontal para desktop
- **Altura Inteligente**: Recálculo automático para diferentes orientações
- **Touch Friendly**: Interface otimizada para dispositivos móveis
- **Sidebar Mobile**: Painel deslizante com largura otimizada para toque

### Dados Incluídos
| Campo | Descrição |
|-------|-----------|
| Cód. Disc. | Código da disciplina |
| Nome Disciplina | Nome completo da disciplina |
| Carga Horária | Horas totais da disciplina |
| Campus | Informações do campus |
| Período | DIURNO/NOTURNO |
| Vagas | Número de vagas disponíveis |
| Matriculados | Alunos já matriculados |
| Pré-matriculados | Alunos em pré-matrícula |
| Vagas Restantes | Vagas ainda disponíveis |
| Professor | Dados do professor responsável |
| Sala | Local da aula |
| Horário | Horário da disciplina |

## ⚙️ Configurações Técnicas

### Processamento Otimizado
- **Lotes**: 10 registros por lote
- **Delay**: 800ms entre lotes
- **Timeout**: 15s por requisição
- **Encoding**: UTF-8 com BOM para Excel

### Permissões Mínimas
- `activeTab`: Acesso à aba atual
- `storage`: Armazenamento local
- `scripting`: Execução de scripts (CSP compliance)

### Compatibilidade Total
- **Manifest V3**: Última versão dos padrões Chrome
- **CSP Compliance**: JavaScript 100% externo, sem inline scripts
- **Mobile Responsive**: Interface adaptativa para todos os dispositivos
- **Cross-browser Storage**: Funciona como extensão e arquivo local

## 🛠️ Desenvolvimento

### Estrutura do Projeto
```
extensionSIAA/
├── manifest.json          # Configuração da extensão (v1.2.0)
├── popup.html/js          # Interface do popup
├── background.js          # Service worker
├── injected.js           # Script de extração
├── viewer.html/js        # Interface de visualização responsiva
├── content.js            # Script de conteúdo
├── privacy-policy.html   # Política de privacidade
├── SUBMISSAO-CHROME-STORE.md  # Guia de submissão
├── CHROME-STORE-SUBMISSION.md # Informações completas
├── README.md            # Este arquivo
└── icons/               # Ícones da extensão (16, 32, 48, 128px)
```

### Scripts Principais
- **popup.js**: Interface principal, verificação de status
- **background.js**: Coordenação e storage
- **injected.js**: Extração de dados do SIAA
- **viewer.js**: Visualização responsiva com headers fixos e filtros avançados

### Arquitetura Responsiva
- **CSS Mobile-First**: Design adaptativo com breakpoints inteligentes
- **JavaScript Adaptativo**: Detecção automática de dispositivo e orientação
- **Headers Dinâmicos**: Recálculo automático de alturas em tempo real
- **Storage Inteligente**: Sistema universal chrome.storage + localStorage

## 🐛 Solução de Problemas

### Status "Acesse o SIAA"
- Verifique se está na URL correta
- Faça login no sistema SIAA
- Aguarde a página carregar completamente

### Erro de Captura
- Verifique sua conexão de internet
- Tente recarregar a página do SIAA
- Aguarde alguns segundos e tente novamente

### Dados Não Aparecem
- Verifique se a captura foi concluída
- Clique em "Visualizar" para abrir a interface
- Verifique se há dados no storage local

### Interface Não Carrega
- Verifique se o navegador suporta Manifest V3
- Desative outras extensões que possam interferir
- Recarregue a extensão em chrome://extensions/

## 📊 Chrome Web Store

### Status de Publicação
```
🔄 PREPARAÇÃO CONCLUÍDA
📦 Arquivo ZIP criado: siaa-data-extractor-v1.2.0.zip
✅ Todos os requisitos atendidos
📋 Documentação completa
🎯 Pronto para submissão
```

### Informações da Store
- **Nome**: SIAA Data Extractor
- **Versão**: 1.2.0
- **Categoria**: Produtividade
- **Público**: Comunidade Cruzeiro do Sul
- **Preço**: Gratuito

## 🔒 Privacidade e Segurança

### Garantias de Privacidade
- ❌ **NÃO coleta dados pessoais**
- ❌ **NÃO envia dados para servidores externos**
- ❌ **NÃO rastreia atividade do usuário**
- ✅ **Processamento 100% local**
- ✅ **Armazenamento apenas local**
- ✅ **Código fonte transparente**

### Segurança Técnica
- **Manifest V3**: Padrões de segurança mais recentes
- **CSP Compliance**: Sem violações de Content Security Policy
- **Permissões Mínimas**: Apenas o necessário para funcionamento
- **Domínio Restrito**: Acesso apenas ao SIAA oficial

## 📈 Roadmap

### Versões Futuras
- **v1.3.0**: Melhorias baseadas em feedback dos usuários
- **Análises Avançadas**: Gráficos e estatísticas
- **Exportação Múltipla**: Formatos adicionais (Excel, PDF)
- **Temas Personalizáveis**: Dark mode e outros temas

### Suporte Contínuo
- Monitoramento de bugs e correções
- Atualizações de compatibilidade
- Novas funcionalidades baseadas em demanda

## 🤝 Contribuição

### Como Contribuir
1. Report bugs e sugestões
2. Teste em diferentes ambientes
3. Compartilhe feedback de uso
4. Contribua com melhorias de código

### Contato
- **Email**: guiyti@gmail.com
- **Suporte**: Via email com resposta rápida

---

## 📄 Licença

Este projeto é desenvolvido para uso acadêmico na Universidade Cruzeiro do Sul.

---

**🎓 SIAA Data Extractor v1.2.0 - Revolucionando a análise de dados acadêmicos!** 

**✅ Pronto para Chrome Web Store | 🚀 Interface Profissional | �� Mobile Optimized** 