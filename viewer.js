// viewer.js
// Variáveis globais
let allData = [];
let filteredData = [];
let currentSort = { column: null, direction: 'asc' };
let visibleColumns = new Set();

// Elementos do DOM
const elements = {
    totalRecords: document.getElementById('totalRecords'),
    filteredRecords: document.getElementById('filteredRecords'),
    lastUpdate: document.getElementById('lastUpdate'),
    searchInput: document.getElementById('searchInput'),
    clearBtn: document.getElementById('clearBtn'),
    exportBtn: document.getElementById('exportBtn'),
    campusFilter: document.getElementById('campusFilter'),
    periodoFilter: document.getElementById('periodoFilter'),
    disciplinaFilter: document.getElementById('disciplinaFilter'),
    professorFilter: document.getElementById('professorFilter'),
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
    await loadData();
    setupEventListeners();
});

// Carregar dados do storage
async function loadData() {
    try {
        const data = await chrome.storage.local.get(['siaa_data_csv', 'siaa_data_timestamp']);
        
        if (!data.siaa_data_csv) {
            showNoData();
            return;
        }

        console.log('📊 Dados encontrados, processando...');
        allData = parseCSV(data.siaa_data_csv);
        
        if (allData.length === 0) {
            showNoData();
            return;
        }

        // Atualizar informações
        elements.totalRecords.textContent = allData.length;
        if (data.siaa_data_timestamp) {
            elements.lastUpdate.textContent = new Date(data.siaa_data_timestamp).toLocaleString('pt-BR');
        }

        // Inicializar colunas visíveis
        if (allData.length > 0) {
            const headers = Object.keys(allData[0]);
            // Mostrar apenas colunas mais importantes por padrão
            const defaultVisibleColumns = [
                'Nome Disciplina', 'Sigla Campus', 'Período', 'Vagas', 
                'Matriculados', 'Vagas Restantes', 'Nome Professor'
            ];
            
            headers.forEach(header => {
                if (defaultVisibleColumns.includes(header)) {
                    visibleColumns.add(header);
                }
            });
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
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        showNoData();
    }
}

// Mostrar mensagem de nenhum dado
function showNoData() {
    elements.loadingMessage.style.display = 'none';
    elements.noDataMessage.style.display = 'block';
    elements.tableWrapper.style.display = 'none';
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
    
    const headers = Object.keys(allData[0]);
    elements.tableHead.innerHTML = '';
    
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.dataset.column = header;
        th.addEventListener('click', () => sortTable(header));
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
    
    const headers = Object.keys(allData[0]);
    elements.columnToggle.innerHTML = '';
    
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
            updateColumnVisibility();
        });
        
        const span = document.createElement('span');
        span.textContent = header;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        elements.columnToggle.appendChild(label);
    });
}

// Atualizar visibilidade das colunas
function updateColumnVisibility() {
    const table = document.getElementById('dataTable');
    const headers = Object.keys(allData[0]);
    
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
    elements.exportBtn.addEventListener('click', exportFilteredData);
    
    // Filtros
    elements.campusFilter.addEventListener('change', applyFilters);
    elements.periodoFilter.addEventListener('change', applyFilters);
    elements.disciplinaFilter.addEventListener('change', applyFilters);
    elements.professorFilter.addEventListener('change', applyFilters);
}

// Aplicar filtros
function applyFilters() {
    let filtered = [...allData];
    
    // Filtro de busca
    const searchTerm = elements.searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        filtered = filtered.filter(row => {
            return Object.values(row).some(value => 
                String(value).toLowerCase().includes(searchTerm)
            );
        });
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
    
    const headers = Object.keys(allData[0]);
    elements.tableBody.innerHTML = '';
    
    filteredData.forEach(row => {
        const tr = document.createElement('tr');
        
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] || '';
            
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
    
    // Resetar ordenação
    currentSort = { column: null, direction: 'asc' };
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });
    
    applyFilters();
}

// Exportar dados filtrados
function exportFilteredData() {
    if (filteredData.length === 0) {
        alert('Nenhum dado para exportar');
        return;
    }
    
    // Filtrar apenas colunas visíveis
    const headers = Object.keys(allData[0]).filter(header => visibleColumns.has(header));
    
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