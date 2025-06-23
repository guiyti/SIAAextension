# 🎓 SIAA Data Extractor - Chrome Extension

Uma extensão avançada do Chrome para extrair e visualizar dados acadêmicos do sistema SIAA da Universidade Cruzeiro do Sul com interface moderna e responsiva.

![SIAA Logo](https://img.shields.io/badge/SIAA-Data%20Extractor-orange?style=for-the-badge&logo=google-chrome)
![Versão](https://img.shields.io/badge/version-1.1.0-blue?style=for-the-badge)
![Manifest](https://img.shields.io/badge/manifest-v3-green?style=for-the-badge)

## ✨ Funcionalidades

### 🔄 Captura Inteligente de Dados
- **Verificação de Atualizações**: Compara dados existentes com novos dados
- **Relatório de Mudanças**: Mostra adições, remoções e modificações
- **Processamento em Lotes**: Otimizado para grandes volumes de dados
- **Interface Minimalista**: Popup compacto e funcional
- **CSP Compliance**: Totalmente compatível com políticas de segurança modernas

### 📊 Visualização Avançada - NOVO v1.1.0!
- **Interface Responsiva**: Design moderno que se adapta a qualquer dispositivo
- **Headers Fixos**: Headers da página e tabela sempre visíveis durante scroll
- **Busca Nos Campos Visíveis**: Busca inteligente apenas nos dados exibidos
- **Filtros Dinâmicos**: Por campus, período, disciplina, professor e curso
- **Ordenação por Drag & Drop**: Reordene colunas arrastando na tabela ou sidebar
- **Toggle de Colunas**: Mostre/oculte colunas com persistência de configurações
- **Exportação Filtrada**: Exporte apenas os dados visíveis e filtrados
- **Design Windows**: Estilo profissional cinza com bordas definidas

### 💾 Gerenciamento de Dados
- **Storage Universal**: Funciona tanto como extensão quanto arquivo local
- **Persistência de Configurações**: Larguras, ordem e visibilidade das colunas
- **Workflow em 3 Etapas**:
  1. **Capturar**: Extrair e armazenar dados
  2. **Baixar**: Download do CSV completo
  3. **Visualizar**: Interface web interativa

### 📱 Mobile Friendly - NOVO!
- **Layout Responsivo**: Perfeita adaptação para dispositivos móveis
- **Detecção Automática**: Ajuste inteligente para portrait/landscape
- **Headers Adaptativos**: Recálculo automático de alturas em mobile
- **Sidebar Touch**: Interface otimizada para toque

## 🚀 Instalação

### Pré-requisitos
- Google Chrome (versão 88+)
- Acesso ao sistema SIAA da Cruzeiro do Sul

### Passos de Instalação

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
1. Clique em **"🔄 Capturar Dados"**
2. Se houver dados salvos, será perguntado sobre verificação de atualizações
3. Aguarde o processamento (pode levar alguns minutos)
4. Dados são salvos automaticamente no storage local

### 3. Verificação de Mudanças
- **Adições**: Novas ofertas de disciplinas
- **Remoções**: Ofertas que não existem mais
- **Modificações**: Mudanças em vagas, professores, etc.
- **Relatório Detalhado**: Mostra exatamente o que mudou

### 4. Download e Visualização
- **📥 Baixar CSV**: Download direto do arquivo CSV
- **👁️ Visualizar**: Abre interface web interativa moderna

## 🔍 Interface de Visualização - RENOVADA!

### Layout Moderno
- **Header Fixo**: Sempre visível com busca, título e estatísticas
- **Sidebar Deslizante**: Filtros e controles em painel lateral
- **Tabela Responsiva**: Headers fixos e scroll otimizado
- **Design Profissional**: Estilo Windows com cores cinza elegantes

### Filtros Disponíveis
- **Campus**: Todos os campus da universidade
- **Período**: DIURNO, NOTURNO, etc.
- **Disciplina**: Todas as disciplinas oferecidas
- **Professor**: Todos os professores cadastrados
- **Curso**: Filtragem por curso específico

### Funcionalidades da Tabela
- **Busca Inteligente**: Digite para buscar nos campos visíveis apenas
- **Ordenação**: Clique nos cabeçalhos para ordenar (visual com setas)
- **Drag & Drop**: Arraste colunas para reordenar na tabela ou sidebar
- **Toggle de Colunas**: Configure visibilidade com checkboxes na sidebar
- **Exportação Avançada**: Exporte apenas dados filtrados e colunas visíveis
- **Redimensionamento**: Ajuste largura das colunas arrastando bordas

### Responsividade Mobile
- **Layout Adaptativo**: Header em coluna para mobile
- **Altura Inteligente**: Recálculo automático para diferentes orientações
- **Touch Friendly**: Interface otimizada para dispositivos móveis
- **Sidebar Mobile**: Painel deslizante com largura otimizada

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

### Processamento
- **Lotes**: 10 registros por lote
- **Delay**: 800ms entre lotes
- **Timeout**: 15s por requisição
- **Encoding**: UTF-8 com BOM para Excel

### Permissões
- `activeTab`: Acesso à aba atual
- `storage`: Armazenamento local
- `scripting`: Execução de scripts (CSP compliance)

### Compatibilidade
- **Manifest V3**: Última versão dos padrões Chrome
- **CSP Compliance**: JavaScript externo, sem inline scripts
- **Mobile Responsive**: Interface adaptativa para todos os dispositivos
- **Cross-browser Storage**: Funciona como extensão e arquivo local

## 🛠️ Desenvolvimento

### Estrutura do Projeto
```
extensionSIAA/
├── manifest.json          # Configuração da extensão (v1.1.0)
├── popup.html/js          # Interface do popup
├── background.js          # Service worker
├── injected.js           # Script de extração
├── viewer.html/js        # Interface de visualização responsiva
├── content.js            # Script de conteúdo
├── privacy-policy.html   # Política de privacidade
├── UPDATE-GUIDE.md       # Guia de atualizações
├── README.md            # Este arquivo
└── icons/               # Ícones da extensão (16, 32, 48, 128px)
```

### Scripts Principais
- **popup.js**: Interface principal, verificação de status
- **background.js**: Coordenação e storage
- **injected.js**: Extração de dados do SIAA
- **viewer.js**: Visualização responsiva com headers fixos e filtros avançados

### Arquitetura Responsiva
- **CSS Mobile-First**: Design adaptativo com media queries
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
- Verifique console de erros (F12)
- Recarregue a extensão em chrome://extensions/
- Teste em aba privada para eliminar cache

### Mobile Layout Quebrado
- A extensão recalcula automaticamente
- Force um reload da página se necessário
- Verifique orientação do dispositivo

## 📝 Changelog

### 🆕 v1.1.0 - Interface Responsiva e Headers Fixos
- ✅ **Headers Fixos**: Header da página e tabela sempre visíveis
- ✅ **Interface Responsiva**: Adaptação perfeita para mobile/desktop
- ✅ **Busca Nos Campos Visíveis**: Busca inteligente apenas nos dados exibidos
- ✅ **Design Windows**: Estilo profissional cinza com bordas definidas
- ✅ **Mobile Optimization**: Detecção automática com ajustes para portrait/landscape
- ✅ **CSP Compliance**: JavaScript totalmente externo, sem inline scripts
- ✅ **Drag & Drop Melhorado**: Reordenação de colunas na tabela e sidebar
- ✅ **Storage Universal**: Funciona como extensão e arquivo local
- ✅ **Sidebar Moderna**: Painel deslizante com controles organizados

### v1.0.0 - Sistema de Verificação
- ✅ Comparação automática de dados
- ✅ Relatório de mudanças detalhado
- ✅ Interface minimalista
- ✅ Popup não fecha automaticamente

### v0.9.0 - Visualização Avançada
- ✅ Filtros por múltiplos campos
- ✅ Busca global funcional
- ✅ Ordenação por colunas
- ✅ Toggle de visibilidade de colunas
- ✅ Exportação filtrada

## 🎯 Próximas Versões

### v1.2.0 - Planejado
- 📊 Gráficos e estatísticas visuais
- 🔄 Sincronização em tempo real
- 📧 Notificações de mudanças
- 🎨 Temas customizáveis

## 📄 Licença

Este projeto é desenvolvido para uso acadêmico e administrativo na Universidade Cruzeiro do Sul.

## 🤝 Contribuição

Para melhorias ou correções:
1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Faça commit das mudanças
4. Abra um Pull Request

---
**🚀 Versão 1.1.0 - Interface Responsiva Profissional** 🎉 