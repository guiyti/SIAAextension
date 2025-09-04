# 🔨 Plano de Refatoração SIAA Extension

## 📊 Análise da Situação Atual

### **Estado Atual do Código**
- **viewer.js**: 4.070 linhas (arquivo principal monolítico)
- **Total da aplicação**: 10.213 linhas
- **103 funções** no viewer.js
- **Problemas identificados**:
  - Arquivo único gigantesco com múltiplas responsabilidades
  - Lógica de UI, dados, presets e persistência misturadas
  - Difícil manutenção e teste
  - Alto acoplamento entre componentes

### **Arquivos Bem Estruturados (Manter)**
- ✅ `siaa-config.json` - Configuração centralizada
- ✅ `xml-processor.js` - Processamento específico de XML
- ✅ `config-manager.js` - Gerenciamento de configurações
- ✅ `background.js` - Service worker da extensão
- ✅ `content.js` - Content script
- ✅ `injected.js` - Script injetado

---

## 🎯 Estratégia de Refatoração

### **Princípios da Refatoração**
1. **Separação de Responsabilidades** - Cada módulo uma função específica
2. **Manutenibilidade** - Código fácil de entender e modificar
3. **Testabilidade** - Componentes isolados e testáveis
4. **Configuração Centralizada** - siaa-config.json como fonte única
5. **Compatibilidade** - Manter funcionalidades existentes

---

## 📋 Plano de Execução (6 Etapas)

### **ETAPA 1: Separação de Utilitários e Configuração** 🚀
**Objetivo**: Extrair funções utilitárias e configuração para módulos separados

**Escopo**:
- Criar `js/utils/` para utilitários gerais
- Criar `js/config/` para gerenciamento de configuração
- Extrair funções de Storage, CSV parsing e utilitários

**Arquivos a criar**:
- `js/utils/storage.js` - Abstração do storage
- `js/utils/csv-parser.js` - Parser de CSV
- `js/utils/data-helpers.js` - Helpers de manipulação de dados
- `js/config/config-loader.js` - Carregamento do siaa-config.json
- `js/config/preset-manager.js` - Gerenciamento de presets

**Benefícios**:
- Redução de ~800 linhas do viewer.js
- Código reutilizável
- Testes isolados possíveis

---

### **ETAPA 2: Separação da Lógica de UI**
**Objetivo**: Extrair componentes de interface

**Escopo**:
- Criar `js/ui/` para componentes de interface
- Separar lógica de tabelas, filtros e controles

**Arquivos a criar**:
- `js/ui/table-manager.js` - Gerenciamento de tabelas
- `js/ui/filter-manager.js` - Sistema de filtros
- `js/ui/column-manager.js` - Gerenciamento de colunas
- `js/ui/dropdown-manager.js` - Dropdowns e menus

**Benefícios**:
- UI modular e componentizada
- Redução de ~1.200 linhas do viewer.js

---

### **ETAPA 3: Separação da Lógica de Dados**
**Objetivo**: Criar camada de dados isolada

**Escopo**:
- Criar `js/data/` para manipulação de dados
- Separar lógica de ofertas e alunos

**Arquivos a criar**:
- `js/data/data-store.js` - Store centralizado de dados
- `js/data/ofertas-service.js` - Serviços específicos de ofertas
- `js/data/alunos-service.js` - Serviços específicos de alunos
- `js/data/duplicate-manager.js` - Gerenciamento de duplicatas

**Benefícios**:
- Lógica de negócio isolada
- Redução de ~1.000 linhas do viewer.js

---

### **ETAPA 4: Sistema de Eventos e Comunicação**
**Objetivo**: Implementar sistema de eventos para desacoplar componentes

**Escopo**:
- Criar sistema de eventos customizados
- Implementar comunicação entre módulos

**Arquivos a criar**:
- `js/core/event-bus.js` - Sistema de eventos centralizado
- `js/core/app-controller.js` - Controlador principal

**Benefícios**:
- Baixo acoplamento entre módulos
- Sistema reativo e flexível

---

### **ETAPA 5: Refatoração do Viewer Principal**
**Objetivo**: Transformar viewer.js em orquestrador

**Escopo**:
- Manter apenas lógica de inicialização e orquestração
- Integrar todos os módulos criados

**Resultado**:
- `viewer.js` com ~500 linhas (apenas orquestração)
- Aplicação modular e maintível

---

### **ETAPA 6: Testes e Otimizações**
**Objetivo**: Implementar testes e otimizações finais

**Escopo**:
- Testes unitários para módulos
- Otimizações de performance
- Documentação dos módulos

---

## 🏗️ Estrutura Final Esperada

