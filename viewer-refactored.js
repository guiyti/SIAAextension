/**
 * @fileoverview SIAA Data Viewer - Versão Refatorada
 * @description Orquestrador principal usando AppController e sistema de eventos
 * @version 3.0.0
 */

// ============================================
// IMPORTAÇÕES DOS MÓDULOS REFATORADOS
// ============================================

// Sistema central
import { getAppController } from './js/core/app-controller.js';
import { getEventBus } from './js/core/event-bus.js';

// Configuração
import { loadConfig } from './js/config/config-loader.js';

// Storage
import { Storage } from './js/utils/storage.js';

// ============================================
// VARIÁVEIS GLOBAIS SIMPLIFICADAS
// ============================================

let appController = null;
let eventBus = null;
let currentViewMode = 'ofertas'; // 'ofertas' ou 'alunos'
let isInitialized = false;

// Estados para compatibilidade (serão gerenciados pelos módulos)
let allData = [];
let filteredData = [];
let currentSort = { column: null, direction: 'asc' };
let visibleColumns = new Set();
let columnOrder = [];
let columnWidths = {};

// ============================================
// ELEMENTOS DO DOM
// ============================================

const elements = {
    // Contadores
    filteredRecords: document.getElementById('filteredRecords'),
    totalOfertas: document.getElementById('totalOfertas'),
    totalAlunos: document.getElementById('totalAlunos'),
    sidebarLastUpdate: document.getElementById('sidebarLastUpdate'),
    
    // Controles
    searchInput: document.getElementById('searchInput'),
    clearBtn: document.getElementById('clearBtn'),
    resetColumnsBtn: document.getElementById('resetColumnsBtn'),
    presetSelect: document.getElementById('presetSelect'),
    exportBtn: document.getElementById('exportBtn'),
    
    // Filtros
    campusFilter: document.getElementById('campusFilter'),
    periodoFilter: document.getElementById('periodoFilter'),
    disciplinaFilter: document.getElementById('disciplinaFilter'),
    professorFilter: document.getElementById('professorFilter'),
    cursoFilter: document.getElementById('cursoFilterTop'),
    horarioFilter: document.getElementById('horarioFilter'),
    
    // Tabela
    tableWrapper: document.getElementById('tableWrapper'),
    tableHead: document.getElementById('tableHead'),
    tableBody: document.getElementById('tableBody'),
    loadingMessage: document.getElementById('loadingMessage'),
    noDataMessage: document.getElementById('noDataMessage'),
    
    // Configuração
    columnToggle: document.getElementById('columnToggle')
};

// ============================================
// INICIALIZAÇÃO PRINCIPAL
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando SIAA Data Viewer (Versão Refatorada)...');
    
    try {
        // 1. Configurar sistema de eventos
        eventBus = getEventBus();
        setupGlobalEventListeners();
        
        // 2. Carregar configuração
        await loadConfig();
        
        // 3. Inicializar AppController
        appController = getAppController();
        await appController.initialize({
            debug: false, // Alterar para true se necessário debug
            autoSave: true,
            defaultMode: currentViewMode
        });
        
        // 4. Configurar controles específicos não gerenciados pelos módulos
        setupLegacyControls();
        
        // 5. Configurar listeners de eventos específicos da aplicação
        setupApplicationEventListeners();
        
        // 6. Carregar configurações salvas
        await loadSavedConfigurations();
        
        isInitialized = true;
        
        console.log('✅ SIAA Data Viewer inicializado com sucesso!');
        eventBus.emit('app.viewer.ready');
        
    } catch (error) {
        console.error('❌ Erro fatal na inicialização:', error);
        showErrorMessage('Erro ao inicializar a aplicação: ' + error.message);
    }
});

// ============================================
// CONFIGURAÇÃO DE EVENT LISTENERS GLOBAIS
// ============================================

