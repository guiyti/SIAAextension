// Elementos da interface
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const captureButton = document.getElementById('captureButton');
const downloadButton = document.getElementById('downloadButton');
const viewButton = document.getElementById('viewButton');
const courseSelect = document.getElementById('courseSelect');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const sendButton = document.getElementById('sendButton');

// Estado da aplicação
let isExtracting = false;
let hasStoredData = false;

// Cursos extras definidos pelo desenvolvedor.
// Adicione novos cursos no formato { codigo: '999', nome: 'NOME DO CURSO' }
const EXTRA_COURSES = [
    // { codigo: '68', nome: 'CST EM ANÁLISE E DESENVOLVIMENTO DE SISTEMAS (EXTRA)' },
    // { codigo: '16', nome: 'CIÊNCIA DA COMPUTAÇÃO (BACHARELADO) (EXTRA)' },
    // { codigo: '121', nome: 'CST EM GESTÃO DA TECNOLOGIA DA INFORMAÇÃO (EXTRA)' }
];

// Mensagens visuais removidas; logs serão feitos apenas no console

// Adicionando stubs para evitar ReferenceError e registrar no console
function showError(msg) {
    console.error('[SIAA-ERRO] ' + msg);
    // Caso queira exibir no popup, descomente a linha abaixo:
    // updateStatus(msg, false);
}

function showSuccess(msg) {
    console.log('[SIAA-OK] ' + msg);
    // Caso queira exibir no popup, descomente a linha abaixo:
    // updateStatus(msg, true);
}

// Função para verificar se está na página correta
async function checkPageStatus() {
    // Não atualizar status durante extração para evitar sobrescrever percentual
    if (isExtracting) return;
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            updateStatus('Erro ao verificar página', false);
            return;
        }

        const url = tab.url;

        // Verificar se está no domínio correto
        if (!url.includes('siaa.cruzeirodosul.edu.br')) {
            updateStatus('Acesse o SIAA', false);
            captureButton.disabled = true;
            return;
        }

        // Verificar se está na página específica
        if (url.includes('novo-siaa/secure/core/home.jsf')) {
            updateStatus('Pronto para extrair', true);
            captureButton.disabled = false;
        } else {
            updateStatus('Acesse home.jsf', false);
            captureButton.disabled = true;
        }
    } catch (error) {
        console.error('Erro ao verificar página:', error);
        updateStatus('Erro ao verificar página', false);
        captureButton.disabled = true;
    }
}

// Função para atualizar status visual
function updateStatus(text, isActive = false) {
    statusText.textContent = text;
    
    if (isActive) {
        statusDot.classList.add('active');
    } else {
        statusDot.classList.remove('active');
    }
}

// Função para parsear CSV em array de objetos
function parseCSVToArray(csvContent) {
    const lines = csvContent.split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());
        
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

// Função para comparar dados
function compareData(oldData, newData) {
    const oldMap = new Map();
    const newMap = new Map();
    
    // Usar ID Oferta como chave única
    oldData.forEach(row => {
        const key = row['ID Oferta'];
        if (key) oldMap.set(key, row);
    });
    
    newData.forEach(row => {
        const key = row['ID Oferta'];
        if (key) newMap.set(key, row);
    });
    
    const added = [];
    const removed = [];
    const modified = [];
    
    // Verificar adições e modificações
    newMap.forEach((newRow, key) => {
        if (!oldMap.has(key)) {
            added.push(newRow);
        } else {
            const oldRow = oldMap.get(key);
            // Comparar campos relevantes
            const fieldsToCompare = ['Vagas', 'Matriculados', 'Pré-matriculados', 'Total', 'Vagas Restantes', 'Nome Professor'];
            let hasChanges = false;
            const changes = {};
            
            fieldsToCompare.forEach(field => {
                if (oldRow[field] !== newRow[field]) {
                    hasChanges = true;
                    changes[field] = {
                        old: oldRow[field],
                        new: newRow[field]
                    };
                }
            });
            
            if (hasChanges) {
                modified.push({
                    disciplina: newRow['Nome Disciplina'],
                    campus: newRow['Sigla Campus'],
                    periodo: newRow['Período'],
                    idOferta: key,
                    changes
                });
            }
        }
    });
    
    // Verificar remoções
    oldMap.forEach((oldRow, key) => {
        if (!newMap.has(key)) {
            removed.push(oldRow);
        }
    });
    
    return { added, removed, modified };
}

