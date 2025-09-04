/**
 * @fileoverview Módulo para gerenciamento de tabelas
 * @description Gerencia rendering, ordenação, redimensionamento e drag & drop de tabelas
 * @version 1.0.0
 */

/**
 * Classe para gerenciamento completo de tabelas
 * @class TableManager
 */
export class TableManager {
    constructor(tableWrapper, tableHead, tableBody) {
        this.tableWrapper = tableWrapper;
        this.tableHead = tableHead;
        this.tableBody = tableBody;
        
        this.data = [];
        this.filteredData = [];
        this.columnOrder = [];
        this.columnWidths = {};
        this.visibleColumns = new Set();
        this.currentSort = { column: null, direction: 'asc' };
        this.dragSrcIndex = null;
        
        // Callbacks externos
        this.onDataUpdate = null;
        this.onColumnResize = null;
        this.onColumnReorder = null;
        this.onSort = null;
    }

    /**
     * Define os dados da tabela
     * @param {Array} data - Array de objetos representando os dados
     */
    setData(data) {
        this.data = data;
        this.filteredData = [...data];
        
        if (data.length > 0 && this.columnOrder.length === 0) {
            this.columnOrder = Object.keys(data[0]);
            this.visibleColumns = new Set(this.columnOrder);
        }
        
        if (this.onDataUpdate) {
            this.onDataUpdate(data);
        }
    }

    /**
     * Define dados filtrados
     * @param {Array} filteredData - Dados após aplicação de filtros
     */
    setFilteredData(filteredData) {
        this.filteredData = filteredData;
        this.renderTableBody();
    }

    /**
     * Define ordem das colunas
     * @param {Array} order - Array com ordem dos cabeçalhos
     */
    setColumnOrder(order) {
        this.columnOrder = order;
        this.setupTableHeader();
    }

    /**
     * Define colunas visíveis
     * @param {Set|Array} visible - Colunas visíveis
     */
    setVisibleColumns(visible) {
        this.visibleColumns = visible instanceof Set ? visible : new Set(visible);
        this.updateColumnVisibility();
    }

    /**
     * Define larguras das colunas
     * @param {Object} widths - Objeto com larguras por cabeçalho
     */
    setColumnWidths(widths) {
        this.columnWidths = widths;
        this.applyColumnWidths();
    }

    /**
     * Configura o cabeçalho da tabela
     */
    setupTableHeader() {
        if (this.data.length === 0) return;
        
        const headers = this.columnOrder;
        this.tableHead.innerHTML = '';
        
        const headerRow = document.createElement('tr');
        headers.forEach((header, index) => {
            const th = document.createElement('th');
            th.textContent = header;
            th.dataset.column = header;
            th.style.position = 'relative';
            
            // Event listener para ordenação
            th.addEventListener('click', (e) => {
                if (!e.target.classList.contains('resizer')) {
                    this.handleSort(header);
                }
            });
            
            // Aplicar largura salva
            if (this.columnWidths[header]) {
                th.style.width = this.columnWidths[header] + 'px';
            }

            // Adicionar resizer
            this.addColumnResizer(th, header);
            
            // Configurar drag and drop
            this.setupColumnDragDrop(th, index);
            
            headerRow.appendChild(th);
        });
        
        this.tableHead.appendChild(headerRow);
        this.updateColumnVisibility();
    }

