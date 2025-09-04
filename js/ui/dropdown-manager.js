/**
 * @fileoverview Módulo para gerenciamento de dropdowns e menus
 * @description Sistema para criação e controle de dropdowns dinâmicos
 * @version 1.0.0
 */

/**
 * Classe para gerenciamento de dropdowns
 * @class DropdownManager
 */
export class DropdownManager {
    constructor() {
        this.activeDropdown = null;
        this.dropdowns = new Map();
        this.globalClickHandler = this.handleGlobalClick.bind(this);
        
        // Configurar event listener global
        document.addEventListener('click', this.globalClickHandler);
    }

    /**
     * Cria e exibe um dropdown de filtro de coluna
     * @param {HTMLElement} inputElement - Input que irá receber o valor
     * @param {string} column - Nome da coluna
     * @param {Array} data - Dados para gerar opções
     * @param {Object} currentFilters - Filtros ativos atuais
     * @param {Object} options - Opções de configuração
     */
    showColumnFilterDropdown(inputElement, column, data, currentFilters = {}, options = {}) {
        this.closeActiveDropdown();

        const {
            maxItems = 50,
            supportMultiple = true,
            delimiter = ';',
            placeholder = 'Digite para filtrar...'
        } = options;

        // Filtrar dados base (sem o filtro da coluna atual)
        const baseData = this.getFilteredBaseData(data, currentFilters, column);
        
        // Extrair valores únicos da coluna
        const uniqueValues = [...new Set(baseData.map(row => (row[column] || '').trim()))]
            .filter(value => value !== '')
            .sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));

        // Filtrar sugestões baseado no input atual
        const typedValue = String(inputElement.value || '').toLowerCase();
        let filteredValues = this.filterSuggestions(uniqueValues, typedValue, supportMultiple, delimiter);
        
        // Limitar número de itens
        if (filteredValues.length > maxItems) {
            filteredValues = filteredValues.slice(0, maxItems);
        }

        // Criar dropdown
        const dropdown = this.createDropdown(filteredValues, inputElement, column, {
            supportMultiple,
            delimiter,
            placeholder
        });

        // Posicionar dropdown
        this.positionDropdown(dropdown, inputElement);

        // Adicionar ao DOM
        document.body.appendChild(dropdown);
        this.activeDropdown = dropdown;

        // Armazenar referência
        this.dropdowns.set(column, {
            element: dropdown,
            input: inputElement,
            column: column
        });
    }

    /**
     * Cria e exibe dropdown customizado
     * @param {Array} options - Opções do dropdown
     * @param {HTMLElement} triggerElement - Elemento que disparou o dropdown
     * @param {Function} onSelect - Callback quando item é selecionado
     * @param {Object} config - Configurações adicionais
     */
    showCustomDropdown(options, triggerElement, onSelect, config = {}) {
        this.closeActiveDropdown();

        const {
            maxHeight = 200,
            searchable = false,
            multiSelect = false,
            className = 'custom-dropdown'
        } = config;

        const dropdown = document.createElement('div');
        dropdown.className = `dropdown-container ${className}`;
        dropdown.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-height: ${maxHeight}px;
            overflow-y: auto;
            z-index: 9999;
            min-width: 150px;
        `;

        // Adicionar busca se habilitada
        if (searchable) {
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Buscar...';
            searchInput.style.cssText = `
                width: 100%;
                padding: 8px;
                border: none;
                border-bottom: 1px solid #eee;
                outline: none;
                box-sizing: border-box;
            `;
            
            searchInput.addEventListener('input', (e) => {
                this.filterDropdownOptions(dropdown, e.target.value);
            });
            
            dropdown.appendChild(searchInput);
        }

        // Adicionar opções
        options.forEach((option, index) => {
            const item = this.createDropdownItem(option, index, onSelect, multiSelect);
            dropdown.appendChild(item);
        });

        // Posicionar e adicionar ao DOM
        this.positionDropdown(dropdown, triggerElement);
        document.body.appendChild(dropdown);
        this.activeDropdown = dropdown;

        return dropdown;
    }

    /**
     * Cria um dropdown para filtro de coluna
     * @param {Array} values - Valores para o dropdown
     * @param {HTMLElement} inputElement - Input associado
     * @param {string} column - Nome da coluna
     * @param {Object} options - Opções de configuração
     * @returns {HTMLElement} Elemento dropdown
     */
    createDropdown(values, inputElement, column, options) {
        const { supportMultiple, delimiter, placeholder } = options;

        const dropdown = document.createElement('div');
        dropdown.className = 'column-filter-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-height: 200px;
            overflow-y: auto;
            z-index: 9999;
            min-width: 200px;
        `;

        // Adicionar cabeçalho se suporta múltiplos valores
        if (supportMultiple) {
            const header = document.createElement('div');
            header.style.cssText = `
                padding: 8px;
                border-bottom: 1px solid #eee;
                font-size: 12px;
                color: #666;
                background: #f9f9f9;
            `;
            header.textContent = `Use "${delimiter}" para múltiplos valores`;
            dropdown.appendChild(header);
        }

        // Adicionar opções
        values.forEach((value, index) => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = value;
            item.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: background-color 0.2s;
            `;

            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f5f5f5';
            });

            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = '';
            });

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectDropdownValue(inputElement, value, supportMultiple, delimiter);
                this.closeActiveDropdown();
            });

            dropdown.appendChild(item);
        });

        // Adicionar opção "Limpar" se há valor no input
        if (inputElement.value) {
            const clearItem = document.createElement('div');
            clearItem.className = 'dropdown-item clear-item';
            clearItem.textContent = '🗑️ Limpar filtro';
            clearItem.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                color: #dc3545;
                border-top: 1px solid #ddd;
                font-weight: bold;
                background: #fff5f5;
            `;

            clearItem.addEventListener('click', (e) => {
                e.stopPropagation();
                inputElement.value = '';
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                this.closeActiveDropdown();
            });

            dropdown.appendChild(clearItem);
        }

        return dropdown;
    }

    /**
     * Cria item de dropdown customizado
     * @param {Object|string} option - Opção do dropdown
     * @param {number} index - Índice da opção
     * @param {Function} onSelect - Callback de seleção
     * @param {boolean} multiSelect - Se permite múltipla seleção
     * @returns {HTMLElement} Item do dropdown
     */
    createDropdownItem(option, index, onSelect, multiSelect) {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        
        const isObject = typeof option === 'object';
        const label = isObject ? option.label : option;
        const value = isObject ? option.value : option;
        const disabled = isObject ? option.disabled : false;

        item.textContent = label;
        item.style.cssText = `
            padding: 8px 12px;
            cursor: ${disabled ? 'not-allowed' : 'pointer'};
            border-bottom: 1px solid #f0f0f0;
            transition: background-color 0.2s;
            ${disabled ? 'opacity: 0.5;' : ''}
        `;

        if (!disabled) {
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f5f5f5';
            });

            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = '';
            });

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                
                if (onSelect) {
                    onSelect(value, option, index);
                }
                
                if (!multiSelect) {
                    this.closeActiveDropdown();
                }
            });
        }

        return item;
    }

    /**
     * Filtra dados base removendo filtros específicos
     * @param {Array} data - Dados originais
     * @param {Object} currentFilters - Filtros ativos
     * @param {string} excludeColumn - Coluna a excluir
     * @returns {Array} Dados filtrados
     */
    getFilteredBaseData(data, currentFilters, excludeColumn) {
        let filtered = [...data];

        // Aplicar todos os filtros exceto o da coluna atual
        Object.entries(currentFilters).forEach(([column, value]) => {
            if (column !== excludeColumn && value) {
                filtered = filtered.filter(row => {
                    const cellValue = row[column] || '';
                    return this.matchesMultipleValues(cellValue, value);
                });
            }
        });

        return filtered;
    }

    /**
     * Filtra sugestões baseado no texto digitado
     * @param {Array} values - Valores únicos
     * @param {string} typed - Texto digitado
     * @param {boolean} supportMultiple - Se suporta múltiplos valores
     * @param {string} delimiter - Delimitador para múltiplos valores
     * @returns {Array} Valores filtrados
     */
    filterSuggestions(values, typed, supportMultiple, delimiter) {
        if (!typed) return values;

        let searchTerm = typed;

        // Se suporta múltiplos valores, filtrar pelo último termo
        if (supportMultiple && typed.includes(delimiter)) {
            searchTerm = typed.split(delimiter).pop().trim();
        }

        return searchTerm 
            ? values.filter(value => String(value).toLowerCase().includes(searchTerm))
            : values;
    }

    /**
     * Seleciona valor no dropdown
     * @param {HTMLElement} inputElement - Input para receber o valor
     * @param {string} value - Valor selecionado
     * @param {boolean} supportMultiple - Se suporta múltiplos valores
     * @param {string} delimiter - Delimitador para múltiplos valores
     */
    selectDropdownValue(inputElement, value, supportMultiple, delimiter) {
        if (supportMultiple && inputElement.value) {
            // Múltiplos valores: adicionar ao final
            const currentValues = inputElement.value.split(delimiter);
            currentValues[currentValues.length - 1] = value;
            inputElement.value = currentValues.join(delimiter) + delimiter + ' ';
        } else {
            // Valor único
            inputElement.value = value;
        }

        // Disparar evento de mudança
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.focus();
    }

    /**
     * Posiciona dropdown relativo ao elemento trigger
     * @param {HTMLElement} dropdown - Elemento dropdown
     * @param {HTMLElement} triggerElement - Elemento que disparou
     */
    positionDropdown(dropdown, triggerElement) {
        const rect = triggerElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownHeight = 200; // Altura estimada

        // Calcular posição
        let top = rect.bottom + window.scrollY;
        let left = rect.left + window.scrollX;

        // Ajustar se sair da tela na vertical
        if (rect.bottom + dropdownHeight > viewportHeight) {
            top = rect.top + window.scrollY - dropdownHeight;
        }

        // Ajustar se sair da tela na horizontal
        const dropdownWidth = 200; // Largura estimada
        if (rect.left + dropdownWidth > window.innerWidth) {
            left = window.innerWidth - dropdownWidth - 10;
        }

        dropdown.style.top = top + 'px';
        dropdown.style.left = left + 'px';
    }

    /**
     * Filtra opções do dropdown baseado em busca
     * @param {HTMLElement} dropdown - Elemento dropdown
     * @param {string} searchText - Texto de busca
     */
    filterDropdownOptions(dropdown, searchText) {
        const items = dropdown.querySelectorAll('.dropdown-item:not(.clear-item)');
        const searchLower = searchText.toLowerCase();

        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            const matches = text.includes(searchLower);
            item.style.display = matches ? '' : 'none';
        });
    }

    /**
     * Verifica se valor corresponde a múltiplos termos
     * @param {string} value - Valor para verificar
     * @param {string} filterStr - String de filtro
     * @returns {boolean} True se corresponde
     */
    matchesMultipleValues(value, filterStr) {
        if (!value || !filterStr) return true;
        
        const valueStr = String(value).toLowerCase();
        const filter = filterStr.toLowerCase();
        
        // Suporte a múltiplos valores separados por vírgula ou ponto e vírgula
        if (filter.includes(',') || filter.includes(';')) {
            const delimiter = filter.includes(';') ? ';' : ',';
            const terms = filter.split(delimiter).map(t => t.trim()).filter(t => t);
            return terms.some(term => valueStr.includes(term));
        } else {
            return valueStr.includes(filter);
        }
    }

    /**
     * Fecha dropdown ativo
     */
    closeActiveDropdown() {
        if (this.activeDropdown) {
            this.activeDropdown.remove();
            this.activeDropdown = null;
        }

        // Limpar referências armazenadas
        this.dropdowns.clear();
    }

    /**
     * Gerencia cliques globais para fechar dropdowns
     * @param {Event} event - Evento de clique
     */
    handleGlobalClick(event) {
        if (this.activeDropdown && !this.activeDropdown.contains(event.target)) {
            // Verificar se clique foi em um input associado
            let shouldClose = true;
            
            for (const [column, data] of this.dropdowns) {
                if (data.input.contains(event.target)) {
                    shouldClose = false;
                    break;
                }
            }
            
            if (shouldClose) {
                this.closeActiveDropdown();
            }
        }
    }

    /**
     * Cria dropdown de contexto
     * @param {Array} menuItems - Itens do menu
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @returns {HTMLElement} Dropdown criado
     */
    showContextMenu(menuItems, x, y) {
        this.closeActiveDropdown();

        const dropdown = document.createElement('div');
        dropdown.className = 'context-menu-dropdown';
        dropdown.style.cssText = `
            position: fixed;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            min-width: 120px;
            padding: 4px 0;
        `;

        menuItems.forEach((item, index) => {
            if (item === 'separator') {
                const separator = document.createElement('div');
                separator.style.cssText = `
                    height: 1px;
                    background: #eee;
                    margin: 4px 0;
                `;
                dropdown.appendChild(separator);
            } else {
                const menuItem = this.createDropdownItem(item, index, (value, option) => {
                    if (option.action) {
                        option.action();
                    }
                }, false);
                dropdown.appendChild(menuItem);
            }
        });

        // Posicionar no local do clique
        dropdown.style.left = x + 'px';
        dropdown.style.top = y + 'px';

        // Ajustar se sair da tela
        document.body.appendChild(dropdown);
        const rect = dropdown.getBoundingClientRect();
        
        if (rect.right > window.innerWidth) {
            dropdown.style.left = (x - rect.width) + 'px';
        }
        
        if (rect.bottom > window.innerHeight) {
            dropdown.style.top = (y - rect.height) + 'px';
        }

        this.activeDropdown = dropdown;
        return dropdown;
    }

    /**
     * Destrói a instância
     */
    destroy() {
        this.closeActiveDropdown();
        document.removeEventListener('click', this.globalClickHandler);
        this.dropdowns.clear();
    }
}

// Instância singleton
let dropdownManagerInstance = null;

/**
 * Obtém instância singleton do DropdownManager
 * @returns {DropdownManager} Instância
 */
export function getDropdownManager() {
    if (!dropdownManagerInstance) {
        dropdownManagerInstance = new DropdownManager();
    }
    return dropdownManagerInstance;
}

// Para compatibilidade com código existente
if (typeof window !== 'undefined') {
    window.DropdownManager = DropdownManager;
    window.getDropdownManager = getDropdownManager;
}
