// viewer.js
// Variáveis globais
const PRESETS = {
    PADRAO: {
        order: ['Cód. Disc.', 'Nome Disciplina', 'Carga Horária', 'Sigla Campus', 'Cód. Campus', 'Nome Campus', 'Período', 'Descrição', 'Cód. Horário', 'Hora', 'ID Oferta', 'Sala', 'Vagas', 'Matriculados', 'Pré-matriculados', 'Total', 'Vagas Restantes', 'Curso', 'Cód. Prof.', 'Nome Professor'],
        visible: ['Cód. Disc.', 'Nome Disciplina', 'Carga Horária', 'Sigla Campus', 'Cód. Campus', 'Nome Campus', 'Período', 'Descrição', 'Cód. Horário', 'Hora', 'ID Oferta', 'Sala', 'Vagas', 'Matriculados', 'Pré-matriculados', 'Total', 'Vagas Restantes', 'Curso', 'Cód. Prof.', 'Nome Professor']
    }
};

// Sistema de storage universal (funciona em extensão e browser)
const Storage = {
    async get(keys) {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return await chrome.storage.local.get(keys);
        } else {
            // Fallback para localStorage quando não há chrome.storage
            const result = {};
            keys.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) {
                    try {
                        result[key] = JSON.parse(value);
                    } catch {
                        result[key] = value;
                    }
                }
            });
            return result;
        }
    },
    
    async set(data) {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return await chrome.storage.local.set(data);
        } else {
            // Fallback para localStorage
            Object.entries(data).forEach(([key, value]) => {
                localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            });
        }
    }
};

let allData = [];
let filteredData = [];
let currentSort = { column: null, direction: 'asc' };
let visibleColumns = new Set();
let columnWidths = {}; // Armazenará larguras por cabeçalho
let columnOrder = [];  // Ordem atual das colunas
let dragSrcIndex = null; // Aux para DnD

// Elementos do DOM
const elements = {
    totalRecords: document.getElementById('totalRecords'),
    filteredRecords: document.getElementById('filteredRecords'),
    searchInput: document.getElementById('searchInput'),
    clearBtn: document.getElementById('clearBtn'),
    resetColumnsBtn: document.getElementById('resetColumnsBtn'),
    exportBtn: document.getElementById('exportBtn'),
    sidebarLastUpdate: document.getElementById('sidebarLastUpdate'),
    campusFilter: document.getElementById('campusFilter'),
    periodoFilter: document.getElementById('periodoFilter'),
    disciplinaFilter: document.getElementById('disciplinaFilter'),
    professorFilter: document.getElementById('professorFilter'),
    cursoFilter: document.getElementById('cursoFilterTop'),
    horarioFilter: document.getElementById('horarioFilter'),
    columnToggle: document.getElementById('columnToggle'),
    loadingMessage: document.getElementById('loadingMessage'),
    tableWrapper: document.getElementById('tableWrapper'),
    noDataMessage: document.getElementById('noDataMessage'),
    tableHead: document.getElementById('tableHead'),
    tableBody: document.getElementById('tableBody')
};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando SIAA Data Viewer...');
    
    // Configurar sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    function toggleSidebar() {
        document.body.classList.toggle('sidebar-open');
        const isOpen = document.body.classList.contains('sidebar-open');
        console.log('🔄 Sidebar toggled:', isOpen ? 'ABERTA' : 'FECHADA');
    }
    
    function closeSidebar() {
        document.body.classList.remove('sidebar-open');
        console.log('🔄 Sidebar fechada');
    }
    
    function openSidebar() {
        document.body.classList.add('sidebar-open');
        console.log('🔄 Sidebar aberta');
    }
    
    // Event listeners para sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    // Fechar sidebar com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
            closeSidebar();
        }
    });
    
    try {
        // Configurar header responsivo
        setupHeaderEvents();
        
        // Carregar configurações armazenadas (larguras, ordem, visibilidade)
        const stored = await Storage.get(['viewer_column_widths', 'viewer_column_order', 'viewer_column_visibility']);
        columnWidths = stored.viewer_column_widths || {};
        if (Array.isArray(stored.viewer_column_order)) {
            columnOrder = stored.viewer_column_order;
        }
        if (Array.isArray(stored.viewer_column_visibility)) {
            visibleColumns = new Set(stored.viewer_column_visibility);
        }

        await loadData();
        setupEventListeners();
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showNoData();
        setupEventListeners();
        setupHeaderEvents(); // Garantir que header seja configurado mesmo com erro
    }
    
    // Função global para debug da sidebar
    window.debugSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        console.log('=== DEBUG SIDEBAR ===');
        console.log('Elemento:', sidebar);
        console.log('Classes do body:', document.body.classList.toString());
        console.log('Estilo computado left:', window.getComputedStyle(sidebar).left);
        console.log('Estilo computado z-index:', window.getComputedStyle(sidebar).zIndex);
        console.log('Estilo computado position:', window.getComputedStyle(sidebar).position);
        console.log('Estilo computado visibility:', window.getComputedStyle(sidebar).visibility);
        console.log('Estilo inline:', sidebar.style.cssText);
        
        // Forçar visibilidade
        sidebar.classList.add('sidebar-debug');
        console.log('✅ Classe sidebar-debug adicionada para forçar visibilidade');
    };
    
    console.log('💡 Use window.debugSidebar() no console para debug da sidebar');
});