    /**
     * Adiciona resizer para redimensionamento de coluna
     * @param {HTMLElement} th - Elemento th do cabeçalho
     * @param {string} header - Nome do cabeçalho
     */
    addColumnResizer(th, header) {
        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        resizer.style.cssText = `
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 5px;
            cursor: col-resize;
            user-select: none;
            z-index: 10;
        `;
        th.appendChild(resizer);

        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const startX = e.pageX;
            const startWidth = th.offsetWidth;
            const colIndex = Array.from(th.parentNode.children).indexOf(th) + 1;
            
            const onMouseMove = (ev) => {
                const newWidth = Math.max(50, startWidth + (ev.pageX - startX));
                th.style.width = newWidth + 'px';
                
                // Aplicar largura a todas as células da coluna
                document.querySelectorAll(`#dataTable td:nth-child(${colIndex})`)
                    .forEach(td => td.style.width = newWidth + 'px');
            };
            
            const onMouseUp = () => {
                const finalWidth = th.offsetWidth;
                this.columnWidths[header] = finalWidth;
                
                if (this.onColumnResize) {
                    this.onColumnResize(header, finalWidth, this.columnWidths);
                }
                
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    /**
     * Configura drag and drop para cabeçalhos
     * @param {HTMLElement} th - Elemento th do cabeçalho
     * @param {number} index - Índice da coluna
     */
    setupColumnDragDrop(th, index) {
        th.setAttribute('draggable', 'true');
        
        th.addEventListener('dragstart', (e) => {
            this.dragSrcIndex = index;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', th.outerHTML);
            th.style.opacity = '0.5';
        });
        
        th.addEventListener('dragend', () => {
            th.style.opacity = '';
            this.dragSrcIndex = null;
        });
        
        th.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        
        th.addEventListener('drop', async (e) => {
            e.preventDefault();
            
            if (this.dragSrcIndex === null) return;
            
            const dragTargetIndex = index;
            if (this.dragSrcIndex !== dragTargetIndex) {
                // Reorganizar array de colunas
                const draggedHeader = this.columnOrder[this.dragSrcIndex];
                this.columnOrder.splice(this.dragSrcIndex, 1);
                this.columnOrder.splice(dragTargetIndex, 0, draggedHeader);
                
                // Recriar cabeçalho
                this.setupTableHeader();
                this.renderTableBody();
                
                if (this.onColumnReorder) {
                    await this.onColumnReorder(this.columnOrder);
                }
            }
        });
    }

    /**
     * Renderiza o corpo da tabela
     */
    renderTableBody() {
        if (!this.tableBody) return;
        
        this.tableBody.innerHTML = '';
        
        if (this.filteredData.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = this.columnOrder.length;
            cell.textContent = 'Nenhum resultado encontrado';
            cell.style.textAlign = 'center';
            cell.style.padding = '20px';
            cell.style.color = '#666';
            row.appendChild(cell);
            this.tableBody.appendChild(row);
            return;
        }
        
        this.filteredData.forEach(row => {
            const tr = document.createElement('tr');
            
            this.columnOrder.forEach(header => {
                const td = document.createElement('td');
                const value = row[header];
                td.textContent = value || '';
                td.title = value || '';
                
                // Aplicar largura se definida
                if (this.columnWidths[header]) {
                    td.style.width = this.columnWidths[header] + 'px';
                }
                
                tr.appendChild(td);
            });
            
            this.tableBody.appendChild(tr);
        });
        
        this.updateColumnVisibility();
    }

    /**
     * Atualiza visibilidade das colunas
     */
    updateColumnVisibility() {
        if (!this.tableHead || !this.tableBody) return;
        
        this.columnOrder.forEach((header, index) => {
            const isVisible = this.visibleColumns.has(header);
            const colIndex = index + 1;
            
            // Cabeçalho
            const headerCell = this.tableHead.querySelector(`th:nth-child(${colIndex})`);
            if (headerCell) {
                headerCell.style.display = isVisible ? '' : 'none';
            }
            
            // Células do corpo
            this.tableBody.querySelectorAll(`td:nth-child(${colIndex})`)
                .forEach(cell => {
                    cell.style.display = isVisible ? '' : 'none';
                });
        });
    }

    /**
     * Aplica larguras das colunas
     */
    applyColumnWidths() {
        Object.entries(this.columnWidths).forEach(([header, width]) => {
            const headerIndex = this.columnOrder.indexOf(header) + 1;
            if (headerIndex > 0) {
                // Aplicar ao cabeçalho
                const headerCell = this.tableHead.querySelector(`th:nth-child(${headerIndex})`);
                if (headerCell) {
                    headerCell.style.width = width + 'px';
                }
                
                // Aplicar às células do corpo
                this.tableBody.querySelectorAll(`td:nth-child(${headerIndex})`)
                    .forEach(cell => {
                        cell.style.width = width + 'px';
                    });
            }
        });
    }

    /**
     * Gerencia ordenação da tabela
     * @param {string} column - Coluna para ordenar
     */
    handleSort(column) {
        if (this.currentSort.column === column) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.column = column;
            this.currentSort.direction = 'asc';
        }
        
        this.sortData(column, this.currentSort.direction);
        this.updateSortIndicators(column, this.currentSort.direction);
        
        if (this.onSort) {
            this.onSort(column, this.currentSort.direction);
        }
    }

    /**
     * Ordena os dados
     * @param {string} column - Coluna para ordenar
     * @param {string} direction - Direção ('asc' ou 'desc')
     */
    sortData(column, direction) {
        this.filteredData.sort((a, b) => {
            const aVal = (a[column] || '').toString().toLowerCase();
            const bVal = (b[column] || '').toString().toLowerCase();
            
            // Tentar conversão numérica
            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return direction === 'asc' ? aNum - bNum : bNum - aNum;
            }
            
            // Ordenação alfabética
            if (direction === 'asc') {
                return aVal.localeCompare(bVal);
            } else {
                return bVal.localeCompare(aVal);
            }
        });
        
        this.renderTableBody();
    }