function setupGlobalEventListeners() {
    // Listener para dados carregados
    eventBus.on('data.loaded', (data) => {
        console.log('📊 Dados carregados via evento:', data);
        updateHeaderCounters();
        showData();
    });
    
    // Listener para dados filtrados
    eventBus.on('ui.filter.applied', (data) => {
        console.log('🔍 Filtros aplicados:', data.count, 'registros');
        updateFilteredRecordsCount(data.count);
    });
    
    // Listener para mudança de modo
    eventBus.on('data.mode.changed', (data) => {
        console.log('🔄 Modo alterado para:', data.newMode);
        currentViewMode = data.newMode;
        updateModeSpecificUI();
    });
    
    // Listener para erros
    eventBus.on('*.error', (data) => {
        console.error('⚠️ Erro capturado:', data);
        showErrorMessage(data.error || 'Erro desconhecido');
    });
    
    // Listener para mudanças de estado que requerem salvamento
    eventBus.on('ui.column.*', () => {
        debouncedSave();
    });
    
    // Listener para inicialização completa
    eventBus.on('app.initialized', () => {
        console.log('🎉 AppController totalmente inicializado');
    });
}

// ============================================
// CONTROLES LEGADOS (não migrados para módulos)
// ============================================

function setupLegacyControls() {
    // Sidebar toggle
    setupSidebarControls();
    
    // View mode controls
    setupViewModeControls();
    
    // Export controls
    setupExportControls();
    
    // Preset controls
    setupPresetControls();
    
    // Clear button
    if (elements.clearBtn) {
        elements.clearBtn.addEventListener('click', () => {
            eventBus.emit('ui.filter.clear.requested');
        });
    }
    
    // Reset columns button
    if (elements.resetColumnsBtn) {
        elements.resetColumnsBtn.addEventListener('click', () => {
            eventBus.emit('ui.column.reset.requested');
        });
    }
}

function setupSidebarControls() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    function toggleSidebar() {
        document.body.classList.toggle('sidebar-open');
        const isOpen = document.body.classList.contains('sidebar-open');
        console.log('🔄 Sidebar toggled:', isOpen ? 'ABERTA' : 'FECHADA');
    }
    
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (sidebarClose) sidebarClose.addEventListener('click', toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);
}

function setupViewModeControls() {
    // Botões de alternância entre ofertas e alunos
    const ofertasBtn = document.getElementById('showOffersBtn');
    const alunosBtn = document.getElementById('showStudentsBtn');
    
    if (ofertasBtn) {
        ofertasBtn.addEventListener('click', () => {
            switchToMode('ofertas');
        });
    }
    
    if (alunosBtn) {
        alunosBtn.addEventListener('click', () => {
            switchToMode('alunos');
        });
    }
}

function setupExportControls() {
    if (elements.exportBtn) {
        elements.exportBtn.addEventListener('click', async () => {
            try {
                await exportCurrentData();
            } catch (error) {
                console.error('Erro na exportação:', error);
                showErrorMessage('Erro ao exportar dados');
            }
        });
    }
}

function setupPresetControls() {
    if (elements.presetSelect) {
        elements.presetSelect.addEventListener('change', async (e) => {
            const presetKey = e.target.value;
            if (presetKey) {
                eventBus.emit('ui.preset.change.requested', { preset: presetKey });
            }
        });
    }
}

// ============================================
// LISTENERS DE EVENTOS DA APLICAÇÃO
// ============================================

function setupApplicationEventListeners() {
    // Requisições de mudança de modo
    eventBus.on('app.mode.change.requested', (data) => {
        switchToMode(data.mode);
    });
    
    // Requisições de limpeza de filtros
    eventBus.on('ui.filter.clear.requested', () => {
        clearAllFilters();
    });
    
    // Requisições de reset de colunas
    eventBus.on('ui.column.reset.requested', () => {
        resetColumns();
    });
    
    // Requisições de mudança de preset
    eventBus.on('ui.preset.change.requested', async (data) => {
        await applyPreset(data.preset);
    });
    
    // Requisições de exportação
    eventBus.on('app.export.requested', async (data) => {
        await exportCurrentData(data.format);
    });
}

