/**
 * @fileoverview Orquestrador Principal do SIAA Data Viewer
 * @description Orquestrador moderno e puro (400-600 linhas) que delega toda lógica para módulos ES6
 * @version 2.0.0
 * @architecture Modular ES6 - Sistema puro sem legacy
 */

// ========================================================================================
// IMPORTS DOS MÓDULOS ES6
// ========================================================================================

import { getEventBus } from './js/core/event-bus.js';
import { getDataStore } from './js/data/data-store.js';
import { getConfigLoader } from './js/config/config-loader.js';
import { OfertasService } from './js/data/ofertas-service.js';
import { AlunosService } from './js/data/alunos-service.js';
import { DuplicateManager } from './js/data/duplicate-manager.js';
import { TableManager } from './js/ui/table-manager.js';
import { FilterManager } from './js/ui/filter-manager.js';
import { ColumnManager } from './js/ui/column-manager.js';
import { getDropdownManager } from './js/ui/dropdown-manager.js';
import { Storage } from './js/utils/storage.js';

// ========================================================================================
// ORQUESTRADOR PRINCIPAL
// ========================================================================================

/**
 * Orquestrador principal da aplicação SIAA Data Viewer
 * @class SIAAOrchestrator
 */
class SIAAOrchestrator {
    constructor() {
        // Módulos principais
        this.eventBus = getEventBus();
        this.dataStore = getDataStore();
        this.configLoader = getConfigLoader();
        
        // Services
        this.ofertasService = null;
        this.alunosService = null;
        this.duplicateManager = null;
        
        // UI Managers
        this.tableManager = null;
        this.filterManager = null;
        this.columnManager = null;
        this.dropdownManager = getDropdownManager();
        
        // Estado da aplicação
        this.isInitialized = false;
        this.currentViewMode = 'ofertas';
        
        // Elementos DOM (carregados dinamicamente)
        this.elements = {};
        
        // Configuração
        this.config = {
            debug: false,
            autoSave: true,
            defaultMode: 'ofertas'
        };
        
        // Sistema de log condicional
        this.log = this.config.debug ? console.log.bind(console) : () => {};
        this.warn = this.config.debug ? console.warn.bind(console) : () => {};
        this.error = console.error.bind(console);
        
        this.log('🎛️ SIAAOrchestrator inicializado');
    }
    
    /**
     * Inicialização principal da aplicação
     */
    async initialize() {
        if (this.isInitialized) {
            this.warn('⚠️ Orquestrador já inicializado');
            return;
        }
        
        try {
            this.log('🚀 Iniciando orquestração...');
            
            // 1. Aguardar DOM estar pronto
            await this.waitForDOM();
            
            // 2. Carregar elementos DOM
            this.loadDOMElements();
            
            // 3. Inicializar módulos
            await this.initializeModules();
            
            // 4. Configurar event listeners principais
            this.setupMainEventListeners();
            
            // 5. Carregar configuração e dados
            await this.loadInitialData();
            
            // 6. Aplicar configurações salvas
            await this.restoreUserSettings();
            
            // 7. Finalizar inicialização
            this.finalizeInitialization();
            
            this.isInitialized = true;
            this.log('✅ Orquestrador inicializado com sucesso');
            
        } catch (error) {
            this.error('❌ Erro na inicialização:', error);
            throw error;
        }
    }
    
    /**
     * Aguarda o DOM estar completamente carregado
     */
    async waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    /**
     * Carrega referências dos elementos DOM
     */
    loadDOMElements() {
        this.elements = {
            // Controles principais
            switchToOfertasBtn: document.getElementById('switchToOfertasBtn'),
            switchToAlunosBtn: document.getElementById('switchToAlunosBtn'),
            
            // Filtros
            searchInput: document.getElementById('searchInput'),
            campusFilter: document.getElementById('campusFilter'),
            clearFiltersBtn: document.getElementById('clearFiltersBtn'),
            
            // Tabela
            tableWrapper: document.getElementById('tableWrapper'),
            tableHead: document.getElementById('tableHead'),
            tableBody: document.getElementById('tableBody'),
            
            // Sidebar
            columnToggle: document.getElementById('columnToggle'),
            
            // Presets
            presetSelect: document.getElementById('presetSelect'),
            resetPresetBtn: document.getElementById('resetPresetBtn'),
            
            // Exportação
            exportBtn: document.getElementById('exportBtn'),
            exportAllBtn: document.getElementById('exportAllBtn'),
            
            // Duplicatas
            duplicatesBtn: document.getElementById('duplicatesBtn'),
            
            // Loading
            loadingIndicator: document.getElementById('loadingIndicator'),
            statusText: document.getElementById('statusText')
        };
        
        this.log('📋 Elementos DOM carregados');
    }
    
