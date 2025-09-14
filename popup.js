// ========================================
// STATE MANAGER V8 (nova classe)
// ========================================
class StateManager {
    constructor() {
        this.version = 'V8-StateManager';
        
        // Estados da aplicação (centralizados)
        this._isExtracting = false;
        this._hasStoredData = false;
        this._hasStorageFailure = false;
        
        console.log('📊 StateManager V8 inicializado');
    }

    // Getters
    getIsExtracting() { return this._isExtracting; }
    getHasStoredData() { return this._hasStoredData; }
    getHasStorageFailure() { return this._hasStorageFailure; }

    // Setters com logs V8
    setIsExtracting(value) {
        console.log('📊 V8 StateManager - setIsExtracting:', value);
        this._isExtracting = Boolean(value);
        this._updateExtractionUI();
    }

    setHasStoredData(value) {
        console.log('📊 V8 StateManager - setHasStoredData:', value);
        this._hasStoredData = Boolean(value);
    }

    setHasStorageFailure(value) {
        console.log('📊 V8 StateManager - setHasStorageFailure:', value);
        this._hasStorageFailure = Boolean(value);
    }

    // Atualizar UI de extração
    _updateExtractionUI() {
        const captureButton = document.getElementById('captureButton');
        if (captureButton) {
            if (this._isExtracting) {
                captureButton.textContent = 'Capturando...';
                captureButton.disabled = true;
            } else {
                captureButton.textContent = 'Iniciar Captura';
                captureButton.disabled = false;
            }
        }
    }

    getStats() {
        return {
            version: this.version,
            isExtracting: this._isExtracting,
            hasStoredData: this._hasStoredData,
            hasStorageFailure: this._hasStorageFailure,
            message: 'StateManager V8 funcionando'
        };
    }
}

// Criar instância do StateManager V8
const stateManagerV8 = new StateManager();

// ========================================
// COMMUNICATION MANAGER V9 (versão incremental)
// ========================================
class CommunicationManager {
    constructor() {
        this.version = 'V9-CommunicationManager-Incremental';
        console.log('📡 CommunicationManager V9 incremental inicializado');
    }

    async fetchCursosDisponiveis() {
        console.log('📡 V9 CommunicationManager - Buscando cursos disponíveis...');
        
        try {
            // Usar XMLProcessor para obter cursos com nomes processados
            
            // Verificar se XMLProcessor está disponível
            if (typeof XMLProcessor === 'undefined') {
                console.warn('📡 V9 - XMLProcessor não disponível, usando método original');
                return await this._fetchCursosDisponiveisOriginal();
            }
            
            const xmlProcessor = new XMLProcessor();
            const results = await xmlProcessor.processStep('ofertas', 'cursos_disponiveis');
            
            if (results.success && results.data) {
                console.log('📡 V9 - Cursos obtidos via XMLProcessor:', results.data.length);
                return results.data; // FORMATO EXATO PRESERVADO
            } else {
                console.warn('📡 V9 - XMLProcessor falhou, usando método original');
                return await this._fetchCursosDisponiveisOriginal();
            }
        } catch (error) {
            console.error('❌ V9 CommunicationManager - Erro ao buscar cursos:', error);
            console.warn('📡 V9 - Tentando método original como fallback');
            return await this._fetchCursosDisponiveisOriginal();
        }
    }

