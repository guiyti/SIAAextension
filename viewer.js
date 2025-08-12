// viewer.js
// Variáveis globais
const PRESETS = {
    PADRAO: {
        order: ['Cód. Disc.', 'Nome Disciplina', 'Carga Horária', 'Sigla Campus', 'Cód. Campus', 'Nome Campus', 'Período', 'Descrição', 'Cód. Horário', 'Hora', 'ID Oferta', 'Sala', 'Vagas', 'Matriculados', 'Pré-matriculados', 'Total Matriculados', 'Vagas Restantes', 'Curso', 'Cód. Prof.', 'Nome Professor'],
        visible: ['Cód. Disc.', 'Nome Disciplina', 'Carga Horária', 'Sigla Campus', 'Cód. Campus', 'Nome Campus', 'Período', 'Descrição', 'Cód. Horário', 'Hora', 'ID Oferta', 'Sala', 'Vagas', 'Matriculados', 'Pré-matriculados', 'Total Matriculados', 'Vagas Restantes', 'Curso', 'Cód. Prof.', 'Nome Professor']
    },
    PRESET_1_BASICO: {
        // 1) Cód Disc. - Nome Disciplina - Sigla Campus - Hora - ID Oferta - Nome Professor
        order: ['Cód. Disc.', 'Nome Disciplina', 'Sigla Campus', 'Hora', 'ID Oferta', 'Nome Professor'],
        visible: ['Cód. Disc.', 'Nome Disciplina', 'Sigla Campus', 'Hora', 'ID Oferta', 'Nome Professor']
    },
    PRESET_2_DETALHADO: {
        // 2) Cód Disc. - Nome Disciplina - Sigla Campus - Cód. Horário - Hora - ID Oferta - Sala - Total Matriculados - Nome Professor
        order: ['Cód. Disc.', 'Nome Disciplina', 'Sigla Campus', 'Cód. Horário', 'Hora', 'ID Oferta', 'Sala', 'Total Matriculados', 'Nome Professor'],
        visible: ['Cód. Disc.', 'Nome Disciplina', 'Sigla Campus', 'Cód. Horário', 'Hora', 'ID Oferta', 'Sala', 'Total Matriculados', 'Nome Professor']
    },
    PRESET_3_CURSO: {
        // 3) Nome Disciplina - Sigla Campus - Hora - Curso - Nome Professor
        order: ['Nome Disciplina', 'Sigla Campus', 'Hora', 'Curso', 'Nome Professor'],
        visible: ['Nome Disciplina', 'Sigla Campus', 'Hora', 'Curso', 'Nome Professor']
    }
};

// Presets fixos (defaults) para restaurar no Redefinir
const PRESET_DEFAULTS = {
    PRESET_1_BASICO: {
        order: ['Cód. Disc.', 'Nome Disciplina', 'Sigla Campus', 'Hora', 'ID Oferta', 'Nome Professor'],
        visible: ['Cód. Disc.', 'Nome Disciplina', 'Sigla Campus', 'Hora', 'ID Oferta', 'Nome Professor']
    },
    PRESET_2_DETALHADO: {
        order: ['Cód. Disc.', 'Nome Disciplina', 'Sigla Campus', 'Cód. Horário', 'Hora', 'ID Oferta', 'Sala', 'Total Matriculados', 'Nome Professor'],
        visible: ['Cód. Disc.', 'Nome Disciplina', 'Sigla Campus', 'Cód. Horário', 'Hora', 'ID Oferta', 'Sala', 'Total Matriculados', 'Nome Professor']
    },
    PRESET_3_CURSO: {
        order: ['Nome Disciplina', 'Sigla Campus', 'Hora', 'Curso', 'Nome Professor'],
        visible: ['Nome Disciplina', 'Sigla Campus', 'Hora', 'Curso', 'Nome Professor']
    }
};

// Overrides em memória para o preset selecionado via botão Salvar
let PRESETS_CURRENT = {};

// Overrides persistentes dos presets embutidos (ordem, visibilidade, larguras)
let builtinOverridesCache = null;
async function getBuiltinOverrides() {
    if (builtinOverridesCache) return builtinOverridesCache;
    const data = await Storage.get(['siaa_builtin_overrides']);
    builtinOverridesCache = data.siaa_builtin_overrides || {};
    return builtinOverridesCache;
}
async function setBuiltinOverrides(map) {
    builtinOverridesCache = map;
    await Storage.set({ 'siaa_builtin_overrides': map });
}

function getPresetConfig(presetKey, headers) {
    const normalize = (cfg) => {
        if (!cfg) return null;
        const order = (cfg.order || []).filter(h => headers.includes(h));
        const rest = headers.filter(h => !order.includes(h));
        return {
            order: [...order, ...rest],
            visible: (cfg.visible || []).filter(h => headers.includes(h))
        };
    };
    if (presetKey === 'PRESET_COMPLETO') {
        return { order: [...headers], visible: [...headers] };
    }
    // 1) Prioriza overrides persistentes
    const overrides = builtinOverridesCache ? builtinOverridesCache : {};
    if (overrides[presetKey]) return normalize(overrides[presetKey]);
    // 2) Depois overrides em memória (sessão)
    if (PRESETS_CURRENT[presetKey]) return normalize(PRESETS_CURRENT[presetKey]);
    // 3) Caso contrário, default
    return normalize(PRESET_DEFAULTS[presetKey]);
}

function getPresetDefault(presetKey, headers) {
    if (presetKey === 'PRESET_COMPLETO') {
        return { order: [...headers], visible: [...headers] };
    }
    const base = PRESET_DEFAULTS[presetKey];
    if (!base) return { order: [...headers], visible: [...headers] };
    const order = base.order.filter(h => headers.includes(h));
    const rest = headers.filter(h => !order.includes(h));
    return { order: [...order, ...rest], visible: base.visible.filter(h => headers.includes(h)) };
}

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
let columnFilters = {}; // Filtros por coluna
let activeDropdown = null; // Dropdown de sugestões ativo
let currentPresetSelection = ''; // Valor selecionado no select de presets