// Carregar dados do storage
async function loadData() {
    try {
        const data = await Storage.get(['siaa_data_csv', 'siaa_data_timestamp']);
        
        if (!data.siaa_data_csv) {
            console.log('⚠️ Nenhum dado encontrado no storage');
            showNoData();
            return;
        }

        console.log('📊 Dados encontrados, processando...');
        allData = parseCSV(data.siaa_data_csv);
        
        if (allData.length === 0) {
            console.log('⚠️ Dados do CSV estão vazios');
            showNoData();
            return;
        }

        // Atualizar informações
        elements.totalRecords.textContent = allData.length;
        if (data.siaa_data_timestamp) {
            const dateStr = new Date(data.siaa_data_timestamp).toLocaleString('pt-BR');
            elements.sidebarLastUpdate.textContent = dateStr;
        } else {
            elements.sidebarLastUpdate.textContent = 'Não disponível';
        }

        finishDataLoading();
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        showNoData();
    }
}

// Finalizar carregamento dos dados
function finishDataLoading() {
    // Headers e configurações iniciais
    const headers = Object.keys(allData[0]);

    // Definir ordem
    if (columnOrder.length === 0) {
        columnOrder = PRESETS.PADRAO.order.filter(h => headers.includes(h));
        headers.forEach(h => { if (!columnOrder.includes(h)) columnOrder.push(h);});
    }

    // Definir visibilidade
    if (visibleColumns.size === 0) {
        PRESETS.PADRAO.visible.forEach(h => visibleColumns.add(h));
    }

    setupTable();
    setupFilters();
    setupColumnToggle();
    applyFilters();
    
    // CORREÇÃO: Aplicar visibilidade das colunas após renderizar a tabela
    setTimeout(() => {
        updateColumnVisibility();
    }, 100);
    
    // Esconder loading e mostrar tabela
    elements.loadingMessage.style.display = 'none';
    elements.tableWrapper.style.display = 'block';
    
    console.log('✅ Dados carregados com sucesso!');
}

// Mostrar mensagem de nenhum dado
function showNoData() {
    elements.loadingMessage.style.display = 'none';
    elements.noDataMessage.style.display = 'block';
    elements.tableWrapper.style.display = 'none';
    
    // Limpar elementos de estatísticas
    elements.totalRecords.textContent = '0';
    elements.filteredRecords.textContent = '0';
    elements.sidebarLastUpdate.textContent = 'Sem dados';
}

// Parsear CSV
function parseCSV(csvContent) {
    const lines = csvContent.split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = parseCSVLine(line);
        
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            

            
            data.push(row);
        }
    }
    
    return data;
}



// Parsear linha CSV considerando aspas
function parseCSVLine(line) {
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Aspas duplas escapadas
                currentValue += '"';
                i++; // Pular próximo caractere
            } else {
                // Alternar estado das aspas
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    values.push(currentValue.trim());
    
    return values;
}