    async _fetchCursosDisponiveisOriginal() {
        console.log('📡 V9 - Usando método original de busca de cursos');
        
        try {
            const codesUrl = await configManager.buildEndpointUrl('ofertas.cursos');
            
            const codesResp = await fetch(codesUrl, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/xml, text/xml, */*',
                    'Accept-Charset': 'ISO-8859-1, UTF-8'
                }
            });
            
            if (!codesResp.ok) {
                throw new Error(`Erro HTTP ${codesResp.status}: ${codesResp.statusText}`);
            }
            
            // 🔧 CORREÇÃO DE ENCODING: Usar ArrayBuffer + TextDecoder para decodificar corretamente
            const arrayBuffer = await codesResp.arrayBuffer();
            
            // Decodificar como ISO-8859-1 (charset do SIAA) com fallback UTF-8
            let codesXml;
            try {
                codesXml = new TextDecoder('iso-8859-1').decode(arrayBuffer);
            } catch (error) {
                codesXml = new TextDecoder('utf-8').decode(arrayBuffer);
            }
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(codesXml, 'text/xml');
            
            // Processar cursos do XML - FORMATO EXATO DA FUNÇÃO ORIGINAL
            const cursos = [];
            const opcoes = xmlDoc.querySelectorAll('option');
            
            opcoes.forEach((opcao, index) => {
                const codigo = opcao.getAttribute('value');
                const nome = opcao.textContent.trim();
                
                if (codigo && nome && codigo !== '0') {
                    cursos.push({ codigo, nome }); // FORMATO IDENTICAL
                }
            });
            
            console.log('📡 V9 - Cursos obtidos via método original:', cursos.length);
            
            return cursos; // MESMO FORMATO DA FUNÇÃO ORIGINAL
            
        } catch (error) {
            console.error('❌ V9 CommunicationManager - Erro no método original:', error);
            return []; // MESMO FALLBACK DA FUNÇÃO ORIGINAL
        }
    }

    getStats() {
        return {
            version: this.version,
            message: 'CommunicationManager V9 incremental - só fetchCursosDisponiveis'
        };
    }
}

// Criar instância do CommunicationManager V9 (incremental)
const communicationManagerV9 = new CommunicationManager();

// ========================================
// UI MANAGER V10 (nova classe)
// ========================================
class UIManager {
    constructor() {
        this.version = 'V10-UIManager';
        
        // Elementos DOM
        this.statusText = document.getElementById('statusText');
        this.statusDot = document.getElementById('statusDot');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressBar = document.getElementById('progressBar');
        
        console.log('🎨 UIManager V10 inicializado');
    }

    updateStatus(text, isActive = false) {
        console.log('🎨 V10 UIManager - updateStatus:', text, isActive);
        
        if (this.statusText) {
            this.statusText.textContent = text;
        }
        
        if (isActive) {
            if (this.statusDot) {
                this.statusDot.style.backgroundColor = '#4CAF50';
                this.statusDot.style.animation = 'pulse 2s infinite';
            }
        } else {
            if (this.statusDot) {
                this.statusDot.style.backgroundColor = '#666';
                this.statusDot.style.animation = 'none';
            }
        }
    }

    showError(msg) {
        console.error('🎨 V10 UIManager - showError:', msg);
        console.error('[SIAA-ERRO V10] ' + msg);
        
        // Atualizar status visual com erro
        this.updateStatus('❌ ' + msg, false);
        
        // Opcional: adicionar estilo de erro ao statusText
        if (this.statusText) {
            this.statusText.style.color = '#f44336';
            setTimeout(() => {
                if (this.statusText) {
                    this.statusText.style.color = '';
                }
            }, 3000);
        }
    }

    showSuccess(msg) {
        console.log('🎨 V10 UIManager - showSuccess:', msg);
        console.log('[SIAA-OK V10] ' + msg);
        
        // Atualizar status visual com sucesso
        this.updateStatus('✅ ' + msg, true);
        
        // Opcional: adicionar estilo de sucesso ao statusText
        if (this.statusText) {
            this.statusText.style.color = '#4CAF50';
            setTimeout(() => {
                if (this.statusText) {
                    this.statusText.style.color = '';
                }
            }, 3000);
        }
    }

    updateProgress(percent, message = null) {
        console.log('🎨 V10 UIManager - updateProgress:', percent, message);
        
        if (typeof percent === 'number') {
            // Atualizar barra de progresso
            if (this.progressBar) {
                this.progressBar.style.width = percent + '%';
            }
            
            // Mostrar container de progresso
            if (this.progressContainer) {
                this.progressContainer.style.display = 'block';
            }
            
            // Atualizar texto com percentual
            if (this.statusText) {
                this.statusText.textContent = percent + '%';
            }
        }
        
        // Se há mensagem, usar ela no status
        if (message) {
            this.updateStatus(message, true);
        }
    }

    hideProgress() {
        console.log('🎨 V10 UIManager - hideProgress');
        
        if (this.progressContainer) {
            this.progressContainer.style.display = 'none';
        }
        
        if (this.progressBar) {
            this.progressBar.style.width = '0%';
        }
    }

    handleExtractionProgress(message, percent) {
        console.log('🎨 V10 UIManager - handleExtractionProgress:', message, percent);
        
        if (typeof percent === 'number') {
            this.updateProgress(percent);
        } else if (message) {
            // Verificar se é mensagem de erro especial
            if (message.includes('erro') || message.includes('falha') || message.includes('Erro')) {
                this.showError(message);
            } else {
                this.updateStatus(message, true);
            }
        }
    }

    handleStudentProgress(message, progress) {
        console.log('🎨 V10 UIManager - handleStudentProgress:', message, progress);
        
        this.updateStatus(`🎓 ${message}`, false);
        
        if (typeof progress === 'number') {
            this.updateProgress(progress);
        }
    }

    getStats() {
        return {
            version: this.version,
            elements: {
                statusText: !!this.statusText,
                statusDot: !!this.statusDot,
                progressContainer: !!this.progressContainer,
                progressBar: !!this.progressBar
            },
            message: 'UIManager V10 Step C - updateStatus() + showError() + showSuccess() + updateProgress() + handleProgress()'
        };
    }
}

// Criar instância do UIManager V10
const uiManagerV10 = new UIManager();

// ========================================
// STORAGE MANAGER V11 (nova classe)
// ========================================
class StorageManager {
    constructor() {
        this.version = 'V11-StorageManager';
        
        console.log('📦 StorageManager V11 inicializado');
    }

    async loadCursoMapping() {
        console.log('📦 V11 StorageManager - loadCursoMapping');
        
        try {
            const storage = await chrome.storage.local.get(['siaa_curso_mapping']);
            const mappingObj = storage.siaa_curso_mapping || {};
            
            // Limpar mapeamento atual (usando variável global)
            cursoMapping.clear();
            
            // Converter objeto para Map
            for (const [codigo, nome] of Object.entries(mappingObj)) {
                cursoMapping.set(codigo, nome);
            }
            
            console.log('📦 V11 - Mapeamento de cursos carregado:', cursoMapping.size);
            console.log('[SIAA-OK V11] Mapeamento carregado do storage');
            
            return cursoMapping;
            
        } catch (error) {
            console.error('📦 V11 StorageManager - Erro ao carregar mapeamento:', error);
            console.error('[SIAA-ERRO V11] Erro ao carregar mapeamento:', error.message);
            throw error;
        }
    }

    async updateStoredDataStatus() {
        console.log('📦 V11 StorageManager - updateStoredDataStatus');
        
        try {
            const data = await chrome.storage.local.get(['siaa_data_csv', 'siaa_data_timestamp']);
            
            if (data.siaa_data_csv) {
                hasStoredData = true;
                console.log('📦 V11 - Dados encontrados no storage. Timestamp:', data.siaa_data_timestamp);
                return {
                    hasData: true,
                    timestamp: data.siaa_data_timestamp,
                    dataSize: data.siaa_data_csv.length
                };
            } else {
                hasStoredData = false;
                console.log('📦 V11 - Nenhum dado encontrado no storage');
                return {
                    hasData: false,
                    timestamp: null,
                    dataSize: 0
                };
            }
            
        } catch (error) {
            console.error('📦 V11 StorageManager - Erro ao verificar dados:', error);
            hasStoredData = false;
            throw error;
        }
    }

    async getCursosFromStorage() {
        console.log('📦 V11 StorageManager - getCursosFromStorage');
        
        try {
            const storage = await chrome.storage.local.get(['siaa_manual_courses']);
            const cursosManager = storage.siaa_manual_courses || [];
            
            console.log('📦 V11 - Cursos manuais do storage:', cursosManager.length);
            return cursosManager;
            
        } catch (error) {
            console.error('📦 V11 StorageManager - Erro ao buscar cursos do storage:', error);
            return [];
        }
    }

    async getDataFromStorage() {
        console.log('📦 V11 StorageManager - getDataFromStorage');
        
        try {
            const data = await chrome.storage.local.get(['siaa_data_csv', 'siaa_data_timestamp']);
            
            if (data.siaa_data_csv) {
                console.log('📦 V11 - Dados CSV encontrados no storage');
                return {
                    csv: data.siaa_data_csv,
                    timestamp: data.siaa_data_timestamp,
                    found: true
                };
            } else {
                console.log('📦 V11 - Nenhum dado CSV no storage');
                return {
                    csv: null,
                    timestamp: null,
                    found: false
                };
            }
            
        } catch (error) {
            console.error('📦 V11 StorageManager - Erro ao buscar dados CSV:', error);
            return {
                csv: null,
                timestamp: null,
                found: false,
                error: error.message
            };
        }
    }

    getStats() {
        return {
            version: this.version,
            message: 'StorageManager V11 funcionando - loadCursoMapping() + updateStoredDataStatus() + getCursosFromStorage() + getDataFromStorage()'
        };
    }
}

// Criar instância do StorageManager V11
const storageManagerV11 = new StorageManager();

// ========================================
// VALIDATION MANAGER V12 (nova classe)
// ========================================
class ValidationManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.version = 'V12-ValidationManager';
        
        console.log('📋 ValidationManager V12 inicializado');
    }

    validateCourseSelection() {
        console.log('📋 V12 ValidationManager - validateCourseSelection');
        
        const courseSelect = document.getElementById('courseSelect');
        if (!courseSelect) {
            console.error('📋 V12 - courseSelect element não encontrado');
            return {
                isValid: false,
                error: 'Elemento de seleção de curso não encontrado',
                course: null
            };
        }
        
        const selectedCode = courseSelect.value;
        if (!selectedCode || selectedCode === '' || selectedCode === '0') {
            console.log('📋 V12 - Nenhum curso selecionado');
            return {
                isValid: false,
                error: 'Selecione um curso antes de continuar',
                course: null
            };
        }
        
        const selectedName = courseSelect.options[courseSelect.selectedIndex]?.text || 'Nome não disponível';
        const cursoSelecionado = { codigo: selectedCode, nome: selectedName };
        
        console.log('📋 V12 - Curso válido selecionado:', cursoSelecionado);
        return {
            isValid: true,
            error: null,
            course: cursoSelecionado
        };
    }

    validateExtractionState() {
        console.log('📋 V12 ValidationManager - validateExtractionState');
        
        const isExtracting = this.stateManager.getIsExtracting();
        
        if (isExtracting) {
            console.log('📋 V12 - Extração já em andamento');
            return {
                isValid: false,
                error: 'Extração já em andamento',
                state: 'extracting'
            };
        }
        
        console.log('📋 V12 - Estado válido para iniciar extração');
        return {
            isValid: true,
            error: null,
            state: 'ready'
        };
    }

    validateStorageData() {
        console.log('📋 V12 ValidationManager - validateStorageData');
        
        const hasStoredData = this.stateManager.getHasStoredData();
        
        return {
            hasData: hasStoredData,
            message: hasStoredData ? 'Dados encontrados no storage' : 'Nenhum dado no storage',
            canProceed: true // Sempre pode prosseguir, mas com informação
        };
    }

    validateBeforeExtraction() {
        console.log('📋 V12 ValidationManager - validateBeforeExtraction (validação completa)');
        
        // Validar estado de extração
        const stateValidation = this.validateExtractionState();
        if (!stateValidation.isValid) {
            return stateValidation;
        }
        
        // Validar seleção de curso
        const courseValidation = this.validateCourseSelection();
        if (!courseValidation.isValid) {
            return courseValidation;
        }
        
        console.log('📋 V12 - Todas validações aprovadas para extração');
        return {
            isValid: true,
            error: null,
            course: courseValidation.course,
            state: stateValidation.state
        };
    }

    validatePageAccess() {
        console.log('📋 V12 ValidationManager - validatePageAccess');
        
        // Verificar se não está extraindo para não interferir
        const isExtracting = this.stateManager.getIsExtracting();
        if (isExtracting) {
            return {
                shouldCheck: false,
                reason: 'Extração em andamento - pular verificação'
            };
        }
        
        return {
            shouldCheck: true,
            reason: 'Estado válido para verificar página'
        };
    }

    getStats() {
        return {
            version: this.version,
            stateManager: this.stateManager.version,
            message: 'ValidationManager V12 funcionando - validateCourseSelection() + validateExtractionState() + validateBeforeExtraction()'
        };
    }
}

// Criar instância do ValidationManager V12
const validationManagerV12 = new ValidationManager(stateManagerV8);

// ========================================
// ELEMENTOS DA INTERFACE (preservados)
// ========================================
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const captureButton = document.getElementById('captureButton');
const updateExtButton = document.getElementById('updateExtButton');
const viewButton = document.getElementById('viewButton');
const courseSelect = document.getElementById('courseSelect');
const courseSelection = document.getElementById('courseSelection');
const warningMessage = document.getElementById('warningMessage');
const endpointWarningMessage = document.getElementById('endpointWarningMessage');
const storageFailureWarning = document.getElementById('storageFailureWarning');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');

// ========================================
// ESTADO DA APLICAÇÃO (redirecionado para StateManager V8)
// ========================================
Object.defineProperty(window, 'isExtracting', {
    get: () => stateManagerV8.getIsExtracting(),
    set: (value) => stateManagerV8.setIsExtracting(value)
});

Object.defineProperty(window, 'hasStoredData', {
    get: () => stateManagerV8.getHasStoredData(),
    set: (value) => stateManagerV8.setHasStoredData(value)
});

Object.defineProperty(window, 'hasStorageFailure', {
    get: () => stateManagerV8.getHasStorageFailure(),
    set: (value) => stateManagerV8.setHasStorageFailure(value)
});

// Cursos extras definidos pelo desenvolvedor
const EXTRA_COURSES = [];

// Mapeamento de cursos (código -> nome) carregado do storage
let cursoMapping = new Map();

// Carregar mapeamento de cursos do storage
async function loadCursoMapping() {
    // STEP A V11: Função redirecionada para StorageManager
    return storageManagerV11.loadCursoMapping();
    
}

// Obter nome do curso pelo código usando o mapeamento
function getCursoNomeFromMapping(codigoCurso) {
    if (!codigoCurso) return '';
    return cursoMapping.get(codigoCurso.toString()) || '';
}

// Funções auxiliares para logs V8
function showError(msg) {
    // STEP B V10: Função redirecionada para UIManager
    return uiManagerV10.showError(msg);
    
}

function showSuccess(msg) {
    // STEP B V10: Função redirecionada para UIManager
    return uiManagerV10.showSuccess(msg);
    
}

// Funções para controlar o aviso estático de falha de storage
function showStorageFailureWarning() {
    hasStorageFailure = true;
    storageFailureWarning.style.display = 'block';
    console.log('⚠️ Aviso estático de falha de storage exibido');
}

function hideStorageFailureWarning() {
    hasStorageFailure = false;
    storageFailureWarning.style.display = 'none';
    console.log('✅ Aviso estático de falha de storage ocultado');
}

// Função para verificar se está na página correta
// Verificar se os endpoints XML estão acessíveis (ofertas e alunos)
async function checkEndpointAccess() {
    try {
        // Usar o config manager para verificar saúde dos endpoints
        const healthStatus = await configManager.checkEndpointsHealth(['ofertas', 'alunos'], 5000);
        
        const ofertasOK = healthStatus.ofertas?.available || false;
        const alunosOK = healthStatus.alunos?.available || false;
        
        console.log('Status dos endpoints:', { ofertas: ofertasOK, alunos: alunosOK });
        console.log('Detalhes completos:', healthStatus);
        
        // Retornar status detalhado de ambos os endpoints
        return {
            ofertas: ofertasOK,
            alunos: alunosOK,
            details: healthStatus
        };
        
    } catch (error) {
        console.log('Erro ao verificar endpoints via config manager:', error.name);
        
        // Fallback para verificação manual de ambos os endpoints
        try {
            const ofertasUrl = 'https://siaa.cruzeirodosul.edu.br/siaa/mod/academico/wacdcon12/comboPeriodo.xml.jsp';
            const alunosUrl = 'https://siaa.cruzeirodosul.edu.br/siaa/mod/academico/wacdrel31/comboAno.xml.jsp';
            
            // Verificar endpoint de ofertas
            const checkOfertas = async () => {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    const response = await fetch(ofertasUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'text/xml, application/xml, */*',
                            'Accept-Charset': 'UTF-8'
                        },
                        credentials: 'include',
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        const text = await response.text();
                        const isValidXML = text.includes('<complete>') || text.includes('<option');
                        console.log('Fallback Ofertas - Status:', response.status, 'XML válido:', isValidXML);
                        return isValidXML;
                    }
                    return false;
                } catch (error) {
                    console.log('Erro ao verificar ofertas (fallback):', error.name);
                    return false;
                }
            };
            
            // Verificar endpoint de alunos
            const checkAlunos = async () => {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    const response = await fetch(alunosUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'text/xml, application/xml, */*',
                            'Accept-Charset': 'UTF-8'
                        },
                        credentials: 'include',
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        const text = await response.text();
                        const isValidXML = text.includes('<complete>') || text.includes('<option');
                        console.log('Fallback Alunos - Status:', response.status, 'XML válido:', isValidXML);
                        return isValidXML;
                    }
                    return false;
                } catch (error) {
                    console.log('Erro ao verificar alunos (fallback):', error.name);
                    return false;
                }
            };
            
            // Executar verificações em paralelo
            const [ofertasOK, alunosOK] = await Promise.all([checkOfertas(), checkAlunos()]);
            
            console.log('Fallback - Resultados:', { ofertas: ofertasOK, alunos: alunosOK });
            
            return {
                ofertas: ofertasOK,
                alunos: alunosOK,
                details: { source: 'fallback' }
            };
            
        } catch (fallbackError) {
            console.log('Erro no fallback:', fallbackError.name);
            return {
                ofertas: false,
                alunos: false,
                details: { error: fallbackError.message }
            };
        }
    }
}

