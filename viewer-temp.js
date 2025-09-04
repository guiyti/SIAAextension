// viewer.js - Versão com Integração Gradual dos Módulos
// Variáveis globais

// INTEGRAÇÃO GRADUAL DOS MÓDULOS REFATORADOS

// Sistema moderno sem debug híbrido

// Função de integração removida - sistema moderno via AppController

// Variáveis globais (mantidas para compatibilidade)

// Presets carregados dinamicamente do siaa-config.json

// Função para obter presets baseado no modo atual
function getCurrentPresets() {
    return getConfigPresets(currentViewMode);
}

// Alias para compatibilidade (ambas fazem a mesma coisa)
const getCurrentPresetDefaults = getCurrentPresets;

// Função para obter configuração de preset
function getPresetConfig(presetKey, headers) {
    const configPreset = getConfigPreset(presetKey, currentViewMode);
    
    if (!configPreset) {
        console.warn('Preset não encontrado no siaa-config:', presetKey);
        return null;
    }
    
    let config = {
        order: configPreset.order || [],
        visible: configPreset.visible || []
    };
    
    // Se for PRESET_COMPLETO, usar todas as colunas disponíveis
    if (presetKey === 'PRESET_COMPLETO') {
        config = {
            order: headers || [],
            visible: headers || []
        };
    }
    
    // Filtrar apenas colunas que existem nos dados atuais
    if (headers && headers.length > 0) {
        const validOrder = config.order.filter(col => headers.includes(col));
        const validVisible = config.visible.filter(col => headers.includes(col));
        
        return {
            order: validOrder,
            visible: validVisible
        };
    }
    
    return config;
}

// Função para carregar customizações salvas do preset
async function loadPresetCustomizations(presetKey) {
    const storageKey = `siaa_preset_override_${currentViewMode}_${presetKey}`;
    const saved = await Storage.get([storageKey]);
    const customization = saved[storageKey];
    
    if (customization && customization.viewMode === currentViewMode) {
        console.log(`📦 Carregando customizações salvas para preset ${presetKey} (modo: ${currentViewMode})`);
        return {
            order: customization.order || [],
            visible: customization.visible || [],
            widths: customization.widths || {}
        };
    }
    
    return null;
}

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
    const defaults = getCurrentPresetDefaults();
    return normalize(defaults[presetKey]);
}

function getPresetDefault(presetKey, headers) {
    if (presetKey === 'PRESET_COMPLETO') {
        return { order: [...headers], visible: [...headers] };
    }
    
    const configPreset = getConfigPreset(presetKey, currentViewMode);
    if (!configPreset) {
        return { order: [...headers], visible: [...headers] };
    }
    
    const order = configPreset.order.filter(h => headers.includes(h));
    const rest = headers.filter(h => !order.includes(h));
    return { 
        order: [...order, ...rest], 
        visible: configPreset.visible.filter(h => headers.includes(h)) 
    };
}

// Função para atualizar contadores do header
async function updateHeaderCounters() {
    try {
        // Obter dados de ofertas e alunos do storage
        const storage = await Storage.get(['siaa_data_csv', 'siaa_students_csv']);
        
        // Contar ofertas
        let ofertasCount = 0;
        if (storage.siaa_data_csv) {
            const ofertasData = parseCSV(storage.siaa_data_csv);
            ofertasCount = ofertasData.length;
        }
        
        // Contar alunos
        let alunosCount = 0;
        if (storage.siaa_students_csv) {
            const alunosData = parseCSV(storage.siaa_students_csv);
            alunosCount = alunosData.length;
        }
        
        // Atualizar elementos do DOM
        if (elements.totalOfertas) {
            elements.totalOfertas.textContent = ofertasCount;
        }
        if (elements.totalAlunos) {
            elements.totalAlunos.textContent = alunosCount;
        }
        
        console.log('📊 Contadores atualizados:', { ofertas: ofertasCount, alunos: alunosCount });
        
    } catch (error) {
        console.error('❌ Erro ao atualizar contadores:', error);
        // Definir valores padrão em caso de erro
        if (elements.totalOfertas) elements.totalOfertas.textContent = '0';
        if (elements.totalAlunos) elements.totalAlunos.textContent = '0';
    }
}

// Função para copiar tabela visível (extraída da implementação anterior)
async function copyVisibleTable() {
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
        
        showNotification('✅ Tabela copiada com sucesso!', 'success');
    } catch (e) {
        console.error('Falha ao copiar:', e);
        alert('Não foi possível copiar para a área de transferência.');
    }
}

// Função para copiar coluna individual
async function copyColumn(columnName, withDuplicates = true) {
    try {
        const values = filteredData.map(row => {
            // Fallback Total/Total Matriculados
            if (columnName === 'Total Matriculados') return row['Total Matriculados'] ?? row['Total'] ?? '';
            if (columnName === 'Total') return row['Total'] ?? row['Total Matriculados'] ?? '';
            return row[columnName] ?? '';
        }).filter(val => val !== ''); // Remove valores vazios
        
        let finalValues = values;
        if (!withDuplicates) {
            finalValues = [...new Set(values)]; // Remove duplicatas
        }
        
        const text = finalValues.join('\n');
        await navigator.clipboard.writeText(text);
        
        const typeText = withDuplicates ? 'com repetições' : 'sem repetições';
        showNotification(`✅ Coluna "${columnName}" copiada ${typeText}! (${finalValues.length} valores)`, 'success');
    } catch (e) {
        console.error('Falha ao copiar coluna:', e);
        alert('Não foi possível copiar para a área de transferência.');
    }
}

// Função para construir lista de colunas no dropdown de cópia
function buildCopyColumnsList() {
    const copyColumnsList = document.getElementById('copyColumnsList');
    if (!copyColumnsList) return;
    
    const orderedColumns = columnOrder.length > 0 ? columnOrder : (allData[0] ? Object.keys(allData[0]) : []);
    const visibleHeaders = orderedColumns.filter(h => visibleColumns.has(h));
    
    copyColumnsList.innerHTML = '';
    
    visibleHeaders.forEach(columnName => {
        const item = document.createElement('div');
        item.className = 'copy-column-item';
        
        item.innerHTML = `
            <span class="copy-column-name" title="${columnName}">${columnName}</span>
            <button class="copy-column-btn" data-column="${columnName}" data-duplicates="true" title="Copiar com repetições">📋 Com</button>
            <button class="copy-column-btn" data-column="${columnName}" data-duplicates="false" title="Copiar sem repetições">🔗 Sem</button>
        `;
        
        // Event listeners para os botões
        item.querySelectorAll('.copy-column-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const column = btn.dataset.column;
                const withDuplicates = btn.dataset.duplicates === 'true';
                await copyColumn(column, withDuplicates);
                document.getElementById('copyDataDropdown').style.display = 'none';
            });
        });
        
        copyColumnsList.appendChild(item);
    });
    
    if (visibleHeaders.length === 0) {
        copyColumnsList.innerHTML = '<div style="padding:8px;color:#666;font-size:11px;text-align:center;">Nenhuma coluna visível</div>';
    }
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
// Removido: columnFilters agora é parte do filterStates
let activeDropdown = null; // Dropdown de sugestões ativo
let currentPresetSelection = ''; // Valor selecionado no select de presets

// Elementos do DOM
const elements = {
    filteredRecords: document.getElementById('filteredRecords'),
    totalOfertas: document.getElementById('totalOfertas'),
    totalAlunos: document.getElementById('totalAlunos'),
    searchInput: document.getElementById('searchInput'),
    clearBtn: document.getElementById('clearBtn'),
    resetColumnsBtn: document.getElementById('resetColumnsBtn'),
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
    
    // ETAPA 5.1: Integração básica com módulos (apenas EventBus e AppController)
    setTimeout(() => {
        initializeBasicModulesIntegration();
    }, 200); // Delay maior para garantir carregamento
    
    // Configurar sidebar toggle
    const toggleSidebar = () => {
        document.body.classList.toggle('sidebar-open');
        const isOpen = document.body.classList.contains('sidebar-open');
        console.log('🔄 Sidebar toggled:', isOpen ? 'ABERTA' : 'FECHADA');
    };
    
    const closeSidebar = () => {
        document.body.classList.remove('sidebar-open');
        console.log('🔄 Sidebar fechada');
    };
    
    // Event listeners para sidebar
    document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);
    document.getElementById('sidebarClose')?.addEventListener('click', closeSidebar);
    document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);
    
    // Fechar sidebar com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
            closeSidebar();
        }
    });
    
    try {
        // 1. Carregar configuração do siaa-config.json primeiro
        console.log('🔧 Carregando configuração SIAA...');
        await loadSiaaConfig();
        
        // 2. Carregar estados salvos
        console.log('📦 Carregando estados salvos...');
        await loadSavedStates();
        
        // 3. Configurar header responsivo
        setupHeaderEvents();
        
        // 4. Configurar controles de modo de visualização
        await setupViewModeControls();
        
        // 5. Sincronizar estados carregados com variáveis globais
        syncLocalStates();
        
        // 5. Carregar configurações antigas (compatibilidade)
        const stored = await Storage.get(['viewer_column_widths', 'viewer_column_order', 'viewer_column_visibility']);
        if (stored.viewer_column_widths && Object.keys(columnWidths).length === 0) {
            columnWidths = stored.viewer_column_widths;
        }
        if (Array.isArray(stored.viewer_column_order) && columnOrder.length === 0) {
            columnOrder = stored.viewer_column_order;
        }
        if (Array.isArray(stored.viewer_column_visibility) && visibleColumns.size === 0) {
            visibleColumns = new Set(stored.viewer_column_visibility);
        }

        // 6. Carregar dados e configurar interface
        await loadData();
        setupEventListeners();
        
        // 7. Atualizar contadores na inicialização
        await updateHeaderCounters();
        
        // 8. Forçar salvamento inicial para sincronizar todos os estados
        await forceSave();
        
        console.log('✅ Inicialização completa com persistência automática');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showNoData();
        setupEventListeners();
        setupHeaderEvents(); // Garantir que header seja configurado mesmo com erro
        
        // Tentar atualizar contadores mesmo com erro
        await updateHeaderCounters();
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
        // totalRecords removido - usando contadores específicos nos botões
        if (data.siaa_data_timestamp) {
            const dateStr = new Date(data.siaa_data_timestamp).toLocaleString('pt-BR');
            elements.sidebarLastUpdate.textContent = dateStr;
        } else {
            elements.sidebarLastUpdate.textContent = 'Não disponível';
        }

        // Atualizar contadores do header
        await updateHeaderCounters();

        await finishDataLoading();
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        showNoData();
    }
}

// Finalizar carregamento dos dados
async function finishDataLoading() {
    try {
        console.log('🔄 finishDataLoading iniciado');
        
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
        const presetKey = getPresetStorageKey();
        const sel = await Storage.get([presetKey]);
        currentPresetSelection = sel[presetKey] || '__builtin__PRESET_1_BASICO';
        // Carregar overrides persistentes em cache para uso imediato
        await getBuiltinOverrides();
        const presetConfigKey = currentPresetSelection.startsWith('__builtin__')
            ? currentPresetSelection.replace('__builtin__','')
            : 'PRESET_1_BASICO';
        const cfg = getPresetConfig(presetConfigKey, headers);
        if (cfg) {
            columnOrder = cfg.order;
            visibleColumns = new Set(cfg.visible);
        }
    } catch (e) {
        // fallback silencioso - usar preset padrão do siaa-config
    if (columnOrder.length === 0) {
        const defaultPreset = getConfigPreset('PADRAO', currentViewMode);
        if (defaultPreset && defaultPreset.order) {
            columnOrder = defaultPreset.order.filter(h => headers.includes(h));
        }
        headers.forEach(h => { if (!columnOrder.includes(h)) columnOrder.push(h);});
    }
    if (visibleColumns.size === 0) {
            const allHeaders = Object.keys(allData[0]);
            allHeaders.forEach(h => visibleColumns.add(h));
        }
    }

    setupTable();
    setupFilters();
    await setupColumnToggle();
    await loadPresetsList();
    await loadPresetsSelect();
    applyFilters();
    
    // CORREÇÃO: Aplicar visibilidade das colunas após renderizar a tabela
    setTimeout(() => {
        updateColumnVisibility();
    }, 100);
    
    // Mostrar dados (esconder dialog)
    showData();
    
    console.log('✅ Dados carregados com sucesso!');
    // Atualizar estado dos botões de Importar/Mesclar
    updateDataActionButtonsUI();
    
    } catch (error) {
        console.error('❌ Erro em finishDataLoading:', error);
        console.error('Stack trace:', error.stack);
        showNoData();
    }
}