// Configurar cabeçalho da tabela
function setupTable() {
    if (allData.length === 0) return;
    
    if (columnOrder.length === 0) columnOrder = Object.keys(allData[0]);
    const headers = columnOrder;
    elements.tableHead.innerHTML = '';
    
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.dataset.column = header;
        th.addEventListener('click', () => sortTable(header));
        
        // Aplicar largura salva
        if (columnWidths[header]) {
            th.style.width = columnWidths[header] + 'px';
        }

        // Adicionar resizer
        th.style.position = 'relative';
        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        resizer.style.cssText = 'position:absolute;right:0;top:0;bottom:0;width:5px;cursor:col-resize;user-select:none;';
        th.appendChild(resizer);

        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const startX = e.pageX;
            const startWidth = th.offsetWidth;
            const colIndex = Array.from(th.parentNode.children).indexOf(th) + 1;
            function onMouseMove(ev) {
                const newWidth = Math.max(50, startWidth + (ev.pageX - startX));
                th.style.width = newWidth + 'px';
                document.querySelectorAll(`#dataTable td:nth-child(${colIndex})`).forEach(td => td.style.width = newWidth + 'px');
            }
            function onMouseUp() {
                const finalWidth = th.offsetWidth;
                columnWidths[header] = finalWidth;
                Storage.set({ viewer_column_widths: columnWidths });
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // Drag-and-drop para cabeçalhos da tabela
        th.setAttribute('draggable', 'true');
        th.addEventListener('dragstart', (e) => {
            dragSrcIndex = headers.indexOf(header);
            th.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'move';
        });
        th.addEventListener('dragend', () => {
            th.style.opacity = '1';
        });
        th.addEventListener('dragover', (e) => { 
            e.preventDefault(); 
            e.dataTransfer.dropEffect = 'move';
        });
        th.addEventListener('drop', (e) => {
            e.preventDefault();
            const dropIndex = headers.indexOf(header);
            if (dragSrcIndex === null || dragSrcIndex === dropIndex) return;
            
            // Reorganizar columnOrder
            const moved = columnOrder.splice(dragSrcIndex, 1)[0];
            columnOrder.splice(dropIndex, 0, moved);
            
            // Salvar nova ordem
            Storage.set({ viewer_column_order: columnOrder });
            
            // Atualizar interface
            setupTable();
            setupColumnToggle(); // Recriar a sidebar na nova ordem
            updateColumnVisibility();
            renderTable();
        });

        headerRow.appendChild(th);
    });
    
    elements.tableHead.appendChild(headerRow);
}

// Configurar filtros
function setupFilters() {
    if (allData.length === 0) return;
    
    // Campus
    const campusValues = [...new Set(allData.map(row => row['Sigla Campus']).filter(Boolean))].sort();
    populateSelect(elements.campusFilter, campusValues);
    
    // Período
    const periodoValues = [...new Set(allData.map(row => row['Período']).filter(Boolean))].sort();
    populateSelect(elements.periodoFilter, periodoValues);
    
    // Disciplina
    const disciplinaValues = [...new Set(allData.map(row => row['Nome Disciplina']).filter(Boolean))].sort();
    populateSelect(elements.disciplinaFilter, disciplinaValues);
    
    // Professor
    const professorValues = [...new Set(allData.map(row => row['Nome Professor']).filter(Boolean))].sort();
    populateSelect(elements.professorFilter, professorValues);

    // Curso
    const cursoSet = new Set();
    const cursoRegex = /\(\d+\s-\s[^)]+\)/g;
    allData.forEach(row => {
        const field = row['Curso'] || '';
        const matches = field.match(cursoRegex);
        if (matches) {
            matches.forEach(c => cursoSet.add(c.trim()));
        }
    });
    const cursoValues = [...cursoSet].sort();
    populateSelect(elements.cursoFilter, cursoValues);

    // Horário
    const horarioSet = new Set();
    allData.forEach(row => {
        const horario = row['Hora'] || '';
        if (horario) {
            // Extrair dias da semana únicos do horário
            const dias = horario.split(' | ').map(periodo => {
                const dia = periodo.split(' ')[0]; // Primeira palavra é o dia
                return dia;
            }).filter(dia => dia);
            dias.forEach(dia => horarioSet.add(dia));
        }
    });
    const horarioValues = [...horarioSet].sort();
    populateSelect(elements.horarioFilter, horarioValues);
}