async function checkPageStatus() {
    // STEP A V12: Validação via ValidationManager
    const pageValidation = validationManagerV12.validatePageAccess();
    if (!pageValidation.shouldCheck) {
        console.log('📋 V12 - Pular verificação:', pageValidation.reason);
        return;
    }
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            updateStatus('Erro ao verificar página', false);
            setObfuscatedState(true, false);
            return;
        }

        const url = tab.url;

        // Verificar se está no domínio correto
        if (!url.includes('siaa.cruzeirodosul.edu.br')) {
            updateStatus('Acesse o SIAA', false);
            setObfuscatedState(true, false);
            return;
        }

        // Verificar se está na página específica
        if (url.includes('novo-siaa/secure/core/home.jsf')) {
            // Está no SIAA, verificar se endpoints estão acessíveis
            const healthStatus = await checkEndpointAccess();
            
            if (healthStatus.ofertas && healthStatus.alunos) {
                // Ambos endpoints OK - permitir captura completa
                updateStatus('Pronto para extrair', true);
                setObfuscatedState(false, false, 'both');
                captureButton.disabled = false;
            } else {
                // Pelo menos um endpoint não está OK - bloquear captura
                if (healthStatus.ofertas && !healthStatus.alunos) {
                    updateStatus('XML Alunos inacessível', false);
                    setObfuscatedState(true, true, 'ofertas-only');
                } else if (!healthStatus.ofertas && healthStatus.alunos) {
                    updateStatus('XML Ofertas inacessível', false);
                    setObfuscatedState(true, true, 'alunos-only');
                } else {
                    updateStatus('XMLs inacessíveis', false);
                    setObfuscatedState(true, true, 'none');
                }
                captureButton.disabled = true;
            }
        } else {
            updateStatus('Acesse home.jsf', false);
            setObfuscatedState(true, false);
            captureButton.disabled = true;
        }
    } catch (error) {
        console.error('Erro ao verificar página:', error);
        updateStatus('Erro ao verificar página', false);
        setObfuscatedState(true, false);
        captureButton.disabled = true;
    }
}

