/**
 * @fileoverview Controlador principal da aplicação
 * @description Orquestra a inicialização e comunicação entre todos os módulos
 * @version 1.0.0
 */

import { getEventBus } from './event-bus.js';
import { getDataStore } from '../data/data-store.js';
import { getConfigLoader } from '../config/config-loader.js';
import { OfertasService } from '../data/ofertas-service.js';
import { AlunosService } from '../data/alunos-service.js';
import { DuplicateManager } from '../data/duplicate-manager.js';
import { TableManager } from '../ui/table-manager.js';
import { FilterManager } from '../ui/filter-manager.js';
import { ColumnManager } from '../ui/column-manager.js';
import { getDropdownManager } from '../ui/dropdown-manager.js';

/**
 * Controlador principal da aplicação
 * @class AppController
 */
export class AppController {
    constructor() {
        this.eventBus = getEventBus();
        this.dataStore = getDataStore();
        this.configLoader = getConfigLoader();
        this.isInitialized = false;
        this.modules = {};
        this.config = {
            debug: false, // Mudará para true apenas em desenvolvimento
            autoSave: true,
            defaultMode: 'ofertas'
        };
        
        // Sistema de log condicional
        this.log = this.config.debug ? console.log.bind(console) : () => {};
        this.warn = this.config.debug ? console.warn.bind(console) : () => {};
        this.error = console.error.bind(console); // Erros sempre mostrados
        
        // 🔄 MICRO-ETAPA D.1: Façades de Compatibilidade Legacy
        this.legacyCompat = {
            currentViewMode: 'ofertas',
            elements: null,
            allData: []
        };
        
        this.setupLegacyFacades();
    }
    
    /**
     * 🔄 MICRO-D.1: Configura façades para compatibilidade com código legacy
     * Permite transição gradual das variáveis globais para o sistema moderno
     */
    setupLegacyFacades() {
        // 🔄 MICRO-D.2: Façade para currentViewMode conectada ao DataStore
        Object.defineProperty(window, 'currentViewMode', {
            get: () => {
                const appState = this.dataStore.getAppState();
                return appState.currentViewMode || this.legacyCompat.currentViewMode;
            },
            set: (value) => {
                this.legacyCompat.currentViewMode = value;
                this.dataStore.updateAppState({ currentViewMode: value });
                this.dataStore.setCurrentMode(value);
                this.eventBus.emit('app.viewMode.changed', { mode: value });
                this.log(`🔄 [D.2] ViewMode alterado via façade → DataStore: ${value}`);
            },
            configurable: true
        });
        
        // Façade para allData
        Object.defineProperty(window, 'allData', {
            get: () => this.dataStore.getRawData() || this.legacyCompat.allData,
            set: (value) => {
                this.legacyCompat.allData = value;
                this.dataStore.setRawData(value);
                this.eventBus.emit('data.changed', { data: value });
                this.log(`🔄 [D.1] AllData alterado via façade: ${value?.length} registros`);
            },
            configurable: true
        });
        
        // 🔄 MICRO-D.2: Façades para estados globais
        this.setupStateFacades();
        
        // Façade para elements (será configurado após DOM estar pronto)
        this.setupElementsFacade();
    }
    