// Elementos do DOM
const elements = {
    totalRecords: document.getElementById('totalRecords'),
    filteredRecords: document.getElementById('filteredRecords'),
    searchInput: document.getElementById('searchInput'),
    clearBtn: document.getElementById('clearBtn'),
    resetColumnsBtn: document.getElementById('resetColumnsBtn'),
    savePresetBtn: document.getElementById('savePresetBtn'),
    presetSelect: document.getElementById('presetSelect'),
    exportBtn: document.getElementById('exportBtn'),
    sidebarLastUpdate: document.getElementById('sidebarLastUpdate'),
    campusFilter: document.getElementById('campusFilter'),
    periodoFilter: document.getElementById('periodoFilter'),
    disciplinaFilter: document.getElementById('disciplinaFilter'),
    professorFilter: document.getElementById('professorFilter'),
    cursoFilter: document.getElementById('cursoFilterTop'),
    horarioFilter: document.getElementById('horarioFilter'),
    columnToggle: document.getElementById('columnToggle'),
    presetsList: document.getElementById('presetsList'),
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

        await finishDataLoading();
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        showNoData();
    }
}

// Finalizar carregamento dos dados
async function finishDataLoading() {
    // Headers e configurações iniciais
    const headers = Object.keys(allData[0]);

    // Compatibilidade: alinhar aliases 'Total' ↔ 'Total Matriculados'
    (function reconcileTotalHeaders() {
        const hasTotal = headers.includes('Total');
        const hasTotalMatric = headers.includes('Total Matriculados');
        // Se o CSV novo usa 'Total Matriculados', mas há estado salvo com 'Total', trocamos
        if (!hasTotal && hasTotalMatric) {
            let changed = false;
            if (Array.isArray(columnOrder) && columnOrder.includes('Total')) {
                columnOrder = columnOrder.map(h => h === 'Total' ? 'Total Matriculados' : h);
                changed = true;
            }
            if (visibleColumns instanceof Set && visibleColumns.has('Total')) {
                visibleColumns.delete('Total');
                visibleColumns.add('Total Matriculados');
                changed = true;
            }
            if (changed) {
                Storage.set({
                    viewer_column_order: columnOrder,
                    viewer_column_visibility: Array.from(visibleColumns)
                });
            }
        }
        // Se o CSV usa 'Total' e presets apontam para 'Total Matriculados', nada a fazer;
        // a lógica de fallback em getCellValue cobre a exibição.
    })();

    // Aplicar preset selecionado ANTES de montar a visualização para manter sincronizado
    try {
        const sel = await Storage.get(['viewer_selected_preset']);
        currentPresetSelection = sel.viewer_selected_preset || '__builtin__PRESET_COMPLETO';
        // Carregar overrides persistentes em cache para uso imediato
        await getBuiltinOverrides();
        const presetKey = currentPresetSelection.startsWith('__builtin__')
            ? currentPresetSelection.replace('__builtin__','')
            : 'PRESET_COMPLETO';
        const cfg = getPresetConfig(presetKey, headers);
        if (cfg) {
            columnOrder = cfg.order;
            visibleColumns = new Set(cfg.visible);
        }
    } catch (e) {
        // fallback silencioso
    if (columnOrder.length === 0) {
        columnOrder = PRESETS.PADRAO.order.filter(h => headers.includes(h));
        headers.forEach(h => { if (!columnOrder.includes(h)) columnOrder.push(h);});
    }
    if (visibleColumns.size === 0) {
            const allHeaders = Object.keys(allData[0]);
            allHeaders.forEach(h => visibleColumns.add(h));
        }
    }

    setupTable();
    setupFilters();
    setupColumnToggle();
    await loadPresetsList();
    await loadPresetsSelect();
    applyFilters();
    
    // CORREÇÃO: Aplicar visibilidade das colunas após renderizar a tabela
    setTimeout(() => {
        updateColumnVisibility();
    }, 100);
    
    // Esconder loading e mostrar tabela
    elements.loadingMessage.style.display = 'none';
    elements.tableWrapper.style.display = 'block';
    
    console.log('✅ Dados carregados com sucesso!');
    // Atualizar estado dos botões de Importar/Mesclar
    updateDataActionButtonsUI();
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
    
    // Segunda linha: inputs de filtro por coluna
    const filterRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.dataset.column = header;
        th.style.cursor = 'default';
        th.style.userSelect = 'auto';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'column-filter-input';
        input.placeholder = 'Filtrar...';
        input.value = columnFilters[header] || '';
        if (columnFilters[header]) {
            th.classList.add('column-filter-active');
            input.classList.add('active');
        }
        input.addEventListener('click', (e) => {
            e.stopPropagation();
            showColumnFilterDropdown(input, header);
        });
        input.addEventListener('input', debounce(() => {
            const val = input.value || '';
            if (val) {
                columnFilters[header] = val;
            } else {
                delete columnFilters[header];
            }
            toggleFilterActiveStyles(header, th, input);
            applyFilters();
            showColumnFilterDropdown(input, header);
        }, 250));
        input.addEventListener('focus', () => {
            // Apenas abre o dropdown; não aplica destaque se não houver valor
            showColumnFilterDropdown(input, header);
        });
        input.addEventListener('blur', () => {
            // Garante que estilos reflitam se há valor ou não
            toggleFilterActiveStyles(header, th, input);
        });
        th.appendChild(input);
        filterRow.appendChild(th);
    });
    
    elements.tableHead.appendChild(headerRow);
    elements.tableHead.appendChild(filterRow);
}

// Aplicar estilos ativos ao cabeçalho/input conforme estado do filtro
function toggleFilterActiveStyles(header, th, input) {
    const isActive = Boolean(columnFilters[header]);
    if (isActive) {
        th.classList.add('column-filter-active');
        input.classList.add('active');
    } else {
        th.classList.remove('column-filter-active');
        input.classList.remove('active');
    }
}