// Função para atualizar status visual
function updateStatus(text, isActive = false) {
    // STEP A V10: Função redirecionada para UIManager
    return uiManagerV10.updateStatus(text, isActive);
    
}

// Função para controlar estado de ofuscação
function setObfuscatedState(shouldObfuscate, showEndpointWarning = false, endpointStatus = 'none') {
    if (shouldObfuscate) {
        // Ofuscar elementos relacionados à captura
        courseSelection.classList.add('obfuscated');
        captureButton.classList.add('obfuscated');
        
        // Mostrar aviso específico baseado no status dos endpoints
        if (showEndpointWarning) {
            updateEndpointWarningMessage(endpointStatus);
            warningMessage.classList.remove('show');
            endpointWarningMessage.classList.add('show');
        } else {
            // Não está no SIAA
            warningMessage.classList.add('show');
            endpointWarningMessage.classList.remove('show');
        }
    } else {
        // Remover ofuscação
        courseSelection.classList.remove('obfuscated');
        captureButton.classList.remove('obfuscated');
        
        // Esconder todos os avisos
        warningMessage.classList.remove('show');
        endpointWarningMessage.classList.remove('show');
    }
    
    // O botão visualizar sempre deve estar acessível (não ofuscar)
    // Já tem a classe btn-always-accessible no HTML
}