// ============================================
// FUNÇÕES DE CONTROLE PRINCIPAL
// ============================================

async function switchToMode(mode) {
    if (mode === currentViewMode) return;
    
    console.log(`🔄 Alternando para modo: ${mode}`);
    
    try {
        // Usar AppController para alternar modo
        await appController.switchMode(mode);
        
        // Atualizar estado local
        currentViewMode = mode;
        
        // Atualizar UI específica do modo
        updateModeSpecificUI();
        
        // Salvar configuração
        await Storage.set({ viewer_current_mode: mode });
        
        console.log(`✅ Modo alterado para: ${mode}`);
        
    } catch (error) {
        console.error('Erro ao alternar modo:', error);
        showErrorMessage('Erro ao alternar modo de visualização');
    }
}

function updateModeSpecificUI() {
    // Atualizar classes CSS
    document.body.className = document.body.className.replace(/mode-\w+/, '');
    document.body.classList.add(`mode-${currentViewMode}`);
    
    // Atualizar botões ativos
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(
        currentViewMode === 'ofertas' ? 'showOffersBtn' : 'showStudentsBtn'
    );
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Emitir evento de mudança
    eventBus.emit('app.mode.ui.updated', { mode: currentViewMode });
}

async function clearAllFilters() {
    console.log('🧹 Limpando todos os filtros...');
    
    try {
        // Usar FilterManager via AppController
        const filterManager = appController.getModule('filterManager');
        if (filterManager) {
            filterManager.clearAllFilters();
        }
        
        // Limpar inputs locais
        if (elements.searchInput) elements.searchInput.value = '';
        
        console.log('✅ Filtros limpos');
        
    } catch (error) {
        console.error('Erro ao limpar filtros:', error);
    }
}

async function resetColumns() {
    console.log('🔄 Resetando colunas...');
    
    try {
        // Usar ColumnManager via AppController
        const columnManager = appController.getModule('columnManager');
        if (columnManager) {
            await columnManager.resetColumns();
        }
        
        console.log('✅ Colunas resetadas');
        
    } catch (error) {
        console.error('Erro ao resetar colunas:', error);
    }
}

async function applyPreset(presetKey) {
    console.log(`🎛️ Aplicando preset: ${presetKey}`);
    
    try {
        // Implementar aplicação de preset via módulos
        const columnManager = appController.getModule('columnManager');
        if (columnManager && presetKey) {
            // Carregar configuração do preset do siaa-config
            const config = await loadConfig();
            const presetConfig = config?.presets?.[currentViewMode]?.[presetKey];
            
            if (presetConfig) {
                await columnManager.applyPreset(presetConfig);
                console.log('✅ Preset aplicado');
            }
        }
        
    } catch (error) {
        console.error('Erro ao aplicar preset:', error);
    }
}

// ============================================
// FUNÇÕES DE EXPORTAÇÃO
// ============================================

