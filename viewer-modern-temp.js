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

// SISTEMA DE INICIALIZAÇÃO MODERNA VIA APPCONTROLLER
class ModernSIAAViewer {
    constructor() {
        this.appController = null;
        this.eventBus = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('🚀 Iniciando SIAA Data Viewer (Moderno)...');
            
            // Aguardar módulos carregarem
            await this.waitForModules();
            
            // Inicializar AppController
            await this.initializeAppController();
            
            // Configurar UI básica
            this.setupBasicUI();
            
            // Configurar event listeners modernos
            this.setupModernEventListeners();
            
            console.log('✅ SIAA Data Viewer moderno inicializado');
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ Erro na inicialização moderna:', error);
            this.fallbackToLegacy();
        }
    }

    async waitForModules() {
        // Aguardar módulos carregarem (retry logic)
        for (let i = 0; i < 10; i++) {
            if (window.getAppController && window.getEventBus) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error('Módulos não carregaram em tempo hábil');
    }

    async initializeAppController() {
        this.appController = window.getAppController();
        this.eventBus = window.getEventBus();
        
        await this.appController.initialize({
            elements: elements,
            debug: false
        });
    }

    setupBasicUI() {
        // Configurar sidebar (funcionalidade essencial)
        this.setupSidebar();
    }

    setupSidebar() {
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
    }

    setupModernEventListeners() {
        // Event listeners via EventBus para desacoplamento
        this.eventBus.on('ui.sidebar.toggle', () => {
            document.body.classList.toggle('sidebar-open');
        });
        
        this.eventBus.on('ui.sidebar.close', () => {
            document.body.classList.remove('sidebar-open');
        });
    }

    fallbackToLegacy() {
        console.warn('⚠️ Fallback para sistema legacy');
        // Manter funcionalidade básica
        this.setupSidebar();
    }
}

// Inicialização moderna
document.addEventListener('DOMContentLoaded', async () => {
    const viewer = new ModernSIAAViewer();
    await viewer.initialize();
});