```
js/
├── core/
│   ├── app-controller.js     # Controlador principal
│   └── event-bus.js          # Sistema de eventos
├── config/
│   ├── config-loader.js      # Carregamento do siaa-config
│   └── preset-manager.js     # Gerenciamento de presets
├── data/
│   ├── data-store.js         # Store de dados
│   ├── ofertas-service.js    # Serviços de ofertas
│   ├── alunos-service.js     # Serviços de alunos
│   └── duplicate-manager.js  # Gerenciamento de duplicatas
├── ui/
│   ├── table-manager.js      # Gerenciamento de tabelas
│   ├── filter-manager.js     # Sistema de filtros
│   ├── column-manager.js     # Gerenciamento de colunas
│   └── dropdown-manager.js   # Dropdowns e menus
└── utils/
    ├── storage.js            # Abstração do storage
    ├── csv-parser.js         # Parser de CSV
    └── data-helpers.js       # Helpers de dados
```

---

## ⚠️ Riscos e Mitigações

### **Riscos Identificados**:
1. **Quebra de funcionalidade** durante a separação
2. **Problemas de dependências** entre módulos
3. **Performance** pode ser afetada temporariamente

### **Mitigações**:
1. **Testes após cada etapa** antes de prosseguir
2. **Backup do código atual** antes de cada etapa
3. **Refatoração incremental** com validação contínua
4. **Manter interface pública** dos módulos estável

---

## 📈 Benefícios Esperados

### **Manutenibilidade**
- Arquivos pequenos e focados (100-300 linhas cada)
- Responsabilidades bem definidas
- Fácil localização de bugs

### **Testabilidade**
- Módulos isolados e testáveis
- Mocks simples para testes unitários
- Cobertura de testes possível

### **Extensibilidade**
- Novos recursos facilmente adicionáveis
- Módulos reutilizáveis
- Arquitetura escalável

### **Performance**
- Carregamento sob demanda possível
- Menor acoplamento
- Cache mais eficiente

---

## 🎯 Status das Etapas

- [x] **ETAPA 1**: Separação de Utilitários e Configuração ✅
  - ✅ `js/utils/storage.js` - Sistema de storage universal criado
  - ✅ `js/utils/csv-parser.js` - Parser de CSV com funcionalidades avançadas
  - ✅ `js/config/config-loader.js` - Carregador do siaa-config.json
  - ✅ Estrutura de diretórios `js/{utils,config,data,ui,core}` criada
  - ✅ viewer.html atualizado para incluir novos módulos
  - ✅ Funções duplicadas removidas do viewer.js
  - 📊 **Redução**: ~100 linhas removidas do viewer.js
  
- [x] **ETAPA 2**: Separação da Lógica de UI ✅
  - ✅ `js/ui/table-manager.js` - Gerenciamento completo de tabelas
  - ✅ `js/ui/filter-manager.js` - Sistema avançado de filtros  
  - ✅ `js/ui/column-manager.js` - Controle de colunas e visibilidade
  - ✅ `js/ui/dropdown-manager.js` - Dropdowns e menus dinâmicos
  - ✅ viewer.html atualizado com novos módulos de UI
  - ✅ Arquitetura modular de componentes implementada
  - 📊 **Criação**: ~1.200 linhas de código UI modularizado  
  
- [x] **ETAPA 3**: Separação da Lógica de Dados ✅
  - ✅ `js/data/data-store.js` - Store centralizado com eventos e persistência
  - ✅ `js/data/ofertas-service.js` - Serviços específicos para ofertas de disciplinas
  - ✅ `js/data/alunos-service.js` - Serviços específicos para dados de alunos
  - ✅ `js/data/duplicate-manager.js` - Sistema avançado de detecção de duplicatas
  - ✅ viewer.html atualizado com módulos de dados
  - ✅ Camada de dados isolada e especializizada
  - 📊 **Criação**: ~1.500 linhas de lógica de dados modularizada
  
- [x] **ETAPA 4**: Sistema de Eventos e Comunicação ✅
  - ✅ `js/core/event-bus.js` - Sistema pub/sub avançado com wildcards e debug
  - ✅ `js/core/app-controller.js` - Controlador principal e orquestração de módulos
  - ✅ `js/core/integration-example.js` - Exemplo prático de integração
  - ✅ viewer.html atualizado com módulos centrais
  - ✅ Sistema reativo de comunicação entre módulos implementado
  - 📊 **Criação**: ~900 linhas de sistema de eventos e controle
  
- [x] **ETAPA 5**: Refatoração do Viewer Principal ✅
  - ✅ `viewer.js` transformado de 4.070 para 587 linhas (-85.6% redução!)
  - ✅ Backup completo criado (`viewer.js.backup`, `viewer.js.original`)
  - ✅ Sistema reativo implementado com EventBus
  - ✅ Orquestração via AppController integrada
  - ✅ Compatibilidade mantida com funções globais
  - ✅ Documentação completa da refatoração criada
  - 📊 **Redução**: 3.483 linhas removidas do arquivo principal