    /**
     * 🔄 MICRO-D.2: Configura façades para objetos de estado globais
     */
    setupStateFacades() {
        // Façade para filterStates
        Object.defineProperty(window, 'filterStates', {
            get: () => ({
                ofertas: this.dataStore.getFilterStates('ofertas'),
                alunos: this.dataStore.getFilterStates('alunos')
            }),
            set: (value) => {
                if (value?.ofertas) this.dataStore.updateFilterStates(value.ofertas, 'ofertas');
                if (value?.alunos) this.dataStore.updateFilterStates(value.alunos, 'alunos');
                this.log(`🔄 [D.2] FilterStates alterado via façade → DataStore`);
            },
            configurable: true
        });
        
        // Façade para columnStates
        Object.defineProperty(window, 'columnStates', {
            get: () => ({
                ofertas: this.dataStore.getColumnStates('ofertas'),
                alunos: this.dataStore.getColumnStates('alunos')
            }),
            set: (value) => {
                if (value?.ofertas) this.dataStore.updateColumnStates(value.ofertas, 'ofertas');
                if (value?.alunos) this.dataStore.updateColumnStates(value.alunos, 'alunos');
                this.log(`🔄 [D.2] ColumnStates alterado via façade → DataStore`);
            },
            configurable: true
        });
        
        // Façade para presetStates  
        Object.defineProperty(window, 'presetStates', {
            get: () => ({
                ofertas: this.dataStore.getPresetStates('ofertas'),
                alunos: this.dataStore.getPresetStates('alunos')
            }),
            set: (value) => {
                if (value?.ofertas) this.dataStore.updatePresetStates(value.ofertas, 'ofertas');
                if (value?.alunos) this.dataStore.updatePresetStates(value.alunos, 'alunos');
                this.log(`🔄 [D.2] PresetStates alterado via façade → DataStore`);
            },
            configurable: true
        });
        
        // Façade para appSettings
        Object.defineProperty(window, 'appSettings', {
            get: () => this.dataStore.getAppState(),
            set: (value) => {
                this.dataStore.updateAppState(value);
                this.log(`🔄 [D.2] AppSettings alterado via façade → DataStore`);
            },
            configurable: true
        });
    }
    
    /**
     * 🔄 MICRO-D.1: Configura façade para object elements
     */
    setupElementsFacade() {
        // Esta será chamada quando o DOM estiver pronto
        this.legacyCompat.elements = this.createElementsProxy();
        
        Object.defineProperty(window, 'elements', {
            get: () => this.legacyCompat.elements,
            configurable: true
        });
    }
    
    /**
     * 🔄 MICRO-D.1: Cria proxy para elements que mapeia para o sistema moderno
     */
    createElementsProxy() {
        return new Proxy({}, {
            get(target, prop) {
                // Mapeia elements legacy para getElementById
                const element = document.getElementById(prop) || 
                               document.querySelector(`[data-element="${prop}"]`) ||
                               document.querySelector(`.${prop}`);
                
                if (!element) {
                    console.warn(`🔄 [D.1] Elemento '${prop}' não encontrado via façade`);
                }
                
                return element;
            },
            set(target, prop, value) {
                console.warn(`🔄 [D.1] Tentativa de definir elements.${prop} - usar sistema moderno`);
                return true;
            }
        });
    }
    
