// Elementos da interface
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const captureButton = document.getElementById('captureButton');
const downloadButton = document.getElementById('downloadButton');
const viewButton = document.getElementById('viewButton');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Estado da aplicação
let isExtracting = false;
let hasStoredData = false;

// Função para mostrar mensagem de erro
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 6000);
}

// Função para mostrar mensagem de sucesso
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    setTimeout(() => {
        successMessage.classList.add('hidden');
    }, 6000);
}

// Função para verificar se está na página correta
async function checkPageStatus() {
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

// Função para mostrar comparação no popup
function showComparison(comparison) {
    let message = '📊 Comparação: ';
    
    if (comparison.added.length > 0) {
        message += `${comparison.added.length} novas `;
    }
    
    if (comparison.removed.length > 0) {
        message += `${comparison.removed.length} removidas `;
    }
    
    if (comparison.modified.length > 0) {
        message += `${comparison.modified.length} modificadas`;
    }
    
    if (comparison.added.length === 0 && comparison.removed.length === 0 && comparison.modified.length === 0) {
        message = '✨ Nenhuma alteração encontrada';
    }
    
    showSuccess(message);
}

// Função para executar a extração
async function startExtraction() {
    if (isExtracting) {
        showError('Extração já em andamento');
        return;
    }

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
        captureButton.textContent = '⏳ Capturando...';
        
        // Obter a aba atual
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            throw new Error('Não foi possível acessar a aba atual');
        }

        // Enviar mensagem para o background script executar a extração
        const response = await chrome.runtime.sendMessage({
            action: 'executeExtraction',
            tabId: tab.id
        });

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
        
        // Processar comparação se houver dados antigos
        processDataComparison();
        
    } else if (request.action === 'extractionError') {
        showError('❌ Erro: ' + request.error);
        updateStatus('Erro na captura', false);
        isExtracting = false;
        captureButton.disabled = false;
        captureButton.textContent = '🔄 Capturar Dados';
        
    } else if (request.action === 'extractionProgress') {
        updateStatus(request.message, true);
        showSuccess(request.message);
        
    } else if (request.action === 'dataStored') {
        updateStoredDataStatus();
    }
});

// Função para processar comparação de dados
async function processDataComparison() {
    try {
        const data = await chrome.storage.local.get(['siaa_data_csv', 'siaa_data_csv_old']);
        
        if (data.siaa_data_csv && data.siaa_data_csv_old) {
            const oldData = parseCSVToArray(data.siaa_data_csv_old);
            const newData = parseCSVToArray(data.siaa_data_csv);
            
            const comparison = compareData(oldData, newData);
            
            if (comparison.added.length > 0 || comparison.removed.length > 0 || comparison.modified.length > 0) {
                setTimeout(() => {
                    showComparison(comparison);
                }, 1000);
            } else {
                showSuccess('✨ Dados atualizados - sem mudanças');
            }
        }
    } catch (error) {
        console.error('Erro na comparação:', error);
    }
}

// Atualizar status dos botões com base nos dados armazenados
async function updateStoredDataStatus() {
    const data = await chrome.storage.local.get(['siaa_data_csv', 'siaa_data_timestamp']);
    if (data.siaa_data_csv) {
        hasStoredData = true;
        downloadButton.disabled = false;
        viewButton.disabled = false;
        console.log('📦 Dados encontrados no storage. Timestamp:', data.siaa_data_timestamp);
    } else {
        hasStoredData = false;
        downloadButton.disabled = true;
        viewButton.disabled = true;
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

// Verificar storage ao abrir popup
document.addEventListener('DOMContentLoaded', async () => {
    await checkPageStatus();
    await updateStoredDataStatus();
    setInterval(checkPageStatus, 5000);
}); 