/**
 * @fileoverview Módulo para gerenciamento de colunas
 * @description Controla visibilidade, ordem e configuração de colunas
 * @version 1.0.0
 */

/**
 * Classe para gerenciamento de colunas
 * @class ColumnManager
 */
export class ColumnManager {
    constructor() {
        this.data = [];
        this.columnOrder = [];
        this.visibleColumns = new Set();
        this.columnWidths = {};
        
        // Elementos DOM
        this.elements = {};
        
        // Callbacks
        this.onVisibilityChange = null;
        this.onOrderChange = null;
        this.onWidthChange = null;
        this.onConfigChange = null;
    }

    /**
     * Inicializa o gerenciador de colunas
     * @param {Object} elements - Elementos DOM
     * @param {Array} data - Dados para extrair colunas
     */
    initialize(elements, data) {
        this.elements = elements;
        this.data = data;
        
        if (data.length > 0) {
            this.extractColumnsFromData();
        }
        
        this.setupColumnToggle();
        this.setupEventListeners();
    }

    /**
     * Extrai informações de colunas dos dados
     */
    extractColumnsFromData() {
        if (this.data.length === 0) return;
        
        const headers = Object.keys(this.data[0]);
        
        if (this.columnOrder.length === 0) {
            this.columnOrder = [...headers];
            this.visibleColumns = new Set(headers);
        }
    }

    /**
     * Configura interface de alternância de colunas
     */
    setupColumnToggle() {
        if (!this.elements.columnToggle || this.data.length === 0) return;
        
        // Preservar título e dica existentes
        const title = this.elements.columnToggle.querySelector('h4');
        const tip = this.elements.columnToggle.querySelector('p');
        
        this.elements.columnToggle.innerHTML = '';
        
        if (title) this.elements.columnToggle.appendChild(title);
        if (tip) this.elements.columnToggle.appendChild(tip);
        
        // Criar controles para cada coluna
        this.columnOrder.forEach((header, index) => {
            const label = this.createColumnControl(header, index);
            this.elements.columnToggle.appendChild(label);
        });
        
        // Configurar drag and drop para reordenação
        this.setupColumnDragDrop();
    }