// Função para atualizar mensagem de endpoint baseada no status
function updateEndpointWarningMessage(status) {
    const endpointWarningMessage = document.getElementById('endpointWarningMessage');
    
    let message = '';
    
    switch (status) {
        case 'ofertas-only':
            message = `
                🔒 <strong>Dados inacessíveis</strong><br><br>
                📋 Para habilitar a captura, acesse:<br>
                <strong>Acadêmico → Relatórios → Relação De Alunos Matriculados Por Curso</strong><br><br>
                <small>⚠️ <strong>Importante:</strong> Ambas aplicações devem estar acessíveis simultaneamente</small>
            `;
            break;
            
        case 'alunos-only':
            message = `
                🔒 <strong>Dados inacessíveis</strong><br><br>
                📋 Para habilitar a captura, acesse:<br>
                <strong>Acadêmico → Consultas → Consulta De Ofertas Por Curso</strong><br><br>
                <small>⚠️ <strong>Importante:</strong> Ambas aplicações devem estar acessíveis simultaneamente</small>
            `;
            break;
            
        case 'none':
            message = `
                🔒 <strong>Dados inacessíveis</strong><br><br>
                📋 Para habilitar a captura, navegue até:<br>
                <strong>1. Acadêmico → Consultas → Consulta De Ofertas Por Curso</strong><br><br>
                <strong>2. Acadêmico → Relatórios → Relação De Alunos Matriculados Por Curso</strong><br><br>
                <small>⚠️ <strong>Importante:</strong> Ambas aplicações devem estar acessíveis simultaneamente</small>
            `;
            break;
            
        default:
            message = `
                🔒 Você está no SIAA, mas os dados não estão acessíveis.<br><br>
                📋 Navegue até:<br>
                <strong>Acadêmico → Consultas → Consulta De Ofertas Por Curso</strong><br>
                <strong>Acadêmico → Relatórios → Relação De Alunos Matriculados Por Curso</strong>
            `;
            break;
    }
    
    endpointWarningMessage.innerHTML = message;
}

