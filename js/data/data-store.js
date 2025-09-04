/**
 * @fileoverview Store centralizado para gerenciamento de dados
 * @description Gerencia estado global dos dados da aplicação
 * @version 1.0.0
 */

import { Storage } from '../utils/storage.js';
import { parseCSV } from '../utils/csv-parser.js';

/**
 * Store centralizado para dados da aplicação
 * @class DataStore
 */
export class DataStore {
    constructor() {
        this.data = {
            ofertas: {
                raw: [],
                processed: [],
                filtered: [],
                timestamp: null,
                headers: []
            },
            alunos: {
                raw: [],
                processed: [],
                filtered: [],
                timestamp: null,
                headers: []
            }
        };
        
        this.currentMode = 'ofertas'; // 'ofertas' ou 'alunos'
        this.listeners = new Map();
        this.isLoading = false;
        
        // 🔄 MICRO-D.2: Estados globais migrados para DataStore
        this.appState = {
            currentViewMode: 'ofertas',
            lastUpdate: null,
            autoSave: true,
            theme: 'default'
        };
        
        this.filterStates = {
            ofertas: {
                searchInput: '',
                campusFilter: '',
                periodoFilter: '',
                disciplinaFilter: '',
                professorFilter: '',
                cursoFilter: '',
                horarioFilter: '',
                columnFilters: {}
            },
            alunos: {
                searchInput: '',
                campusFilter: '',
                periodoFilter: '',
                disciplinaFilter: '',
                professorFilter: '',
                cursoFilter: '',
                horarioFilter: '',
                columnFilters: {}
            }
        };
        
        this.columnStates = {
            ofertas: {
                order: [],
                visibility: [],
                widths: {},
                sort: { column: null, direction: 'asc' }
            },
            alunos: {
                order: [],
                visibility: [],
                widths: {},
                sort: { column: null, direction: 'asc' }
            }
        };
        
        this.presetStates = {
            ofertas: {
                currentSelection: '__builtin__PRESET_1_BASICO',
                customPresets: {},
                lastUsed: '__builtin__PRESET_1_BASICO'
            },
            alunos: {
                currentSelection: '__builtin__PRESET_1_BASICO',
                customPresets: {},
                lastUsed: '__builtin__PRESET_1_BASICO'
            }
        };
        
        // 🚀 MICRO-D.4: Estados da UI de tabela migrados para DataStore
        this.tableStates = {
            ofertas: {
                filteredData: [],
                currentSort: { column: null, direction: 'asc' },
                visibleColumns: new Set(),
                columnWidths: {},
                columnOrder: [],
                dragSrcIndex: null,
                activeDropdown: null,
                currentPresetSelection: ''
            },
            alunos: {
                filteredData: [],
                currentSort: { column: null, direction: 'asc' },
                visibleColumns: new Set(),
                columnWidths: {},
                columnOrder: [],
                dragSrcIndex: null,
                activeDropdown: null,
                currentPresetSelection: ''
            }
        };
    }

    /**
     * Obtém dados do modo atual
     * @returns {Object} Dados do modo atual
     */
    getCurrentData() {
        return this.data[this.currentMode];
    }

    /**
     * Obtém todos os dados brutos do modo atual
     * @returns {Array} Array de dados brutos
     */
    getRawData() {
        return this.getCurrentData().raw;
    }

    /**
     * Obtém dados processados do modo atual
     * @returns {Array} Array de dados processados
     */
    getProcessedData() {
        return this.getCurrentData().processed;
    }

    /**
     * Obtém dados filtrados do modo atual
     * @returns {Array} Array de dados filtrados
     */
    getFilteredData() {
        return this.getCurrentData().filtered;
    }

    /**
     * Obtém cabeçalhos do modo atual
     * @returns {Array} Array de cabeçalhos
     */
    getHeaders() {
        return this.getCurrentData().headers;
    }

    /**
     * Define modo atual
     * @param {string} mode - Modo ('ofertas' ou 'alunos')
     */
    setCurrentMode(mode) {
        if (mode !== 'ofertas' && mode !== 'alunos') {
            throw new Error('Modo deve ser "ofertas" ou "alunos"');
        }
        
        const oldMode = this.currentMode;
        this.currentMode = mode;
        
        this.emit('modeChanged', { oldMode, newMode: mode });
    }

