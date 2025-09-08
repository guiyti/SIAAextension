# 🚀 ROTEIRO DE MODERNIZAÇÃO - SIAA Data Extractor

## 📊 STATUS ATUAL DO PROJETO

### ✅ ESTADO FUNCIONANDO:

**BACKGROUND.JS - V7 COMPLETO:**
```
background.js (23.773 caracteres)
├── ExtractionManager V7 - gerencia extrações
├── DataDeduplicationHelper V7 - previne duplicatas
├── MessageHandler V7 - comunicação popup/background
└── TabManager V7 - gerenciamento de abas/badges
```

**POPUP.JS - V9 STEP 1:**
```
popup.js (36.836 caracteres)
├── StateManager V8 - gerenciamento de estado (isExtracting, hasStoredData, etc)
└── CommunicationManager V9 - fetchCursosDisponiveis() modularizada
```

### 📁 ARQUIVOS PRINCIPAIS:
- `background.js` - V7 modularizado e estável
- `popup.js` - V9 STEP 1 com StateManager + CommunicationManager parcial
- `popup-step1-safe.js` - backup do estado funcionando
- `popup-v9-step1-backup.js` - backup atual
- `config-manager.js`, `content.js`, `injected.js`, `viewer.js`, `xml-processor.js` - originais

---

## 🎯 DIRETRIZES OBRIGATÓRIAS PARA TODAS AS ETAPAS

### DIRETRIZ 1: Teste Node.js Obrigatório
```bash
node -e "try { require('./arquivo.js'); console.log('✅ OK'); } catch(e) { console.error('❌', e.message); }"
```

### DIRETRIZ 2: Limpeza Após Aprovação
- Remover arquivos de backup antigos após confirmação
- Manter apenas 2 backups: atual + anterior funcionando

### DIRETRIZ 3: Deduplicação de Dados
- Todos os novos sistemas devem implementar hash de linhas CSV
- Usar `DataDeduplicationHelper` pattern

### DIRETRIZ 4: Backup/Rollback
- Backup antes de qualquer mudança
- Rollback imediato se houver problemas

### DIRETRIZ 5: Mudanças Incrementais
- Uma classe/função por vez
- Testar após cada mudança

---

## 📋 HISTÓRICO DE IMPLEMENTAÇÕES

### FASE 3: BACKGROUND.JS ✅ CONCLUÍDA
- **V4**: ExtractionManager implementado
- **V5**: DataDeduplicationHelper adicionado
- **V6**: MessageHandler implementado  
- **V7**: TabManager implementado
- **Status**: ✅ ESTÁVEL - 4 classes modulares funcionando

### FASE 4: POPUP.JS 🔄 EM ANDAMENTO

#### ✅ ETAPA 4.1: Análise e Estruturação
- **Status**: ✅ CONCLUÍDA
- **Resultado**: Estrutura analisada, classes identificadas

#### ✅ ETAPA 4.2 V8: StateManager  
- **Status**: ✅ CONCLUÍDA
- **Implementação**: Classe StateManager centralizando estados (isExtracting, hasStoredData, hasStorageFailure)
- **Compatibilidade**: 100% - Object.defineProperty() para redirection
- **Resultado**: Estados centralizados, UI automática

#### 🔄 ETAPA 4.3 V9: CommunicationManager
- **Status**: ✅ PARCIAL - STEP 1 FUNCIONANDO
- **Implementado**: fetchCursosDisponiveis() modularizada
- **Problema**: checkEndpointAccess() e startExtraction() quebram dropdown
- **Decisão**: Manter STEP 1 e continuar para próxima etapa

---

## 🚀 PRÓXIMAS ETAPAS

### 📦 ETAPA 4.4: UIManager (PRÓXIMA)
- **Objetivo**: Modularizar manipulação de DOM e eventos
- **Tempo estimado**: 30 minutos
- **Funções-alvo**: 
  - `updateStatus()`
  - `showError()` / `showSuccess()`
  - `updateProgress()`
  - Event listeners management

### 📦 ETAPA 4.5: StorageManager
- **Objetivo**: Modularizar operações de storage
- **Funções-alvo**: `chrome.storage.local` operations

### 📦 ETAPA 4.6: ValidationManager  
- **Objetivo**: Centralizar validações
- **Funções-alvo**: Validações de curso, endpoint, dados

---

## 🎯 ESTRATÉGIA PARA ETAPA 4.4

### PREPARAÇÃO:
1. **Backup obrigatório**: `cp popup.js popup-v9-backup.js`
2. **Teste Node.js**: Verificar carregamento antes da mudança
3. **Identificar funções UI**: `updateStatus`, `showError`, `showSuccess`, `updateProgress`

### IMPLEMENTAÇÃO INCREMENTAL:
1. **Step A**: Criar UIManager classe com updateStatus() apenas
2. **Step B**: Adicionar showError()/showSuccess() se Step A funcionar  
3. **Step C**: Adicionar updateProgress() se Step B funcionar
4. **Step D**: Adicionar event listeners se Step C funcionar

### CRITÉRIOS DE SUCESSO:
- ✅ Dropdown continua funcionando
- ✅ Extração continua funcionando  
- ✅ Mensagens de erro/sucesso funcionam
- ✅ Progress bar funciona

---

## 🧹 LIMPEZA REALIZADA

### ARQUIVOS REMOVIDOS:
- ❌ 9 backups antigos do background.js
- ❌ 5 backups antigos do popup.js  
- ❌ Diretório `src/` completo (13 arquivos)
- ❌ `ROTEIRO-BACKUP.md` duplicado

### ARQUIVOS MANTIDOS:
- ✅ `popup-step1-safe.js` - estado funcionando
- ✅ `popup-v9-step1-backup.js` - backup atual

**Total removido**: 28 arquivos desnecessários

---

## 🎯 FOCO: ETAPA 4.4 UIManager

**Estado atual**: Popup V9 STEP 1 funcionando (dropdown ok)  
**Próximo passo**: Implementar UIManager incrementalmente  
**Backup atual**: `popup-step1-safe.js` e `popup-v9-step1-backup.js`  
**Estratégia**: Uma função UI por vez, teste após cada adição

Pronto para implementar ETAPA 4.4! 🚀