// Função removida - usar parseCSV do viewer.js se necessário

// Função removida - não utilizada no fluxo atual

// Função para buscar cursos disponíveis usando XMLProcessor
async function fetchCursosDisponiveis() {
    // STEP 1 V9: Função redirecionada para CommunicationManager (somente esta função)
    return communicationManagerV9.fetchCursosDisponiveis();
    
}

// Método fallback para compatibilidade
async function fetchCursosDisponiveisOriginal() {
    console.log('⚠️ Usando método original de busca de cursos');
    
    try {
        const codesUrl = await configManager.buildEndpointUrl('ofertas.cursos');
        const codesResp = await fetch(codesUrl, {
            headers: {
                'Accept': 'text/xml, application/xml, */*',
                'Accept-Charset': 'UTF-8'
            }
        });
        if (!codesResp.ok) throw new Error(`HTTP ${codesResp.status}`);
        const codesAb = await codesResp.arrayBuffer();
        const codesText = new TextDecoder('utf-8').decode(codesAb);
        const codesXml = new DOMParser().parseFromString(codesText, 'text/xml');
        const codeOptions = Array.from(codesXml.querySelectorAll('option'));
        
        // Tentar aplicar parseCursoNome manualmente aqui
        const cursos = codeOptions.map(opt => {
            const codigo = opt.getAttribute('value');
            const nomeCompleto = opt.textContent.trim();
            
            if (!codigo) return null;
            
            // Aplicar parseCursoNome manualmente
            const cursoMatch = nomeCompleto.match(/^(.+?)\s*-\s*(\d+)$/);
            if (cursoMatch && cursoMatch[2] === codigo) {
                return {
                    codigo: codigo,
                    nome: cursoMatch[1].trim(),
                    selected: opt.hasAttribute('selected')
                };
            } else {
                return {
                    codigo: codigo,
                    nome: nomeCompleto || `Curso ${codigo}`,
                    selected: opt.hasAttribute('selected')
                };
            }
        }).filter(Boolean);
        
        console.log('📚 Cursos do método fallback:', cursos.length);
        return cursos;
        
    } catch (e) {
        console.error('❌ Erro no método fallback:', e);
        return [];
    }
}