// Preencher select com opções
function populateSelect(selectElement, values) {
    // Manter primeira opção (Todos)
    const firstOption = selectElement.children[0];
    selectElement.innerHTML = '';
    selectElement.appendChild(firstOption);
    
    values.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        selectElement.appendChild(option);
    });
}

// Configurar toggle de colunas
function setupColumnToggle() {
    if (allData.length === 0) return;
    
    // Preservar o título e a dica
    const title = elements.columnToggle.querySelector('h4');
    const tip = elements.columnToggle.querySelector('p');
    elements.columnToggle.innerHTML = '';
    if (title) {
        elements.columnToggle.appendChild(title);
    }
    if (tip) {
        elements.columnToggle.appendChild(tip);
    }
    
    // Usar columnOrder para manter a ordem correta das colunas na sidebar
    const headers = columnOrder.length > 0 ? columnOrder : Object.keys(allData[0]);
    
    headers.forEach(header => {
        const label = document.createElement('label');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = visibleColumns.has(header);
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                visibleColumns.add(header);
            } else {
                visibleColumns.delete(header);
            }
            Storage.set({ viewer_column_visibility: [...visibleColumns] });
            updateColumnVisibility();
        });
        
        const span = document.createElement('span');
        span.textContent = header;
        span.style.flex = '1';
        
        const dragIndicator = document.createElement('span');
        dragIndicator.className = 'drag-indicator';
        dragIndicator.textContent = '⋮⋮';
        dragIndicator.title = 'Arraste para reordenar';
        
        label.appendChild(checkbox);
        label.appendChild(span);
        label.appendChild(dragIndicator);
        elements.columnToggle.appendChild(label);

        // Tornar label arrastável para ordenar na sidebar
        label.setAttribute('draggable','true');
        label.addEventListener('dragstart', (e)=>{
            const labels = Array.from(elements.columnToggle.children).filter(child => child.tagName === 'LABEL');
            dragSrcIndex = labels.indexOf(label);
            label.classList.add('dragging');
            e.dataTransfer.effectAllowed='move';
        });
        label.addEventListener('dragend', ()=>{
            label.classList.remove('dragging');
            // Remover todos os indicadores visuais
            document.querySelectorAll('.column-toggle label').forEach(l => {
                l.classList.remove('drag-over');
            });
        });
        label.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (!label.classList.contains('dragging')) {
                label.classList.add('drag-over');
            }
        });
        label.addEventListener('dragleave', (e) => {
            // Só remove se realmente saiu do elemento
            if (!label.contains(e.relatedTarget)) {
                label.classList.remove('drag-over');
            }
        });
        label.addEventListener('dragover', e=>{
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        label.addEventListener('drop', e=>{
            e.preventDefault();
            label.classList.remove('drag-over');
            
            const labels = Array.from(elements.columnToggle.children).filter(child => child.tagName === 'LABEL');
            const dropIndex = labels.indexOf(label);
            if(dragSrcIndex === null || dragSrcIndex === dropIndex) return;
            
            // Reorganizar columnOrder
            const moved = columnOrder.splice(dragSrcIndex, 1)[0];
            columnOrder.splice(dropIndex, 0, moved);
            
            // Salvar nova ordem
            Storage.set({ viewer_column_order: columnOrder });
            
            // Atualizar interface
            setupTable();
            setupColumnToggle(); // Recriar a sidebar na nova ordem
            updateColumnVisibility();
            renderTable();
        });
    });
}

