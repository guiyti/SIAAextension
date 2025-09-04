/**
 * @fileoverview Módulo para gerenciamento de filtros
 * @description Sistema completo de filtros para dados tabulares
 * @version 1.0.0
 */

/**
 * Classe para gerenciamento de filtros
 * @class FilterManager
 */
export class FilterManager {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.columnFilters = {};
        this.sidebarFilters = {};
        this.searchTerm = '';
        this.visibleColumns = new Set();
        
        // Callbacks
        this.onFilterChange = null;
        this.onDataFiltered = null;
        
        // Elementos do DOM
        this.elements = {};
    }

    /**
     * Inicializa o sistema de filtros
     * @param {Object} elements - Elementos DOM dos filtros
     * @param {Array} data - Dados para filtrar
     * @param {Set} visibleColumns - Colunas visíveis
     */
    initialize(elements, data, visibleColumns) {
        this.elements = elements;
        this.data = data;
        this.visibleColumns = visibleColumns;
        this.filteredData = [...data];
        
        this.setupFilterElements();
        this.populateFilterOptions();
    }

    /**
     * Configura event listeners para elementos de filtro
     */
    setupFilterElements() {
        // Filtro de busca
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.setSearchTerm(e.target.value);
            });
        }

        // Filtros da sidebar
        const sidebarFilters = [
            'campusFilter', 'periodoFilter', 'disciplinaFilter', 
            'professorFilter', 'cursoFilter', 'horarioFilter'
        ];

        sidebarFilters.forEach(filterId => {
            if (this.elements[filterId]) {
                this.elements[filterId].addEventListener('change', (e) => {
                    this.setSidebarFilter(filterId, e.target.value);
                });
            }
        });

        // Botão limpar
        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    /**
     * Popula opções dos filtros baseado nos dados
     */
    populateFilterOptions() {
        if (this.data.length === 0) return;

        // Campus
        if (this.elements.campusFilter) {
            const campusValues = [...new Set(this.data.map(row => row['Sigla Campus']).filter(Boolean))].sort();
            this.populateSelect(this.elements.campusFilter, campusValues);
        }
        
        // Período
        if (this.elements.periodoFilter) {
            const periodoValues = [...new Set(this.data.map(row => row['Período']).filter(Boolean))].sort();
            this.populateSelect(this.elements.periodoFilter, periodoValues);
        }
        
        // Disciplina
        if (this.elements.disciplinaFilter) {
            const disciplinaValues = [...new Set(this.data.map(row => row['Nome Disciplina']).filter(Boolean))].sort();
            this.populateSelect(this.elements.disciplinaFilter, disciplinaValues);
        }
        
        // Professor
        if (this.elements.professorFilter) {
            const professorValues = [...new Set(this.data.map(row => row['Nome Professor']).filter(Boolean))].sort();
            this.populateSelect(this.elements.professorFilter, professorValues);
        }

        // Curso (com parsing especial)
        if (this.elements.cursoFilter) {
            const cursoSet = new Set();
            const cursoRegex = /\(\d+\s-\s[^)]+\)/g;
            this.data.forEach(row => {
                const field = row['Curso'] || '';
                const matches = field.match(cursoRegex);
                if (matches) {
                    matches.forEach(c => cursoSet.add(c.trim()));
                }
            });
            const cursoValues = [...cursoSet].sort();
            this.populateSelect(this.elements.cursoFilter, cursoValues);
        }

        // Horário (com parsing especial)
        if (this.elements.horarioFilter) {
            const horarioSet = new Set();
            this.data.forEach(row => {
                const horario = row['Hora'] || '';
                if (horario) {
                    // Extrair dias da semana únicos do horário
                    const dias = horario.split(' | ').map(periodo => {
                        const dia = periodo.split(' ')[0]; // Primeira palavra é o dia
                        return dia;
                    }).filter(dia => dia && dia.length > 1);
                    dias.forEach(dia => horarioSet.add(dia));
                }
            });
            const horarioValues = [...horarioSet].sort();
            this.populateSelect(this.elements.horarioFilter, horarioValues);
        }
    }

    /**
     * Popula um select com opções
     * @param {HTMLSelectElement} select - Elemento select
     * @param {Array} values - Valores para as opções
     */
    populateSelect(select, values) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Todos</option>';
        
        values.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
        
        // Restaurar valor selecionado se ainda existe
        if (currentValue && values.includes(currentValue)) {
            select.value = currentValue;
        }
    }

    /**
     * Define termo de busca
     * @param {string} term - Termo de busca
     */
    setSearchTerm(term) {
        this.searchTerm = term.toLowerCase().trim();
        this.applyFilters();
    }

    /**
     * Define filtro de coluna específica
     * @param {string} column - Nome da coluna
     * @param {string} value - Valor do filtro
     */
    setColumnFilter(column, value) {
        if (value) {
            this.columnFilters[column] = value;
        } else {
            delete this.columnFilters[column];
        }
        this.applyFilters();
    }

    /**
     * Define filtro da sidebar
     * @param {string} filterId - ID do filtro
     * @param {string} value - Valor do filtro
     */
    setSidebarFilter(filterId, value) {
        if (value) {
            this.sidebarFilters[filterId] = value;
        } else {
            delete this.sidebarFilters[filterId];
        }
        this.applyFilters();
    }

    /**
     * Atualiza dados base e reaplica filtros
     * @param {Array} data - Novos dados
     */
    setData(data) {
        this.data = data;
        this.populateFilterOptions();
        this.applyFilters();
    }

    /**
     * Atualiza colunas visíveis
     * @param {Set} visibleColumns - Colunas visíveis
     */
    setVisibleColumns(visibleColumns) {
        this.visibleColumns = visibleColumns;
        this.applyFilters();
    }

    /**
     * Aplica todos os filtros aos dados
     */
    applyFilters() {
        let filtered = [...this.data];
        
        // Filtro de busca - apenas nos campos visíveis
        if (this.searchTerm) {
            const visibleColumnsList = Array.from(this.visibleColumns);
            
            filtered = filtered.filter(row => {
                return visibleColumnsList.some(column => {
                    const value = row[column] || '';
                    return String(value).toLowerCase().includes(this.searchTerm);
                });
            });
        }
        
        // Filtros por coluna (AND cumulativo)
        Object.entries(this.columnFilters).forEach(([column, term]) => {
            filtered = filtered.filter(row => {
                const value = row[column] || '';
                return this.matchesMultipleValues(value, term, column);
            });
        });
        
        // Filtros da sidebar
        this.applySidebarFilters(filtered);
        
        this.filteredData = filtered;
        
        // Notificar mudança
        if (this.onDataFiltered) {
            this.onDataFiltered(this.filteredData);
        }
        
        if (this.onFilterChange) {
            this.onFilterChange({
                total: this.data.length,
                filtered: this.filteredData.length,
                filters: this.getActiveFilters()
            });
        }
    }

    /**
     * Aplica filtros da sidebar
     * @param {Array} filtered - Array de dados já filtrados
     */
    applySidebarFilters(filtered) {
        // Mapeamento de filtros para campos
        const filterMapping = {
            campusFilter: 'Sigla Campus',
            periodoFilter: 'Período',
            disciplinaFilter: 'Nome Disciplina',
            professorFilter: 'Nome Professor',
            cursoFilter: 'Curso',
            horarioFilter: 'Hora'
        };

        Object.entries(this.sidebarFilters).forEach(([filterId, value]) => {
            const fieldName = filterMapping[filterId];
            if (fieldName) {
                this.filteredData = filtered.filter(row => {
                    return this.matchesMultipleValues(row[fieldName], value);
                });
                filtered = this.filteredData; // Para próxima iteração
            }
        });
    }

    /**
     * Verifica se um valor corresponde a múltiplos termos de busca
     * @param {string} value - Valor para verificar
     * @param {string} filterStr - String de filtro
     * @param {string} columnName - Nome da coluna (para lógica especial)
     * @returns {boolean} True se corresponde
     */
    matchesMultipleValues(value, filterStr, columnName = '') {
        if (!value || !filterStr) return true;
        
        const valueStr = String(value).toLowerCase();
        const filter = filterStr.toLowerCase();
        
        // Lógica especial para RGM: permitir busca sem hífen encontrar RGMs com hífen
        if (columnName && columnName.toLowerCase().includes('rgm')) {
            // Remove hífens tanto do valor quanto do filtro para comparação
            const valueWithoutHyphen = valueStr.replace(/-/g, '');
            const filterWithoutHyphen = filter.replace(/-/g, '');
            
            // Suporte a múltiplos valores separados por vírgula
            if (filter.includes(',')) {
                const terms = filter.split(',').map(t => t.trim()).filter(t => t);
                return terms.some(term => {
                    const termWithoutHyphen = term.replace(/-/g, '');
                    return valueWithoutHyphen.includes(termWithoutHyphen);
                });
            } else {
                return valueWithoutHyphen.includes(filterWithoutHyphen);
            }
        }
        
        // Suporte a múltiplos valores separados por vírgula
        if (filter.includes(',')) {
            const terms = filter.split(',').map(t => t.trim()).filter(t => t);
            return terms.some(term => valueStr.includes(term));
        } else {
            return valueStr.includes(filter);
        }
    }

    /**
     * Limpa todos os filtros
     */
    clearAllFilters() {
        // Limpar busca
        this.searchTerm = '';
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
        }

        // Limpar filtros de coluna
        this.columnFilters = {};

        // Limpar filtros da sidebar
        this.sidebarFilters = {};
        Object.keys(this.elements).forEach(elementId => {
            const element = this.elements[elementId];
            if (element && element.tagName === 'SELECT') {
                element.value = '';
            }
        });

        this.applyFilters();
    }

    /**
     * Limpa filtros de um tipo específico
     * @param {string} type - Tipo de filtro ('search', 'column', 'sidebar')
     */
    clearFilterType(type) {
        switch (type) {
            case 'search':
                this.setSearchTerm('');
                break;
            case 'column':
                this.columnFilters = {};
                break;
            case 'sidebar':
                this.sidebarFilters = {};
                Object.keys(this.elements).forEach(elementId => {
                    const element = this.elements[elementId];
                    if (element && element.tagName === 'SELECT') {
                        element.value = '';
                    }
                });
                break;
        }
        this.applyFilters();
    }

    /**
     * Obtém lista de filtros ativos
     * @returns {Object} Filtros ativos
     */
    getActiveFilters() {
        const active = {};
        
        if (this.searchTerm) {
            active.search = this.searchTerm;
        }
        
        if (Object.keys(this.columnFilters).length > 0) {
            active.columns = { ...this.columnFilters };
        }
        
        if (Object.keys(this.sidebarFilters).length > 0) {
            active.sidebar = { ...this.sidebarFilters };
        }
        
        return active;
    }

    /**
     * Obtém dados filtrados
     * @returns {Array} Dados após aplicação dos filtros
     */
    getFilteredData() {
        return this.filteredData;
    }

    /**
     * Obtém estatísticas dos filtros
     * @returns {Object} Estatísticas
     */
    getStats() {
        return {
            total: this.data.length,
            filtered: this.filteredData.length,
            filtersActive: Object.keys(this.getActiveFilters()).length,
            reductionPercentage: this.data.length > 0 
                ? Math.round((1 - this.filteredData.length / this.data.length) * 100)
                : 0
        };
    }

    /**
     * Aplica estado de filtros
     * @param {Object} state - Estado dos filtros
     */
    setState(state) {
        if (state.searchTerm !== undefined) {
            this.setSearchTerm(state.searchTerm);
        }
        
        if (state.columnFilters) {
            this.columnFilters = { ...state.columnFilters };
        }
        
        if (state.sidebarFilters) {
            this.sidebarFilters = { ...state.sidebarFilters };
            
            // Aplicar aos elementos DOM
            Object.entries(state.sidebarFilters).forEach(([filterId, value]) => {
                if (this.elements[filterId]) {
                    this.elements[filterId].value = value;
                }
            });
        }
        
        this.applyFilters();
    }

    /**
     * Obtém estado atual dos filtros
     * @returns {Object} Estado dos filtros
     */
    getState() {
        return {
            searchTerm: this.searchTerm,
            columnFilters: { ...this.columnFilters },
            sidebarFilters: { ...this.sidebarFilters }
        };
    }

    /**
     * Destrói a instância
     */
    destroy() {
        this.data = [];
        this.filteredData = [];
        this.columnFilters = {};
        this.sidebarFilters = {};
        this.elements = {};
        this.onFilterChange = null;
        this.onDataFiltered = null;
    }
}

// Para compatibilidade com código existente
if (typeof window !== 'undefined') {
    window.FilterManager = FilterManager;
}
