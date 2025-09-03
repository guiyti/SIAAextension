// Background Script - Service Worker para Chrome Extension
console.log('🔧 SIAA Data Extractor - Background Script iniciado');

// Listener para instalação da extensão
chrome.runtime.onInstalled.addListener((details) => {
    console.log('📦 Extensão instalada:', details.reason);
    
    if (details.reason === 'install') {
        console.log('✅ Primeira instalação da extensão SIAA Data Extractor');
    } else if (details.reason === 'update') {
        console.log('🔄 Extensão atualizada para versão:', chrome.runtime.getManifest().version);
    }
});

// Função para executar a extração usando chrome.scripting
async function executeExtraction(tabId, cursoSelecionado = null) {
    console.log('⚙️ executeExtraction chamado com cursoSelecionado:', cursoSelecionado);
    try {
        console.log('🚀 Iniciando extração via chrome.scripting para tab:', tabId);
        
        // Verificar se a aba é válida
        const tab = await chrome.tabs.get(tabId);
        
        if (!tab.url.includes('siaa.cruzeirodosul.edu.br')) {
            throw new Error('Página não é do SIAA');
        }
        
        if (!tab.url.includes('novo-siaa/secure/core/home.jsf')) {
            throw new Error('Navegue para a página inicial do SIAA (home.jsf)');
        }
        
        // Notificar início da extração
        console.log('📡 Enviando mensagem de progresso...');
        chrome.runtime.sendMessage({
            action: 'extractionProgress',
            message: 'Preparando extração...'
        }).catch(err => console.log('ℹ️ Popup pode estar fechado:', err));
        
        // Primeiro injetar o script que define as funções
        console.log('💉 Injetando script injected.js...');
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['injected.js']
        });
        
        console.log('✅ Script injected.js carregado');
        
        // Aguardar um pouco para garantir que o script foi carregado
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Depois executar a função de extração
        console.log('🎯 Executando função exportarTabelaSIAA...');
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (selectedCourse) => {
                // Tornar disponível globalmente para eventuais fallbacks
                if (selectedCourse) {
                    window.__SIAA_SELECTED_COURSE = selectedCourse;
                }
                console.log('🔍 Verificando função exportarTabelaSIAA...');
                
                console.log('📌 selectedCourse dentro da página:', selectedCourse);
                if (typeof window.exportarTabelaSIAA === 'function') {
                    console.log('🚀 Executando exportarTabelaSIAA...');
                    
                    // Executar a função
                    try {
                        window.exportarTabelaSIAA(selectedCourse || null);
                        return { success: true, message: 'Função executada com sucesso' };
                    } catch (execError) {
                        console.error('❌ Erro ao executar função:', execError);
                        return { success: false, error: execError.message };
                    }
                } else {
                    console.error('❌ Função exportarTabelaSIAA não encontrada');
                    return { success: false, error: 'Função exportarTabelaSIAA não encontrada' };
                }
            },
            args: [cursoSelecionado]
        });
        
        console.log('📊 Resultado da execução:', results);
        
        const result = results[0]?.result;
        
        if (result && !result.success) {
            throw new Error(result.error || 'Erro na execução da função');
        }
        
        console.log('✅ Extração iniciada com sucesso');
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Erro na extração:', error);
        
        // Notificar erro
        chrome.runtime.sendMessage({
            action: 'extractionError',
            error: error.message
        }).catch(err => console.log('ℹ️ Popup pode estar fechado:', err));
        
        return { success: false, error: error.message };
    }
}