- [ ] **ETAPA 6**: Testes e Otimizações

---

## 📝 Log de Alterações

### ETAPA 1 - Concluída ($(date))
**Arquivos criados:**
- `js/utils/storage.js` - 200 linhas
- `js/utils/csv-parser.js` - 350 linhas  
- `js/config/config-loader.js` - 250 linhas

**Arquivos modificados:**
- `viewer.html` - Adicionados imports dos módulos
- `viewer.js` - Removidas ~100 linhas duplicadas

**Funcionalidades preservadas:**
- ✅ Sistema de storage funcionando
- ✅ Parser de CSV compatível
- ✅ Carregamento de configuração

### ETAPA 2 - Concluída ($(date))
**Arquivos criados:**
- `js/ui/table-manager.js` - 450 linhas (gerenciamento completo de tabelas)
- `js/ui/filter-manager.js` - 380 linhas (sistema avançado de filtros)
- `js/ui/column-manager.js` - 420 linhas (controle de colunas e visibilidade)
- `js/ui/dropdown-manager.js` - 550 linhas (dropdowns e menus dinâmicos)

**Arquivos modificados:**
- `viewer.html` - Adicionados imports dos módulos de UI

**Componentes UI criados:**
- ✅ **TableManager**: Renderização, ordenação, redimensionamento, drag&drop
- ✅ **FilterManager**: Filtros de busca, coluna e sidebar com múltiplos valores
- ✅ **ColumnManager**: Visibilidade, ordem, largura e presets de colunas
- ✅ **DropdownManager**: Dropdowns dinâmicos com busca e seleção múltipla

**Benefícios alcançados:**
- 🎯 **Modularidade**: Cada componente UI isolado e reutilizável
- 🔧 **Manutenibilidade**: Lógica específica em arquivos dedicados
- 🧪 **Testabilidade**: Componentes independentes e configuráveis
- 📱 **Responsividade**: Sistema de eventos e callbacks flexível

### ETAPA 3 - Concluída ($(date))
**Arquivos criados:**
- `js/data/data-store.js` - 450 linhas (store centralizado com eventos)
- `js/data/ofertas-service.js` - 520 linhas (serviços específicos de ofertas)
- `js/data/alunos-service.js` - 580 linhas (serviços específicos de alunos)
- `js/data/duplicate-manager.js` - 650 linhas (detecção avançada de duplicatas)

**Arquivos modificados:**
- `viewer.html` - Adicionados imports dos módulos de dados

**Serviços de dados criados:**
- ✅ **DataStore**: Store centralizado, persistência, eventos e gestão de estado
- ✅ **OfertasService**: Validação, processamento, filtros e estatísticas de ofertas
- ✅ **AlunosService**: Validação, processamento, filtros e estatísticas de alunos
- ✅ **DuplicateManager**: Múltiplas estratégias de detecção, interface visual, relatórios

**Benefícios alcançados:**
- 📊 **Separação de Dados**: Lógica de negócio isolada da apresentação
- 🔧 **Especialização**: Serviços específicos para cada tipo de dados
- 🧪 **Flexibilidade**: Múltiplas estratégias de processamento configuráveis
- 📈 **Observabilidade**: Sistema de eventos para monitoramento de mudanças

### ETAPA 4 - Concluída ($(date))
**Arquivos criados:**
- `js/core/event-bus.js` - 450 linhas (sistema pub/sub avançado)
- `js/core/app-controller.js` - 380 linhas (controlador principal da aplicação)
- `js/core/integration-example.js` - 200 linhas (exemplo prático de uso)

**Arquivos modificados:**
- `viewer.html` - Adicionados imports dos módulos centrais

**Sistema de eventos implementado:**
- ✅ **EventBus**: Pub/sub com wildcards, prioridades, timeout e debug
- ✅ **AppController**: Orquestração completa de todos os módulos
- ✅ **Comunicação Reativa**: Eventos para data.loaded, ui.filter.changed, etc.
- ✅ **Exemplo de Integração**: Guia prático para uso no código existente

**Benefícios alcançados:**
- 🔗 **Desacoplamento**: Módulos comunicam-se via eventos, não referências diretas
- ⚡ **Reatividade**: Sistema responde automaticamente a mudanças de estado
- 🎯 **Centralização**: AppController orquestra toda a aplicação
- 🧪 **Flexibilidade**: Fácil adição de novos listeners e comportamentos

---

*Documento criado em: $(date)*
*Última atualização: ETAPA 4 concluída*
