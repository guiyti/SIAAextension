# 🎓 SIAA Data Extractor - Chrome Extension

Uma extensão do Chrome para extrair dados acadêmicos do sistema SIAA da Universidade Cruzeiro do Sul.

![SIAA Logo](https://img.shields.io/badge/SIAA-Data%20Extractor-orange?style=for-the-badge&logo=google-chrome)

## ✨ Funcionalidades

### 🔄 Captura Inteligente de Dados
- **Verificação de Atualizações**: Compara dados existentes com novos dados
- **Relatório de Mudanças**: Mostra adições, remoções e modificações
- **Processamento em Lotes**: Otimizado para grandes volumes de dados
- **Interface Minimalista**: Popup compacto e funcional

### 📊 Visualização Avançada
- **Filtros Dinâmicos**: Por campus, período, disciplina e professor
- **Busca Global**: Pesquisa em todos os campos simultaneamente
- **Ordenação Clicável**: Ordene por qualquer coluna (numérica ou alfabética)
- **Toggle de Colunas**: Mostre/oculte colunas conforme necessário
- **Exportação Filtrada**: Exporte apenas os dados visíveis

### 💾 Gerenciamento de Dados
- **Storage Local**: Dados salvos automaticamente no navegador
- **Workflow em 3 Etapas**:
  1. **Capturar**: Extrair e armazenar dados
  2. **Baixar**: Download do CSV completo
  3. **Visualizar**: Interface web interativa

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
- **👁️ Visualizar**: Abre interface web interativa

## 🔍 Interface de Visualização

### Filtros Disponíveis
- **Campus**: Todos os campus da universidade
- **Período**: DIURNO, NOTURNO, etc.
- **Disciplina**: Todas as disciplinas oferecidas
- **Professor**: Todos os professores cadastrados

### Funcionalidades da Tabela
- **Busca Global**: Digite qualquer termo para buscar em todos os campos
- **Ordenação**: Clique nos cabeçalhos para ordenar
- **Toggle de Colunas**: Mostre apenas as colunas relevantes
- **Exportação**: Exporte dados filtrados em CSV

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
- `scripting`: Execução de scripts

### Compatibilidade
- **Manifest V3**: Última versão dos padrões Chrome
- **CSP Bypass**: Usa `chrome.scripting` para contornar políticas de segurança
- **Mobile Friendly**: Interface responsiva

## 🛠️ Desenvolvimento

### Estrutura do Projeto
```
extensionSIAA/
├── manifest.json          # Configuração da extensão
├── popup.html/js          # Interface do popup
├── background.js          # Service worker
├── injected.js           # Script de extração
├── viewer.html/js        # Interface de visualização
├── content.js            # Script de conteúdo
└── icons/               # Ícones da extensão
```

### Scripts Principais
- **popup.js**: Interface principal, verificação de status
- **background.js**: Coordenação e storage
- **injected.js**: Extração de dados do SIAA
- **viewer.js**: Visualização e filtros avançados

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

### Performance
- A extensão processa em lotes para otimizar performance
- Grandes volumes de dados podem levar alguns minutos
- Não feche a aba durante o processamento

## 📝 Changelog

### v3.0 - Sistema de Verificação
- ✅ Comparação automática de dados
- ✅ Relatório de mudanças detalhado
- ✅ Interface minimalista
- ✅ Popup não fecha automaticamente

### v2.5 - Visualização Avançada
- ✅ Filtros por múltiplos campos
- ✅ Busca global funcional
- ✅ Ordenação por colunas
- ✅ Toggle de visibilidade de colunas
- ✅ Exportação filtrada

### v2.0 - Workflow em 3 Etapas
- ✅ Separação entre captura e download
- ✅ Storage persistente
- ✅ Interface de visualização
- ✅ Filtros e busca

## 📄 Licença

Este projeto é desenvolvido para uso acadêmico e administrativo na Universidade Cruzeiro do Sul.

## 🤝 Contribuição

Para melhorias ou correções:
1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Faça commit das mudanças
4. Abra um Pull Request

---

**Desenvolvido com ❤️ para a comunidade acadêmica da Cruzeiro do Sul** 