    /**
     * Atualiza indicadores visuais de ordenação
     * @param {string} column - Coluna ordenada
     * @param {string} direction - Direção da ordenação
     */
    updateSortIndicators(column, direction) {
        // Remover indicadores existentes
        this.tableHead.querySelectorAll('th').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });
        
        // Adicionar indicador na coluna atual
        const headerCell = this.tableHead.querySelector(`th[data-column="${column}"]`);
        if (headerCell) {
            headerCell.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    }

    /**
     * Limpa ordenação
     */
    clearSort() {
        this.currentSort = { column: null, direction: 'asc' };
        this.filteredData = [...this.data];
        this.renderTableBody();
        
        // Remover indicadores visuais
        this.tableHead.querySelectorAll('th').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });
    }

    /**
     * Obtém estado atual da tabela
     * @returns {Object} Estado da tabela
     */
    getState() {
        return {
            columnOrder: [...this.columnOrder],
            columnWidths: { ...this.columnWidths },
            visibleColumns: new Set(this.visibleColumns),
            currentSort: { ...this.currentSort },
            dataCount: this.data.length,
            filteredCount: this.filteredData.length
        };
    }

    /**
     * Aplica estado à tabela
     * @param {Object} state - Estado para aplicar
     */
    setState(state) {
        if (state.columnOrder) this.columnOrder = state.columnOrder;
        if (state.columnWidths) this.columnWidths = state.columnWidths;
        if (state.visibleColumns) this.visibleColumns = state.visibleColumns;
        if (state.currentSort) this.currentSort = state.currentSort;
        
        this.setupTableHeader();
        this.renderTableBody();
    }

    /**
     * Redimensiona a tabela para caber no container
     */
    resize() {
        if (this.tableWrapper) {
            // Força recálculo do layout
            this.tableWrapper.style.height = 'auto';
            setTimeout(() => {
                this.applyColumnWidths();
            }, 0);
        }
    }

    /**
     * Destrói a instância e remove event listeners
     */
    destroy() {
        if (this.tableHead) this.tableHead.innerHTML = '';
        if (this.tableBody) this.tableBody.innerHTML = '';
        
        this.data = [];
        this.filteredData = [];
        this.columnOrder = [];
        this.columnWidths = {};
        this.visibleColumns.clear();
    }
}

// Para compatibilidade com código existente
if (typeof window !== 'undefined') {
    window.TableManager = TableManager;
}