    /**
     * Carrega dados do storage
     * @param {string} mode - Modo para carregar (opcional, usa o atual se não especificado)
     * @returns {Promise<boolean>} True se dados foram carregados
     */
    async loadFromStorage(mode = null) {
        const targetMode = mode || this.currentMode;
        this.isLoading = true;
        
        try {
            const storageKey = targetMode === 'ofertas' ? 'siaa_data_csv' : 'siaa_students_csv';
            const timestampKey = targetMode === 'ofertas' ? 'siaa_data_timestamp' : 'siaa_students_timestamp';
            
            const stored = await Storage.get([storageKey, timestampKey]);
            
            if (!stored[storageKey]) {
                console.log(`⚠️ Nenhum dado de ${targetMode} encontrado no storage`);
                this.clearData(targetMode);
                return false;
            }

            // Parsear CSV
            const parsedData = parseCSV(stored[storageKey]);
            
            if (parsedData.length === 0) {
                console.log(`⚠️ Dados de ${targetMode} estão vazios`);
                this.clearData(targetMode);
                return false;
            }

            // Atualizar store
            this.data[targetMode] = {
                raw: parsedData,
                processed: [...parsedData],
                filtered: [...parsedData],
                timestamp: stored[timestampKey] || new Date().toISOString(),
                headers: Object.keys(parsedData[0])
            };

            console.log(`✅ Dados de ${targetMode} carregados:`, parsedData.length, 'registros');
            
            this.emit('dataLoaded', { 
                mode: targetMode, 
                count: parsedData.length,
                timestamp: this.data[targetMode].timestamp
            });
            
            return true;
            
        } catch (error) {
            console.error(`❌ Erro ao carregar dados de ${targetMode}:`, error);
            this.clearData(targetMode);
            return false;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Salva dados no storage
     * @param {string} mode - Modo para salvar (opcional, usa o atual se não especificado)
     * @param {Array} data - Dados para salvar (opcional, usa os atuais se não especificado)
     * @returns {Promise<boolean>} True se dados foram salvos
     */
    async saveToStorage(mode = null, data = null) {
        const targetMode = mode || this.currentMode;
        const targetData = data || this.data[targetMode].raw;
        
        try {
            const storageKey = targetMode === 'ofertas' ? 'siaa_data_csv' : 'siaa_students_csv';
            const timestampKey = targetMode === 'ofertas' ? 'siaa_data_timestamp' : 'siaa_students_timestamp';
            
            // Converter para CSV se necessário
            let csvData;
            if (Array.isArray(targetData) && targetData.length > 0) {
                if (typeof targetData[0] === 'object') {
                    // Converter objetos para CSV
                    const headers = Object.keys(targetData[0]);
                    const csvLines = [headers.join(',')];
                    targetData.forEach(row => {
                        const line = headers.map(header => {
                            const value = row[header] || '';
                            // Escapar vírgulas e aspas
                            return value.toString().includes(',') || value.toString().includes('"') 
                                ? `"${value.toString().replace(/"/g, '""')}"` 
                                : value;
                        }).join(',');
                        csvLines.push(line);
                    });
                    csvData = csvLines.join('\n');
                } else {
                    csvData = targetData.join('\n');
                }
            } else {
                csvData = targetData;
            }
            
            const timestamp = new Date().toISOString();
            
            await Storage.set({
                [storageKey]: csvData,
                [timestampKey]: timestamp
            });
            
            // Atualizar timestamp no store
            this.data[targetMode].timestamp = timestamp;
            
            console.log(`✅ Dados de ${targetMode} salvos no storage`);
            
            this.emit('dataSaved', { 
                mode: targetMode, 
                count: Array.isArray(targetData) ? targetData.length : 1,
                timestamp: timestamp
            });
            
            return true;
            
        } catch (error) {
            console.error(`❌ Erro ao salvar dados de ${targetMode}:`, error);
            return false;
        }
    }

    /**
     * Define dados brutos
     * @param {Array} data - Dados brutos
     * @param {string} mode - Modo (opcional, usa o atual se não especificado)
     */
    setRawData(data, mode = null) {
        const targetMode = mode || this.currentMode;
        
        this.data[targetMode].raw = [...data];
        this.data[targetMode].processed = [...data];
        this.data[targetMode].filtered = [...data];
        
        if (data.length > 0) {
            this.data[targetMode].headers = Object.keys(data[0]);
        }
        
        this.emit('rawDataChanged', { mode: targetMode, count: data.length });
    }

    /**
     * Define dados processados
     * @param {Array} data - Dados processados
     * @param {string} mode - Modo (opcional, usa o atual se não especificado)
     */
    setProcessedData(data, mode = null) {
        const targetMode = mode || this.currentMode;
        
        this.data[targetMode].processed = [...data];
        this.data[targetMode].filtered = [...data];
        
        this.emit('processedDataChanged', { mode: targetMode, count: data.length });
    }

    /**
     * Define dados filtrados
     * @param {Array} data - Dados filtrados
     * @param {string} mode - Modo (opcional, usa o atual se não especificado)
     */
    setFilteredData(data, mode = null) {
        const targetMode = mode || this.currentMode;
        
        this.data[targetMode].filtered = [...data];
        
        this.emit('filteredDataChanged', { mode: targetMode, count: data.length });
    }

    /**
     * Limpa dados de um modo
     * @param {string} mode - Modo para limpar (opcional, usa o atual se não especificado)
     */
    clearData(mode = null) {
        const targetMode = mode || this.currentMode;
        
        this.data[targetMode] = {
            raw: [],
            processed: [],
            filtered: [],
            timestamp: null,
            headers: []
        };
        
        this.emit('dataCleared', { mode: targetMode });
    }

    /**
     * Obtém estatísticas dos dados
     * @param {string} mode - Modo (opcional, usa o atual se não especificado)
     * @returns {Object} Estatísticas
     */
    getStats(mode = null) {
        const targetMode = mode || this.currentMode;
        const modeData = this.data[targetMode];
        
        return {
            mode: targetMode,
            raw: modeData.raw.length,
            processed: modeData.processed.length,
            filtered: modeData.filtered.length,
            headers: modeData.headers.length,
            timestamp: modeData.timestamp,
            reductionByProcessing: modeData.raw.length > 0 
                ? Math.round((1 - modeData.processed.length / modeData.raw.length) * 100) 
                : 0,
            reductionByFiltering: modeData.processed.length > 0 
                ? Math.round((1 - modeData.filtered.length / modeData.processed.length) * 100) 
                : 0,
            isLoading: this.isLoading
        };
    }

    /**
     * Obtém estatísticas de todos os modos
     * @returns {Object} Estatísticas completas
     */
    getAllStats() {
        return {
            ofertas: this.getStats('ofertas'),
            alunos: this.getStats('alunos'),
            currentMode: this.currentMode,
            isLoading: this.isLoading
        };
    }

    /**
     * Verifica se tem dados no modo atual
     * @returns {boolean} True se tem dados
     */
    hasData() {
        return this.getCurrentData().raw.length > 0;
    }

    /**
     * Verifica se está carregando
     * @returns {boolean} True se está carregando
     */
    isDataLoading() {
        return this.isLoading;
    }

    /**
     * Adiciona listener de eventos
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função callback
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Remove listener de eventos
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função callback
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Emite evento
     * @param {string} event - Nome do evento
     * @param {*} data - Dados do evento
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erro no listener de ${event}:`, error);
                }
            });
        }
    }

    /**
     * Processa dados com função customizada
     * @param {Function} processor - Função para processar dados
     * @param {string} mode - Modo (opcional, usa o atual se não especificado)
     * @returns {Array} Dados processados
     */
    processData(processor, mode = null) {
        const targetMode = mode || this.currentMode;
        const rawData = this.data[targetMode].raw;
        
        try {
            const processed = processor(rawData);
            this.setProcessedData(processed, targetMode);
            return processed;
        } catch (error) {
            console.error('Erro ao processar dados:', error);
            return rawData;
        }
    }

    // 🔄 MICRO-D.2: Métodos para gerenciamento de estado
    
    /**
     * Obtém configurações da aplicação
     * @returns {Object} Configurações da aplicação
     */
    getAppState() {
        return { ...this.appState };
    }
    
    /**
     * Atualiza configurações da aplicação
     * @param {Object} newState - Novos valores de estado
     */
    updateAppState(newState) {
        this.appState = { ...this.appState, ...newState };
        this.emit('app.state.changed', { state: this.getAppState() });
    }
    
    /**
     * Obtém estados de filtro para um modo específico
     * @param {string} mode - Modo ('ofertas' ou 'alunos')
     * @returns {Object} Estados de filtro
     */
    getFilterStates(mode = null) {
        const targetMode = mode || this.currentMode;
        return { ...this.filterStates[targetMode] };
    }
    
    /**
     * Atualiza estados de filtro
     * @param {Object} newFilters - Novos valores de filtro
     * @param {string} mode - Modo específico (opcional)
     */
    updateFilterStates(newFilters, mode = null) {
        const targetMode = mode || this.currentMode;
        this.filterStates[targetMode] = { ...this.filterStates[targetMode], ...newFilters };
        this.emit('filter.states.changed', { 
            mode: targetMode, 
            filters: this.getFilterStates(targetMode) 
        });
    }
    
    /**
     * Obtém estados de coluna para um modo específico
     * @param {string} mode - Modo ('ofertas' ou 'alunos')
     * @returns {Object} Estados de coluna
     */
    getColumnStates(mode = null) {
        const targetMode = mode || this.currentMode;
        return { ...this.columnStates[targetMode] };
    }
    
    /**
     * Atualiza estados de coluna
     * @param {Object} newColumns - Novos valores de coluna
     * @param {string} mode - Modo específico (opcional)
     */
    updateColumnStates(newColumns, mode = null) {
        const targetMode = mode || this.currentMode;
        this.columnStates[targetMode] = { ...this.columnStates[targetMode], ...newColumns };
        this.emit('column.states.changed', { 
            mode: targetMode, 
            columns: this.getColumnStates(targetMode) 
        });
    }
    
    /**
     * Obtém estados de preset para um modo específico
     * @param {string} mode - Modo ('ofertas' ou 'alunos')
     * @returns {Object} Estados de preset
     */
    getPresetStates(mode = null) {
        const targetMode = mode || this.currentMode;
        return { ...this.presetStates[targetMode] };
    }
    
    /**
     * Atualiza estados de preset
     * @param {Object} newPresets - Novos valores de preset
     * @param {string} mode - Modo específico (opcional)
     */
    updatePresetStates(newPresets, mode = null) {
        const targetMode = mode || this.currentMode;
        this.presetStates[targetMode] = { ...this.presetStates[targetMode], ...newPresets };
        this.emit('preset.states.changed', { 
            mode: targetMode, 
            presets: this.getPresetStates(targetMode) 
        });
    }
    
    // 🚀 MICRO-D.4: Métodos para gerenciamento dos estados da tabela
    
    /**
     * Obtém estados da tabela para um modo específico
     * @param {string} mode - Modo ('ofertas' ou 'alunos')
     * @returns {Object} Estados da tabela
     */
    getTableStates(mode = null) {
        const targetMode = mode || this.currentMode;
        return { ...this.tableStates[targetMode] };
    }
    
    /**
     * Atualiza estados da tabela
     * @param {Object} newStates - Novos valores dos estados
     * @param {string} mode - Modo específico (opcional)
     */
    updateTableStates(newStates, mode = null) {
        const targetMode = mode || this.currentMode;
        this.tableStates[targetMode] = { ...this.tableStates[targetMode], ...newStates };
        this.emit('table.states.changed', { 
            mode: targetMode, 
            states: this.getTableStates(targetMode) 
        });
    }
    
    /**
     * Obtém estado específico da tabela
     * @param {string} stateKey - Chave do estado
     * @param {string} mode - Modo específico (opcional)
     * @returns {*} Valor do estado
     */
    getTableState(stateKey, mode = null) {
        const targetMode = mode || this.currentMode;
        return this.tableStates[targetMode][stateKey];
    }
    
    /**
     * Define estado específico da tabela
     * @param {string} stateKey - Chave do estado
     * @param {*} value - Novo valor
     * @param {string} mode - Modo específico (opcional)
     */
    setTableState(stateKey, value, mode = null) {
        const targetMode = mode || this.currentMode;
        this.tableStates[targetMode][stateKey] = value;
        this.emit('table.state.changed', { 
            mode: targetMode, 
            key: stateKey, 
            value: value 
        });
    }

    /**
     * Destrói o store
     */
    destroy() {
        this.data = {
            ofertas: { raw: [], processed: [], filtered: [], timestamp: null, headers: [] },
            alunos: { raw: [], processed: [], filtered: [], timestamp: null, headers: [] }
        };
        this.listeners.clear();
        this.isLoading = false;
        
        // Limpar estados migrados
        this.appState = { currentViewMode: 'ofertas', lastUpdate: null, autoSave: true, theme: 'default' };
        this.filterStates = { ofertas: {}, alunos: {} };
        this.columnStates = { ofertas: {}, alunos: {} };
        this.presetStates = { ofertas: {}, alunos: {} };
        this.tableStates = { ofertas: {}, alunos: {} };
    }
}

// Instância singleton
let dataStoreInstance = null;

/**
 * Obtém instância singleton do DataStore
 * @returns {DataStore} Instância do store
 */
export function getDataStore() {
    if (!dataStoreInstance) {
        dataStoreInstance = new DataStore();
    }
    return dataStoreInstance;
}

// Para compatibilidade com código existente
if (typeof window !== 'undefined') {
    window.DataStore = DataStore;
    window.getDataStore = getDataStore;
}