// Listener para mensagens
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Filtrar apenas mensagens com actions válidas
    if (!request || !request.action) {
        console.warn('⚠️ Mensagem sem action recebida no background:', request);
        return;
    }
    
    console.log('📨 Mensagem recebida no background:', request.action);
    if (request.cursoSelecionado) {
        console.log('📌 cursoSelecionado recebido no background:', request.cursoSelecionado);
    }
    
    if (request.action === 'executeExtraction') {
        console.log('🎯 Processando solicitação de extração para tab:', request.tabId);
        
        // Executar extração de forma assíncrona
        executeExtraction(request.tabId, request.cursoSelecionado)
            .then(result => {
                console.log('✅ Extração concluída:', result);
                sendResponse(result);
            })
            .catch(error => {
                console.error('❌ Erro na extração:', error);
                sendResponse({ success: false, error: error.message });
            });
        
        // Retornar true para indicar resposta assíncrona
        return true;
    }
    
    if (request.action === 'captureData') {
        console.log('💾 Salvando dados capturados...');
        
        // Primeiro buscar dados antigos
        chrome.storage.local.get(['siaa_data_csv'], (oldData) => {
            // Funções auxiliares para parse/gerar CSV com suporte mínimo a aspas
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
                            i++; // pular próxima
                        } else {
                            inQuotes = !inQuotes;
                        }
                    } else if (char === ',' && !inQuotes) {
                        values.push(currentValue);
                        currentValue = '';
                    } else {
                        currentValue += char;
                    }
                }
                values.push(currentValue);
                return values.map(v => v.trim());
            }

            function csvToObjects(csv) {
                if (!csv) return [];
                const lines = csv.split('\n').filter(l => l.trim());
                if (lines.length < 2) return [];
                const headers = parseCSVLine(lines[0]);
                return lines.slice(1).map(line => {
                    const values = parseCSVLine(line);
                    const obj = {};
                    headers.forEach((h, idx) => obj[h] = values[idx] || '');
                    return obj;
                });
            }

            function objectsToCSV(objs, headers) {
                const headerLine = headers.join(',');
                const lines = objs.map(obj => headers.map(h => {
                    const val = String(obj[h] || '').replace(/"/g, '""');
                    return val.includes(',') ? `"${val}"` : val;
                }).join(','));
                return [headerLine, ...lines].join('\n');
            }

            // Mesclar removendo duplicatas por ID Oferta
            const oldObjs = csvToObjects(oldData.siaa_data_csv);
            const newObjs = csvToObjects(request.csv);

            const map = new Map();
            [...oldObjs, ...newObjs].forEach(obj => {
                const key = obj['ID Oferta'] || obj['Id Oferta'] || obj['IdOferta'] || obj['idOferta'];
                if (key) {
                    map.set(key, obj); // mantém o último (novo) caso de duplicata
                }
            });

            const mergedObjs = Array.from(map.values());
            // Usar cabeçalhos do novo CSV se existirem, senão do antigo
            const headerLine = request.csv.split('\n')[0] || oldData.siaa_data_csv?.split('\n')[0];
            const headers = parseCSVLine(headerLine);
            const mergedCsv = objectsToCSV(mergedObjs, headers);

            // Prefixar BOM para compatibilidade com Excel / UTF-8
            const csvWithBom = '\uFEFF' + mergedCsv;

            const saveData = {
                siaa_data_csv: csvWithBom,
                siaa_data_timestamp: request.timestamp || Date.now()
            };
            
            chrome.storage.local.set(saveData, () => {
                if (chrome.runtime.lastError) {
                    console.error('❌ Erro ao salvar dados de ofertas:', chrome.runtime.lastError);
                } else {
                    console.log(`💾 Dados de ofertas armazenados com sucesso. Total de ofertas: ${mergedObjs.length}`);
                    console.log(`📊 Tamanho do CSV salvo: ${saveData.siaa_data_csv.length} caracteres`);
                    chrome.runtime.sendMessage({ action: 'dataStored' }).catch(err => console.log('ℹ️ Popup pode estar fechado:', err));
                }
            });
        });
        
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === 'extractionComplete') {
        console.log('🎉 Extração completa recebida');
        
        // Repassar para o popup
        chrome.runtime.sendMessage({
            action: 'extractionComplete'
        }).catch(err => console.log('ℹ️ Popup pode estar fechado:', err));
        
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === 'extractionProgress') {
        console.log('📈 Progresso da extração:', request.message);
        
        // Repassar para o popup
        chrome.runtime.sendMessage({
            action: 'extractionProgress',
            message: request.message
        }).catch(err => console.log('ℹ️ Popup pode estar fechado:', err));
        
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === 'captureStudentData') {
        console.log('🎓 Salvando dados de alunos capturados...');
        
        // Primeiro buscar dados antigos de alunos
        chrome.storage.local.get(['siaa_students_csv'], (oldData) => {
            // Funções auxiliares para parse/gerar CSV com suporte mínimo a aspas (IGUAIS às das ofertas)
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
                            i++; // pular próxima
                        } else {
                            inQuotes = !inQuotes;
                        }
                    } else if (char === ',' && !inQuotes) {
                        values.push(currentValue);
                        currentValue = '';
                    } else {
                        currentValue += char;
                    }
                }
                values.push(currentValue);
                return values.map(v => v.trim());
            }

            function csvToObjects(csv) {
                if (!csv) return [];
                const lines = csv.split('\n').filter(l => l.trim());
                if (lines.length < 2) return [];
                const headers = parseCSVLine(lines[0]);
                return lines.slice(1).map(line => {
                    const values = parseCSVLine(line);
                    const obj = {};
                    headers.forEach((h, idx) => obj[h] = values[idx] || '');
                    return obj;
                });
            }

            function objectsToCSV(objs, headers) {
                const headerLine = headers.join(',');
                const lines = objs.map(obj => headers.map(h => {
                    const val = String(obj[h] || '').replace(/"/g, '""');
                    return val.includes(',') ? `"${val}"` : val;
                }).join(','));
                return [headerLine, ...lines].join('\n');
            }

            // Mesclar removendo duplicatas por RGM (chave única dos alunos)
            const oldObjs = csvToObjects(oldData.siaa_students_csv);
            const newObjs = csvToObjects(request.csv);

            const map = new Map();
            [...oldObjs, ...newObjs].forEach(obj => {
                const key = obj['RGM'] || obj['Rgm'] || obj['rgm'] || obj['Registro'] || obj['registro'];
                if (key) {
                    map.set(key, obj); // mantém o último (novo) caso de duplicata
                }
            });

            const mergedObjs = Array.from(map.values());
            // Usar cabeçalhos do novo CSV se existirem, senão do antigo
            const headerLine = request.csv.split('\n')[0] || oldData.siaa_students_csv?.split('\n')[0];
            const headers = parseCSVLine(headerLine);
            const mergedCsv = objectsToCSV(mergedObjs, headers);

            // Prefixar BOM para compatibilidade com Excel / UTF-8
            const csvWithBom = '\uFEFF' + mergedCsv;

            const studentData = {
                siaa_students_csv: csvWithBom,
                siaa_students_timestamp: request.timestamp || Date.now()
            };
            
            chrome.storage.local.set(studentData, () => {
                if (chrome.runtime.lastError) {
                    console.error('❌ Erro ao salvar dados de alunos:', chrome.runtime.lastError);
                } else {
                    console.log(`💾 Dados de alunos mesclados e armazenados com sucesso. Total de alunos: ${mergedObjs.length}`);
                    console.log(`📊 Tamanho do CSV de alunos salvo: ${studentData.siaa_students_csv.length} caracteres`);
                    chrome.runtime.sendMessage({ action: 'studentsDataStored' }).catch(err => console.log('ℹ️ Popup pode estar fechado:', err));
                }
            });
        });
        
        sendResponse({ success: true });
        return true;
    }
});