// Popular o select com cursos + extras
async function popularSelectCursos() {
    courseSelect.innerHTML = '<option value="">Carregando...</option>';

    try {
        // Carregar mapeamento de cursos do storage primeiro
        await loadCursoMapping();
        
        // Buscar cursos da API (cursos_disponiveis com nomes processados)
        const cursosAPI = await fetchCursosDisponiveis();
        
        // Buscar cursos manuais do storage
        const storage = await chrome.storage.local.get(['siaa_manual_courses']);
        const cursosManager = storage.siaa_manual_courses || [];
        
        console.log('📚 Cursos API:', cursosAPI.length);
        console.log('➕ Cursos manuais:', cursosManager.length);
        console.log('🗂️ Mapeamento de cursos:', cursoMapping.size);

        // Mesclar cursos, garantindo que não haja duplicatas pelo código
        const cursoMap = new Map();
        
        // Adicionar cursos da API (cursos_disponiveis)
        cursosAPI.forEach(c => {
            // Os nomes já foram processados pelo parseCursoNome no XMLProcessor
            // Mas podemos usar o mapeamento como fallback se disponível
            const nomeFromMapping = getCursoNomeFromMapping(c.codigo);
            const nomeFinal = c.nome || nomeFromMapping || `Curso ${c.codigo}`;
            
            cursoMap.set(c.codigo, {
                codigo: c.codigo,
                nome: nomeFinal,
                selected: c.selected,
                fonte: 'api'
            });
        });
        
        // Adicionar cursos extras (mantendo compatibilidade)
        EXTRA_COURSES.forEach(c => {
            if (!cursoMap.has(c.codigo)) {  // Só adicionar se não existir
                const nomeFromMapping = getCursoNomeFromMapping(c.codigo);
                const nomeFinal = nomeFromMapping || c.nome;
                
                cursoMap.set(c.codigo, {
                    codigo: c.codigo,
                    nome: nomeFinal,
                    selected: false,
                    fonte: 'extra'
                });
            }
        });
        
        // Adicionar cursos manuais
        cursosManager.forEach(c => {
            // Para cursos manuais, verificar se já existe na API
            if (cursoMap.has(c.codigo)) {
                // Se já existe, apenas marcar como manual e usar o melhor nome disponível
                const existing = cursoMap.get(c.codigo);
                const nomeFromMapping = getCursoNomeFromMapping(c.codigo);
                const nomeFinal = existing.nome || nomeFromMapping || c.nome || `Curso ${c.codigo}`;
                
                cursoMap.set(c.codigo, {
                    ...existing,
                    nome: nomeFinal,
                    manual: true
                });
            } else {
                // Se não existe na API, adicionar como curso manual
                const nomeFromMapping = getCursoNomeFromMapping(c.codigo);
                const nomeFinal = nomeFromMapping || c.nome || `Curso ${c.codigo}`;
                
                cursoMap.set(c.codigo, {
                    codigo: c.codigo,
                    nome: nomeFinal,
                    selected: false,
                    fonte: 'manual',
                    manual: true
                });
            }
        });

        // Ordenar alfabeticamente pelo nome
        const cursosOrdenados = Array.from(cursoMap.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));


        // Construir opções
        const optionsHtml = ['<option value="">Selecione...</option>'];
        cursosOrdenados.forEach(curso => {
            // Adicionar indicador apenas para cursos manuais
            const indicator = curso.manual ? ' [Manual]' : '';
            optionsHtml.push(`<option value="${curso.codigo}">${curso.nome}${indicator}</option>`);
        });

        courseSelect.innerHTML = optionsHtml.join('');
        
        console.log(`✅ Total de cursos carregados: ${cursosOrdenados.length}`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar cursos:', error);
        courseSelect.innerHTML = '<option value="">Erro ao carregar cursos</option>';
    }
}

// Atualizar popularSelectCursos na inicialização
popularSelectCursos();