async function exportCurrentData(format = 'csv') {
    console.log(`📤 Exportando dados no formato: ${format}`);
    
    try {
        const dataStore = appController.getModule('dataStore');
        if (!dataStore) {
            throw new Error('DataStore não disponível');
        }
        
        const data = dataStore.getFilteredData();
        if (data.length === 0) {
            showErrorMessage('Nenhum dado para exportar');
            return;
        }
        
        let content = '';
        let filename = '';
        let mimeType = '';
        
        if (format === 'csv') {
            // Usar serviço apropriado para exportação
            const service = currentViewMode === 'ofertas' 
                ? appController.getModule('ofertasService')
                : appController.getModule('alunosService');
            
            if (service && service.exportToCSV) {
                content = service.exportToCSV(data);
                filename = `siaa_${currentViewMode}_${new Date().toISOString().split('T')[0]}.csv`;
                mimeType = 'text/csv';
            }
        }
        
        if (content) {
            downloadFile(content, filename, mimeType);
            console.log('✅ Exportação concluída');
        }
        
    } catch (error) {
        console.error('Erro na exportação:', error);
        showErrorMessage('Erro ao exportar dados');
    }
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

// ============================================
// FUNÇÕES DE ATUALIZAÇÃO DE UI
// ============================================

async function updateHeaderCounters() {
    try {
        const dataStore = appController.getModule('dataStore');
        if (!dataStore) return;
        
        const stats = dataStore.getAllStats();
        
        // Atualizar contadores
        if (elements.totalOfertas) {
            elements.totalOfertas.textContent = stats.ofertas.raw;
        }
        
        if (elements.totalAlunos) {
            elements.totalAlunos.textContent = stats.alunos.raw;
        }
        
        // Atualizar timestamp
        if (elements.sidebarLastUpdate) {
            const timestamp = stats[currentViewMode].timestamp;
            if (timestamp) {
                const date = new Date(timestamp);
                elements.sidebarLastUpdate.textContent = date.toLocaleString('pt-BR');
            }
        }
        
    } catch (error) {
        console.error('Erro ao atualizar contadores:', error);
    }
}

function updateFilteredRecordsCount(count) {
    if (elements.filteredRecords) {
        elements.filteredRecords.textContent = count;
    }
}

function showData() {
    if (elements.loadingMessage) elements.loadingMessage.style.display = 'none';
    if (elements.noDataMessage) elements.noDataMessage.style.display = 'none';
    if (elements.tableWrapper) elements.tableWrapper.style.display = 'block';
}

function showNoData() {
    if (elements.loadingMessage) elements.loadingMessage.style.display = 'none';
    if (elements.tableWrapper) elements.tableWrapper.style.display = 'none';
    if (elements.noDataMessage) elements.noDataMessage.style.display = 'block';
}

function showErrorMessage(message) {
    console.error('Erro para usuário:', message);
    
    // Implementar notificação visual se necessário
    if (typeof alert !== 'undefined') {
        alert('Erro: ' + message);
    }
}

// ============================================
// CONFIGURAÇÕES E PERSISTÊNCIA
// ============================================

async function loadSavedConfigurations() {
    try {
        // Carregar modo salvo
        const savedConfig = await Storage.get(['viewer_current_mode']);
        if (savedConfig.viewer_current_mode) {
            currentViewMode = savedConfig.viewer_current_mode;
            updateModeSpecificUI();
        }
        
        console.log('✅ Configurações carregadas');
        
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
}

// Debounced save para evitar muitas escritas
let saveTimeout = null;
function debouncedSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        try {
            if (appController && appController.isAppInitialized()) {
                await appController.saveCurrentState();
            }
        } catch (error) {
            console.error('Erro ao salvar estado:', error);
        }
    }, 1000);
}

// ============================================
// FUNÇÕES DE COMPATIBILIDADE (TEMPORÁRIAS)
// ============================================

// Manter algumas funções para compatibilidade com código que ainda não foi migrado
function getCurrentColumnFilters() {
    const filterManager = appController?.getModule('filterManager');
    return filterManager?.getState()?.columnFilters || {};
}

function setCurrentColumnFilter(column, value) {
    const filterManager = appController?.getModule('filterManager');
    if (filterManager) {
        filterManager.setColumnFilter(column, value);
    }
}

// ============================================
// EXPOSIÇÃO GLOBAL PARA COMPATIBILIDADE
// ============================================

// Expor funções essenciais globalmente para compatibilidade
window.switchToMode = switchToMode;
window.clearAllFilters = clearAllFilters;
window.resetColumns = resetColumns;
window.exportCurrentData = exportCurrentData;
window.getCurrentColumnFilters = getCurrentColumnFilters;
window.setCurrentColumnFilter = setCurrentColumnFilter;

// Expor estado para debugging
window.getAppState = () => ({
    isInitialized,
    currentViewMode,
    appController: appController?.getAppStats(),
    eventBusStats: eventBus?.getStats()
});

console.log('📋 Viewer.js refatorado carregado - usando AppController e sistema de eventos');