// Configurar filtros
function setupFilters() {
    if (allData.length === 0) return;
    
    // Se os selects não existem no DOM, não executar população
    // Campus
    if (elements.campusFilter) {
    const campusValues = [...new Set(allData.map(row => row['Sigla Campus']).filter(Boolean))].sort();
    populateSelect(elements.campusFilter, campusValues);
    }
    
    // Período
    if (elements.periodoFilter) {
    const periodoValues = [...new Set(allData.map(row => row['Período']).filter(Boolean))].sort();
    populateSelect(elements.periodoFilter, periodoValues);
    }
    
    // Disciplina
    if (elements.disciplinaFilter) {
    const disciplinaValues = [...new Set(allData.map(row => row['Nome Disciplina']).filter(Boolean))].sort();
    populateSelect(elements.disciplinaFilter, disciplinaValues);
    }
    
    // Professor
    if (elements.professorFilter) {
    const professorValues = [...new Set(allData.map(row => row['Nome Professor']).filter(Boolean))].sort();
    populateSelect(elements.professorFilter, professorValues);
    }

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
    if (elements.cursoFilter) populateSelect(elements.cursoFilter, cursoValues);

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
    if (elements.horarioFilter) populateSelect(elements.horarioFilter, horarioValues);
}

// Preencher select com opções
function populateSelect(selectElement, values) {
    if (!selectElement) return;
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
    if (!elements.columnToggle) return; // Se não existe no DOM, não montar
    
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
        
        // Atualizar cabeçalho (todas as linhas do thead)
        const headerCells = table.querySelectorAll(`thead th[data-column="${header}"]`);
        headerCells.forEach(cell => { cell.className = className; });
        
        // Atualizar células do corpo
        const cells = table.querySelectorAll(`td:nth-child(${index + 1})`);
        cells.forEach(cell => {
            cell.className = className;
        });
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Botões
    elements.resetColumnsBtn.addEventListener('click', resetColumns);
    if (elements.savePresetBtn) elements.savePresetBtn.addEventListener('click', savePreset);
    elements.presetSelect.addEventListener('change', loadSelectedPreset);
    elements.exportBtn.addEventListener('click', exportFilteredData);
    
    // Dropdown de configuração no header
    const configBtn = document.getElementById('columnConfigBtn');
    const configDropdown = document.getElementById('columnConfigDropdown');
    const copyVisibleBtn = document.getElementById('copyVisibleBtn');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (configBtn && configDropdown) {
        const toggle = () => {
            const rect = configBtn.getBoundingClientRect();
            configDropdown.style.left = Math.round(rect.left + window.scrollX) + 'px';
            configDropdown.style.top = Math.round(rect.bottom + window.scrollY + 6) + 'px';
            const willOpen = configDropdown.style.display === 'none' || !configDropdown.style.display;
            configDropdown.style.display = willOpen ? 'block' : 'none';
            if (willOpen) {
                buildVisibilityAndOrderLists();
            }
        };
        configBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggle();
        });
        document.addEventListener('mousedown', (e) => {
            if (!configDropdown) return;
            const clickInside = configDropdown.contains(e.target) || configBtn.contains(e.target);
            if (!clickInside) configDropdown.style.display = 'none';
        });
    }

    // Copiar tabela visível (com cabeçalhos e apenas colunas visíveis)
    if (copyVisibleBtn) {
        copyVisibleBtn.addEventListener('click', async () => {
            try {
                const orderedColumns = columnOrder.length > 0 ? columnOrder : (allData[0] ? Object.keys(allData[0]) : []);
                const visibleHeaders = orderedColumns.filter(h => visibleColumns.has(h));
                if (!visibleHeaders.length) {
                    alert('Não há colunas visíveis para copiar.');
                    return;
                }
                const rows = [visibleHeaders, ...filteredData.map(row => visibleHeaders.map(h => {
                    // Fallback Total/Total Matriculados
                    if (h === 'Total Matriculados') return row['Total Matriculados'] ?? row['Total'] ?? '';
                    if (h === 'Total') return row['Total'] ?? row['Total Matriculados'] ?? '';
                    return row[h] ?? '';
                }))];
                // Constrói texto tabular (TSV) para fallback
                const tsv = rows.map(r => r.map(cell => String(cell).replace(/\t/g,' ').replace(/\r?\n/g,' ')).join('\t')).join('\n');

                // Constrói HTML table para preservar células em apps que suportam text/html
                const escapeHtml = (s) => String(s)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
                const htmlHead = '<table><thead><tr>' + visibleHeaders.map(h => `<th>${escapeHtml(h)}</th>`).join('') + '</tr></thead>';
                const htmlBody = '<tbody>' + filteredData.map(row => {
                    const tds = visibleHeaders.map(h => {
                        let v;
                        if (h === 'Total Matriculados') v = row['Total Matriculados'] ?? row['Total'] ?? '';
                        else if (h === 'Total') v = row['Total'] ?? row['Total Matriculados'] ?? '';
                        else v = row[h] ?? '';
                        return `<td>${escapeHtml(v)}</td>`;
                    }).join('');
                    return `<tr>${tds}</tr>`;
                }).join('') + '</tbody></table>';
                const html = htmlHead + htmlBody;

                if (window.ClipboardItem) {
                    const item = new ClipboardItem({
                        'text/html': new Blob([html], { type: 'text/html' }),
                        'text/plain': new Blob([tsv], { type: 'text/plain' })
                    });
                    await navigator.clipboard.write([item]);
                } else {
                    await navigator.clipboard.writeText(tsv);
                }
                copyVisibleBtn.textContent = '✅ Copiado!';
                setTimeout(() => { copyVisibleBtn.textContent = '📋 Copiar Tabela Visível'; }, 1200);
            } catch (e) {
                console.error('Falha ao copiar:', e);
                alert('Não foi possível copiar para a área de transferência.');
            }
        });
    }

    // Limpar filtros (globais de coluna, selects e ordenação)
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            clearFilters();
            clearFiltersBtn.textContent = '✅ Filtros Limpos!';
            setTimeout(() => { clearFiltersBtn.textContent = '🧹 Limpar Filtros'; }, 1200);
        });
    }
    
    // Event listener para limpar todos os dados
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearAllData);
    }
    
    // Filtros
    if (elements.campusFilter) elements.campusFilter.addEventListener('change', applyFilters);
    if (elements.periodoFilter) elements.periodoFilter.addEventListener('change', applyFilters);
    if (elements.disciplinaFilter) elements.disciplinaFilter.addEventListener('change', applyFilters);
    if (elements.professorFilter) elements.professorFilter.addEventListener('change', applyFilters);
    if (elements.cursoFilter) elements.cursoFilter.addEventListener('change', applyFilters);
    if (elements.horarioFilter) elements.horarioFilter.addEventListener('change', applyFilters);

    // Exportar/Importar CSV Completo no menu hamburger
    const exportAllBtn = document.getElementById('exportAllBtn');
    const importAllBtn = document.getElementById('importAllBtn');
    const importFileInput = document.getElementById('importFileInput');
    const mergeAllBtn = document.getElementById('mergeAllBtn');
    const mergeFileInput = document.getElementById('mergeFileInput');
    if (exportAllBtn) exportAllBtn.addEventListener('click', exportAllCsvFromStorage);
    if (importAllBtn && importFileInput) {
        importAllBtn.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                await importAllCsvWithHeaderValidation(text);
            } catch (err) {
                alert('Falha ao ler o arquivo CSV.');
            } finally {
                importFileInput.value = '';
            }
        });
    }
    if (mergeAllBtn && mergeFileInput) {
        mergeAllBtn.addEventListener('click', () => mergeFileInput.click());
        mergeFileInput.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                await mergeAllCsvWithHeaderValidation(text);
            } catch (err) {
                alert('Falha ao ler o arquivo CSV para mesclar.');
            } finally {
                mergeFileInput.value = '';
            }
        });
    }
}