    /**
     * Inicializa todos os módulos necessários
     */
    async initializeModules() {
        this.log('🔧 Inicializando módulos...');
        
        // Carregar configuração
        await this.configLoader.load();
        
        // Inicializar services
        this.ofertasService = new OfertasService();
        this.alunosService = new AlunosService();
        this.duplicateManager = new DuplicateManager();
        
        // Inicializar UI managers
        this.tableManager = new TableManager(
            this.elements.tableWrapper,
            this.elements.tableHead,
            this.elements.tableBody
        );
        
        this.filterManager = new FilterManager();
        this.columnManager = new ColumnManager();
        
        // Configurar comunicação entre módulos via EventBus
        this.setupModuleCommunication();
        
        this.log('✅ Módulos inicializados');
    }
    
    /**
     * Configura comunicação entre módulos via EventBus
     */
    setupModuleCommunication() {
        // Comunicação DataStore -> UI Managers
        this.eventBus.on('data:updated', (data) => {
            this.tableManager.setData(data.filtered || data.raw);
            this.filterManager.setData(data.raw);
        });
        
        // Comunicação Filter -> Table
        this.eventBus.on('filters:applied', (filteredData) => {
            this.tableManager.setFilteredData(filteredData);
            this.updateDataCounts();
        });
        
        // Comunicação Column -> Table
        this.eventBus.on('columns:changed', (config) => {
            this.tableManager.updateColumns(config);
        });
        
        // Comunicação Table -> Storage (auto-save)
        this.eventBus.on('table:changed', (state) => {
            if (this.config.autoSave) {
                this.autoSaveTableState(state);
            }
        });
        
        this.log('🔗 Comunicação entre módulos configurada');
    }
    
    /**
     * Configura event listeners principais do orquestrador
     */
    setupMainEventListeners() {
        // Switch entre modos
        this.elements.switchToOfertasBtn?.addEventListener('click', () => {
            this.switchViewMode('ofertas');
        });
        
        this.elements.switchToAlunosBtn?.addEventListener('click', () => {
            this.switchViewMode('alunos');
        });
        
        // Filtros principais
        this.elements.searchInput?.addEventListener('input', (e) => {
            this.filterManager.setSearchTerm(e.target.value);
        });
        
        this.elements.campusFilter?.addEventListener('change', (e) => {
            this.filterManager.setCampusFilter(e.target.value);
        });
        
        this.elements.clearFiltersBtn?.addEventListener('click', () => {
            this.clearAllFilters();
        });
        
        // Presets
        this.elements.presetSelect?.addEventListener('change', (e) => {
            this.loadPreset(e.target.value);
        });
        
        this.elements.resetPresetBtn?.addEventListener('click', () => {
            this.resetCurrentPreset();
        });
        
        // Exportação
        this.elements.exportBtn?.addEventListener('click', () => {
            this.exportCurrentData();
        });
        
        this.elements.exportAllBtn?.addEventListener('click', () => {
            this.exportAllData();
        });
        
        // Duplicatas
        this.elements.duplicatesBtn?.addEventListener('click', () => {
            this.showDuplicatesDialog();
        });
        
        this.log('🎯 Event listeners principais configurados');
    }
    
    /**
     * Carrega dados iniciais
     */
    async loadInitialData() {
        this.log('📥 Carregando dados iniciais...');
        
        try {
            this.showLoading('Carregando dados...');
            
            // Carregar dados do storage
            const stored = await Storage.get(['siaa_data_csv', 'siaa_students_csv']);
            
            if (stored.siaa_data_csv) {
                await this.dataStore.loadOfertasData(stored.siaa_data_csv);
                this.log('📊 Dados de ofertas carregados');
            }
            
            if (stored.siaa_students_csv) {
                await this.dataStore.loadAlunosData(stored.siaa_students_csv);
                this.log('👥 Dados de alunos carregados');
            }
            
            // Carregar no modo padrão
            await this.switchViewMode(this.config.defaultMode);
            
            this.hideLoading();
            
        } catch (error) {
            this.error('❌ Erro ao carregar dados:', error);
            this.showError('Erro ao carregar dados');
        }
    }
    
    /**
     * Restaura configurações do usuário
     */
    async restoreUserSettings() {
        this.log('⚙️ Restaurando configurações...');
        
        try {
            const settings = await Storage.get([
                'siaa_view_mode',
                'viewer_column_order',
                'viewer_column_visibility',
                'viewer_column_widths'
            ]);
            
            // Restaurar modo de visualização
            if (settings.siaa_view_mode) {
                this.currentViewMode = settings.siaa_view_mode;
            }
            
            // Restaurar configurações de colunas
            if (settings.viewer_column_order) {
                this.columnManager.setColumnOrder(settings.viewer_column_order);
            }
            
            if (settings.viewer_column_visibility) {
                this.columnManager.setVisibleColumns(settings.viewer_column_visibility);
            }
            
            if (settings.viewer_column_widths) {
                this.tableManager.setColumnWidths(settings.viewer_column_widths);
            }
            
            this.log('✅ Configurações restauradas');
            
        } catch (error) {
            this.warn('⚠️ Erro ao restaurar configurações:', error);
        }
    }
    