// Listener para clique no ícone da extensão
chrome.action.onClicked.addListener(async (tab) => {
    console.log('🖱️ Ícone da extensão clicado na aba:', tab.id);
    
    try {
        // Verificar se está na página correta
        if (!tab.url.includes('siaa.cruzeirodosul.edu.br')) {
            // Navegar para o SIAA se não estiver
            await chrome.tabs.update(tab.id, {
                url: 'https://siaa.cruzeirodosul.edu.br/novo-siaa/secure/core/home.jsf'
            });
            return;
        }
        
        // Se já estiver no SIAA, o popup será aberto automaticamente
        console.log('✅ Usuário no SIAA - Popup será exibido');
        
    } catch (error) {
        console.error('❌ Erro ao processar clique:', error);
    }
});

// Listener para mudanças de aba
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Verificar se a página foi carregada completamente
    if (changeInfo.status === 'complete' && tab.url) {
        
        // Log para debug
        if (tab.url.includes('siaa.cruzeirodosul.edu.br')) {
            console.log('📍 Navegação no SIAA detectada:', tab.url);
            
            // Verificar se está na página correta
            if (tab.url.includes('novo-siaa/secure/core/home.jsf')) {
                console.log('✅ Usuário na página inicial do SIAA');
                
                // Atualizar badge (opcional)
                chrome.action.setBadgeText({
                    tabId: tabId,
                    text: '✓'
                });
                chrome.action.setBadgeBackgroundColor({
                    tabId: tabId,
                    color: '#ebb55e'
                });
            } else {
                // Limpar badge se não estiver na página correta
                chrome.action.setBadgeText({
                    tabId: tabId,
                    text: ''
                });
            }
        } else {
            // Limpar badge se não estiver no SIAA
            chrome.action.setBadgeText({
                tabId: tabId,
                text: ''
            });
        }
    }
});

// Listener para erros não capturados
self.addEventListener('error', (event) => {
    console.error('❌ Erro não capturado no background script:', event.error);
});

// Listener para promises rejeitadas
self.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rejeitada no background script:', event.reason);
});

console.log('✅ SIAA Data Extractor - Background Script configurado'); 