// Habilitar/Desabilitar botões Importar/Mesclar conforme existência de dados
function updateDataActionButtonsUI() {
    const importAllBtn = document.getElementById('importAllBtn');
    const mergeAllBtn = document.getElementById('mergeAllBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');
    const hasData = Array.isArray(allData) && allData.length > 0;
    if (importAllBtn) {
        importAllBtn.disabled = hasData;
        importAllBtn.title = hasData
            ? 'Desabilitado: já existem dados. Limpe os dados ou use Importar e Mesclar CSV.'
            : '';
    }
    if (mergeAllBtn) {
        mergeAllBtn.disabled = !hasData;
        mergeAllBtn.title = !hasData
            ? 'Desabilitado: não há dados para mesclar. Primeiro importe um CSV completo.'
            : '';
    }
    if (clearDataBtn) {
        clearDataBtn.disabled = false; // sempre disponível
    }
}

// Construir listas de Visibilidade e Ordem no menu header
function buildVisibilityAndOrderLists() {
    const visibilityList = document.getElementById('visibilityList');
    const orderList = document.getElementById('orderList');
    if (!visibilityList || !orderList) return;

    visibilityList.innerHTML = '';
    orderList.innerHTML = '';

    const headers = columnOrder.length ? columnOrder : Object.keys(allData[0] || {});

    // Visibilidade
    headers.forEach(header => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = visibleColumns.has(header);
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) visibleColumns.add(header); else visibleColumns.delete(header);
            Storage.set({ viewer_column_visibility: Array.from(visibleColumns) });
            updateColumnVisibility();
            rebuildOrderList(orderList, headers);
        });
        const span = document.createElement('span');
        span.textContent = header;
        label.appendChild(checkbox);
        label.appendChild(span);
        visibilityList.appendChild(label);
    });

    // Ordem (somente visíveis)
    rebuildOrderList(orderList, headers);

    const onDragOver = (e) => {
        e.preventDefault();
        const dragging = orderList.querySelector('.dragging');
        const afterElement = getDragAfterElement(orderList, e.clientY);
        if (!dragging) return;
        if (afterElement == null) {
            orderList.appendChild(dragging);
        } else {
            orderList.insertBefore(dragging, afterElement);
        }
    };
    orderList.addEventListener('dragover', onDragOver);
}