// Atualizar visibilidade das colunas
function updateColumnVisibility() {
    const table = document.getElementById('dataTable');
    const headers = columnOrder;
    
    headers.forEach((header, index) => {
        const isVisible = visibleColumns.has(header);
        const className = isVisible ? '' : 'hidden-column';
        
        // Atualizar cabeçalho
        const headerCell = table.querySelector(`th[data-column="${header}"]`);
        if (headerCell) {
            headerCell.className = className;
        }
        
        // Atualizar células do corpo
        const cells = table.querySelectorAll(`td:nth-child(${index + 1})`);
        cells.forEach(cell => {
            cell.className = className;
        });
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Busca
    elements.searchInput.addEventListener('input', debounce(applyFilters, 300));
    
    // Botões
    elements.clearBtn.addEventListener('click', clearFilters);
    elements.resetColumnsBtn.addEventListener('click', resetColumns);
    elements.exportBtn.addEventListener('click', exportFilteredData);
    
    // Botão de limpar dados
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearAllData);
    }
    
    // Filtros
    elements.campusFilter.addEventListener('change', applyFilters);
    elements.periodoFilter.addEventListener('change', applyFilters);
    elements.disciplinaFilter.addEventListener('change', applyFilters);
    elements.professorFilter.addEventListener('change', applyFilters);
    elements.cursoFilter.addEventListener('change', applyFilters);
    elements.horarioFilter.addEventListener('change', applyFilters);
}

// Aplicar filtros
function applyFilters() {
    let filtered = [...allData];
    
    // Filtro de busca - apenas nos campos visíveis
    const searchTerm = elements.searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        const visibleColumnsList = Array.from(visibleColumns);
        console.log('🔍 Buscando por:', searchTerm, 'nas colunas visíveis:', visibleColumnsList);
        
        filtered = filtered.filter(row => {
            return visibleColumnsList.some(column => {
                const value = row[column] || '';
                return String(value).toLowerCase().includes(searchTerm);
            });
        });
        
        console.log('📊 Resultados da busca:', filtered.length, 'registros encontrados');
    }
    
    // Filtros específicos
    const campusFilter = elements.campusFilter.value;
    if (campusFilter) {
        filtered = filtered.filter(row => row['Sigla Campus'] === campusFilter);
    }
    
    const periodoFilter = elements.periodoFilter.value;
    if (periodoFilter) {
        filtered = filtered.filter(row => row['Período'] === periodoFilter);
    }
    
    const disciplinaFilter = elements.disciplinaFilter.value;
    if (disciplinaFilter) {
        filtered = filtered.filter(row => row['Nome Disciplina'] === disciplinaFilter);
    }
    
    const professorFilter = elements.professorFilter.value;
    if (professorFilter) {
        filtered = filtered.filter(row => row['Nome Professor'] === professorFilter);
    }

    const cursoFilter = elements.cursoFilter.value;
    if (cursoFilter) {
        filtered = filtered.filter(row => (row['Curso'] || '').includes(cursoFilter));
    }

    const horarioFilter = elements.horarioFilter.value;
    if (horarioFilter) {
        filtered = filtered.filter(row => {
            const horario = row['Hora'] || '';
            return horario.includes(horarioFilter);
        });
    }
    
    filteredData = filtered;
    elements.filteredRecords.textContent = filteredData.length;
    
    renderTable();
}

// Renderizar tabela
function renderTable() {
    if (filteredData.length === 0) {
        elements.tableBody.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 20px; color: #666;">Nenhum registro encontrado com os filtros aplicados</td></tr>';
        return;
    }
    
    const headers = columnOrder;
    elements.tableBody.innerHTML = '';
    
    filteredData.forEach(row => {
        const tr = document.createElement('tr');

        const isInactive = (row['Descrição'] || '').toUpperCase().startsWith('INATIV');
        if (isInactive) tr.classList.add('inactive-row');

        headers.forEach(header => {
            const td = document.createElement('td');

            let cellText = row[header] || '';
            if (isInactive && header === 'Nome Disciplina' && !cellText.includes('(INATIVA)')) {
                cellText += ' (INATIVA)';
            }
            td.textContent = cellText;

            if (columnWidths[header]) {
                td.style.width = columnWidths[header] + 'px';
            }

            // Aplicar classe de visibilidade
            if (!visibleColumns.has(header)) {
                td.className = 'hidden-column';
            }

            tr.appendChild(td);
        });

        elements.tableBody.appendChild(tr);
    });
}