// Função para executar a extração
async function startExtraction() {
    if (isExtracting) {
        showError('Extração já em andamento');
        return;
    }

    console.log('[SIAA] startExtraction acionado');

    // STEP A V12: Validação completa via ValidationManager
    const validation = validationManagerV12.validateBeforeExtraction();
    if (!validation.isValid) {
        showError(validation.error);
        return;
    }

    const cursoSelecionado = validation.course;
    console.log('📋 V12 - Curso validado no popup:', cursoSelecionado);
    

    try {
        isExtracting = true;
        
        // Esconder aviso estático de falha de storage (se existir)
        if (hasStorageFailure) {
            hideStorageFailureWarning();
        }
        
        // Verificar se há dados salvos
        const data = await chrome.storage.local.get(['siaa_data_csv', 'siaa_data_timestamp']);
        
        if (data.siaa_data_csv) {
            // Mostrar opção de verificar atualizações
            showSuccess('📊 Dados encontrados! Verificando atualizações...');
        }
        
        // Desabilitar botão durante extração
        captureButton.disabled = true;
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        statusDot.style.display = 'none';
        captureButton.textContent = '⏳ Capturando...';
        
        // Obter a aba atual
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            throw new Error('Não foi possível acessar a aba atual');
        }

        // Enviar mensagem para o background script executar a extração, incluindo o curso seleccionado
        console.log('[SIAA] Enviando executeExtraction para background');
        console.log('🔍 [DEBUG] Dados sendo enviados:', {
            action: 'executeExtraction',
            tabId: tab.id,
            cursoSelecionado
        });

        let response;
        try {
            response = await chrome.runtime.sendMessage({
                action: 'executeExtraction',
                tabId: tab.id,
                cursoSelecionado
            });

            console.log('🔍 [DEBUG] Resposta completa do background:', JSON.stringify(response, null, 2));
        console.log('[SIAA] Resposta do background:', response);
        } catch (error) {
            console.error('❌ [DEBUG] Erro ao enviar mensagem para background:', error);
            throw error;
        }

        if (response && response.success) {
            showSuccess('Captura iniciada! Aguarde...');
            updateStatus('Capturando dados...', true);
        } else {
            throw new Error(response?.error || 'Erro ao iniciar captura');
        }

    } catch (error) {
        console.error('Erro na extração:', error);
        showError('Erro: ' + error.message);
        
        // Reabilitar botão
        isExtracting = false;
        captureButton.disabled = false;
        captureButton.textContent = '🔄 Capturar Dados';
        progressContainer.style.display = 'none';
        statusDot.style.display = 'inline-block';
    }
}

// Event Listeners
captureButton.addEventListener('click', startExtraction);

// Listener para mensagens do background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Mensagem recebida no popup:', request);
    
    if (request.action === 'extractionComplete') {
        showSuccess('✅ Dados capturados com sucesso!');
        updateStatus('Captura finalizada', true);
        isExtracting = false;
        captureButton.disabled = false;
        captureButton.textContent = '🔄 Capturar Dados';
        progressContainer.style.display = 'none';
        statusDot.style.display = 'inline-block';
        
    } else if (request.action === 'extractionError') {
        showError('❌ Erro: ' + request.error);
        updateStatus('Erro na captura', false);
        isExtracting = false;
        captureButton.disabled = false;
        captureButton.textContent = '🔄 Capturar Dados';
        
    } else if (request.action === 'extractionProgress') {
        handleExtractionProgress(request.message, request.progress);
        
    } else if (request.action === 'dataStored') {
        updateStoredDataStatus();
        
    } else if (request.action === 'studentsDataStored') {
        console.log('🎓 Dados de alunos salvos no storage');
        updateStoredDataStatus(); // Atualizar status dos dados
        
    } else if (request.action === 'studentCaptureProgress') {
        handleStudentProgress(request.message, request.progress);
    }
});

// Atualizar status dos botões com base nos dados armazenados
async function updateStoredDataStatus() {
    // STEP A V11: Função redirecionada para StorageManager
    const result = await storageManagerV11.updateStoredDataStatus();
    
    // O botão visualizar sempre deve estar disponível, mesmo sem dados
    // Se não há dados, o viewer mostrará uma mensagem apropriada
    viewButton.disabled = false;
    
    return result;
    
}

// Função removida - download será feito via viewer

// Abrir viewer
function openViewer() {
    chrome.tabs.create({ url: chrome.runtime.getURL('viewer.html') });
}

// Botões adicionais
viewButton.addEventListener('click', openViewer);
if (updateExtButton) {
    updateExtButton.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://chromewebstore.google.com/detail/siaa-data-extractor/eagbiabplhfolaennchgalfljbdniioc?authuser=0&hl=pt-BR' });
    });
}

// Verificar storage ao abrir popup
document.addEventListener('DOMContentLoaded', async () => {
    await checkPageStatus();
    await updateStoredDataStatus();
    setInterval(checkPageStatus, 5000);
});

// Receber progresso
let lastPercent = 0;
function handleExtractionProgress(message, percent) {
    // STEP C V10: Função redirecionada para UIManager
    return uiManagerV10.handleExtractionProgress(message, percent);
    
}

// Função para lidar com progresso de captura de alunos
function handleStudentProgress(message, progress) {
    // STEP C V10: Função redirecionada para UIManager
    return uiManagerV10.handleStudentProgress(message, progress);
    
}

// Botão Atualizar Extensão: handler já acima

// Funções de overlay removidas - não utilizadas no fluxo atual 

// ========================================
// FUNÇÃO DE DIAGNÓSTICO V8
// ========================================
self.diagnosePopupV8 = function() {
    console.log('🔍 Diagnóstico Popup V8:');
    console.log('📊 StateManager Stats:', stateManagerV8.getStats());
    
    return {
        version: 'V8-StateManager',
        stateManager: stateManagerV8.getStats(),
        message: 'Popup V8 funcionando com StateManager'
    };
};

console.log('✅ SIAA Data Extractor - Popup Script V8 (StateManager) configurado');
console.log('📊 StateManager V8 ativo para gerenciamento de estado');
console.log('💡 Use diagnosePopupV8() no console para debug');