function rebuildOrderList(orderList, headers) {
    orderList.innerHTML = '';
    const visibleOnly = headers.filter(h => visibleColumns.has(h));
    visibleOnly.forEach((header, idx) => {
        const item = document.createElement('div');
        item.textContent = `${idx + 1}. ${header}`;
        item.setAttribute('draggable', 'true');
        item.className = 'order-item';
        item.addEventListener('dragstart', () => { item.classList.add('dragging'); });
        item.addEventListener('dragend', () => { item.classList.remove('dragging'); saveOrderFromOrderList(); });
        orderList.appendChild(item);
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.order-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

function saveOrderFromOrderList() {
    const orderList = document.getElementById('orderList');
    if (!orderList) return;
    const newOrderVisible = [...orderList.querySelectorAll('.order-item')]
        .map(el => el.textContent.replace(/^\d+\.\s*/, ''));
    const headers = columnOrder.length ? columnOrder : Object.keys(allData[0] || {});
    const hidden = headers.filter(h => !newOrderVisible.includes(h));
    const newOrder = [...newOrderVisible, ...hidden];
    if (newOrder.length) {
        columnOrder = newOrder;
        Storage.set({ viewer_column_order: columnOrder });
        setupTable();
        updateColumnVisibility();
        renderTable();
        // Reconstroi para refletir ordem após salvar
        buildVisibilityAndOrderLists();
    }
}

// Aplicar filtros
function applyFilters() {
    let filtered = [...allData];
    
    // Filtro de busca - apenas nos campos visíveis
    const searchTerm = '';
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
    
    // Filtros por coluna (AND cumulativo)
    const entries = Object.entries(columnFilters);
    if (entries.length > 0) {
        filtered = filtered.filter(row => {
            return entries.every(([col, term]) => {
                const value = row[col] || '';
                return String(value).toLowerCase().includes(String(term).toLowerCase());
            });
        });
    }
    
    // Filtros específicos
    const campusFilter = elements.campusFilter ? elements.campusFilter.value : '';
    if (campusFilter) {
        filtered = filtered.filter(row => row['Sigla Campus'] === campusFilter);
    }
    
    const periodoFilter = elements.periodoFilter ? elements.periodoFilter.value : '';
    if (periodoFilter) {
        filtered = filtered.filter(row => row['Período'] === periodoFilter);
    }
    
    const disciplinaFilter = elements.disciplinaFilter ? elements.disciplinaFilter.value : '';
    if (disciplinaFilter) {
        filtered = filtered.filter(row => row['Nome Disciplina'] === disciplinaFilter);
    }
    
    const professorFilter = elements.professorFilter ? elements.professorFilter.value : '';
    if (professorFilter) {
        filtered = filtered.filter(row => row['Nome Professor'] === professorFilter);
    }

    const cursoFilter = elements.cursoFilter ? elements.cursoFilter.value : '';
    if (cursoFilter) {
        filtered = filtered.filter(row => (row['Curso'] || '').includes(cursoFilter));
    }

    const horarioFilter = elements.horarioFilter ? elements.horarioFilter.value : '';
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

            // Fallback entre 'Total Matriculados' e 'Total'
            let cellText;
            if (header === 'Total Matriculados') {
                cellText = row['Total Matriculados'] ?? row['Total'] ?? '';
            } else if (header === 'Total') {
                cellText = row['Total'] ?? row['Total Matriculados'] ?? '';
            } else {
                cellText = row[header] || '';
            }
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
    // Ordenação especial para coluna de horários por dia da semana (Seg → Sáb) e horário inicial
    function normalizeTextForComparison(text) {
        return String(text || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    function dayNameToIndexPortuguese(dayToken) {
        const d = normalizeTextForComparison(dayToken).slice(0, 6); // pega prefixo suficiente
        if (d.startsWith('seg')) return 1; // Segunda
        if (d.startsWith('ter')) return 2; // Terça
        if (d.startsWith('qua')) return 3; // Quarta
        if (d.startsWith('qui')) return 4; // Quinta
        if (d.startsWith('sex')) return 5; // Sexta
        if (d.startsWith('sab')) return 6; // Sábado
        if (d.startsWith('dom')) return 0; // Domingo (caso apareça)
        return 99; // desconhecido vai para o final
    }

    function extractHoraSortTuple(value) {
        // Ex.: "SEG 08:00-10:00 | QUA 10:00-12:00"
        const raw = String(value || '').trim();
        if (!raw) return [99, 24 * 60 + 1];

        const firstSegment = raw.split(' | ')[0] || raw;
        const [firstWord, timeRange] = firstSegment.split(/\s+/, 2);
        const dayIndex = dayNameToIndexPortuguese(firstWord || '');

        let minutes = 24 * 60 + 1; // depois de todos
        if (timeRange && /\d{1,2}:\d{2}/.test(timeRange)) {
            const start = timeRange.split('-')[0];
            const [hh, mm] = start.split(':').map(n => parseInt(n, 10));
            if (!Number.isNaN(hh) && !Number.isNaN(mm)) minutes = hh * 60 + mm;
        }
        return [dayIndex, minutes];
    }

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
    if (column === 'Hora') {
        filteredData.sort((a, b) => {
            const [dA, mA] = extractHoraSortTuple(a[column]);
            const [dB, mB] = extractHoraSortTuple(b[column]);
            let cmp = 0;
            if (dA !== dB) cmp = dA < dB ? -1 : 1;
            else if (mA !== mB) cmp = mA < mB ? -1 : 1;
            return currentSort.direction === 'asc' ? cmp : -cmp;
        });
    } else {
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
    }
    
    renderTable();
}

// Limpar filtros
function clearFilters() {
    // limpar selects (se existirem)
    if (elements.campusFilter) elements.campusFilter.value = '';
    if (elements.periodoFilter) elements.periodoFilter.value = '';
    if (elements.disciplinaFilter) elements.disciplinaFilter.value = '';
    if (elements.professorFilter) elements.professorFilter.value = '';
    if (elements.cursoFilter) elements.cursoFilter.value = '';
    if (elements.horarioFilter) elements.horarioFilter.value = '';
    
    // Limpar filtros por coluna + inputs
    columnFilters = {};
    document.querySelectorAll('.column-filter-input').forEach(inp => { inp.value = ''; inp.classList.remove('active'); });
    document.querySelectorAll('thead th').forEach(th => th.classList.remove('column-filter-active'));
    closeActiveDropdown();
    
    // Resetar ordenação
    currentSort = { column: null, direction: 'asc' };
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });
    
    // Feedback visual
    // sem foco em busca global
    console.log('🧹 Filtros limpos');
    
    applyFilters();
}

// Dropdown de sugestões estilo Excel
function showColumnFilterDropdown(inputEl, header) {
    closeActiveDropdown();
    // Base: aplicar todos os filtros exceto o da coluna atual
    const tempFilters = { ...columnFilters };
    delete tempFilters[header];
    let base = [...allData];
    // Busca global
    const searchTerm = '';
    if (searchTerm) {
        const visibleColumnsList = Array.from(visibleColumns);
        base = base.filter(row => visibleColumnsList.some(c => String(row[c]||'').toLowerCase().includes(searchTerm)));
    }
    // Filtros específicos (sidebar) - null safe
    const campusFilter = elements.campusFilter ? elements.campusFilter.value : '';
    if (campusFilter) base = base.filter(r => r['Sigla Campus'] === campusFilter);
    const periodoFilter = elements.periodoFilter ? elements.periodoFilter.value : '';
    if (periodoFilter) base = base.filter(r => r['Período'] === periodoFilter);
    const disciplinaFilter = elements.disciplinaFilter ? elements.disciplinaFilter.value : '';
    if (disciplinaFilter) base = base.filter(r => r['Nome Disciplina'] === disciplinaFilter);
    const professorFilter = elements.professorFilter ? elements.professorFilter.value : '';
    if (professorFilter) base = base.filter(r => r['Nome Professor'] === professorFilter);
    const cursoFilter = elements.cursoFilter ? elements.cursoFilter.value : '';
    if (cursoFilter) base = base.filter(r => (r['Curso']||'').includes(cursoFilter));
    const horarioFilter = elements.horarioFilter ? elements.horarioFilter.value : '';
    if (horarioFilter) base = base.filter(r => (r['Hora']||'').includes(horarioFilter));
    // Filtros por coluna (exceto atual)
    const other = Object.entries(tempFilters);
    if (other.length) {
        base = base.filter(row => other.every(([col, term]) => String(row[col]||'').toLowerCase().includes(String(term).toLowerCase())));
    }

    // Valores únicos
    const uniques = [...new Set(base.map(r => (r[header]||'').trim()).filter(v => v !== ''))]
        .sort((a,b)=>String(a).localeCompare(String(b),'pt-BR'));

    // Filtrar sugestões conforme texto digitado no input
    const typed = String(inputEl.value || '').toLowerCase();
    let list = typed
        ? uniques.filter(v => String(v).toLowerCase().includes(typed))
        : uniques;

    // Ordenação especial para coluna Hora: Seg→Sáb e horário inicial
    if (header === 'Hora') {
        const normalize = (text) => String(text || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
        const dayIndex = (dayToken) => {
            const d = normalize(dayToken).slice(0,6);
            if (d.startsWith('seg')) return 1;
            if (d.startsWith('ter')) return 2;
            if (d.startsWith('qua')) return 3;
            if (d.startsWith('qui')) return 4;
            if (d.startsWith('sex')) return 5;
            if (d.startsWith('sab')) return 6;
            if (d.startsWith('dom')) return 0;
            return 99;
        };
        const tuple = (val) => {
            const raw = String(val || '').trim();
            if (!raw) return [99, 24*60+1];
            const firstSeg = raw.split(' | ')[0] || raw;
            const [firstWord, timeRange] = firstSeg.split(/\s+/, 2);
            const di = dayIndex(firstWord || '');
            let mins = 24*60+1;
            if (timeRange && /\d{1,2}:\d{2}/.test(timeRange)) {
                const start = timeRange.split('-')[0];
                const [hh, mm] = start.split(':').map(n => parseInt(n,10));
                if (!Number.isNaN(hh) && !Number.isNaN(mm)) mins = hh*60 + mm;
            }
            return [di, mins];
        };
        list = [...list].sort((a,b) => {
            const [da, ma] = tuple(a);
            const [db, mb] = tuple(b);
            if (da !== db) return da - db;
            return ma - mb;
        });
    }

    const dropdown = document.createElement('div');
    dropdown.className = 'column-filter-dropdown';

    if (list.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'column-filter-nooption';
        empty.textContent = 'Sem opções';
        dropdown.appendChild(empty);
    } else {
        list.forEach(val => {
            const opt = document.createElement('div');
            opt.className = 'column-filter-option';
            opt.textContent = val;
            opt.title = val;
            opt.addEventListener('mousedown', (e) => {
                e.preventDefault();
                inputEl.value = val;
                columnFilters[header] = val;
                toggleFilterActiveStyles(header, inputEl.closest('th'), inputEl);
                applyFilters();
                closeActiveDropdown();
            });
            dropdown.appendChild(opt);
        });
    }

    document.body.appendChild(dropdown);
    activeDropdown = dropdown;

    const rect = inputEl.getBoundingClientRect();
    dropdown.style.left = Math.round(rect.left + window.scrollX) + 'px';
    dropdown.style.top = Math.round(rect.bottom + window.scrollY) + 'px';
    dropdown.style.minWidth = Math.max(rect.width, 180) + 'px';
}

function closeActiveDropdown() {
    if (activeDropdown && activeDropdown.parentNode) {
        activeDropdown.parentNode.removeChild(activeDropdown);
    }
    activeDropdown = null;
}

// Fechar dropdown ao clicar fora
document.addEventListener('mousedown', (e) => {
    if (!activeDropdown) return;
    const isInside = activeDropdown.contains(e.target);
    const isInput = e.target.classList && e.target.classList.contains('column-filter-input');
    if (!isInside && !isInput) {
        closeActiveDropdown();
    }
});

// Redefinir colunas para o padrão
function resetColumns() {
    if (!allData || allData.length === 0) {
        console.log('⚠️ Nenhum dado disponível para redefinir colunas');
        return;
    }
    
    const headers = Object.keys(allData[0]);
    
    // Redefinir de acordo com o preset atualmente selecionado
    let presetKey = 'PRESET_COMPLETO';
    if (currentPresetSelection && currentPresetSelection.startsWith('__builtin__')) {
        presetKey = currentPresetSelection.replace('__builtin__','');
    }
    // Remover overrides persistentes e em memória para este preset
    (async () => {
        const overrides = await getBuiltinOverrides();
        if (overrides[presetKey]) {
            delete overrides[presetKey];
            await setBuiltinOverrides(overrides);
        }
    })();
    if (PRESETS_CURRENT && PRESETS_CURRENT[presetKey]) delete PRESETS_CURRENT[presetKey];

    const base = getPresetDefault(presetKey, headers);
    columnOrder = base.order;
    visibleColumns = new Set(base.visible);
    
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
    // Sincronizar menu se aberto
    const configDropdown = document.getElementById('columnConfigDropdown');
    if (configDropdown && configDropdown.style.display === 'block') {
        buildVisibilityAndOrderLists();
    }
    
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

// Salvar preset: sobrescreve em memória o preset fixo selecionado
function savePreset() {
    if (!currentPresetSelection || !currentPresetSelection.startsWith('__builtin__')) {
        alert('Selecione um dos 4 presets para salvar suas configurações.');
        return;
    }
    const key = currentPresetSelection.replace('__builtin__','');
    const headers = Object.keys(allData[0] || {});
    const normalizedOrder = columnOrder.filter(h => headers.includes(h));
    const rest = headers.filter(h => !normalizedOrder.includes(h));
    const newCfg = {
        order: [...normalizedOrder, ...rest],
        visible: Array.from(visibleColumns).filter(h => headers.includes(h)),
        widths: { ...columnWidths }
    };
    // Em memória (sessão)
    PRESETS_CURRENT[key] = newCfg;
    // Persistente (storage)
    (async () => {
        const overrides = await getBuiltinOverrides();
        overrides[key] = newCfg;
        await setBuiltinOverrides(overrides);
    })();
    const btn = elements.savePresetBtn;
    if (btn) {
    const originalText = btn.textContent;
    btn.textContent = '✅ Salvo!';
    btn.style.background = '#27ae60';
    btn.style.color = 'white';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
        }, 1200);
    }
}

// Carregar preset selecionado no header
function loadSelectedPreset() {
    const selectedPreset = elements.presetSelect.value;
    if (!selectedPreset) {
        return; // Nada selecionado, não faz nada
    }
    currentPresetSelection = selectedPreset;
    // Persistir seleção para sincronizar na próxima carga
    Storage.set({ viewer_selected_preset: currentPresetSelection });
    if (selectedPreset.startsWith('__builtin__')) {
        const key = selectedPreset.replace('__builtin__','');
        applyBuiltInPreset(key);
    } else {
    loadPreset(selectedPreset);
    }
}

function applyBuiltInPreset(presetKey) {
    const headers = Object.keys(allData[0] || {});
    const cfg = getPresetConfig(presetKey, headers);
    if (!cfg) return;
    columnOrder = cfg.order;
    visibleColumns = new Set(cfg.visible);

    // Se houver larguras salvas no override, restaurá-las
    const overrides = builtinOverridesCache || {};
    if (overrides[presetKey] && overrides[presetKey].widths) {
        columnWidths = { ...overrides[presetKey].widths };
    }

    Storage.set({
        viewer_column_order: columnOrder,
        viewer_column_visibility: Array.from(visibleColumns)
    });

    setupTable();
    setupColumnToggle();
    updateColumnVisibility();
    renderTable();

    const configDropdown = document.getElementById('columnConfigDropdown');
    if (configDropdown && configDropdown.style.display === 'block') {
        buildVisibilityAndOrderLists();
    }
    if (elements.presetSelect && currentPresetSelection) {
        elements.presetSelect.value = currentPresetSelection;
    }
}

// Carregar preset
async function loadPreset(presetName) {
    const presets = await getPresets();
    const preset = presets[presetName];
    
    if (!preset) {
        alert(`Preset "${presetName}" não encontrado`);
        return;
    }
    
    // Aplicar configuração do preset
    columnOrder = [...preset.order];
    visibleColumns = new Set(preset.visible);
    columnWidths = {...preset.widths};
    
    // Atualizar modified timestamp
    preset.modified = new Date().toISOString();
    presets[presetName] = preset;
    await Storage.set({ 'siaa_column_presets': presets });
    
    // Salvar configurações atuais
    await Storage.set({
        viewer_column_order: columnOrder,
        viewer_column_visibility: Array.from(visibleColumns),
        viewer_column_widths: columnWidths
    });
    
    // Atualizar interface
    setupTable();
    setupColumnToggle();
    updateColumnVisibility();
    renderTable();
    
    console.log(`📥 Preset "${presetName}" carregado`);

    // Manter seleção no select
    currentPresetSelection = presetName;
    if (elements.presetSelect) {
        elements.presetSelect.value = presetName;
    }
}

// Deletar preset
async function deletePreset(presetName) {
    const confirmed = confirm(
        `⚠️ Deletar Preset\n\n` +
        `Deseja realmente deletar o preset "${presetName}"?\n\n` +
        'Esta ação não pode ser desfeita.'
    );
    
    if (!confirmed) return;
    
    const presets = await getPresets();
    delete presets[presetName];
    await Storage.set({ 'siaa_column_presets': presets });
    
    // Atualizar listas
    await loadPresetsList();
    await loadPresetsSelect();
    
    console.log(`🗑️ Preset "${presetName}" deletado`);
}

// Obter presets do storage
async function getPresets() {
    const data = await Storage.get(['siaa_column_presets']);
    return data.siaa_column_presets || {};
}

// Carregar select de presets no header (fixos)
async function loadPresetsSelect() {
    elements.presetSelect.innerHTML = '';
    const builtins = [
        { key: 'PRESET_1_BASICO', label: 'Preset 1 • Básico' },
        { key: 'PRESET_2_DETALHADO', label: 'Preset 2 • Detalhado' },
        { key: 'PRESET_3_CURSO', label: 'Preset 3 • Curso' },
        { key: 'PRESET_COMPLETO', label: 'Preset 4 • Completo' }
    ];
    builtins.forEach(b => {
        const option = document.createElement('option');
        option.value = `__builtin__${b.key}`;
        option.textContent = b.label;
        option.title = b.label;
        elements.presetSelect.appendChild(option);
    });
    if (currentPresetSelection) {
        elements.presetSelect.value = currentPresetSelection;
    }
}

// Carregar e exibir lista de presets na sidebar
async function loadPresetsList() {
    if (!elements.presetsList) return;
    elements.presetsList.innerHTML = '<div class="no-presets">Presets fixos: use o menu superior</div>';
}

// Expor funções globalmente para uso nos botões HTML
window.loadPreset = loadPreset;
window.deletePreset = deletePreset;

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

// Exportar CSV completo do storage (sem filtros, cabeçalho completo)
async function exportAllCsvFromStorage() {
    try {
        const data = await Storage.get(['siaa_data_csv']);
        const csv = data.siaa_data_csv;
        if (!csv) {
            alert('Não há CSV completo armazenado para exportar.');
            return;
        }
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `siaa_dados_completos_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error('Erro ao exportar CSV completo:', e);
        alert('Erro ao exportar CSV completo.');
    }
}

// Validar cabeçalho do CSV importado antes de aceitar
async function importAllCsvWithHeaderValidation(csvText) {
    if (!csvText || typeof csvText !== 'string') {
        alert('Arquivo CSV inválido.');
        return;
    }
    // Extrair primeira linha (cabeçalho) considerando BOM
    const clean = csvText.replace(/^\uFEFF/, '');
    const firstLine = (clean.split('\n')[0] || '').trim();
    if (!firstLine) {
        alert('CSV sem cabeçalho.');
        return;
    }
    const headersImported = parseCSVLine(firstLine);
    const required = [
        'Cód. Disc.', 'Nome Disciplina', 'Carga Horária', 'Cód. Campus', 'Sigla Campus', 'Nome Campus', 'Período',
        'Vagas', 'Matriculados', 'Pré-matriculados', 'Total Matriculados', 'Vagas Restantes', 'Sala', 'Descrição',
        'Cód. Horário', 'ID Oferta', 'Hora', 'Curso', 'Cód. Prof.', 'Nome Professor'
    ];
    const missing = required.filter(h => !headersImported.includes(h));
    if (missing.length) {
        alert('Cabeçalho inválido. Ausentes:\n- ' + missing.join('\n- '));
        return;
    }
    // Tudo ok: armazenar CSV completo e recarregar viewer
    const csvWithBom = clean.startsWith('\uFEFF') ? clean : ('\uFEFF' + clean);
    await Storage.set({
        siaa_data_csv: csvWithBom,
        siaa_data_timestamp: Date.now()
    });
    // Recarregar dados em memória
    await loadData();
    alert('CSV importado com sucesso.');
    updateDataActionButtonsUI();
}

// Mesclar CSV completo importado com o atual, mantendo a última ocorrência (da importação) em caso de duplicidade por ID Oferta
async function mergeAllCsvWithHeaderValidation(csvText) {
    if (!csvText || typeof csvText !== 'string') {
        alert('Arquivo CSV inválido.');
        return;
    }
    const clean = csvText.replace(/^\uFEFF/, '');
    const firstLine = (clean.split('\n')[0] || '').trim();
    if (!firstLine) {
        alert('CSV sem cabeçalho.');
        return;
    }
    const headersImported = parseCSVLine(firstLine);
    const required = [
        'Cód. Disc.', 'Nome Disciplina', 'Carga Horária', 'Cód. Campus', 'Sigla Campus', 'Nome Campus', 'Período',
        'Vagas', 'Matriculados', 'Pré-matriculados', 'Total Matriculados', 'Vagas Restantes', 'Sala', 'Descrição',
        'Cód. Horário', 'ID Oferta', 'Hora', 'Curso', 'Cód. Prof.', 'Nome Professor'
    ];
    const missing = required.filter(h => !headersImported.includes(h));
    if (missing.length) {
        alert('Cabeçalho inválido. Ausentes:\n- ' + missing.join('\n- '));
        return;
    }

    // Obter CSV atual do storage
    const data = await Storage.get(['siaa_data_csv']);
    const currentCsv = (data.siaa_data_csv || '').replace(/^\uFEFF/, '');
    if (!currentCsv) {
        // Se não há CSV atual, apenas importa
        await importAllCsvWithHeaderValidation(csvText);
        return;
    }

    // Converter ambos em arrays de objetos usando parser local
    const currentObjs = parseCSV(currentCsv);
    const importedObjs = parseCSV(clean);

    // Mesclar por ID Oferta, mantendo a última (da importação) em caso de duplicidade
    const map = new Map();
    const duplicates = [];
    for (const obj of currentObjs) {
        const key = obj['ID Oferta'];
        if (key) map.set(key, obj);
    }
    for (const obj of importedObjs) {
        const key = obj['ID Oferta'];
        if (!key) continue;
        if (map.has(key)) {
            duplicates.push(key);
        }
        map.set(key, obj); // mantém a última (importada)
    }

    // Montar CSV final usando os headers do importado
    const finalHeaders = headersImported;
    const lines = [finalHeaders.join(',')];
    for (const row of map.values()) {
        const line = finalHeaders.map(h => {
            const value = row[h] || '';
            const escaped = String(value).replace(/"/g, '""');
            return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
                ? `"${escaped}"`
                : escaped;
        }).join(',');
        lines.push(line);
    }
    const mergedCsv = lines.join('\n');
    const csvWithBom = '\uFEFF' + mergedCsv;

    await Storage.set({
        siaa_data_csv: csvWithBom,
        siaa_data_timestamp: Date.now()
    });

    // Recarregar dados no viewer
    await loadData();

    // Popup com duplicidades indicando que a última (importada) foi mantida
    if (duplicates.length) {
        alert(`Mesclagem concluída. Duplicidades por ID Oferta detectadas e a última foi mantida (importação):\n- ${duplicates.slice(0,50).join('\n- ')}${duplicates.length>50?'\n...':''}`);
    } else {
        alert('Mesclagem concluída. Nenhuma duplicidade por ID Oferta encontrada.');
    }
    updateDataActionButtonsUI();
}

// Limpar todos os dados armazenados
async function clearAllData() {
    // Confirmar ação
    const confirmed = confirm(
        '⚠️ ATENÇÃO!\n\n' +
        'Esta ação irá remover apenas os DADOS das ofertas capturadas.\n\n' +
        '• Dados de disciplinas e ofertas serão removidos\n' +
        '• Configurações de colunas e presets serão PRESERVADOS\n' +
        '• Filtros serão limpos\n\n' +
        'Esta ação NÃO PODE ser desfeita!\n\n' +
        'Deseja realmente continuar?'
    );
    
    if (!confirmed) {
        console.log('🚫 Limpeza de dados cancelada pelo usuário');
        return;
    }
    
    try {
        console.log('🗑️ Iniciando limpeza dos dados das ofertas...');
        
        // Limpar apenas os dados das ofertas, preservando presets e configurações
        await Storage.set({
            'siaa_data_csv': null,
            'siaa_data_timestamp': null
        });
        
        // Limpar variáveis locais dos dados
        allData = [];
        filteredData = [];
        
        // Limpar interface da tabela
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
        
        // Limpar seção de colunas (será recriada quando novos dados forem carregados)
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
        
        // Mostrar mensagem de "sem dados"
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
        
        console.log('✅ Dados das ofertas foram removidos com sucesso (presets preservados)');
        
        // Notificar usuário
        alert('✅ Dados limpos com sucesso!\n\nApenas os dados das ofertas foram removidos.\nSeus presets e configurações de colunas foram preservados.\n\nPara usar novamente, capture novos dados no SIAA.');
        updateDataActionButtonsUI();
        
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