// Mostrar dados na tabela (esconder dialog)
function showData() {
    if (elements.loadingMessage) {
        elements.loadingMessage.style.display = 'none';
    }
    if (elements.noDataMessage) {
        elements.noDataMessage.style.display = 'none';
    }
    if (elements.tableWrapper) {
        elements.tableWrapper.style.display = 'block';
    }
}

// Mostrar mensagem de nenhum dado (dinâmica baseada no modo)
function showNoData() {
    elements.loadingMessage.style.display = 'none';
    elements.noDataMessage.style.display = 'block';
    elements.tableWrapper.style.display = 'none';
    
    // Atualizar mensagem baseada no modo atual
    const noDataElement = document.getElementById('noDataMessage');
    if (noDataElement) {
        if (currentViewMode === 'alunos') {
            noDataElement.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🎓</div>
                    <h3 style="margin-bottom: 15px; color: #2c3e50;">Nenhum dado de alunos disponível</h3>
                    <p style="margin-bottom: 20px; line-height: 1.6;">
                        Não há dados de alunos capturados ainda.<br>
                        Para capturar dados de alunos:
                    </p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left; max-width: 500px; margin-left: auto; margin-right: auto;">
                        <strong>📋 Como capturar dados de alunos:</strong><br><br>
                        <strong>1️⃣ Acesse o SIAA e faça login</strong><br>
                        <strong>2️⃣ Navegue até:</strong><br>
                        &nbsp;&nbsp;• <strong>Acadêmico → Consultas → Consulta De Ofertas Por Curso</strong><br>
                        &nbsp;&nbsp;• <strong>Acadêmico → Relatórios → Relação De Alunos Matriculados Por Curso</strong><br><br>
                        <strong>3️⃣ Use a extensão para capturar</strong><br>
                        <strong>4️⃣ Os dados aparecerão automaticamente aqui</strong><br><br>
                        <small style="color: #e67e22;">💡 <strong>Importante:</strong> Ambas as seções precisam estar acessíveis para captura completa dos dados de alunos</small>
                    </div>
                </div>
            `;
        } else {
            noDataElement.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
                    <h3 style="margin-bottom: 15px; color: #2c3e50;">Nenhum dado de ofertas disponível</h3>
                    <p style="margin-bottom: 20px; line-height: 1.6;">
                        Não há dados de ofertas capturados ainda.<br>
                        Para capturar dados de ofertas:
                    </p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left; max-width: 500px; margin-left: auto; margin-right: auto;">
                        <strong>📋 Como capturar dados de ofertas:</strong><br><br>
                        <strong>1️⃣ Acesse o SIAA e faça login</strong><br>
                        <strong>2️⃣ Navegue até:</strong><br>
                        &nbsp;&nbsp;• <strong>Acadêmico → Consultas → Consulta De Ofertas Por Curso</strong><br>
                        &nbsp;&nbsp;• <strong>Acadêmico → Relatórios → Relação De Alunos Matriculados Por Curso</strong><br><br>
                        <strong>3️⃣ Use a extensão para capturar</strong><br>
                        <strong>4️⃣ Os dados aparecerão automaticamente aqui</strong><br><br>
                        <small style="color: #e67e22;">💡 <strong>Importante:</strong> Ambas as seções precisam estar acessíveis para captura completa (ofertas + alunos)</small>
                    </div>
                </div>
            `;
        }
    }
    
    // Limpar elementos de estatísticas
    if (elements.filteredRecords) elements.filteredRecords.textContent = '0';
    if (elements.sidebarLastUpdate) elements.sidebarLastUpdate.textContent = 'Sem dados';
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
                debouncedAutoSave(); // Salvar estados automaticamente
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
        th.addEventListener('drop', async (e) => {
            e.preventDefault();
            const dropIndex = headers.indexOf(header);
            if (dragSrcIndex === null || dragSrcIndex === dropIndex) return;
            
            // Reorganizar columnOrder
            const moved = columnOrder.splice(dragSrcIndex, 1)[0];
            columnOrder.splice(dropIndex, 0, moved);
            
            // Salvar nova ordem
            Storage.set({ viewer_column_order: columnOrder });
            debouncedAutoSave(); // Salvar estados automaticamente
            
            // Atualizar interface
            setupTable();
            await setupColumnToggle(); // Recriar a sidebar na nova ordem
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
        input.placeholder = 'Filtrar... (use ; para múltiplos valores)';
        input.value = getCurrentColumnFilters()[header] || '';
        if (getCurrentColumnFilters()[header]) {
            th.classList.add('column-filter-active');
            input.classList.add('active');
        }
        input.addEventListener('click', (e) => {
            e.stopPropagation();
            showColumnFilterDropdown(input, header);
        });
        input.addEventListener('input', debounce(() => {
            const val = input.value || '';
            setCurrentColumnFilter(header, val);
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
    const isActive = Boolean(getCurrentColumnFilters()[header]);
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
async function setupColumnToggle() {
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
        checkbox.addEventListener('change', async (e) => {
            if (e.target.checked) {
                visibleColumns.add(header);
            } else {
                visibleColumns.delete(header);
            }
            Storage.set({ viewer_column_visibility: [...visibleColumns] });
            debouncedAutoSave(); // Salvar estados automaticamente
            await autoSaveCurrentPreset(); // Salvar customização do preset atual
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
        label.addEventListener('drop', async e=>{
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
            debouncedAutoSave(); // Salvar estados automaticamente
            
            // Atualizar interface
            setupTable();
            await setupColumnToggle(); // Recriar a sidebar na nova ordem
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
    elements.presetSelect.addEventListener('change', loadSelectedPreset);
    elements.exportBtn.addEventListener('click', exportFilteredData);
    
    // Dropdown de configuração no header
    const configBtn = document.getElementById('columnConfigBtn');
    const configDropdown = document.getElementById('columnConfigDropdown');
    const copyDataBtn = document.getElementById('copyDataBtn');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (configBtn && configDropdown) {
        const toggle = async () => {
            const rect = configBtn.getBoundingClientRect();
            const dropdownWidth = 350; // Largura fixa aumentada
            
            // Posicionar o dropdown para crescer para a esquerda
            const leftPosition = Math.round(rect.right + window.scrollX - dropdownWidth);
            configDropdown.style.left = leftPosition + 'px';
            configDropdown.style.top = Math.round(rect.bottom + window.scrollY + 6) + 'px';
            configDropdown.style.width = dropdownWidth + 'px';
            
            const willOpen = configDropdown.style.display === 'none' || !configDropdown.style.display;
            configDropdown.style.display = willOpen ? 'block' : 'none';
            if (willOpen) {
                await buildVisibilityAndOrderLists();
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

    // Dropdown de cópia de dados
    const copyDropdown = document.getElementById('copyDataDropdown');
    if (copyDataBtn && copyDropdown) {
        const toggleCopyDropdown = () => {
            const rect = copyDataBtn.getBoundingClientRect();
            const dropdownWidth = 280;
            
            // Posicionar o dropdown para crescer para a esquerda
            const leftPosition = Math.round(rect.right + window.scrollX - dropdownWidth);
            copyDropdown.style.left = leftPosition + 'px';
            copyDropdown.style.top = Math.round(rect.bottom + window.scrollY + 6) + 'px';
            copyDropdown.style.width = dropdownWidth + 'px';
            
            const willOpen = copyDropdown.style.display === 'none' || !copyDropdown.style.display;
            copyDropdown.style.display = willOpen ? 'block' : 'none';
            if (willOpen) {
                buildCopyColumnsList();
            }
        };
        
        copyDataBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Fechar dropdown de configuração se estiver aberto
            if (configDropdown) configDropdown.style.display = 'none';
            toggleCopyDropdown();
        });
        
        document.addEventListener('mousedown', (e) => {
            if (!copyDropdown) return;
            const clickInside = copyDropdown.contains(e.target) || copyDataBtn.contains(e.target);
            if (!clickInside) copyDropdown.style.display = 'none';
        });
        
        // Event listener para copiar tabela completa
        const copyTableBtn = document.getElementById('copyTableBtn');
        if (copyTableBtn) {
            copyTableBtn.addEventListener('click', async () => {
                await copyVisibleTable();
                copyDropdown.style.display = 'none';
            });
        }
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
    if (elements.campusFilter) elements.campusFilter.addEventListener('change', () => { applyFilters(); debouncedAutoSave(); });
    if (elements.periodoFilter) elements.periodoFilter.addEventListener('change', () => { applyFilters(); debouncedAutoSave(); });
    if (elements.disciplinaFilter) elements.disciplinaFilter.addEventListener('change', () => { applyFilters(); debouncedAutoSave(); });
    if (elements.professorFilter) elements.professorFilter.addEventListener('change', () => { applyFilters(); debouncedAutoSave(); });
    if (elements.cursoFilter) elements.cursoFilter.addEventListener('change', () => { applyFilters(); debouncedAutoSave(); });
    if (elements.horarioFilter) elements.horarioFilter.addEventListener('change', () => { applyFilters(); debouncedAutoSave(); });

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
async function buildVisibilityAndOrderLists() {
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
        checkbox.addEventListener('change', async () => {
            if (checkbox.checked) {
                visibleColumns.add(header);
                // Feedback visual positivo
                label.classList.add('checked');
                setTimeout(() => { label.classList.remove('checked'); }, 500);
            } else {
                visibleColumns.delete(header);
                // Feedback visual negativo
                label.classList.add('unchecked');
                setTimeout(() => { label.classList.remove('unchecked'); }, 500);
            }
            Storage.set({ viewer_column_visibility: Array.from(visibleColumns) });
            debouncedAutoSave(); // Salvar estados automaticamente
            await autoSaveCurrentPreset(); // Salvar customização do preset atual
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
        item.addEventListener('dragstart', () => { 
            item.classList.add('dragging');
        });
        item.addEventListener('dragend', () => { 
            item.classList.remove('dragging'); 
            saveOrderFromOrderList();
            // Feedback visual de sucesso
            item.style.background = 'rgba(34, 197, 94, 0.1)';
            item.style.borderColor = '#22c55e';
            setTimeout(() => {
                item.style.background = '';
                item.style.borderColor = '';
            }, 800);
        });
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

async function saveOrderFromOrderList() {
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
        debouncedAutoSave(); // Salvar estados automaticamente
        await autoSaveCurrentPreset(); // Salvar customização do preset atual
        setupTable();
        updateColumnVisibility();
        renderTable();
        // Reconstroi para refletir ordem após salvar
        await buildVisibilityAndOrderLists();
    }
}

// Função auxiliar para verificar se um valor corresponde a múltiplos termos separados por ponto e vírgula
function matchesMultipleValues(valueToCheck, filterTerm) {
    if (!filterTerm || !filterTerm.trim()) return true;
    
    const value = String(valueToCheck || '').toLowerCase();
    const filterStr = String(filterTerm).toLowerCase();
    
    // Se contém ponto e vírgula, trata como múltiplos valores (OR)
    if (filterStr.includes(';')) {
        const terms = filterStr.split(';')
            .map(term => term.trim())
            .filter(term => term.length > 0);
        
        // Retorna true se qualquer um dos termos for encontrado
        return terms.some(term => value.includes(term));
    } else {
        // Comportamento original: busca simples por inclusão
        return value.includes(filterStr);
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
    
    // Filtros por coluna (AND cumulativo) - com suporte a múltiplos valores
    const entries = Object.entries(getCurrentColumnFilters());
    if (entries.length > 0) {
        filtered = filtered.filter(row => {
            return entries.every(([col, term]) => {
                const value = row[col] || '';
                return matchesMultipleValues(value, term);
            });
        });
    }
    
    // Filtros específicos - com suporte a múltiplos valores
    const campusFilter = elements.campusFilter ? elements.campusFilter.value : '';
    if (campusFilter) {
        filtered = filtered.filter(row => matchesMultipleValues(row['Sigla Campus'], campusFilter));
    }
    
    const periodoFilter = elements.periodoFilter ? elements.periodoFilter.value : '';
    if (periodoFilter) {
        filtered = filtered.filter(row => matchesMultipleValues(row['Período'], periodoFilter));
    }
    
    const disciplinaFilter = elements.disciplinaFilter ? elements.disciplinaFilter.value : '';
    if (disciplinaFilter) {
        filtered = filtered.filter(row => matchesMultipleValues(row['Nome Disciplina'], disciplinaFilter));
    }
    
    const professorFilter = elements.professorFilter ? elements.professorFilter.value : '';
    if (professorFilter) {
        filtered = filtered.filter(row => matchesMultipleValues(row['Nome Professor'], professorFilter));
    }

    const cursoFilter = elements.cursoFilter ? elements.cursoFilter.value : '';
    if (cursoFilter) {
        filtered = filtered.filter(row => matchesMultipleValues(row['Curso'], cursoFilter));
    }

    const horarioFilter = elements.horarioFilter ? elements.horarioFilter.value : '';
    if (horarioFilter) {
        filtered = filtered.filter(row => matchesMultipleValues(row['Hora'], horarioFilter));
    }
    
    filteredData = filtered;
    elements.filteredRecords.textContent = filteredData.length;
    
    renderTable();
}

// Renderizar tabela
function renderTable() {
    console.log('📋 renderTable iniciado');
    console.log('📊 Estado atual:', {
        filteredDataLength: filteredData.length,
        currentViewMode: currentViewMode,
        currentDataLength: window.currentData ? window.currentData.length : 0,
        currentColumns: window.currentColumns ? window.currentColumns.length : 0
    });
    
    if (filteredData.length === 0) {
        console.log('❌ Nenhum dado filtrado encontrado');
        elements.tableBody.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 20px; color: #666;">Nenhum registro encontrado com os filtros aplicados</td></tr>';
        return;
    }
    
    console.log('✅ Renderizando', filteredData.length, 'registros');
    
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
    // Limpar apenas os filtros do modo atual
    if (elements.searchInput) elements.searchInput.value = '';
    if (elements.campusFilter) elements.campusFilter.value = '';
    if (elements.periodoFilter) elements.periodoFilter.value = '';
    if (elements.disciplinaFilter) elements.disciplinaFilter.value = '';
    if (elements.professorFilter) elements.professorFilter.value = '';
    if (elements.cursoFilter) elements.cursoFilter.value = '';
    if (elements.horarioFilter) elements.horarioFilter.value = '';
    
    // Limpar filtros por coluna + inputs
    filterStates[currentViewMode].columnFilters = {};
    document.querySelectorAll('.column-filter-input').forEach(inp => { inp.value = ''; inp.classList.remove('active'); });
    document.querySelectorAll('thead th').forEach(th => th.classList.remove('column-filter-active'));
    closeActiveDropdown();
    
    // Resetar ordenação
    currentSort = { column: null, direction: 'asc' };
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });
    
    // Limpar também o estado salvo para o modo atual
    filterStates[currentViewMode] = {
        searchInput: '',
        campusFilter: '',
        periodoFilter: '',
        disciplinaFilter: '',
        professorFilter: '',
        cursoFilter: '',
        horarioFilter: '',
        columnFilters: {}
    };
    
    console.log(`🧹 Filtros limpos para modo ${currentViewMode}`);
    
    applyFilters();
}

// Dropdown de sugestões estilo Excel
function showColumnFilterDropdown(inputEl, header) {
    closeActiveDropdown();
    // Base: aplicar todos os filtros exceto o da coluna atual
    const tempFilters = { ...getCurrentColumnFilters() };
    delete tempFilters[header];
    let base = [...allData];
    // Busca global
    const searchTerm = '';
    if (searchTerm) {
        const visibleColumnsList = Array.from(visibleColumns);
        base = base.filter(row => visibleColumnsList.some(c => String(row[c]||'').toLowerCase().includes(searchTerm)));
    }
    // Filtros específicos (sidebar) - null safe - com suporte a múltiplos valores
    const campusFilter = elements.campusFilter ? elements.campusFilter.value : '';
    if (campusFilter) base = base.filter(r => matchesMultipleValues(r['Sigla Campus'], campusFilter));
    const periodoFilter = elements.periodoFilter ? elements.periodoFilter.value : '';
    if (periodoFilter) base = base.filter(r => matchesMultipleValues(r['Período'], periodoFilter));
    const disciplinaFilter = elements.disciplinaFilter ? elements.disciplinaFilter.value : '';
    if (disciplinaFilter) base = base.filter(r => matchesMultipleValues(r['Nome Disciplina'], disciplinaFilter));
    const professorFilter = elements.professorFilter ? elements.professorFilter.value : '';
    if (professorFilter) base = base.filter(r => matchesMultipleValues(r['Nome Professor'], professorFilter));
    const cursoFilter = elements.cursoFilter ? elements.cursoFilter.value : '';
    if (cursoFilter) base = base.filter(r => matchesMultipleValues(r['Curso'], cursoFilter));
    const horarioFilter = elements.horarioFilter ? elements.horarioFilter.value : '';
    if (horarioFilter) base = base.filter(r => matchesMultipleValues(r['Hora'], horarioFilter));
    // Filtros por coluna (exceto atual) - com suporte a múltiplos valores
    const other = Object.entries(tempFilters);
    if (other.length) {
        base = base.filter(row => other.every(([col, term]) => matchesMultipleValues(row[col], term)));
    }

    // Valores únicos
    const uniques = [...new Set(base.map(r => (r[header]||'').trim()).filter(v => v !== ''))]
        .sort((a,b)=>String(a).localeCompare(String(b),'pt-BR'));

    // Filtrar sugestões conforme texto digitado no input - considerando múltiplos valores
    const typed = String(inputEl.value || '').toLowerCase();
    let list;
    if (typed) {
        // Se há ponto e vírgula, filtrar pelo último termo (o que está sendo digitado)
        const lastTerm = typed.includes(';') 
            ? typed.split(';').pop().trim() 
            : typed;
        
        list = lastTerm 
            ? uniques.filter(v => String(v).toLowerCase().includes(lastTerm))
            : uniques;
    } else {
        list = uniques;
    }

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
                
                // Lidar com múltiplos valores separados por ponto e vírgula
                const currentValue = inputEl.value || '';
                let newValue;
                
                if (currentValue.includes(';')) {
                    // Se já há múltiplos valores, substituir o último termo incompleto
                    const terms = currentValue.split(';');
                    const lastTerm = terms[terms.length - 1].trim();
                    
                    if (lastTerm === '' || val.toLowerCase().startsWith(lastTerm.toLowerCase())) {
                        // Se o último termo está vazio ou a sugestão completa o termo atual
                        terms[terms.length - 1] = val;
                        newValue = terms.join(';');
                    } else {
                        // Se é um termo completamente novo, adicionar
                        newValue = currentValue.trim() + ';' + val;
                    }
                } else if (currentValue.trim() === '' || val.toLowerCase().startsWith(currentValue.trim().toLowerCase())) {
                    // Se não há valor ou a sugestão completa o valor atual, substituir
                    newValue = val;
                } else {
                    // Se há um valor e é diferente, substituir (usuário clicou numa opção específica)
                    newValue = val;
                }
                
                inputEl.value = newValue;
                setCurrentColumnFilter(header, newValue);
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
async function resetColumns() {
    if (!allData || allData.length === 0) {
        console.log('⚠️ Nenhum dado disponível para redefinir colunas');
        return;
    }
    
    const headers = Object.keys(allData[0]);
    
    // Redefinir de acordo com o preset atualmente selecionado
    let presetKey = 'PRESET_1_BASICO';
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

    // Obter configuração original do siaa-config (sem customizações)
    const configPreset = getConfigPreset(presetKey, currentViewMode);
    if (configPreset) {
        const validOrder = configPreset.order.filter(h => headers.includes(h));
        const rest = headers.filter(h => !validOrder.includes(h));
        columnOrder = [...validOrder, ...rest];
        visibleColumns = new Set(configPreset.visible.filter(h => headers.includes(h)));
    } else {
        // Fallback se não encontrar no config
    const base = getPresetDefault(presetKey, headers);
    columnOrder = base.order;
    visibleColumns = new Set(base.visible);
    }
    
    // Limpar customizações do storage para este preset
    const storageKey = `siaa_preset_override_${currentViewMode}_${presetKey}`;
    await Storage.set({ [storageKey]: null });
    
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
    await setupColumnToggle();
    updateColumnVisibility();
    renderTable();
    // Sincronizar menu se aberto
    const configDropdown = document.getElementById('columnConfigDropdown');
    if (configDropdown && configDropdown.style.display === 'block') {
        await buildVisibilityAndOrderLists();
    }
    
    // Feedback visual
    console.log('🔄 Colunas redefinidas para o padrão');
    
    // Feedback para o usuário
    const btn = elements.resetColumnsBtn;
    const originalText = btn.textContent;
    const originalBg = btn.style.background;
    const originalColor = btn.style.color;
    btn.textContent = '✅ Redefinido!';
    btn.style.background = 'rgba(255,255,255,0.95)';
    btn.style.color = '#1e293b';
    btn.style.boxShadow = '0 4px 16px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255,255,255,0.4)';
    btn.style.borderLeft = '3px solid #22c55e';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = originalBg;
        btn.style.color = originalColor;
        btn.style.boxShadow = '';
        btn.style.borderLeft = '';
    }, 1500);
}

// Função para salvar automaticamente as customizações do preset atual
async function autoSaveCurrentPreset() {
    if (!currentPresetSelection || !currentPresetSelection.startsWith('__builtin__')) {
        return; // Só salva presets builtin
    }
    
    const key = currentPresetSelection.replace('__builtin__','');
    const headers = Object.keys(allData[0] || {});
    const normalizedOrder = columnOrder.filter(h => headers.includes(h));
    const rest = headers.filter(h => !normalizedOrder.includes(h));
    
    // Criar chave específica para o modo atual
    const storageKey = `siaa_preset_override_${currentViewMode}_${key}`;
    
    const customization = {
        order: [...normalizedOrder, ...rest],
        visible: Array.from(visibleColumns).filter(h => headers.includes(h)),
        widths: { ...columnWidths },
        viewMode: currentViewMode, // Garantir separação
        timestamp: Date.now()
    };
    
    // Salvar no storage com chave específica do modo
    await Storage.set({ [storageKey]: customization });
    
    console.log(`💾 Customização do preset ${key} salva automaticamente para modo ${currentViewMode}`);
}

// DEPRECADO: Salvar preset: sobrescreve em memória o preset fixo selecionado
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
    const originalBg = btn.style.background;
    const originalColor = btn.style.color;
    btn.textContent = '✅ Salvo!';
    btn.style.background = 'rgba(255,255,255,0.95)';
    btn.style.color = '#1e293b';
    btn.style.boxShadow = '0 4px 16px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255,255,255,0.4)';
    btn.style.borderLeft = '3px solid #22c55e';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = originalBg;
        btn.style.color = originalColor;
        btn.style.boxShadow = '';
        btn.style.borderLeft = '';
        }, 1200);
    }
}

// Carregar preset selecionado no header
async function loadSelectedPreset() {
    const selectedPreset = elements.presetSelect.value;
    if (!selectedPreset) {
        return; // Nada selecionado, não faz nada
    }
    currentPresetSelection = selectedPreset;
    // Persistir seleção para sincronizar na próxima carga (específico por modo)
    const storageKey = getPresetStorageKey();
    const storageData = {};
    storageData[storageKey] = currentPresetSelection;
    Storage.set(storageData);
    debouncedAutoSave(); // Salvar estados automaticamente
    if (selectedPreset.startsWith('__builtin__')) {
        const key = selectedPreset.replace('__builtin__','');
        await applyBuiltInPreset(key);
    } else {
    await loadPreset(selectedPreset);
    }
}

async function applyBuiltInPreset(presetKey) {
    const headers = Object.keys(allData[0] || {});
    
    // Primeiro, obter configuração base do siaa-config
    const cfg = getPresetConfig(presetKey, headers);
    if (!cfg) return;
    
    // Verificar se há customizações salvas para este preset no modo atual
    const customizations = await loadPresetCustomizations(presetKey);
    
    if (customizations) {
        // Usar customizações salvas
        columnOrder = customizations.order.filter(h => headers.includes(h));
        visibleColumns = new Set(customizations.visible.filter(h => headers.includes(h)));
        columnWidths = customizations.widths || {};
        console.log(`🎨 Aplicando customizações salvas para preset ${presetKey} (modo: ${currentViewMode})`);
    } else {
        // Usar configuração padrão do siaa-config
    columnOrder = cfg.order;
    visibleColumns = new Set(cfg.visible);
        columnWidths = {};
        console.log(`📋 Aplicando configuração padrão para preset ${presetKey} (modo: ${currentViewMode})`);
    }

    Storage.set({
        viewer_column_order: columnOrder,
        viewer_column_visibility: Array.from(visibleColumns),
        viewer_column_widths: columnWidths
    });

    setupTable();
    await setupColumnToggle();
    updateColumnVisibility();
    renderTable();

    const configDropdown = document.getElementById('columnConfigDropdown');
    if (configDropdown && configDropdown.style.display === 'block') {
        await buildVisibilityAndOrderLists();
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
    await setupColumnToggle();
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
    
    // Obter presets do siaa-config para o modo atual
    const configPresets = getConfigPresets(currentViewMode);
    
    if (!configPresets || Object.keys(configPresets).length === 0) {
        console.warn('⚠️ Nenhum preset encontrado no siaa-config para modo:', currentViewMode);
        return;
    }
    
    // Criar options baseados no siaa-config
    Object.entries(configPresets).forEach(([key, preset]) => {
        const option = document.createElement('option');
        option.value = `__builtin__${key}`;
        option.textContent = preset.name || key;
        option.title = preset.description || preset.name || key;
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
        if (elements.tableBody) elements.tableBody.innerHTML = '';
        if (elements.tableHead) elements.tableHead.innerHTML = '';
        if (elements.filteredRecords) elements.filteredRecords.textContent = '0';
        
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
            const originalBg = clearDataBtn.style.background;
            clearDataBtn.innerHTML = '✅ Dados Limpos!';
            clearDataBtn.style.background = 'rgba(255,255,255,0.95)';
            clearDataBtn.style.color = '#1e293b';
            clearDataBtn.style.boxShadow = '0 4px 16px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255,255,255,0.4)';
            clearDataBtn.style.borderLeft = '3px solid #22c55e';
            
            setTimeout(() => {
                clearDataBtn.innerHTML = originalText;
                clearDataBtn.style.background = originalBg;
                clearDataBtn.style.color = '';
                clearDataBtn.style.boxShadow = '';
                clearDataBtn.style.borderLeft = '';
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

    // ===== FUNCIONALIDADE DE ADICIONAR CURSO =====
    setupAddCourseModal();

    // ===== FUNCIONALIDADE DE MODO DE VISUALIZAÇÃO =====
    setupViewModeToggle();
    
    // ===== FUNCIONALIDADE DE MANUTENÇÃO DE DADOS =====
    setupDataMaintenanceButtons();
}

// Configurar modal de adicionar curso
function setupAddCourseModal() {
    const addCourseBtn = document.getElementById('addCourseBtn');
    const modal = document.getElementById('addCourseModal');
    const closeBtn = document.getElementById('closeCourseModal');
    const cancelBtn = document.getElementById('cancelCourseBtn');
    const saveBtn = document.getElementById('saveCourseBtn');
    const codeInput = document.getElementById('courseCodeInput');
    const nameInput = document.getElementById('courseNameInput');

    if (!addCourseBtn || !modal) return;

    // Abrir modal
    addCourseBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        codeInput.focus();
        codeInput.value = '';
        nameInput.value = '';
    });

    // Fechar modal
    const closeModal = () => {
        modal.style.display = 'none';
        codeInput.value = '';
        nameInput.value = '';
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    // Fechar ao clicar fora do modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });

    // Permitir Enter para salvar
    codeInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveBtn?.click();
        }
    });

    nameInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveBtn?.click();
        }
    });

    // Salvar curso
    saveBtn?.addEventListener('click', async () => {
        const code = codeInput.value.trim();
        
        if (!code) {
            alert('Por favor, digite o código do curso.');
            codeInput.focus();
            return;
        }

        // Validar código (apenas números)
        if (!/^\d+$/.test(code)) {
            alert('O código do curso deve conter apenas números.');
            codeInput.focus();
            return;
        }

        const name = nameInput.value.trim() || `Curso ${code}`;

        try {
            await addCourseToStorage(code, name);
            closeModal();
            
            // Mostrar sucesso
            showNotification(`✅ Curso ${code} adicionado com sucesso!`, 'success');
            
        } catch (error) {
            console.error('Erro ao adicionar curso:', error);
            alert('Erro ao adicionar curso. Tente novamente.');
        }
    });
}

// Adicionar curso ao storage
async function addCourseToStorage(code, name) {
    // Buscar cursos manuais existentes
    const storage = await Storage.get(['siaa_manual_courses']);
    const manualCourses = storage.siaa_manual_courses || [];
    
    // Verificar se já existe
    const exists = manualCourses.find(course => course.codigo === code);
    if (exists) {
        throw new Error(`Curso ${code} já está na lista.`);
    }
    
    // Adicionar novo curso
    const newCourse = {
        codigo: code,
        nome: name,
        manual: true,
        addedAt: Date.now()
    };
    
    manualCourses.push(newCourse);
    
    // Salvar no storage
    await Storage.set({
        siaa_manual_courses: manualCourses
    });
    
    console.log('✅ Curso manual adicionado:', newCourse);
}

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `course-notification course-notification-${type}`;
    notification.textContent = message;
    
    // Estilos inline para a notificação - design sóbrio com sombras
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '14px 20px',
        borderRadius: '8px',
        fontWeight: '500',
        fontSize: '14px',
        zIndex: '10001',
        maxWidth: '320px',
        wordWrap: 'break-word',
        transition: 'all 0.3s ease',
        opacity: '0',
        transform: 'translateY(-20px)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.2)'
    });
    
    // Design sóbrio por tipo usando gradientes sutis e sombras
    if (type === 'success') {
        Object.assign(notification.style, {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            color: '#1e293b',
            boxShadow: '0 8px 32px rgba(34, 197, 94, 0.15), 0 4px 16px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #22c55e'
        });
    } else if (type === 'error') {
        Object.assign(notification.style, {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(254,252,252,0.95) 100%)',
            color: '#1e293b',
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15), 0 4px 16px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #ef4444'
        });
    } else {
        Object.assign(notification.style, {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            color: '#1e293b',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15), 0 4px 16px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #3b82f6'
        });
    }
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ===== SISTEMA DE MODO DE VISUALIZAÇÃO =====

// Estado global do modo
let currentViewMode = 'ofertas'; // 'ofertas' ou 'alunos'

// Estados de filtros separados por modo
let filterStates = {
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

// ===== CONFIGURAÇÃO CENTRALIZADA =====

// Cache da configuração do siaa-config.json
let siaaConfig = null;

// Função para carregar configuração do siaa-config.json
async function loadSiaaConfig() {
    if (siaaConfig) return siaaConfig; // Usar cache se já carregado
    
    try {
        const response = await fetch('/siaa-config.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        siaaConfig = await response.json();
        console.log('✅ Configuração SIAA carregada:', siaaConfig.version);
        return siaaConfig;
    } catch (error) {
        console.error('❌ Erro ao carregar siaa-config.json:', error);
        // Fallback para configuração mínima
        siaaConfig = {
            version: 'fallback',
            presets: {
                ofertas: {},
                alunos: {}
            }
        };
        return siaaConfig;
    }
}

// Função para obter presets do siaa-config
function getConfigPresets(viewMode = null) {
    if (!siaaConfig) {
        console.warn('⚠️ Configuração SIAA não carregada');
        return {};
    }
    
    const mode = viewMode || currentViewMode;
    return siaaConfig.presets?.[mode] || {};
}

// Função para obter preset específico do siaa-config
function getConfigPreset(presetKey, viewMode = null) {
    const presets = getConfigPresets(viewMode);
    return presets[presetKey] || null;
}

// ===== SISTEMA DE PERSISTÊNCIA AUTOMÁTICA =====

// Configurações gerais da aplicação que devem ser persistidas
let appSettings = {
    currentViewMode: 'ofertas',
    lastUpdate: null,
    autoSave: true,
    theme: 'default'
};

// Estados de colunas por modo
let columnStates = {
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

// Estados de presets por modo
let presetStates = {
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

// Função para salvar automaticamente todos os estados
async function autoSaveStates() {
    if (!appSettings.autoSave) return;
    
    try {
        const stateData = {
            // Estados principais
            siaa_app_settings: appSettings,
            siaa_filter_states: filterStates,
            siaa_column_states: columnStates,
            siaa_preset_states: presetStates,
            
            // Modo atual
            siaa_view_mode: currentViewMode,
            
            // Estados específicos do modo atual
            [`viewer_selected_preset_${currentViewMode}`]: presetStates[currentViewMode].currentSelection,
            viewer_column_order: columnStates[currentViewMode].order,
            viewer_column_visibility: columnStates[currentViewMode].visibility,
            viewer_column_widths: columnStates[currentViewMode].widths,
            
            // Timestamp da última atualização
            siaa_states_timestamp: Date.now()
        };
        
        await Storage.set(stateData);
        console.log('✅ Estados salvos automaticamente');
    } catch (error) {
        console.error('❌ Erro ao salvar estados:', error);
    }
}

// Função para carregar todos os estados salvos
async function loadSavedStates() {
    try {
        const keys = [
            'siaa_app_settings',
            'siaa_filter_states',
            'siaa_column_states',
            'siaa_preset_states',
            'siaa_view_mode',
            'siaa_states_timestamp'
        ];
        
        const saved = await Storage.get(keys);
        
        // Carregar configurações da aplicação
        if (saved.siaa_app_settings) {
            appSettings = { ...appSettings, ...saved.siaa_app_settings };
        }
        
        // Carregar estados de filtros
        if (saved.siaa_filter_states) {
            filterStates = { ...filterStates, ...saved.siaa_filter_states };
        }
        
        // Carregar estados de colunas
        if (saved.siaa_column_states) {
            columnStates = { ...columnStates, ...saved.siaa_column_states };
        }
        
        // Carregar estados de presets
        if (saved.siaa_preset_states) {
            presetStates = { ...presetStates, ...saved.siaa_preset_states };
        }
        
        // Carregar modo de visualização
        if (saved.siaa_view_mode) {
            currentViewMode = saved.siaa_view_mode;
            appSettings.currentViewMode = currentViewMode;
        }
        
        console.log('✅ Estados carregados do storage');
        return true;
    } catch (error) {
        console.error('❌ Erro ao carregar estados:', error);
        return false;
    }
}

// Função para sincronizar estados locais com variáveis globais
function syncLocalStates() {
    // Sincronizar estados de colunas do modo atual
    const currentMode = currentViewMode;
    
    // Atualizar variáveis globais com estados salvos
    if (columnStates[currentMode].order.length > 0) {
        columnOrder = [...columnStates[currentMode].order];
    }
    
    if (columnStates[currentMode].visibility.length > 0) {
        visibleColumns = new Set(columnStates[currentMode].visibility);
    }
    
    if (Object.keys(columnStates[currentMode].widths).length > 0) {
        columnWidths = { ...columnStates[currentMode].widths };
    }
    
    if (columnStates[currentMode].sort.column) {
        currentSort = { ...columnStates[currentMode].sort };
    }
    
    // Sincronizar preset atual
    if (presetStates[currentMode].currentSelection) {
        currentPresetSelection = presetStates[currentMode].currentSelection;
    }
}

// Função para atualizar estados com variáveis globais atuais
function updateStatesFromGlobals() {
    const currentMode = currentViewMode;
    
    // Atualizar estados de colunas
    columnStates[currentMode].order = [...columnOrder];
    columnStates[currentMode].visibility = Array.from(visibleColumns);
    columnStates[currentMode].widths = { ...columnWidths };
    columnStates[currentMode].sort = { ...currentSort };
    
    // Atualizar preset atual
    presetStates[currentMode].currentSelection = currentPresetSelection;
    
    // Atualizar configurações da aplicação
    appSettings.currentViewMode = currentViewMode;
    appSettings.lastUpdate = Date.now();
}

// Debounce para evitar salvamentos excessivos
let autoSaveTimeout = null;
function debouncedAutoSave() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(async () => {
        updateStatesFromGlobals();
        await autoSaveStates();
    }, 1000); // Salvar após 1 segundo de inatividade
}

// Função para forçar salvamento imediato
async function forceSave() {
    updateStatesFromGlobals();
    await autoSaveStates();
}

// Função para obter os filtros de coluna do modo atual
function getCurrentColumnFilters() {
    return filterStates[currentViewMode].columnFilters;
}

// Função para definir um filtro de coluna no modo atual
function setCurrentColumnFilter(header, value) {
    if (value) {
        filterStates[currentViewMode].columnFilters[header] = value;
    } else {
        delete filterStates[currentViewMode].columnFilters[header];
    }
    debouncedAutoSave(); // Salvar estados automaticamente
}

// Salvar estado atual dos filtros
function saveCurrentFilterState() {
    const currentState = filterStates[currentViewMode];
    
    // Salvar filtros da sidebar
    if (elements.searchInput) currentState.searchInput = elements.searchInput.value;
    if (elements.campusFilter) currentState.campusFilter = elements.campusFilter.value;
    if (elements.periodoFilter) currentState.periodoFilter = elements.periodoFilter.value;
    if (elements.disciplinaFilter) currentState.disciplinaFilter = elements.disciplinaFilter.value;
    if (elements.professorFilter) currentState.professorFilter = elements.professorFilter.value;
    if (elements.cursoFilter) currentState.cursoFilter = elements.cursoFilter.value;
    if (elements.horarioFilter) currentState.horarioFilter = elements.horarioFilter.value;
    
    // Salvar filtros de colunas
    currentState.columnFilters = { ...getCurrentColumnFilters() };
    
    debouncedAutoSave(); // Salvar estados automaticamente
    
    console.log(`💾 Estado de filtros salvo para modo ${currentViewMode}:`, currentState);
}

// Restaurar estado dos filtros
function restoreFilterState() {
    const currentState = filterStates[currentViewMode];
    
    // Restaurar filtros da sidebar
    if (elements.searchInput) elements.searchInput.value = currentState.searchInput || '';
    if (elements.campusFilter) elements.campusFilter.value = currentState.campusFilter || '';
    if (elements.periodoFilter) elements.periodoFilter.value = currentState.periodoFilter || '';
    if (elements.disciplinaFilter) elements.disciplinaFilter.value = currentState.disciplinaFilter || '';
    if (elements.professorFilter) elements.professorFilter.value = currentState.professorFilter || '';
    if (elements.cursoFilter) elements.cursoFilter.value = currentState.cursoFilter || '';
    if (elements.horarioFilter) elements.horarioFilter.value = currentState.horarioFilter || '';
    
    // Garantir que os filtros de colunas estão sincronizados
    filterStates[currentViewMode].columnFilters = { ...currentState.columnFilters };
    
    // Limpar todos os filtros visuais de colunas primeiro
    document.querySelectorAll('.column-filter-input').forEach(inp => {
        inp.value = '';
        inp.classList.remove('active');
    });
    document.querySelectorAll('thead th').forEach(th => {
        th.classList.remove('column-filter-active');
    });
    
    // Aplicar estilos visuais aos filtros de colunas ativos do modo atual
    const table = document.querySelector('#csvTable');
    if (table) {
        const headers = table.querySelectorAll('thead th');
        headers.forEach(th => {
            const headerText = th.textContent.trim();
            const input = th.querySelector('input[type="text"]');
            const filterValue = getCurrentColumnFilters()[headerText];
            
            if (input) {
                if (filterValue) {
                    input.value = filterValue;
                    toggleFilterActiveStyles(headerText, th, input);
                } else {
                    input.value = '';
                    th.classList.remove('column-filter-active');
                    input.classList.remove('active');
                }
            }
        });
    }
    
    console.log(`🔄 Estado de filtros restaurado para modo ${currentViewMode}:`, currentState);
    console.log(`📊 Filtros de coluna ativos para ${currentViewMode}:`, getCurrentColumnFilters());
}

// Configurar alternância de modo de visualização
function setupViewModeToggle() {
    console.log('🔧 setupViewModeToggle iniciado');
    
    const switchToOfertasBtn = document.getElementById('switchToOfertas');
    const switchToAlunosBtn = document.getElementById('switchToAlunos');
    
    if (!switchToOfertasBtn || !switchToAlunosBtn) {
        console.log('❌ Botões de switch não encontrados!');
        return;
    }
    
    console.log('✅ Botões de switch encontrados');

    // Carregar modo salvo
    loadViewMode();

    // Evento do botão Ofertas
    switchToOfertasBtn.addEventListener('click', async () => {
        console.log('🔄 Switch para ofertas clicado');
        if (currentViewMode !== 'ofertas') {
            // Salvar estado atual antes de trocar
            saveCurrentFilterState();
            await switchToOffersMode();
        }
    });
    
    // Evento do botão Alunos
    switchToAlunosBtn.addEventListener('click', async () => {
        console.log('🔄 Switch para alunos clicado');
        if (currentViewMode !== 'alunos') {
            // Salvar estado atual antes de trocar
            saveCurrentFilterState();
            await switchToStudentsMode();
        }
    });
    
    console.log('✅ setupViewModeToggle concluído');
}

// Obter chave de storage específica para preset baseada no modo
function getPresetStorageKey() {
    return `viewer_selected_preset_${currentViewMode}`;
}

// Carregar preset específico do modo atual
async function loadModeSpecificPreset() {
    try {
        const presetKey = getPresetStorageKey();
        const sel = await Storage.get([presetKey]);
        const savedPreset = sel[presetKey] || '__builtin__PRESET_1_BASICO';
        
        console.log(`🎛️ Carregando preset para modo ${currentViewMode}:`, savedPreset);
        
        currentPresetSelection = savedPreset;
        
        // Atualizar o select
        if (elements.presetSelect) {
            elements.presetSelect.value = savedPreset;
        }
        
        // Aplicar o preset se for builtin
        if (savedPreset.startsWith('__builtin__')) {
            const key = savedPreset.replace('__builtin__','');
            await applyBuiltInPreset(key);
        } else {
            await loadPreset(savedPreset);
        }
        
        console.log(`✅ Preset ${savedPreset} aplicado para modo ${currentViewMode}`);
    } catch (error) {
        console.error('❌ Erro ao carregar preset específico do modo:', error);
    }
}

// Carregar modo de visualização do storage
async function loadViewMode() {
    try {
        console.log('🔄 loadViewMode iniciado');
        
        const storage = await Storage.get(['siaa_view_mode']);
        const savedMode = storage.siaa_view_mode || 'ofertas';
        
        console.log('📦 Modo salvo encontrado:', savedMode);
        
        if (savedMode === 'alunos') {
            console.log('🔄 Carregando modo alunos...');
            await switchToStudentsMode(false); // false = não salvar novamente
        } else {
            console.log('🔄 Carregando modo ofertas...');
            await switchToOffersMode(false);
        }
        
        console.log('✅ loadViewMode concluído');
    } catch (error) {
        console.error('❌ Erro ao carregar modo:', error);
        await switchToOffersMode(false);
    }
}

// Alternar para modo de ofertas
async function switchToOffersMode(save = true) {
    currentViewMode = 'ofertas';
    
    const switchToOfertasBtn = document.getElementById('switchToOfertas');
    const switchToAlunosBtn = document.getElementById('switchToAlunos');
    const title = document.querySelector('.app-title');
    
    // Atualizar interface dos botões
    if (switchToOfertasBtn && switchToAlunosBtn) {
        switchToOfertasBtn.classList.add('active');
        switchToAlunosBtn.classList.remove('active');
    }
    
    if (title) {
        title.textContent = 'Visualizador SIAA';
    }
    
    // Salvar no storage
    if (save) {
        await Storage.set({ siaa_view_mode: 'ofertas' });
        await forceSave(); // Forçar salvamento completo ao mudar modo
    }
    
    // Recarregar dados de ofertas
    await loadData();
    
    // Carregar preset específico do modo ofertas
    await loadModeSpecificPreset();
    
    // Garantir que a tabela seja exibida (caso tenha dados)
    if (allData && allData.length > 0) {
        showData();
    }
    
    console.log('📊 Modo alterado para: Ofertas');
}

// Alternar para modo de alunos
async function switchToStudentsMode(save = true) {
    currentViewMode = 'alunos';
    
    const switchToOfertasBtn = document.getElementById('switchToOfertas');
    const switchToAlunosBtn = document.getElementById('switchToAlunos');
    const title = document.querySelector('.app-title');
    
    // Atualizar interface dos botões
    if (switchToOfertasBtn && switchToAlunosBtn) {
        switchToOfertasBtn.classList.remove('active');
        switchToAlunosBtn.classList.add('active');
    }
    
    if (title) {
        title.textContent = 'Visualizador SIAA';
    }
    
    // Salvar no storage
    if (save) {
        await Storage.set({ siaa_view_mode: 'alunos' });
        await forceSave(); // Forçar salvamento completo ao mudar modo
    }
    
    // Verificar se há dados de alunos
    console.log('🔍 Verificando dados de alunos no storage...');
    const studentData = await Storage.get(['siaa_students_csv']);
    
    console.log('📦 Storage resultado:', {
        hasStudentsData: !!studentData.siaa_students_csv,
        dataSize: studentData.siaa_students_csv ? studentData.siaa_students_csv.length : 0
    });
    
    if (!studentData.siaa_students_csv) {
        // Não há dados de alunos - mostrar opção de capturar
        console.log('❌ Nenhum dado de aluno encontrado - chamando showStudentCaptureOption');
        showStudentCaptureOption();
    } else {
        // Carregar dados de alunos
        console.log('✅ Dados encontrados - chamando loadStudentData...');
        await loadStudentData();
    }
    
    // Carregar preset específico do modo alunos
    await loadModeSpecificPreset();
    
    // Restaurar estado dos filtros específicos para alunos
    restoreFilterState();
    
    console.log('👥 Modo alterado para: Alunos');
}

// Alternar para modo de ofertas
async function switchToOffersMode(save = true) {
    console.log('🔄 switchToOffersMode iniciado, save:', save);
    
    currentViewMode = 'ofertas';
    
    const switchToOfertasBtn = document.getElementById('switchToOfertas');
    const switchToAlunosBtn = document.getElementById('switchToAlunos');
    const title = document.querySelector('.app-title');
    
    console.log('🎛️ Elementos encontrados:', {
        switchToOfertasBtn: !!switchToOfertasBtn,
        switchToAlunosBtn: !!switchToAlunosBtn,
        title: !!title
    });
    
    // Atualizar interface dos botões
    if (switchToOfertasBtn && switchToAlunosBtn) {
        switchToOfertasBtn.classList.add('active');
        switchToAlunosBtn.classList.remove('active');
        console.log('✅ Botões atualizados para modo ofertas');
    }
    
    if (title) {
        title.textContent = 'Visualizador SIAA';
        console.log('✅ Título atualizado para modo ofertas');
    }
    
    // Salvar no storage
    if (save) {
        await Storage.set({ siaa_view_mode: 'ofertas' });
        console.log('✅ Modo ofertas salvo no storage');
    }
    
    // Recarregar presets para modo ofertas
    await loadPresetsSelect();
    
    // Verificar se existem dados de ofertas
    console.log('🔍 Verificando dados de ofertas no storage...');
    const storage = await Storage.get(['siaa_data_csv']);
    
    console.log('📦 Storage resultado:', {
        hasOffersData: !!storage.siaa_data_csv,
        dataSize: storage.siaa_data_csv ? storage.siaa_data_csv.length : 0
    });
    
    if (!storage.siaa_data_csv) {
        // Não há dados de ofertas - mostrar mensagem
        console.log('❌ Nenhum dado de ofertas encontrado - mostrando mensagem');
        showNoData();
    } else {
        // Carregar dados de ofertas
        console.log('✅ Dados encontrados - carregando dados de ofertas...');
        await loadData();
        
        // Carregar preset específico do modo ofertas
        await loadModeSpecificPreset();
        
        // Garantir que a tabela seja exibida
        showData();
        
        // Restaurar estado dos filtros específicos para ofertas
        restoreFilterState();
    }
    
    console.log('📊 Modo alterado para: Ofertas');
}

// Mostrar opção de capturar dados de alunos
function showStudentCaptureOption() {
    // Usar a função showNoData que agora é dinâmica baseada no modo
    showNoData();
}

// Carregar dados de alunos existentes
async function loadStudentData() {
    try {
        console.log('🔄 Carregando dados de alunos...');
        const storage = await Storage.get(['siaa_students_csv', 'siaa_students_timestamp']);
        
        if (!storage.siaa_students_csv) {
            console.log('❌ Dados não encontrados');
            showStudentCaptureOption();
            return;
        }
        
        console.log('📄 CSV encontrado, processando...');
        console.log('📄 CSV size:', storage.siaa_students_csv.length);
        console.log('📄 CSV preview:', storage.siaa_students_csv.substring(0, 200));
        
        // Processar CSV de alunos
        const studentData = parseCSV(storage.siaa_students_csv);
        console.log('📊 Dados processados:', {
            totalStudents: studentData.length,
            firstRecord: studentData[0],
            hasValidData: studentData.length > 0 && typeof studentData[0] === 'object'
        });
        
        if (studentData.length === 0) {
            console.log('❌ CSV vazio ou mal formatado');
            showStudentCaptureOption();
            return;
        }
        
        // Configurar dados globais para alunos
        window.currentData = studentData;
        window.currentColumns = studentData.length > 0 ? Object.keys(studentData[0]) : [];
        
        // IMPORTANTE: Atualizar allData para que renderTable funcione
        allData = studentData;
        
        console.log('🗂️ Colunas detectadas:', window.currentColumns);
        console.log('🔄 Configurando dados para renderização...');
        
        // Recarregar presets para modo alunos
        await loadPresetsSelect();
        
        // Aplicar preset padrão para alunos (Preset 1)
        await applyBuiltInPreset('PRESET_1_BASICO');
        
        // Atualizar selector de preset para mostrar o preset selecionado
        elements.presetSelect.value = '__builtin__PRESET_1_BASICO';
        
        // Atualizar contadores do header
        await updateHeaderCounters();

        // Configurar tabela e filtros para dados de alunos
        finishDataLoading();
        
        console.log('✅ Dados de alunos configurados e renderizados');
        
        // Atualizar timestamp
        if (storage.siaa_students_timestamp) {
            const dateStr = new Date(storage.siaa_students_timestamp).toLocaleString('pt-BR');
            elements.sidebarLastUpdate.textContent = dateStr;
        } else {
            elements.sidebarLastUpdate.textContent = 'Não disponível';
        }
        
        console.log(`📊 Dados de alunos carregados: ${studentData.length} registros`);
        
        // Garantir que a tabela seja exibida
        showData();
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados de alunos:', error);
        showStudentCaptureOption();
    }
}

// ===== FUNCIONALIDADE DE MANUTENÇÃO DE DADOS =====

// Configurar botões de manutenção de dados
function setupDataMaintenanceButtons() {
    const clearDuplicatesBtn = document.getElementById('clearDuplicatesBtn');
    const resetDataBtn = document.getElementById('resetDataBtn');
    
    if (clearDuplicatesBtn) {
        clearDuplicatesBtn.addEventListener('click', async () => {
            await clearDuplicatesFromStorage();
        });
    }
    
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', async () => {
            if (confirm('🗑️ ATENÇÃO: Esta ação irá REMOVER TODOS OS DADOS armazenados!\n\nSerão deletados:\n• Todos os dados de ofertas\n• Todos os dados de alunos\n• Todos os cursos manuais\n• Todas as configurações\n\nEsta ação NÃO PODE ser desfeita!\n\nTem certeza que deseja continuar?')) {
                await resetAllData();
            }
        });
    }
}

// Função para limpar duplicatas dos dados armazenados
async function clearDuplicatesFromStorage() {
    try {
        showNotification('🔄 Analisando duplicatas...', 'info');
        
        const storage = await Storage.get(['siaa_data_csv', 'siaa_students_csv']);
        const duplicatesInfo = [];
        
        // Analisar duplicatas de ofertas
        if (storage.siaa_data_csv) {
            const duplicates = await findDuplicatesInCSV(storage.siaa_data_csv, 'ofertas');
            if (duplicates.length > 0) {
                duplicatesInfo.push({
                    type: 'ofertas',
                    duplicates: duplicates,
                    csv: storage.siaa_data_csv
                });
            }
        }
        
        // Analisar duplicatas de alunos
        if (storage.siaa_students_csv) {
            const duplicates = await findDuplicatesInCSV(storage.siaa_students_csv, 'alunos');
            if (duplicates.length > 0) {
                duplicatesInfo.push({
                    type: 'alunos',
                    duplicates: duplicates,
                    csv: storage.siaa_students_csv
                });
            }
        }
        
        if (duplicatesInfo.length > 0) {
            // Mostrar diálogo com as duplicatas encontradas para seleção manual
            const selectedForRemoval = await showDuplicatesDialog(duplicatesInfo);
            if (selectedForRemoval && selectedForRemoval.length > 0) {
                await removeSelectedDuplicates(selectedForRemoval);
            } else if (selectedForRemoval && selectedForRemoval.length === 0) {
                showNotification('ℹ️ Nenhum registro foi selecionado para remoção', 'info');
            }
            // Se selectedForRemoval for null, o usuário cancelou
        } else {
            showNotification('ℹ️ Nenhuma duplicata encontrada nos dados', 'info');
        }
        
    } catch (error) {
        console.error('❌ Erro ao analisar duplicatas:', error);
        showNotification('❌ Erro ao analisar duplicatas', 'error');
    }
}

// Função para encontrar duplicatas em um CSV (sem removê-las)
async function findDuplicatesInCSV(csvData, type) {
    const cleanCsv = csvData.replace(/^\uFEFF/, '');
    const lines = cleanCsv.split('\n').filter(line => line.trim());
    
    if (lines.length <= 1) return [];
    
    const header = lines[0];
    const data = lines.slice(1);
    const headerFields = header.split(',');
    
    let keyIndex;
    let keyName;
    if (type === 'ofertas') {
        keyIndex = headerFields.findIndex(field => 
            field.includes('ID Oferta') || field.includes('ID') || field.includes('Oferta')
        );
        keyName = 'ID Oferta';
    } else if (type === 'alunos') {
        // Para alunos, vamos usar uma combinação de Nome + Código Campus
        const nomeIndex = headerFields.findIndex(field => 
            field.includes('Nome') && !field.includes('Professor') && !field.includes('Curso')
        );
        const campusCodigoIndex = headerFields.findIndex(field => 
            field.includes('Código Campus') || field.includes('Cód. Campus')
        );
        
        if (nomeIndex === -1 || campusCodigoIndex === -1) {
            // Fallback para RGM se não encontrar os campos necessários
        keyIndex = headerFields.findIndex(field => 
            field.includes('RGM') || field.includes('Registro')
        );
        keyName = 'RGM';
        } else {
            // Usar combinação Nome + Código Campus
            keyIndex = -2; // Valor especial para indicar chave combinada
            keyName = 'Nome + Campus';
        }
    }
    
    if (keyIndex === -1) return [];
    
    const duplicatesMap = new Map();
    const allOccurrences = new Map(); // Para armazenar TODAS as ocorrências, incluindo a primeira
    
    data.forEach((line, index) => {
        const fields = line.split(',');
        let key = '';
        
        if (keyIndex === -2 && type === 'alunos') {
            // Chave combinada para alunos: Nome + Código Campus
            const nomeIndex = headerFields.findIndex(field => 
                field.includes('Nome') && !field.includes('Professor') && !field.includes('Curso')
            );
            const campusCodigoIndex = headerFields.findIndex(field => 
                field.includes('Código Campus') || field.includes('Cód. Campus')
            );
            
            const nome = fields[nomeIndex] ? fields[nomeIndex].trim() : '';
            const campusCodigo = fields[campusCodigoIndex] ? fields[campusCodigoIndex].trim() : '';
            
            if (nome && campusCodigo) {
                key = `${nome}|${campusCodigo}`; // Usar | como separador
            }
        } else if (keyIndex >= 0) {
            key = fields[keyIndex] ? fields[keyIndex].trim() : '';
        }
        
        if (key) {
            if (!allOccurrences.has(key)) {
                allOccurrences.set(key, []);
            }
            
            // Criar objeto com dados mais detalhados
            const recordData = {
                lineIndex: index + 2, // +2 porque começamos do índice 1 e há o cabeçalho
                originalLineIndex: index + 1, // Para referência na remoção
                line: line,
                fields: fields,
                key: key,
                displayData: {} // Para mostrar dados importantes do registro
            };
            
            // Extrair dados importantes para exibição
            if (type === 'ofertas') {
                recordData.displayData = {
                    disciplina: fields[headerFields.findIndex(f => f.includes('Nome Disciplina') || f.includes('Disciplina'))] || '',
                    professor: fields[headerFields.findIndex(f => f.includes('Nome Professor') || f.includes('Professor'))] || '',
                    campus: fields[headerFields.findIndex(f => f.includes('Sigla Campus') || f.includes('Campus'))] || '',
                    periodo: fields[headerFields.findIndex(f => f.includes('Período') || f.includes('Periodo'))] || '',
                    sala: fields[headerFields.findIndex(f => f.includes('Sala'))] || '',
                    horario: fields[headerFields.findIndex(f => f.includes('Hora'))] || ''
                };
            } else if (type === 'alunos') {
                recordData.displayData = {
                    nome: fields[headerFields.findIndex(f => f.includes('Nome') && !f.includes('Professor') && !f.includes('Curso'))] || '',
                    curso: fields[headerFields.findIndex(f => f.includes('Nome do Curso') || (f.includes('Curso') && !f.includes('Código')))] || '',
                    campusCodigo: fields[headerFields.findIndex(f => f.includes('Código Campus') || f.includes('Cód. Campus'))] || '',
                    siglaCampus: fields[headerFields.findIndex(f => f.includes('Sigla Campus'))] || '',
                    situacao: fields[headerFields.findIndex(f => f.includes('Situação') || f.includes('Status'))] || '',
                    rgm: fields[headerFields.findIndex(f => f.includes('RGM'))] || ''
                };
            }
            
            allOccurrences.get(key).push(recordData);
        }
    });
    
    // Filtrar apenas chaves que têm duplicatas
    const duplicates = [];
    for (const [key, occurrences] of allOccurrences) {
        if (occurrences.length > 1) {
            duplicates.push({
                key: key,
                keyName: keyName,
                count: occurrences.length,
                allOccurrences: occurrences // Todas as ocorrências para seleção
            });
        }
    }
    
    return duplicates;
}

// Função para remover duplicatas de um CSV
async function removeDuplicatesFromCSV(csvData, type) {
    const cleanCsv = csvData.replace(/^\uFEFF/, '');
    const lines = cleanCsv.split('\n').filter(line => line.trim());
    
    if (lines.length <= 1) return { csv: csvData, duplicatesRemoved: 0 };
    
    const header = lines[0];
    const data = lines.slice(1);
    const headerFields = header.split(',');
    
    let keyIndex;
    if (type === 'ofertas') {
        keyIndex = headerFields.findIndex(field => 
            field.includes('ID Oferta') || field.includes('ID') || field.includes('Oferta')
        );
    } else if (type === 'alunos') {
        // Para alunos, vamos usar uma combinação de Nome + Código Campus
        const nomeIndex = headerFields.findIndex(field => 
            field.includes('Nome') && !field.includes('Professor') && !field.includes('Curso')
        );
        const campusCodigoIndex = headerFields.findIndex(field => 
            field.includes('Código Campus') || field.includes('Cód. Campus')
        );
        
        if (nomeIndex === -1 || campusCodigoIndex === -1) {
            // Fallback para RGM se não encontrar os campos necessários
        keyIndex = headerFields.findIndex(field => 
            field.includes('RGM') || field.includes('Registro')
        );
        } else {
            // Usar combinação Nome + Código Campus
            keyIndex = -2; // Valor especial para indicar chave combinada
        }
    }
    
    if (keyIndex === -1) return { csv: csvData, duplicatesRemoved: 0 };
    
    const seen = new Set();
    const uniqueData = [];
    let duplicatesRemoved = 0;
    
    data.forEach(line => {
        const fields = line.split(',');
        let key = '';
        
        if (keyIndex === -2 && type === 'alunos') {
            // Chave combinada para alunos: Nome + Código Campus
            const nomeIndex = headerFields.findIndex(field => 
                field.includes('Nome') && !field.includes('Professor') && !field.includes('Curso')
            );
            const campusCodigoIndex = headerFields.findIndex(field => 
                field.includes('Código Campus') || field.includes('Cód. Campus')
            );
            
            const nome = fields[nomeIndex] ? fields[nomeIndex].trim() : '';
            const campusCodigo = fields[campusCodigoIndex] ? fields[campusCodigoIndex].trim() : '';
            
            if (nome && campusCodigo) {
                key = `${nome}|${campusCodigo}`; // Usar | como separador
            }
        } else if (keyIndex >= 0) {
            key = fields[keyIndex] ? fields[keyIndex].trim() : '';
        }
        
        if (!key || !seen.has(key)) {
            if (key) seen.add(key);
            uniqueData.push(line);
        } else {
            duplicatesRemoved++;
        }
    });
    
    const finalCsv = '\uFEFF' + [header, ...uniqueData].join('\n');
    return { csv: finalCsv, duplicatesRemoved };
}

// Função para mostrar diálogo de duplicatas com seleção manual
async function showDuplicatesDialog(duplicatesInfo) {
    return new Promise((resolve) => {
        // Criar modal de duplicatas
        const modal = document.createElement('div');
        modal.id = 'duplicatesModal';
        modal.className = 'course-modal';
        modal.style.display = 'flex';
        
        const content = document.createElement('div');
        content.className = 'course-modal-content';
        content.style.maxWidth = '95vw';
        content.style.maxHeight = '90vh';
        content.style.width = '900px';
        
        // Header
        const header = document.createElement('div');
        header.className = 'course-modal-header';
        header.innerHTML = `
            <h3>🔍 Selecionar Duplicatas para Remoção</h3>
            <button id="closeDuplicatesModal" class="course-modal-close">&times;</button>
        `;
        
        // Body
        const body = document.createElement('div');
        body.className = 'course-modal-body';
        body.style.maxHeight = '60vh';
        body.style.overflowY = 'auto';
        body.style.padding = '15px';
        
        let bodyContent = `
            <div style="background: rgba(248,250,252,0.6); border: 1px solid rgba(203,213,225,0.4); border-radius: 8px; padding: 16px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <p style="margin: 0; color: #334155;"><strong>📝 Instruções:</strong> Para cada grupo de duplicatas, <span style="color: #475569; font-weight: 600; background: rgba(239,68,68,0.1); padding: 2px 6px; border-radius: 4px; border-left: 3px solid #ef4444;">marque quais registros você deseja REMOVER</span>. Pelo menos um registro deve permanecer desmarcado (será mantido).</p>
            </div>
        `;
        
        let duplicateIndex = 0;
        
        duplicatesInfo.forEach(info => {
            const typeLabel = info.type === 'ofertas' ? 'Ofertas' : 'Alunos';
            bodyContent += `<h4 style="color: #2c3e50; margin: 20px 0 10px 0;">📋 ${typeLabel}:</h4>`;
            
            info.duplicates.forEach(duplicate => {
                bodyContent += `
                    <div class="duplicate-group" style="background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 8px; padding: 15px; margin: 10px 0;">
                        <h5 style="color: #495057; margin: 0 0 12px 0;">
                            <strong>${duplicate.keyName}: ${info.type === 'alunos' && duplicate.key.includes('|') ? duplicate.key.replace('|', ' - Campus: ') : duplicate.key}</strong>
                            <span style="color: #6c757d; font-size: 14px; font-weight: normal;">
                                (${duplicate.count} ocorrências encontradas)
                            </span>
                        </h5>
                        
                        <div style="background: white; border-radius: 6px; overflow: hidden;">
                `;
                
                duplicate.allOccurrences.forEach((occurrence, occIndex) => {
                    const checkboxId = `duplicate_${duplicateIndex}_${occIndex}`;
                    const displayInfo = occurrence.displayData;
                    
                    let displayText = '';
                    if (info.type === 'ofertas') {
                        displayText = `
                            <strong>${displayInfo.disciplina}</strong><br>
                            👨‍🏫 ${displayInfo.professor} | 🏛️ ${displayInfo.campus} | 
                            📅 ${displayInfo.periodo} | 🚪 ${displayInfo.sala} | 
                            🕐 ${displayInfo.horario}
                        `;
                    } else if (info.type === 'alunos') {
                        displayText = `
                            <strong>${displayInfo.nome}</strong><br>
                            🎓 ${displayInfo.curso} | 🏛️ Campus: ${displayInfo.campusCodigo}${displayInfo.siglaCampus ? ` (${displayInfo.siglaCampus})` : ''} | 
                            📊 ${displayInfo.situacao} | 🆔 RGM: ${displayInfo.rgm}
                        `;
                    }
                    
                    bodyContent += `
                        <div style="display: flex; align-items: flex-start; padding: 12px; border-bottom: 1px solid #f0f0f0; ${occIndex === duplicate.allOccurrences.length - 1 ? 'border-bottom: none;' : ''}">
                            <div style="margin-right: 12px; margin-top: 2px;">
                                <input type="checkbox" id="${checkboxId}" 
                                       data-duplicate-group="${duplicateIndex}" 
                                       data-line-index="${occurrence.originalLineIndex}" 
                                       data-type="${info.type}"
                                       style="transform: scale(1.2);">
                            </div>
                            <label for="${checkboxId}" style="flex: 1; cursor: pointer; line-height: 1.4;">
                                <div style="font-size: 13px; color: #333;">
                                    ${displayText}
                                </div>
                                <div style="font-size: 11px; color: #999; margin-top: 4px;">
                                    Linha ${occurrence.lineIndex} no arquivo
                                </div>
                            </label>
                        </div>
                    `;
                });
                
                bodyContent += `
                        </div>
                        <div style="margin-top: 8px; padding: 8px; background: #e9ecef; border-radius: 4px; font-size: 12px; color: #495057;">
                            💡 <strong>Dica:</strong> Deixe pelo menos um registro desmarcado para manter.
                        </div>
                    </div>
                `;
                
                duplicateIndex++;
            });
        });
        
        // Adicionar botões de seleção rápida
        bodyContent += `
            <div style="background: rgba(248,250,252,0.6); border: 1px solid rgba(203,213,225,0.4); border-radius: 8px; padding: 16px; margin: 15px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <strong style="color: #334155;">⚡ Ações Rápidas:</strong><br>
                <button id="selectAllDuplicates" class="course-btn" style="background: rgba(255,255,255,0.9); color: #475569; border: 1px solid rgba(203,213,225,0.6); margin: 8px 5px 5px 0; padding: 6px 12px; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.06); border-radius: 6px;">
                    Marcar Todas as Duplicatas (exceto primeiras)
                </button>
                <button id="clearAllSelections" class="course-btn" style="background: rgba(255,255,255,0.9); color: #475569; border: 1px solid rgba(203,213,225,0.6); margin: 5px; padding: 6px 12px; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.06); border-radius: 6px;">
                    Desmarcar Todas
                </button>
            </div>
        `;
        
        body.innerHTML = bodyContent;
        
        // Footer
        const footer = document.createElement('div');
        footer.className = 'course-modal-footer';
        footer.innerHTML = `
            <div style="flex: 1; text-align: left; color: #6c757d; font-size: 14px;">
                <span id="selectionCount">0 registros selecionados para remoção</span>
            </div>
            <button id="cancelDuplicatesBtn" class="course-btn course-btn-secondary">❌ Cancelar</button>
            <button id="removeDuplicatesBtn" class="course-btn course-btn-primary" style="background: rgba(248,250,252,0.9); color: #475569; border: 1px solid rgba(203,213,225,0.6); box-shadow: 0 2px 8px rgba(239,68,68,0.15), 0 1px 3px rgba(0,0,0,0.1); border-left: 3px solid #ef4444;" disabled>🗑️ Remover Selecionados</button>
        `;
        
        content.appendChild(header);
        content.appendChild(body);
        content.appendChild(footer);
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Funções auxiliares
        const updateSelectionCount = () => {
            const selectedCheckboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
            const count = selectedCheckboxes.length;
            const countDisplay = document.getElementById('selectionCount');
            const removeBtn = document.getElementById('removeDuplicatesBtn');
            
            countDisplay.textContent = `${count} registros selecionados para remoção`;
            removeBtn.disabled = count === 0;
            
            // Verificar se algum grupo ficaria sem registros
            const groups = new Set();
            selectedCheckboxes.forEach(cb => groups.add(cb.dataset.duplicateGroup));
            
            let hasInvalidGroup = false;
            groups.forEach(groupId => {
                const groupCheckboxes = modal.querySelectorAll(`input[data-duplicate-group="${groupId}"]`);
                const groupChecked = modal.querySelectorAll(`input[data-duplicate-group="${groupId}"]:checked`);
                if (groupCheckboxes.length === groupChecked.length) {
                    hasInvalidGroup = true;
                }
            });
            
            if (hasInvalidGroup) {
                countDisplay.innerHTML = `<span style="color: #dc3545;">${count} selecionados - ⚠️ Atenção: Pelo menos um registro deve permanecer em cada grupo!</span>`;
                removeBtn.disabled = true;
            }
        };
        
        // Event listeners para checkboxes
        modal.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                updateSelectionCount();
            }
        });
        
        // Event listeners para botões de ação rápida
        document.getElementById('selectAllDuplicates').addEventListener('click', () => {
            const allGroups = new Set();
            modal.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                allGroups.add(cb.dataset.duplicateGroup);
            });
            
            allGroups.forEach(groupId => {
                const groupCheckboxes = modal.querySelectorAll(`input[data-duplicate-group="${groupId}"]`);
                groupCheckboxes.forEach((cb, index) => {
                    if (index > 0) { // Manter o primeiro desmarcado
                        cb.checked = true;
                    }
                });
            });
            updateSelectionCount();
        });
        
        document.getElementById('clearAllSelections').addEventListener('click', () => {
            modal.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
            updateSelectionCount();
        });
        
        // Event listeners principais
        const closeBtn = document.getElementById('closeDuplicatesModal');
        const cancelBtn = document.getElementById('cancelDuplicatesBtn');
        const removeBtn = document.getElementById('removeDuplicatesBtn');
        
        const closeModal = () => {
            document.body.removeChild(modal);
            resolve(null);
        };
        
        const confirmRemoval = () => {
            const selectedCheckboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
            const selectedForRemoval = [];
            
            selectedCheckboxes.forEach(cb => {
                selectedForRemoval.push({
                    type: cb.dataset.type,
                    lineIndex: parseInt(cb.dataset.lineIndex)
                });
            });
            
            document.body.removeChild(modal);
            resolve(selectedForRemoval);
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        removeBtn.addEventListener('click', confirmRemoval);
        
        // Fechar ao clicar fora do modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Inicializar contagem
        updateSelectionCount();
    });
}

