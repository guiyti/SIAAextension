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
async function executeExtraction(tabId) {
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
            func: () => {
                console.log('🔍 Verificando função exportarTabelaSIAA...');
                
                // Verificar se a função está disponível
                if (typeof window.exportarTabelaSIAA === 'function') {
                    console.log('🚀 Executando exportarTabelaSIAA...');
                    
                    // Executar a função
                    try {
                        window.exportarTabelaSIAA();
                        return { success: true, message: 'Função executada com sucesso' };
                    } catch (execError) {
                        console.error('❌ Erro ao executar função:', execError);
                        return { success: false, error: execError.message };
                    }
                } else {
                    console.error('❌ Função exportarTabelaSIAA não encontrada');
                    return { success: false, error: 'Função exportarTabelaSIAA não encontrada' };
                }
            }
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
    console.log('📨 Mensagem recebida no background:', request);
    
    if (request.action === 'executeExtraction') {
        console.log('🎯 Processando solicitação de extração para tab:', request.tabId);
        
        // Executar extração de forma assíncrona
        executeExtraction(request.tabId)
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
            // Salvar dados antigos para comparação
            const saveData = {
                siaa_data_csv: request.csv,
                siaa_data_timestamp: request.timestamp || Date.now()
            };
            
            if (oldData.siaa_data_csv) {
                saveData.siaa_data_csv_old = oldData.siaa_data_csv;
                console.log('📂 Dados antigos salvos para comparação');
            }
            
            chrome.storage.local.set(saveData, () => {
                console.log('💾 Dados capturados armazenados no storage');
                
                // Notificar que dados foram armazenados
                chrome.runtime.sendMessage({ 
                    action: 'dataStored' 
                }).catch(err => console.log('ℹ️ Popup pode estar fechado:', err));
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