// Função para buscar cursos disponíveis via SIAA
async function fetchCursosDisponiveis() {
    // Verificar lista de códigos no storage
    const stored = await chrome.storage.local.get('siaa_course_codes');
    let codeList = Array.isArray(stored.siaa_course_codes) ? stored.siaa_course_codes : null;

    try {
        // 1) Obter lista de códigos permitidos ao usuário
        const codesUrl = 'https://siaa.cruzeirodosul.edu.br/siaa/mod/academico/wacdcon12/comboCurso.xml.jsp?ano_leti=2025&sem_leti=2';
        const codesResp = await fetch(codesUrl, {
            headers: {
                'Accept': 'text/xml, application/xml, */*',
                'Accept-Charset': 'ISO-8859-1'
            }
        });
        if (!codesResp.ok) throw new Error(`HTTP ${codesResp.status}`);
        const codesAb = await codesResp.arrayBuffer();
        const codesText = new TextDecoder('iso-8859-1').decode(codesAb);
        const codesXml = new DOMParser().parseFromString(codesText, 'text/xml');
        const codeOptions = Array.from(codesXml.querySelectorAll('option'));
        const codes = codeOptions.map(opt => opt.getAttribute('value')).filter(Boolean);

        // 2) Obter mapeamento código->nome global
        const namesUrl = 'https://siaa.cruzeirodosul.edu.br/siaa/mod/acd/graduacao/wacdplan05/comboCursos.jsp?ano_leti=2025&sem_leti=2';
        const namesResp = await fetch(namesUrl, { headers: { 'Accept': 'text/xml, application/xml, */*', 'Accept-Charset': 'ISO-8859-1' } });
        if (!namesResp.ok) throw new Error(`HTTP ${namesResp.status}`);
        const namesAb = await namesResp.arrayBuffer();
        const namesText = new TextDecoder('iso-8859-1').decode(namesAb);
        const namesXml = new DOMParser().parseFromString(namesText, 'text/xml');
        const nameOptions = Array.from(namesXml.querySelectorAll('option'));
        const nameMap = new Map();
        nameOptions.forEach(opt => {
            const val = opt.getAttribute('value');
            const text = opt.textContent.trim();
            if (val && text) nameMap.set(val, text);
        });

        // Se já tínhamos lista de códigos, usa ela; senão armazena nova.
        if (!codeList) {
            await chrome.storage.local.set({ siaa_course_codes: codes });
            codeList = codes;
        }

        const validCodes = (codeList && codeList.length) ? codeList : codes;
        const cursos = validCodes.map(cod => ({ codigo: cod, nome: nameMap.get(cod) || cod }));

        return cursos;
    } catch (e) {
        console.error('Erro ao buscar cursos:', e);
        showError('Erro ao carregar cursos');
        return [];
    }
}