    /**
     * Cria controle para uma coluna específica
     * @param {string} header - Nome da coluna
     * @param {number} index - Índice da coluna
     * @returns {HTMLElement} Elemento label do controle
     */
    createColumnControl(header, index) {
        const label = document.createElement('label');
        label.className = 'column-control';
        label.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px;
            margin: 2px 0;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
        `;
        
        // Checkbox de visibilidade
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = this.visibleColumns.has(header);
        checkbox.addEventListener('change', async (e) => {
            await this.toggleColumnVisibility(header, e.target.checked);
        });
        
        // Nome da coluna
        const span = document.createElement('span');
        span.textContent = header;
        span.style.flex = '1';
        span.style.marginLeft = '8px';
        
        // Indicador de arrastar
        const dragIndicator = document.createElement('span');
        dragIndicator.className = 'drag-indicator';
        dragIndicator.textContent = '⋮⋮';
        dragIndicator.title = 'Arraste para reordenar';
        dragIndicator.style.cssText = `
            cursor: grab;
            padding: 4px;
            color: #666;
            user-select: none;
        `;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        label.appendChild(dragIndicator);
        
        // Dados para drag and drop
        label.dataset.columnIndex = index;
        label.dataset.columnName = header;
        
        return label;
    }

    /**
     * Configura drag and drop para reordenação de colunas
     */
    setupColumnDragDrop() {
        if (!this.elements.columnToggle) return;
        
        let dragSrcEl = null;
        
        const labels = this.elements.columnToggle.querySelectorAll('label.column-control');
        
        labels.forEach(label => {
            label.setAttribute('draggable', 'true');
            
            label.addEventListener('dragstart', (e) => {
                dragSrcEl = label;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', label.outerHTML);
                label.style.opacity = '0.5';
            });
            
            label.addEventListener('dragend', () => {
                label.style.opacity = '';
                dragSrcEl = null;
            });
            
            label.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });
            
            label.addEventListener('drop', async (e) => {
                e.preventDefault();
                
                if (dragSrcEl && dragSrcEl !== label) {
                    const srcIndex = parseInt(dragSrcEl.dataset.columnIndex);
                    const targetIndex = parseInt(label.dataset.columnIndex);
                    
                    await this.reorderColumn(srcIndex, targetIndex);
                }
            });
        });
    }

    /**
     * Alterna visibilidade de uma coluna
     * @param {string} header - Nome da coluna
     * @param {boolean} visible - Se deve estar visível
     */
    async toggleColumnVisibility(header, visible) {
        if (visible) {
            this.visibleColumns.add(header);
        } else {
            this.visibleColumns.delete(header);
        }
        
        this.updateColumnVisibility();
        
        if (this.onVisibilityChange) {
            await this.onVisibilityChange(header, visible, this.visibleColumns);
        }
        
        if (this.onConfigChange) {
            await this.onConfigChange('visibility', {
                column: header,
                visible: visible,
                visibleColumns: new Set(this.visibleColumns)
            });
        }
    }

    /**
     * Reordena colunas
     * @param {number} fromIndex - Índice de origem
     * @param {number} toIndex - Índice de destino
     */
    async reorderColumn(fromIndex, toIndex) {
        const header = this.columnOrder[fromIndex];
        
        // Remover da posição original
        this.columnOrder.splice(fromIndex, 1);
        
        // Inserir na nova posição
        this.columnOrder.splice(toIndex, 0, header);
        
        // Recriar interface
        this.setupColumnToggle();
        
        if (this.onOrderChange) {
            await this.onOrderChange(this.columnOrder);
        }
        
        if (this.onConfigChange) {
            await this.onConfigChange('order', {
                columnOrder: [...this.columnOrder]
            });
        }
    }

    /**
     * Atualiza visibilidade das colunas na tabela
     */
    updateColumnVisibility() {
        const table = document.getElementById('dataTable');
        if (!table) return;
        
        this.columnOrder.forEach((header, index) => {
            const isVisible = this.visibleColumns.has(header);
            const className = isVisible ? '' : 'hidden-column';
            
            // Atualizar cabeçalho
            const headerCells = table.querySelectorAll(`thead th[data-column="${header}"]`);
            headerCells.forEach(cell => { 
                cell.className = className;
                cell.style.display = isVisible ? '' : 'none';
            });
            
            // Atualizar células do corpo
            const cells = table.querySelectorAll(`td:nth-child(${index + 1})`);
            cells.forEach(cell => {
                cell.className = className;
                cell.style.display = isVisible ? '' : 'none';
            });
        });
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Botão de reset de colunas
        if (this.elements.resetColumnsBtn) {
            this.elements.resetColumnsBtn.addEventListener('click', () => {
                this.resetColumns();
            });
        }
        
        // Outros event listeners podem ser adicionados aqui
    }

    /**
     * Reseta colunas para estado padrão
     */
    async resetColumns() {
        if (this.data.length === 0) return;
        
        // Resetar para todas as colunas visíveis na ordem original
        const originalHeaders = Object.keys(this.data[0]);
        this.columnOrder = [...originalHeaders];
        this.visibleColumns = new Set(originalHeaders);
        this.columnWidths = {};
        
        // Recriar interface
        this.setupColumnToggle();
        this.updateColumnVisibility();
        
        if (this.onConfigChange) {
            await this.onConfigChange('reset', {
                columnOrder: [...this.columnOrder],
                visibleColumns: new Set(this.visibleColumns),
                columnWidths: {}
            });
        }
    }

    /**
     * Define ordem das colunas
     * @param {Array} order - Nova ordem das colunas
     */
    setColumnOrder(order) {
        this.columnOrder = [...order];
        this.setupColumnToggle();
    }

    /**
     * Define colunas visíveis
     * @param {Set|Array} visible - Colunas visíveis
     */
    setVisibleColumns(visible) {
        this.visibleColumns = visible instanceof Set ? visible : new Set(visible);
        this.setupColumnToggle();
        this.updateColumnVisibility();
    }

    /**
     * Define larguras das colunas
     * @param {Object} widths - Larguras das colunas
     */
    setColumnWidths(widths) {
        this.columnWidths = { ...widths };
        
        if (this.onWidthChange) {
            this.onWidthChange(this.columnWidths);
        }
    }

    /**
     * Define dados
     * @param {Array} data - Novos dados
     */
    setData(data) {
        this.data = data;
        this.extractColumnsFromData();
        this.setupColumnToggle();
    }

    /**
     * Obtém configuração atual das colunas
     * @returns {Object} Configuração das colunas
     */
    getConfig() {
        return {
            columnOrder: [...this.columnOrder],
            visibleColumns: new Set(this.visibleColumns),
            columnWidths: { ...this.columnWidths }
        };
    }

    /**
     * Aplica configuração às colunas
     * @param {Object} config - Configuração para aplicar
     */
    setConfig(config) {
        if (config.columnOrder) {
            this.columnOrder = [...config.columnOrder];
        }
        
        if (config.visibleColumns) {
            this.visibleColumns = config.visibleColumns instanceof Set 
                ? config.visibleColumns 
                : new Set(config.visibleColumns);
        }
        
        if (config.columnWidths) {
            this.columnWidths = { ...config.columnWidths };
        }
        
        this.setupColumnToggle();
        this.updateColumnVisibility();
    }

    /**
     * Obtém estatísticas das colunas
     * @returns {Object} Estatísticas
     */
    getStats() {
        return {
            totalColumns: this.columnOrder.length,
            visibleColumns: this.visibleColumns.size,
            hiddenColumns: this.columnOrder.length - this.visibleColumns.size,
            customWidths: Object.keys(this.columnWidths).length
        };
    }

    /**
     * Cria preset a partir da configuração atual
     * @param {string} name - Nome do preset
     * @returns {Object} Preset criado
     */
    createPreset(name) {
        return {
            name: name,
            order: [...this.columnOrder],
            visible: Array.from(this.visibleColumns),
            widths: { ...this.columnWidths }
        };
    }

    /**
     * Aplica preset
     * @param {Object} preset - Preset para aplicar
     */
    async applyPreset(preset) {
        if (preset.order) {
            this.columnOrder = [...preset.order];
        }
        
        if (preset.visible) {
            this.visibleColumns = new Set(preset.visible);
        }
        
        if (preset.widths) {
            this.columnWidths = { ...preset.widths };
        }
        
        this.setupColumnToggle();
        this.updateColumnVisibility();
        
        if (this.onConfigChange) {
            await this.onConfigChange('preset', preset);
        }
    }

    /**
     * Destrói a instância
     */
    destroy() {
        this.data = [];
        this.columnOrder = [];
        this.visibleColumns.clear();
        this.columnWidths = {};
        this.elements = {};
        
        this.onVisibilityChange = null;
        this.onOrderChange = null;
        this.onWidthChange = null;
        this.onConfigChange = null;
    }
}

// Para compatibilidade com código existente
if (typeof window !== 'undefined') {
    window.ColumnManager = ColumnManager;
}