    /**
     * 🔄 MICRO-D.1: Ativa todas as façades de compatibilidade
     */
    activateLegacyFacades() {
        // Inicializar viewMode com valor padrão
        if (!window.currentViewMode) {
            this.legacyCompat.currentViewMode = this.config.defaultMode;
        }
        
        // Configurar elements após DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupElementsFacade();
                this.log('🔄 [D.1] Elements façade configurado após DOMContentLoaded');
            });
        } else {
            this.setupElementsFacade();
            this.log('🔄 [D.1] Elements façade configurado imediatamente');
        }
        
        this.log('✅ [D.1] Façades de compatibilidade ativadas');
    }

    /**
     * Inicializa a aplicação
     * @param {Object} config - Configuração da aplicação
     * @returns {Promise<void>}
     */
    async initialize(config = {}) {
        if (this.isInitialized) {
            this.warn('AppController já foi inicializado');
            return;
        }

        this.config = { ...this.config, ...config };
        
        if (this.config.debug) {
            this.eventBus.setDebug(true);
        }

        try {
            this.log('🚀 Inicializando SIAA App Controller...');
            
            // MICRO-ETAPA B.1.2: Carregar configuração via ConfigLoader
            console.log('🧪 [B.1.2] Carregando config via sistema moderno...');
            await this.configLoader.load();
            const siaaConfig = this.configLoader.getConfig();
            console.log('✅ [B.1.2] Config carregada via ConfigLoader:', siaaConfig?.version);
            
            // 🔄 MICRO-ETAPA D.1: Ativar façades de compatibilidade
            this.log('🔄 [D.1] Ativando façades de compatibilidade legacy...');
            this.activateLegacyFacades();
            
            // 1. Configurar event bus
            this.setupEventListeners();
            
            // 2. Inicializar módulos de dados
            await this.initializeDataModules();
            
            // 3. Inicializar módulos de UI
            await this.initializeUIModules();
            
            // 4. Carregar dados iniciais
            await this.loadInitialData();
            
            // 5. Conectar módulos via eventos
            this.connectModules();
            
            this.isInitialized = true;
            
            this.eventBus.emit('app.initialized', {
                modules: Object.keys(this.modules),
                config: this.config,
                timestamp: new Date().toISOString()
            });
            
            this.log('✅ SIAA App Controller inicializado com sucesso');
            
        } catch (error) {
            this.error('❌ Erro ao inicializar AppController:', error);
            this.eventBus.emit('app.error', {
                type: 'initialization',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * Configura listeners globais do event bus
     */
    setupEventListeners() {
        // Listener para erros globais
        this.eventBus.on('*.error', (data) => {
            this.error('Erro capturado pelo AppController:', data);
        });

        // Listener para mudanças de modo
        this.eventBus.on('app.mode.change', async (data) => {
            await this.switchMode(data.mode);
        });

        // Listener para comandos de save
        this.eventBus.on('app.save', () => {
            this.saveCurrentState();
        });

        // Listener para comandos de reset
        this.eventBus.on('app.reset', () => {
            this.resetApplication();
        });
    }

    /**
     * Inicializa módulos de dados
     */
    async initializeDataModules() {
        this.log('📊 Inicializando módulos de dados...');

        // Data Store
        this.modules.dataStore = this.dataStore;
        
        // Serviços especializados
        this.modules.ofertasService = new OfertasService();
        this.modules.alunosService = new AlunosService();
        this.modules.duplicateManager = new DuplicateManager();

        // Configurar listeners do data store
        this.dataStore.on('dataLoaded', (data) => {
            this.eventBus.emit('data.loaded', data);
        });

        this.dataStore.on('dataFiltered', (data) => {
            this.eventBus.emit('data.filtered', data);
        });

        this.dataStore.on('modeChanged', (data) => {
            this.eventBus.emit('data.mode.changed', data);
        });

        this.log('✅ Módulos de dados inicializados');
    }

    /**
     * Inicializa módulos de UI
     */
    async initializeUIModules() {
        this.log('🎨 Inicializando módulos de UI...');

        // Obter elementos do DOM
        const elements = this.getDOMElements();

        // Table Manager
        this.modules.tableManager = new TableManager(
            elements.tableWrapper,
            elements.tableHead,
            elements.tableBody
        );

        // Filter Manager
        this.modules.filterManager = new FilterManager();
        this.modules.filterManager.initialize(elements, [], new Set());

        // Column Manager
        this.modules.columnManager = new ColumnManager();
        this.modules.columnManager.initialize(elements, []);

        // Dropdown Manager
        this.modules.dropdownManager = getDropdownManager();

        // Configurar callbacks dos módulos UI
        this.setupUICallbacks();

        this.log('✅ Módulos de UI inicializados');
    }

    /**
     * Obtém elementos do DOM necessários
     * @returns {Object} Elementos do DOM
     */
    getDOMElements() {
        return {
            // Tabela
            tableWrapper: document.getElementById('tableWrapper'),
            tableHead: document.getElementById('tableHead'),
            tableBody: document.getElementById('tableBody'),
            
            // Filtros
            searchInput: document.getElementById('searchInput'),
            clearBtn: document.getElementById('clearBtn'),
            campusFilter: document.getElementById('campusFilter'),
            periodoFilter: document.getElementById('periodoFilter'),
            disciplinaFilter: document.getElementById('disciplinaFilter'),
            professorFilter: document.getElementById('professorFilter'),
            cursoFilter: document.getElementById('cursoFilterTop'),
            horarioFilter: document.getElementById('horarioFilter'),
            
            // Colunas
            columnToggle: document.getElementById('columnToggle'),
            resetColumnsBtn: document.getElementById('resetColumnsBtn'),
            presetSelect: document.getElementById('presetSelect'),
            
            // Contadores
            filteredRecords: document.getElementById('filteredRecords'),
            totalOfertas: document.getElementById('totalOfertas'),
            totalAlunos: document.getElementById('totalAlunos'),
            sidebarLastUpdate: document.getElementById('sidebarLastUpdate'),
            
            // Exportação
            exportBtn: document.getElementById('exportBtn'),
            loadingMessage: document.getElementById('loadingMessage'),
            noDataMessage: document.getElementById('noDataMessage')
        };
    }

    /**
     * Configura callbacks dos módulos UI
     */
    setupUICallbacks() {
        // Table Manager callbacks
        this.modules.tableManager.onDataUpdate = (data) => {
            this.eventBus.emit('ui.table.data.updated', { count: data.length });
        };

        this.modules.tableManager.onColumnResize = (header, width, allWidths) => {
            this.eventBus.emit('ui.column.resized', { header, width, allWidths });
        };

        this.modules.tableManager.onColumnReorder = (order) => {
            this.eventBus.emit('ui.column.reordered', { order });
        };

        this.modules.tableManager.onSort = (column, direction) => {
            this.eventBus.emit('ui.table.sorted', { column, direction });
        };

        // Filter Manager callbacks
        this.modules.filterManager.onFilterChange = (filterInfo) => {
            this.eventBus.emit('ui.filter.changed', filterInfo);
        };

        this.modules.filterManager.onDataFiltered = (filteredData) => {
            this.eventBus.emit('ui.filter.applied', { 
                count: filteredData.length,
                data: filteredData 
            });
        };

        // Column Manager callbacks
        this.modules.columnManager.onVisibilityChange = (header, visible, visibleColumns) => {
            this.eventBus.emit('ui.column.visibility.changed', { 
                header, 
                visible, 
                visibleColumns 
            });
        };

        this.modules.columnManager.onOrderChange = (order) => {
            this.eventBus.emit('ui.column.order.changed', { order });
        };

        this.modules.columnManager.onConfigChange = (type, config) => {
            this.eventBus.emit('ui.column.config.changed', { type, config });
        };
    }

    /**
     * Carrega dados iniciais
     */
    async loadInitialData() {
        this.log('📂 Carregando dados iniciais...');
        
        const mode = this.config.defaultMode;
        this.dataStore.setCurrentMode(mode);
        
        const loaded = await this.dataStore.loadFromStorage();
        
        if (loaded) {
            this.log(`✅ Dados de ${mode} carregados com sucesso`);
        } else {
            this.log(`⚠️ Nenhum dado encontrado para ${mode}`);
        }
    }

    /**
     * Conecta módulos via eventos
     */
    connectModules() {
        this.log('🔗 Conectando módulos via eventos...');

        // Quando dados são carregados → atualizar UI
        this.eventBus.on('data.loaded', (data) => {
            const currentData = this.dataStore.getProcessedData();
            
            // Atualizar table manager
            this.modules.tableManager.setData(currentData);
            
            // Atualizar filter manager
            this.modules.filterManager.setData(currentData);
            this.modules.filterManager.setVisibleColumns(this.modules.tableManager.visibleColumns);
            
            // Atualizar column manager
            this.modules.columnManager.setData(currentData);
        });

        // Quando filtros mudam → aplicar aos dados
        this.eventBus.on('ui.filter.applied', (data) => {
            this.modules.tableManager.setFilteredData(data.data);
        });

        // Quando visibilidade de colunas muda → atualizar table e filters
        this.eventBus.on('ui.column.visibility.changed', (data) => {
            this.modules.tableManager.setVisibleColumns(data.visibleColumns);
            this.modules.filterManager.setVisibleColumns(data.visibleColumns);
            
            if (this.config.autoSave) {
                this.saveCurrentState();
            }
        });

        // Quando ordem de colunas muda → atualizar table
        this.eventBus.on('ui.column.order.changed', (data) => {
            this.modules.tableManager.setColumnOrder(data.order);
            
            if (this.config.autoSave) {
                this.saveCurrentState();
            }
        });

        // Quando coluna é redimensionada → salvar estado
        this.eventBus.on('ui.column.resized', (data) => {
            if (this.config.autoSave) {
                this.saveCurrentState();
            }
        });

        this.log('✅ Módulos conectados via eventos');
    }

    /**
     * Alterna modo da aplicação
     * @param {string} mode - Novo modo ('ofertas' ou 'alunos')
     */
    async switchMode(mode) {
        if (mode === this.dataStore.currentMode) return;
        
        this.log(`🔄 Alternando para modo: ${mode}`);
        
        this.dataStore.setCurrentMode(mode);
        await this.dataStore.loadFromStorage();
        
        this.eventBus.emit('app.mode.switched', { 
            mode, 
            timestamp: new Date().toISOString() 
        });
    }

    /**
     * Salva estado atual da aplicação
     */
    async saveCurrentState() {
        try {
            const state = {
                tableState: this.modules.tableManager.getState(),
                filterState: this.modules.filterManager.getState(),
                columnState: this.modules.columnManager.getConfig(),
                dataStats: this.dataStore.getStats(),
                timestamp: new Date().toISOString()
            };

            // Emitir evento de salvamento
            this.eventBus.emit('app.state.saving', state);
            
            // Aqui poderia implementar salvamento no storage
            // await Storage.set({ 'app_state': state });
            
            this.eventBus.emit('app.state.saved', state);
            
        } catch (error) {
            this.eventBus.emit('app.error', {
                type: 'save_state',
                error: error.message
            });
        }
    }

    /**
     * Reseta aplicação ao estado inicial
     */
    async resetApplication() {
        this.log('🔄 Resetando aplicação...');
        
        // Limpar dados
        this.dataStore.clearData();
        
        // Resetar UI modules
        this.modules.tableManager.destroy();
        this.modules.filterManager.destroy();
        this.modules.columnManager.destroy();
        
        // Recarregar dados iniciais
        await this.loadInitialData();
        
        this.eventBus.emit('app.reset.completed', {
            timestamp: new Date().toISOString()
        });
        
        this.log('✅ Aplicação resetada');
    }

    /**
     * Obtém estatísticas da aplicação
     * @returns {Object} Estatísticas completas
     */
    getAppStats() {
        return {
            isInitialized: this.isInitialized,
            config: this.config,
            modules: Object.keys(this.modules),
            dataStats: this.dataStore.getAllStats(),
            eventBusStats: this.eventBus.getStats(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Obtém instância de módulo específico
     * @param {string} moduleName - Nome do módulo
     * @returns {Object|null} Instância do módulo
     */
    getModule(moduleName) {
        return this.modules[moduleName] || null;
    }

    /**
     * Verifica se aplicação está inicializada
     * @returns {boolean} True se inicializada
     */
    isAppInitialized() {
        return this.isInitialized;
    }

    /**
     * Destrói a aplicação e limpa recursos
     */
    destroy() {
        this.log('🗑️ Destruindo AppController...');
        
        // Destruir módulos
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        
        // Limpar event bus
        this.eventBus.removeAll();
        
        this.isInitialized = false;
        this.modules = {};
        
        this.log('✅ AppController destruído');
    }
}

// Instância singleton
let appControllerInstance = null;

/**
 * Obtém instância singleton do AppController
 * @returns {AppController} Instância do controlador
 */
export function getAppController() {
    if (!appControllerInstance) {
        appControllerInstance = new AppController();
    }
    return appControllerInstance;
}

// Para compatibilidade com código existente
if (typeof window !== 'undefined') {
    window.AppController = AppController;
    window.getAppController = getAppController;
}