// Ordenar tabela
function sortTable(column) {
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    
    // Atualizar indicadores visuais
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });
    
    const currentHeader = document.querySelector(`th[data-column="${column}"]`);
    if (currentHeader) {
        currentHeader.classList.add(`sorted-${currentSort.direction}`);
    }
    
    // Ordenar dados
    filteredData.sort((a, b) => {
        let valueA = a[column] || '';
        let valueB = b[column] || '';
        
        // Tentar converter para número se possível
        const numA = parseFloat(valueA);
        const numB = parseFloat(valueB);
        
        if (!isNaN(numA) && !isNaN(numB)) {
            valueA = numA;
            valueB = numB;
        } else {
            valueA = String(valueA).toLowerCase();
            valueB = String(valueB).toLowerCase();
        }
        
        if (valueA < valueB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    renderTable();
}

// Limpar filtros
function clearFilters() {
    elements.searchInput.value = '';
    elements.campusFilter.value = '';
    elements.periodoFilter.value = '';
    elements.disciplinaFilter.value = '';
    elements.professorFilter.value = '';
    elements.cursoFilter.value = '';
    elements.horarioFilter.value = '';
    
    // Resetar ordenação
    currentSort = { column: null, direction: 'asc' };
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });
    
    // Feedback visual
    elements.searchInput.focus();
    console.log('🧹 Filtros limpos');
    
    applyFilters();
}

// Redefinir colunas para o padrão
function resetColumns() {
    if (!allData || allData.length === 0) {
        console.log('⚠️ Nenhum dado disponível para redefinir colunas');
        return;
    }
    
    const headers = Object.keys(allData[0]);
    
    // Redefinir ordem para o padrão
    columnOrder = PRESETS.PADRAO.order.filter(h => headers.includes(h));
    headers.forEach(h => { 
        if (!columnOrder.includes(h)) columnOrder.push(h);
    });
    
    // Redefinir visibilidade para o padrão
    visibleColumns.clear();
    PRESETS.PADRAO.visible.forEach(h => {
        if (headers.includes(h)) visibleColumns.add(h);
    });
    
    // Limpar larguras personalizadas
    columnWidths = {};
    
    // Salvar configurações resetadas
    Storage.set({
        viewer_column_order: columnOrder,
        viewer_column_visibility: Array.from(visibleColumns),
        viewer_column_widths: columnWidths
    });
    
    // Atualizar interface
    setupTable();
    setupColumnToggle();
    updateColumnVisibility();
    renderTable();
    
    // Feedback visual
    console.log('🔄 Colunas redefinidas para o padrão');
    
    // Feedback para o usuário
    const btn = elements.resetColumnsBtn;
    const originalText = btn.textContent;
    const originalBg = btn.style.background;
    btn.textContent = '✅ Redefinido!';
    btn.style.background = '#27ae60';
    btn.style.color = 'white';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
    }, 1500);
}