// Função para remover registros específicos selecionados pelo usuário
async function removeSelectedDuplicates(selectedForRemoval) {
    try {
        showNotification('🔄 Removendo registros selecionados...', 'info');
        
        const storage = await Storage.get(['siaa_data_csv', 'siaa_students_csv']);
        let totalRemoved = 0;
        
        // Agrupar seleções por tipo
        const ofertasToRemove = selectedForRemoval
            .filter(item => item.type === 'ofertas')
            .map(item => item.lineIndex)
            .sort((a, b) => b - a); // Ordenar em ordem decrescente para remoção
        
        const alunosToRemove = selectedForRemoval
            .filter(item => item.type === 'alunos')
            .map(item => item.lineIndex)
            .sort((a, b) => b - a); // Ordenar em ordem decrescente para remoção
        
        // Remover linhas selecionadas de ofertas
        if (ofertasToRemove.length > 0 && storage.siaa_data_csv) {
            const cleanedCsv = removeSpecificLines(storage.siaa_data_csv, ofertasToRemove);
            await Storage.set({ siaa_data_csv: cleanedCsv });
            totalRemoved += ofertasToRemove.length;
            console.log(`✅ ${ofertasToRemove.length} ofertas duplicadas removidas`);
        }
        
        // Remover linhas selecionadas de alunos
        if (alunosToRemove.length > 0 && storage.siaa_students_csv) {
            const cleanedCsv = removeSpecificLines(storage.siaa_students_csv, alunosToRemove);
            await Storage.set({ siaa_students_csv: cleanedCsv });
            totalRemoved += alunosToRemove.length;
            console.log(`✅ ${alunosToRemove.length} alunos duplicados removidos`);
        }
        
        showNotification(`✅ ${totalRemoved} registros removidos com sucesso!`, 'success');
        
        // Recarregar dados se estivermos visualizando
        if (window.currentData && window.currentData.length > 0) {
            if (currentViewMode === 'alunos') {
                await loadStudentData();
            } else {
                await loadData();
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao remover registros:', error);
        showNotification('❌ Erro ao remover registros', 'error');
    }
}

// Função auxiliar para remover linhas específicas de um CSV
function removeSpecificLines(csvData, lineIndicesToRemove) {
    const cleanCsv = csvData.replace(/^\uFEFF/, '');
    const lines = cleanCsv.split('\n');
    
    // Remover linhas específicas (lineIndicesToRemove já está em ordem decrescente)
    lineIndicesToRemove.forEach(lineIndex => {
        if (lineIndex > 0 && lineIndex < lines.length) {
            lines.splice(lineIndex, 1);
        }
    });
    
    return '\uFEFF' + lines.join('\n');
}

// Função para resetar todos os dados
async function resetAllData() {
    try {
        showNotification('🗑️ Removendo todos os dados...', 'info');
        
        // Limpar todos os dados do storage
        await Storage.remove([
            'siaa_data_csv',
            'siaa_data_timestamp', 
            'siaa_students_csv',
            'siaa_students_timestamp',
            'siaa_manual_courses',
            'siaa_view_mode',
            'viewer_selected_preset',
            'siaa_column_presets'
        ]);
        
        // Limpar variáveis locais
        allData = [];
        filteredData = [];
        window.currentData = [];
        window.currentColumns = [];
        
        // Limpar interface
        if (elements.tableBody) elements.tableBody.innerHTML = '';
        if (elements.tableHead) elements.tableHead.innerHTML = '';
        if (elements.filteredRecords) elements.filteredRecords.textContent = '0';
        if (elements.sidebarLastUpdate) elements.sidebarLastUpdate.textContent = 'Sem dados';
        
        // Mostrar mensagem de sem dados
        showNoData();
        
        showNotification('✅ Todos os dados foram removidos com sucesso!', 'success');
        console.log('🗑️ Reset completo dos dados executado');
        
    } catch (error) {
        console.error('❌ Erro ao resetar dados:', error);
        showNotification('❌ Erro ao resetar dados', 'error');
    }
} 

// FUNÇÕES DE INTEGRAÇÃO HÍBRIDA REMOVIDAS - USANDO SISTEMA MODERNO

// ETAPA 5.2: Configurar melhorias orientadas a eventos (PARALELAS ao código existente)
function setupEventDrivenEnhancements(eventBus) {
    console.log('📡 [ETAPA 5.2] Configurando melhorias baseadas em eventos...');
    
    // Listener para quando dados são carregados
    eventBus.on('data.loaded', (data) => {
        debugLog('📊 [Híbrido] Dados detectados:', data.count || data.length || 'N/A');
        // Futuramente: analytics, cache, etc.
    });
    
    // Listener para quando filtros são aplicados
    eventBus.on('ui.filter.applied', (data) => {
        debugLog('🔍 [Híbrido] Filtros detectados:', data.count || 'N/A');
        // Futuramente: salvamento automático de filtros, etc.
    });
    
    // Listener para mudanças de preset
    eventBus.on('ui.preset.changed', (data) => {
        debugLog('🎨 [Híbrido] Preset detectado:', data.preset || 'N/A');
        // Futuramente: salvamento automático, etc.
    });
}

// ETAPA 5.2: Observar dados existentes e emitir eventos
function setupDataObservers(eventBus) {
    console.log('👁️ [ETAPA 5.2] Configurando observadores de dados...');
    
    // Observar mudanças em allData (sem modificar código existente)
    let lastDataLength = allData.length;
    
    setInterval(() => {
        if (allData.length !== lastDataLength) {
            lastDataLength = allData.length;
            eventBus.emit('data.loaded', { 
                mode: currentViewMode, 
                count: allData.length,
                source: 'legacy-observer'
            });
        }
    }, 1000); // Verificar a cada 1 segundo
}

// ETAPA 5.2: Conectar UI existente com sistema de eventos
function setupUIEventBridge(eventBus) {
    debugLog('🌉 [ETAPA 5.2] Configurando ponte UI-Eventos...');
    
    // Emitir eventos quando filtros forem aplicados (sem modificar applyFilters)
    let lastFilteredLength = filteredData.length;
    
    setInterval(() => {
        if (filteredData.length !== lastFilteredLength) {
            lastFilteredLength = filteredData.length;
            eventBus.emit('ui.filter.applied', { 
                count: filteredData.length,
                total: allData.length,
                source: 'legacy-observer'
            });
        }
    }, 500); // Verificar a cada 0.5 segundos
}

// ETAPA 5.3: Integração com módulos utilitários
function setupUtilityModuleIntegration(eventBus) {
    debugLog('🔧 [ETAPA 5.3] Integrando módulos utilitários...');
    
    try {
        const modules = [
            {
                name: 'Storage',
                check: () => window.Storage && window.StorageHelper,
                setup: () => {
                    window.ModularStorage = window.Storage;
                    window.ModularStorageHelper = window.StorageHelper;
                    eventBus.on('storage.operation', (data) => {
                        console.log('💾 [Híbrido] Operação de storage:', data.operation, data.key);
                    });
                }
            },
            {
                name: 'CSV Parser',
                check: () => window.parseCSV && window.parseCSVLine && window.CSVParser,
                setup: () => {
                    window.ModularParseCSV = window.parseCSV;
                    window.ModularParseCSVLine = window.parseCSVLine;
                    window.ModularCSVParser = window.CSVParser;
                    eventBus.on('csv.parsed', (data) => {
                        debugLog('📊 [Híbrido] CSV processado:', data.rows, 'linhas');
                    });
                }
            },
            {
                name: 'Config Loader',
                check: () => window.loadConfig && window.getConfig && window.ConfigLoader,
                setup: () => {
                    window.ModularLoadConfig = window.loadConfig;
                    window.ModularGetConfig = window.getConfig;
                    window.ModularConfigLoader = window.ConfigLoader;
                    eventBus.on('config.loaded', (data) => {
                        console.log('⚙️ [Híbrido] Configuração carregada:', Object.keys(data.config || {}).length, 'presets');
                    });
                }
            }
        ];
        
        modules.forEach(module => {
            if (module.check()) {
                console.log(`✅ [ETAPA 5.3] Módulo ${module.name} detectado`);
                module.setup();
            }
        });
        
        debugLog('✅ [ETAPA 5.3] Módulos utilitários integrados');
        
    } catch (error) {
        debugWarn('⚠️ [ETAPA 5.3] Erro na integração de utilitários:', error);
    }
}

// ETAPA 5.4: Integração com módulos de dados
function setupDataModuleIntegration(eventBus) {
    debugLog('📊 [ETAPA 5.4] Integrando módulos de dados...');
    
    try {
        const dataModules = [
            {
                name: 'DataStore',
                check: () => window.DataStore && window.getDataStore,
                setup: () => {
                    const dataStore = window.getDataStore();
                    window.ModularDataStore = dataStore;
                    dataStore.on('data.loaded', (data) => {
                        debugLog('📊 [Híbrido] DataStore - dados carregados:', data.count);
                    });
                }
            },
            {
                name: 'OfertasService',
                check: () => window.OfertasService && window.getOfertasService,
                setup: () => {
                    window.ModularOfertasService = window.getOfertasService();
                    eventBus.on('ofertas.process', (data) => {
                        console.log('🎓 [Híbrido] OfertasService - processando:', data.count, 'ofertas');
                    });
                }
            },
            {
                name: 'AlunosService',
                check: () => window.AlunosService && window.getAlunosService,
                setup: () => {
                    window.ModularAlunosService = window.getAlunosService();
                    eventBus.on('alunos.process', (data) => {
                        console.log('👥 [Híbrido] AlunosService - processando:', data.count, 'alunos');
                    });
                }
            },
            {
                name: 'DuplicateManager',
                check: () => window.DuplicateManager && window.getDuplicateManager,
                setup: () => {
                    window.ModularDuplicateManager = window.getDuplicateManager();
                    eventBus.on('duplicates.found', (data) => {
                        debugLog('🔍 [Híbrido] DuplicateManager - duplicatas encontradas:', data.count);
                    });
                }
            }
        ];
        
        dataModules.forEach(module => {
            if (module.check()) {
                console.log(`✅ [ETAPA 5.4] Módulo ${module.name} detectado`);
                module.setup();
            }
        });
        
        debugLog('✅ [ETAPA 5.4] Módulos de dados integrados');
        
    } catch (error) {
        debugWarn('⚠️ [ETAPA 5.4] Erro na integração de dados:', error);
    }
}

// ETAPA 5.4: Integração com módulos de UI
function setupUIModuleIntegration(eventBus) {
    debugLog('🎨 [ETAPA 5.4] Integrando módulos de UI...');
    
    try {
        const uiModules = [
            {
                name: 'TableManager',
                check: () => window.TableManager && window.getTableManager,
                setup: () => {
                    window.ModularTableManager = window.getTableManager();
                    eventBus.on('table.render', (data) => {
                        console.log('📋 [Híbrido] TableManager - renderizando:', data.rows, 'linhas');
                    });
                }
            },
            {
                name: 'FilterManager',
                check: () => window.FilterManager && window.getFilterManager,
                setup: () => {
                    window.ModularFilterManager = window.getFilterManager();
                    eventBus.on('filter.applied', (data) => {
                        debugLog('🔍 [Híbrido] FilterManager - filtros aplicados:', data.type);
                    });
                }
            },
            {
                name: 'ColumnManager',
                check: () => window.ColumnManager && window.getColumnManager,
                setup: () => {
                    window.ModularColumnManager = window.getColumnManager();
                    eventBus.on('columns.changed', (data) => {
                        debugLog('📊 [Híbrido] ColumnManager - colunas alteradas:', data.visible?.length || 0);
                    });
                }
            },
            {
                name: 'DropdownManager',
                check: () => window.DropdownManager && window.getDropdownManager,
                setup: () => {
                    window.ModularDropdownManager = window.getDropdownManager();
                    eventBus.on('dropdown.opened', (data) => {
                        console.log('📝 [Híbrido] DropdownManager - dropdown aberto:', data.type);
                    });
                }
            }
        ];
        
        uiModules.forEach(module => {
            if (module.check()) {
                console.log(`✅ [ETAPA 5.4] Módulo ${module.name} detectado`);
                module.setup();
            }
        });
        
        debugLog('✅ [ETAPA 5.4] Módulos de UI integrados');
        
    } catch (error) {
        debugWarn('⚠️ [ETAPA 5.4] Erro na integração de UI:', error);
    }
}

// ETAPA 5.2: Integração híbrida com módulos
setTimeout(() => {
    if (modulesLoaded) {
        initializeHybridIntegration();
    }
}, 500); 