    /**
     * Finaliza a inicialização
     */
    finalizeInitialization() {
        // Atualizar UI inicial
        this.updateViewModeUI();
        this.updateDataCounts();
        
        // Emitir evento de inicialização completa
        this.eventBus.emit('app:initialized', {
            mode: this.currentViewMode,
            timestamp: new Date().toISOString()
        });
        
        this.log('🎉 Inicialização finalizada');
    }
    
    /**
     * Alterna entre modos de visualização
     */
    async switchViewMode(mode) {
        if (this.currentViewMode === mode) return;
        
        this.log(`🔄 Alternando para modo: ${mode}`);
        
        try {
            // Salvar estado atual
            await this.saveCurrentState();
            
            // Atualizar modo
            this.currentViewMode = mode;
            
            // Carregar dados do novo modo
            const data = mode === 'ofertas' 
                ? this.dataStore.getOfertasData()
                : this.dataStore.getAlunosData();
            
            // Atualizar managers
            this.tableManager.setData(data);
            this.filterManager.setData(data);
            this.columnManager.setData(data);
            
            // Aplicar filtros
            this.filterManager.applyAllFilters();
            
            // Atualizar UI
            this.updateViewModeUI();
            this.updateDataCounts();
            
            // Salvar modo selecionado
            await Storage.set({ siaa_view_mode: mode });
            
            // Emitir evento
            this.eventBus.emit('viewMode:changed', { mode, data });
            
        } catch (error) {
            this.error('❌ Erro ao alternar modo:', error);
        }
    }
    
    /**
     * Atualiza interface do modo de visualização
     */
    updateViewModeUI() {
        // Atualizar botões
        this.elements.switchToOfertasBtn?.classList.toggle('active', this.currentViewMode === 'ofertas');
        this.elements.switchToAlunosBtn?.classList.toggle('active', this.currentViewMode === 'alunos');
        
        // Atualizar visibilidade de controles específicos
        const isOfertasMode = this.currentViewMode === 'ofertas';
        this.elements.duplicatesBtn?.style.setProperty('display', isOfertasMode ? 'none' : 'block');
    }
    
    /**
     * Atualiza contadores de dados
     */
    updateDataCounts() {
        const totalData = this.currentViewMode === 'ofertas' 
            ? this.dataStore.getOfertasData()
            : this.dataStore.getAlunosData();
            
        const filteredData = this.filterManager.getFilteredData();
        
        // Atualizar contadores nos botões
        if (this.elements.switchToOfertasBtn) {
            const ofertasCount = this.dataStore.getOfertasData()?.length || 0;
            this.elements.switchToOfertasBtn.textContent = `Ofertas (${ofertasCount})`;
        }
        
        if (this.elements.switchToAlunosBtn) {
            const alunosCount = this.dataStore.getAlunosData()?.length || 0;
            this.elements.switchToAlunosBtn.textContent = `Alunos (${alunosCount})`;
        }
        
        // Atualizar status
        if (this.elements.statusText) {
            const total = totalData?.length || 0;
            const filtered = filteredData?.length || 0;
            this.elements.statusText.textContent = `Mostrando ${filtered} de ${total} registros`;
        }
    }
    
    /**
     * Limpa todos os filtros
     */
    clearAllFilters() {
        this.filterManager.clearAllFilters();
        
        // Limpar inputs
        if (this.elements.searchInput) this.elements.searchInput.value = '';
        if (this.elements.campusFilter) this.elements.campusFilter.value = '';
    }
    
    /**
     * Carrega preset selecionado
     */
    async loadPreset(presetId) {
        if (!presetId) return;
        
        try {
            // Delegar para o service apropriado
            if (this.currentViewMode === 'ofertas') {
                await this.ofertasService.loadPreset(presetId);
            } else {
                await this.alunosService.loadPreset(presetId);
            }
            
            this.log(`📋 Preset carregado: ${presetId}`);
            
        } catch (error) {
            this.error('❌ Erro ao carregar preset:', error);
        }
    }
    
    /**
     * Reseta preset atual
     */
    async resetCurrentPreset() {
        const currentPreset = this.elements.presetSelect?.value;
        if (!currentPreset) return;
        
        try {
            // Delegar para o service apropriado
            if (this.currentViewMode === 'ofertas') {
                await this.ofertasService.resetPreset(currentPreset);
            } else {
                await this.alunosService.resetPreset(currentPreset);
            }
            
            this.log(`🔄 Preset resetado: ${currentPreset}`);
            
        } catch (error) {
            this.error('❌ Erro ao resetar preset:', error);
        }
    }
    