// Exportar dados filtrados
function exportFilteredData() {
    if (filteredData.length === 0) {
        alert('Nenhum dado para exportar');
        return;
    }
    
    // Usar ordem das colunas definida pelo usuário, filtrando apenas as visíveis
    // Fallback para ordem original se columnOrder estiver vazio
    const orderedColumns = columnOrder.length > 0 ? columnOrder : Object.keys(allData[0]);
    const headers = orderedColumns.filter(header => visibleColumns.has(header));
    
    // Criar CSV
    const csvContent = [
        headers.join(','),
        ...filteredData.map(row => 
            headers.map(header => {
                const value = row[header] || '';
                const escaped = String(value).replace(/"/g, '""');
                return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
                    ? `"${escaped}"` 
                    : escaped;
            }).join(',')
        )
    ].join('\n');
    
    // Download
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fileName = `siaa_dados_filtrados_${new Date().toISOString().slice(0, 10)}.csv`;
    
    a.href = url;
    a.download = fileName;
    a.click();
    
    URL.revokeObjectURL(url);
    
    // Feedback
    console.log(`📥 Exportados ${filteredData.length} registros com ${headers.length} colunas`);
    console.log(`📋 Ordem das colunas no CSV:`, headers);
}

// Limpar todos os dados armazenados
async function clearAllData() {
    // Confirmar ação
    const confirmed = confirm(
        '⚠️ ATENÇÃO!\n\n' +
        'Esta ação irá remover TODOS os dados armazenados da extensão SIAA Data Extractor.\n\n' +
        '• Dados de disciplinas e ofertas\n' +
        '• Configurações de colunas\n' +
        '• Filtros salvos\n' +
        '• Histórico de atualizações\n\n' +
        'Esta ação NÃO PODE ser desfeita!\n\n' +
        'Deseja realmente continuar?'
    );
    
    if (!confirmed) {
        console.log('🚫 Limpeza de dados cancelada pelo usuário');
        return;
    }
    
    try {
        console.log('🗑️ Iniciando limpeza de todos os dados...');
        
        // Limpar storage
        await Storage.set({
            'siaa_data_csv': null,
            'siaa_last_update': null,
            'siaa_column_config': null,
            'siaa_filters_config': null
        });
        
        // Limpar variáveis locais
        allData = [];
        filteredData = [];
        visibleColumns = new Set();
        columnOrder = [];
        columnWidths = {};
        
        // Limpar interface
        elements.tableBody.innerHTML = '';
        elements.tableHead.innerHTML = '';
        elements.totalRecords.textContent = '0';
        elements.filteredRecords.textContent = '0';
        
        // Limpar filtros
        elements.searchInput.value = '';
        elements.campusFilter.innerHTML = '<option value="">Todos os Campus</option>';
        elements.periodoFilter.innerHTML = '<option value="">Todos os Períodos</option>';
        elements.disciplinaFilter.innerHTML = '<option value="">Todas as Disciplinas</option>';
        elements.professorFilter.innerHTML = '<option value="">Todos os Professores</option>';
        elements.cursoFilter.innerHTML = '<option value="">Todos os Cursos</option>';
        elements.horarioFilter.innerHTML = '<option value="">Todos os Horários</option>';
        
        // Limpar seção de colunas
        const columnToggle = document.getElementById('columnToggle');
        if (columnToggle) {
            const existingList = columnToggle.querySelector('ul');
            if (existingList) {
                existingList.remove();
            }
        }
        
        // Atualizar data na sidebar
        const sidebarLastUpdate = document.getElementById('sidebarLastUpdate');
        if (sidebarLastUpdate) {
            sidebarLastUpdate.textContent = '-';
        }
        
        // Mostrar mensagem de sucesso
        showNoData();
        
        // Feedback visual
        const clearDataBtn = document.getElementById('clearDataBtn');
        if (clearDataBtn) {
            const originalText = clearDataBtn.innerHTML;
            clearDataBtn.innerHTML = '✅ Dados Limpos!';
            clearDataBtn.style.background = '#4caf50';
            
            setTimeout(() => {
                clearDataBtn.innerHTML = originalText;
                clearDataBtn.style.background = '#d32f2f';
            }, 3000);
        }
        
        console.log('✅ Todos os dados foram removidos com sucesso');
        
        // Notificar usuário
        alert('✅ Dados limpos com sucesso!\n\nTodos os dados da extensão foram removidos.\nPara usar novamente, capture novos dados no SIAA.');
        
    } catch (error) {
        console.error('❌ Erro ao limpar dados:', error);
        alert('❌ Erro ao limpar dados.\nVerifique o console para mais detalhes.');
    }
}

// Debounce para otimizar performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =============================================================================
// FUNÇÕES DE HEADER E LAYOUT RESPONSIVO
// =============================================================================

// Função para detectar se está em mobile
function isMobile() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Função para detectar orientação mobile
function getMobileOrientation() {
    if (!isMobile()) return 'desktop';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

// Função para configurar a altura do header dinamicamente
function setupHeaderHeight() {
    const header = document.querySelector('.header');
    const mainContent = document.querySelector('.main-content');
    const tableWrapper = document.getElementById('tableWrapper');
    
    if (header) {
        // Force um reflow para garantir que o header tenha sua altura correta
        header.style.display = 'none';
        header.offsetHeight; // trigger reflow
        header.style.display = '';
        
        // Aguardar um frame para garantir que o layout foi aplicado
        requestAnimationFrame(() => {
            // Detectar mobile antes do setTimeout para definir o delay
            const mobile = isMobile();
            
            // Aguardar mais um pouco para layout mobile se estabilizar
            setTimeout(() => {
                const headerHeight = header.offsetHeight;
                const orientation = getMobileOrientation();
                
                // Ajustar padding baseado no dispositivo e orientação
                let finalPadding = headerHeight;
                if (mobile) {
                    if (orientation === 'portrait') {
                        // Mobile portrait: header mais alto, precisa de mais espaço
                        finalPadding = Math.max(headerHeight + 30, 220);
                        console.log('📱 MOBILE PORTRAIT - Header height:', headerHeight + 'px', '| Padding aplicado:', finalPadding + 'px');
                    } else {
                        // Mobile landscape: header menor, menos espaço necessário
                        finalPadding = Math.max(headerHeight + 15, 180);
                        console.log('📱 MOBILE LANDSCAPE - Header height:', headerHeight + 'px', '| Padding aplicado:', finalPadding + 'px');
                    }
                } else {
                    // Para desktop, usar altura real + pequena margem
                    finalPadding = headerHeight + 5;
                    console.log('🖥️ DESKTOP - Header height:', headerHeight + 'px', '| Padding aplicado:', finalPadding + 'px');
                }
                
                // Definir variável CSS
                document.documentElement.style.setProperty('--header-height', finalPadding + 'px');
                
                // SEMPRE ajustar o main-content diretamente
                if (mainContent) {
                    mainContent.style.paddingTop = finalPadding + 'px';
                    console.log('✅ Main-content padding-top ajustado para:', finalPadding + 'px');
                } else {
                    // Tentar encontrar novamente se não encontrou
                    const mainContentRetry = document.querySelector('.main-content');
                    if (mainContentRetry) {
                        mainContentRetry.style.paddingTop = finalPadding + 'px';
                        console.log('✅ Main-content encontrado na segunda tentativa e ajustado para:', finalPadding + 'px');
                    } else {
                        console.error('❌ Main-content não encontrado!');
                    }
                }
                
                // Ajustar o tableWrapper também
                if (tableWrapper) {
                    tableWrapper.style.height = `calc(100vh - ${finalPadding}px)`;
                    console.log('✅ TableWrapper height ajustado para: calc(100vh - ' + finalPadding + 'px)');
                }
                
                console.log('🔄 Configuração finalizada - Mobile:', mobile, '| Final padding:', finalPadding + 'px');
            }, mobile ? 300 : 100); // delay maior para mobile
        });
    }
}

// Configurar eventos de header após DOM carregado
function setupHeaderEvents() {
    console.log('DOM carregado, configurando header height...');
    setupHeaderHeight();
    
    // Reconfigurar após pequenos delays para garantir que tudo foi renderizado
    setTimeout(setupHeaderHeight, 50);
    setTimeout(setupHeaderHeight, 200);
    setTimeout(setupHeaderHeight, 500);
    
    // Backup: também executar quando a página estiver completamente carregada
    window.addEventListener('load', function() {
        console.log('Página completamente carregada, reconfiguração final...');
        setupHeaderHeight();
    });

    // Reconfigurar se a janela for redimensionada (com debounce)
    window.addEventListener('resize', debounce(setupHeaderHeight, 150));
    
    // Reconfigurar em mudanças de orientação (mobile)
    window.addEventListener('orientationchange', function() {
        setTimeout(setupHeaderHeight, 200); // delay maior para orientação
    });
    
    // Observer para detectar mudanças no header
    if (typeof ResizeObserver !== 'undefined') {
        const headerObserver = new ResizeObserver(debounce(setupHeaderHeight, 100));
        const header = document.querySelector('.header');
        if (header) {
            headerObserver.observe(header);
        }
    }
} 