// Popular o select com cursos + extras
async function popularSelectCursos() {
    courseSelect.innerHTML = '<option value="">Carregando...</option>';

    const cursosAPI = await fetchCursosDisponiveis();

    // Mesclar extras, garantindo que não haja duplicatas pelo código
    const cursoMap = new Map();
    cursosAPI.forEach(c => cursoMap.set(c.codigo, c));
    EXTRA_COURSES.forEach(c => cursoMap.set(c.codigo, c));

    // Ordenar alfabeticamente pelo nome
    const cursosOrdenados = Array.from(cursoMap.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    // Construir opções
    const optionsHtml = ['<option value="">Selecione...</option>'];
    cursosOrdenados.forEach(curso => {
        optionsHtml.push(`<option value="${curso.codigo}">${curso.nome}</option>`);
    });

    courseSelect.innerHTML = optionsHtml.join('');
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

    // NOVA VALIDAÇÃO DE CURSO SELECIONADO
    const selectedCode = courseSelect.value;
    if (!selectedCode) {
        showError('Selecione um curso antes de continuar');
        return;
    }
    const selectedName = courseSelect.options[courseSelect.selectedIndex].text;
    const cursoSelecionado = { codigo: selectedCode, nome: selectedName };

    console.log('[SIAA] Curso selecionado no popup:', cursoSelecionado);

    try {
        isExtracting = true;
        
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
        const response = await chrome.runtime.sendMessage({
            action: 'executeExtraction',
            tabId: tab.id,
            cursoSelecionado
        });

        console.log('[SIAA] Resposta do background:', response);

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
    }
});

// Atualizar status dos botões com base nos dados armazenados
async function updateStoredDataStatus() {
    const data = await chrome.storage.local.get(['siaa_data_csv', 'siaa_data_timestamp']);
    if (data.siaa_data_csv) {
        hasStoredData = true;
        downloadButton.disabled = false;
        viewButton.disabled = false;
        // sendButton permanece habilitado
        console.log('📦 Dados encontrados no storage. Timestamp:', data.siaa_data_timestamp);
    } else {
        hasStoredData = false;
        downloadButton.disabled = true;
        viewButton.disabled = true;
        // sendButton permanece habilitado
    }
}

// Baixar CSV do storage
async function downloadStoredCSV() {
    const data = await chrome.storage.local.get(['siaa_data_csv', 'siaa_data_timestamp']);
    if (!data.siaa_data_csv) {
        showError('Nenhum dado para download.');
        return;
    }
    const blob = new Blob([data.siaa_data_csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fileName = `ofertas_disciplinas_${new Date(data.siaa_data_timestamp).toISOString().slice(0,10)}.csv`;
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('📥 CSV baixado!');
}

// Abrir viewer
function openViewer() {
    chrome.tabs.create({ url: chrome.runtime.getURL('viewer.html') });
}

// Botões adicionais
downloadButton.addEventListener('click', downloadStoredCSV);
viewButton.addEventListener('click', openViewer);
sendButton.addEventListener('click', sendCSV);

// Verificar storage ao abrir popup
document.addEventListener('DOMContentLoaded', async () => {
    await checkPageStatus();
    await updateStoredDataStatus();
    setInterval(checkPageStatus, 5000);
});

// Receber progresso
let lastPercent = 0;
function handleExtractionProgress(message, percent) {
    if (typeof percent === 'number') {
        lastPercent = percent;
        progressBar.style.width = percent + '%';
        statusText.textContent = percent + '%';
    }
}

// Botão Enviar CSV
async function sendCSV() {
    // Abrir seletor de arquivo
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            await chrome.storage.local.set({
                siaa_data_csv: text,
                siaa_data_timestamp: Date.now()
            });
            showSuccess('CSV carregado! Abrindo viewer...');
            chrome.runtime.sendMessage({ action: 'dataStored' });
            openViewer();
        } catch (e) {
            showError('Falha ao ler CSV: ' + e.message);
        }
    };
    input.click();
}

// Exibir overlay
function exibirOverlayComparacao(comp) {
    const parts = [];
    if (comp.added.length)   parts.push(`⬆️ ${comp.added.length}`);
    if (comp.removed.length) parts.push(`⬇️ ${comp.removed.length}`);
    if (comp.modified.length)parts.push(`🔄 ${comp.modified.length}`);
    cmpDetails.textContent = parts.join('  ');
    comparisonOverlay.style.display = 'flex';
}

btnKeep.addEventListener('click', async () => {
    comparisonOverlay.style.display = 'none';
});

btnOverwrite.addEventListener('click', async () => {
    await chrome.storage.local.remove('siaa_data_csv_old');
    comparisonOverlay.style.display = 'none';
    showSuccess('Dados sobrescritos');
}); 