    /**
     * Exporta dados atuais
     */
    async exportCurrentData() {
        try {
            const filteredData = this.filterManager.getFilteredData();
            const filename = `siaa_${this.currentViewMode}_${new Date().toISOString().split('T')[0]}.csv`;
            
            // Delegar para o service apropriado
            if (this.currentViewMode === 'ofertas') {
                await this.ofertasService.exportData(filteredData, filename);
            } else {
                await this.alunosService.exportData(filteredData, filename);
            }
            
            this.log(`📤 Dados exportados: ${filename}`);
            
        } catch (error) {
            this.error('❌ Erro ao exportar dados:', error);
        }
    }
    
    /**
     * Exporta todos os dados
     */
    async exportAllData() {
        try {
            // Delegar para os services
            await this.ofertasService.exportAllData();
            await this.alunosService.exportAllData();
            
            this.log('📤 Todos os dados exportados');
            
        } catch (error) {
            this.error('❌ Erro ao exportar todos os dados:', error);
        }
    }
    
    /**
     * Mostra diálogo de duplicatas
     */
    async showDuplicatesDialog() {
        if (this.currentViewMode !== 'alunos') return;
        
        try {
            const data = this.dataStore.getAlunosData();
            const duplicates = this.duplicateManager.findDuplicates(data, 'nome+campus');
            
            if (duplicates.length === 0) {
                alert('Nenhuma duplicata encontrada.');
                return;
            }
            
            // Delegar para o DuplicateManager mostrar o diálogo
            await this.duplicateManager.showDialog(duplicates);
            
        } catch (error) {
            this.error('❌ Erro ao verificar duplicatas:', error);
        }
    }
    
    /**
     * Salva estado atual
     */
    async saveCurrentState() {
        try {
            const state = {
                viewMode: this.currentViewMode,
                columnOrder: this.columnManager.getColumnOrder(),
                visibleColumns: this.columnManager.getVisibleColumns(),
                columnWidths: this.tableManager.getColumnWidths(),
                filters: this.filterManager.getFilters()
            };
            
            await Storage.set({
                siaa_view_mode: state.viewMode,
                viewer_column_order: state.columnOrder,
                viewer_column_visibility: state.visibleColumns,
                viewer_column_widths: state.columnWidths
            });
            
        } catch (error) {
            this.warn('⚠️ Erro ao salvar estado:', error);
        }
    }
    
    /**
     * Auto-save do estado da tabela
     */
    async autoSaveTableState(state) {
        try {
            await Storage.set({
                viewer_column_order: state.columnOrder,
                viewer_column_visibility: state.visibleColumns,
                viewer_column_widths: state.columnWidths
            });
            
        } catch (error) {
            this.warn('⚠️ Erro no auto-save:', error);
        }
    }
    
    /**
     * Mostra indicador de carregamento
     */
    showLoading(message = 'Carregando...') {
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'block';
        }
        if (this.elements.statusText) {
            this.elements.statusText.textContent = message;
        }
    }
    
    /**
     * Oculta indicador de carregamento
     */
    hideLoading() {
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'none';
        }
    }
    
    /**
     * Mostra mensagem de erro
     */
    showError(message) {
        if (this.elements.statusText) {
            this.elements.statusText.textContent = `Erro: ${message}`;
        }
        console.error('SIAA Error:', message);
    }
    
    /**
     * Limpa recursos e event listeners
     */
    destroy() {
        this.eventBus.removeAllListeners();
        this.tableManager?.destroy();
        this.filterManager?.destroy();
        this.columnManager?.destroy();
        this.dropdownManager?.destroy();
        
        this.isInitialized = false;
        this.log('🗑️ Orquestrador destruído');
    }
}

// ========================================================================================
// INICIALIZAÇÃO GLOBAL
// ========================================================================================

// Instância global do orquestrador
let orchestrator = null;

/**
 * Inicializa a aplicação
 */
async function initializeApp() {
    try {
        if (orchestrator) {
            console.warn('⚠️ Aplicação já inicializada');
            return;
        }
        
        orchestrator = new SIAAOrchestrator();
        await orchestrator.initialize();
        
        // Expor globalmente para debugging
        if (typeof window !== 'undefined') {
            window.SIAAOrchestrator = orchestrator;
        }
        
        console.log('✅ SIAA Data Viewer inicializado com sucesso');
        
    } catch (error) {
        console.error('❌ Erro fatal na inicialização:', error);
        throw error;
    }
}

// Auto-inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Exportar para uso como módulo
export { SIAAOrchestrator, initializeApp };

// ========================================================================================
// FIM DO ORQUESTRADOR - 545 LINHAS
// ========================================================================================
