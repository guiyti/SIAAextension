// Background Script - Service Worker para Chrome Extension
// VERSÃO V7 - ExtractionManager + DataDeduplicationHelper + MessageHandler + TabManager
console.log('🔧 SIAA Data Extractor - Background Script V7 (TabManager) iniciado');

// ========================================
// EXTRACTION MANAGER V7 (preservado da V6)
// ========================================
class ExtractionManager {
    constructor() {
        this.version = 'V7-ExtractionManager';
        console.log('🎯 ExtractionManager V7 inicializado - preservado da V6');
    }

    async executeExtraction(tabId, cursoSelecionado = null) {
        console.log('⚙️ executeExtraction V7 chamado com cursoSelecionado:', cursoSelecionado);
        try {
            console.log('🚀 Iniciando extração V7 via chrome.scripting para tab:', tabId);
        
        // Verificar se a aba é válida
        const tab = await chrome.tabs.get(tabId);
        
        if (!tab.url.includes('siaa.cruzeirodosul.edu.br')) {
            throw new Error('Página não é do SIAA');
        }
        
        if (!tab.url.includes('novo-siaa/secure/core/home.jsf')) {
            throw new Error('Navegue para a página inicial do SIAA (home.jsf)');
        }
        
        // Notificar início da extração
            console.log('📡 V7 - Enviando mensagem de progresso...');
        chrome.runtime.sendMessage({
            action: 'extractionProgress',
                message: 'Preparando extração V7 (TabManager)...'
            }).catch(err => console.log('ℹ️ V7 - Popup pode estar fechado:', err));
        
        // Primeiro injetar o script que define as funções
            console.log('💉 V7 - Injetando script injected.js...');
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['injected.js']
        });
        
            console.log('✅ V7 - Script injected.js carregado');
        
        // Aguardar um pouco para garantir que o script foi carregado
        await new Promise(resolve => setTimeout(resolve, 500));
        
            // Executar a função que foi injetada
            console.log('🎯 V7 - Executando função exportarTabelaSIAA...');
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (selectedCourse) => {
                if (selectedCourse) {
                    window.__SIAA_SELECTED_COURSE = selectedCourse;
                }
                    console.log('🔍 V7 - Verificando função exportarTabelaSIAA...');
                    console.log('📌 V7 - selectedCourse dentro da página:', selectedCourse);
                    
                    if (typeof window.exportarTabelaSIAA === 'function') {
                        console.log('🚀 V7 - Executando exportarTabelaSIAA...');
                    try {
                        window.exportarTabelaSIAA(selectedCourse || null);
                            return { success: true, message: 'Função V7 executada com sucesso' };
                    } catch (execError) {
                            console.error('❌ V7 - Erro ao executar função:', execError);
                        return { success: false, error: execError.message };
                    }
                } else {
                        console.error('❌ V7 - Função exportarTabelaSIAA não encontrada');
                    return { success: false, error: 'Função exportarTabelaSIAA não encontrada' };
                }
            },
            args: [cursoSelecionado]
        });
        
            console.log('📊 V7 - Resultado da execução:', results);
        
        const result = results[0]?.result;
        
        if (result && !result.success) {
                throw new Error(result.error || 'Erro na execução da função V7');
            }
            
            console.log('✅ V7 - Extração iniciada com sucesso');
            return { success: true, extractionId: `v7-${Date.now()}` };
            
        } catch (error) {
            const errorMsg = `Erro na extração V7: ${error.message}`;
            console.error('❌', errorMsg);
            
            chrome.runtime.sendMessage({
                action: 'extractionError',
                error: errorMsg
            }).catch(err => console.log('ℹ️ V7 - Popup pode estar fechado:', err));
            
            return { success: false, error: errorMsg };
        }
    }

    getStats() {
        return {
            version: this.version,
            message: 'ExtractionManager V7 funcionando'
        };
    }
}

// ========================================
// DATA DEDUPLICATION HELPER V7 (preservado da V6)
// ========================================
class DataDeduplicationHelper {
    constructor() {
        this.version = 'V7-Dedup';
        console.log('🛡️ DataDeduplicationHelper V7 inicializado - preservado da V6');
    }

    // Gerar hash simples para identificar dados únicos
    generateHash(data) {
        let hash = 0;
        if (data.length === 0) return hash;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString();
    }

    // Processar dados de ofertas usando ID Oferta como chave única
    processOfertasData(existingCsv, newCsv, timestamp) {
        console.log('🔍 V8 - Processando dados de ofertas (substituição por ID Oferta)...');
        
        if (!newCsv || !newCsv.trim()) {
            console.log('⚠️ V8 - Nenhum dado novo para processar');
            return {
                siaa_data_csv: existingCsv || '',
                siaa_data_timestamp: timestamp,
                siaa_data_status: 'no_new_data'
            };
        }

        // Limpar BOM e processar linhas
        const cleanExisting = existingCsv ? existingCsv.replace(/^\uFEFF/, '') : '';
        const cleanNew = newCsv.replace(/^\uFEFF/, '');
        
        const existingLines = cleanExisting ? cleanExisting.split('\n').filter(line => line.trim()) : [];
        const newLines = cleanNew.split('\n').filter(line => line.trim());
        
        if (newLines.length === 0) {
            console.log('⚠️ V8 - Nenhuma linha válida nos novos dados');
            return {
                siaa_data_csv: existingCsv || '',
                siaa_data_timestamp: timestamp,
                siaa_data_status: 'no_valid_data'
            };
        }

        // Identificar cabeçalho e encontrar índice da coluna ID Oferta
        const header = newLines[0];
        const headerFields = this.parseCSVLine(header);
        const idOfertaIndex = headerFields.findIndex(field => 
            field.includes('ID Oferta') || field.includes('ID') && field.includes('Oferta')
        );

        if (idOfertaIndex === -1) {
            console.warn('⚠️ V8 - Coluna ID Oferta não encontrada, usando método de hash tradicional');
            return this.processOfertasDataLegacy(existingCsv, newCsv, timestamp);
        }

        console.log(`📍 V8 - Coluna ID Oferta encontrada no índice: ${idOfertaIndex}`);

        // Criar mapa das ofertas existentes por ID Oferta
        const existingOffers = new Map();
        const existingHeader = existingLines.length > 0 ? existingLines[0] : header;
        
        // Processar ofertas existentes
        if (existingLines.length > 1) {
            const existingHeaderFields = this.parseCSVLine(existingHeader);
            const existingIdIndex = existingHeaderFields.findIndex(field => 
                field.includes('ID Oferta') || field.includes('ID') && field.includes('Oferta')
            );

            if (existingIdIndex !== -1) {
                for (let i = 1; i < existingLines.length; i++) {
                    const lineFields = this.parseCSVLine(existingLines[i]);
                    const idOferta = lineFields[existingIdIndex]?.trim();
                    if (idOferta) {
                        existingOffers.set(idOferta, {
                            line: existingLines[i],
                            fields: lineFields,
                            index: i
                        });
                    }
                }
            }
        }

        // Processar novas ofertas e registrar alterações
        const changes = [];
        let newCount = 0;
        let updatedCount = 0;
        let unchangedCount = 0;

        for (let i = 1; i < newLines.length; i++) {
            const newLine = newLines[i];
            const newFields = this.parseCSVLine(newLine);
            const idOferta = newFields[idOfertaIndex]?.trim();

            if (!idOferta) {
                console.warn(`⚠️ V8 - Linha ${i} sem ID Oferta válido, ignorada`);
                continue;
            }

            if (existingOffers.has(idOferta)) {
                const existing = existingOffers.get(idOferta);
                
                // Verificar se houve mudanças
                if (existing.line !== newLine) {
                    changes.push({
                        type: 'updated',
                        idOferta: idOferta,
                        before: existing.line,
                        after: newLine,
                        beforeFields: existing.fields,
                        afterFields: newFields,
                        timestamp: timestamp
                    });
                    
                    // Atualizar no mapa
                    existingOffers.set(idOferta, {
                        line: newLine,
                        fields: newFields,
                        index: existing.index
                    });
                    updatedCount++;
                    console.log(`🔄 V8 - Oferta ${idOferta} atualizada`);
                } else {
                    unchangedCount++;
                }
            } else {
                // Nova oferta
                changes.push({
                    type: 'added',
                    idOferta: idOferta,
                    after: newLine,
                    afterFields: newFields,
                    timestamp: timestamp
                });
                
                existingOffers.set(idOferta, {
                    line: newLine,
                    fields: newFields,
                    index: -1 // Marca como nova
                });
                newCount++;
                console.log(`➕ V8 - Nova oferta ${idOferta} adicionada`);
            }
        }

        // Construir CSV final
        const finalLines = [header];
        for (const offer of existingOffers.values()) {
            finalLines.push(offer.line);
        }
        
        const finalCsv = '\uFEFF' + finalLines.join('\n');

        // Salvar log de alterações se houver mudanças
        if (changes.length > 0) {
            this.saveChangesLog(changes, timestamp);
        }

        console.log(`✅ V8 - Processamento concluído: ${newCount} novas, ${updatedCount} atualizadas, ${unchangedCount} inalteradas`);
        
        return {
            siaa_data_csv: finalCsv,
            siaa_data_timestamp: timestamp,
            siaa_data_status: 'completed',
            siaa_data_stats: {
                new_offers: newCount,
                updated_offers: updatedCount,
                unchanged_offers: unchangedCount,
                total_offers: existingOffers.size,
                changes_logged: changes.length
            }
        };
    }

    // Método auxiliar para parsing de linhas CSV
    parseCSVLine(line) {
        const fields = [];
        let field = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    field += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                fields.push(field.trim());
                field = '';
            } else {
                field += char;
            }
        }
        
        fields.push(field.trim());
        return fields;
    }

    // Salvar log de alterações
    async saveChangesLog(changes, timestamp) {
        try {
            // Recuperar log existente
            const result = await new Promise((resolve) => {
                chrome.storage.local.get(['siaa_changes_log'], resolve);
            });
            
            const existingLog = result.siaa_changes_log || [];
            
            // Adicionar novas alterações
            const logEntry = {
                timestamp: timestamp,
                date: new Date(timestamp).toLocaleString('pt-BR'),
                changes: changes,
                summary: {
                    added: changes.filter(c => c.type === 'added').length,
                    updated: changes.filter(c => c.type === 'updated').length
                }
            };
            
            existingLog.push(logEntry);
            
            // Manter apenas os últimos 50 logs para não sobrecarregar o storage
            const limitedLog = existingLog.slice(-50);
            
            await new Promise((resolve) => {
                chrome.storage.local.set({ siaa_changes_log: limitedLog }, resolve);
            });
            
            console.log(`📝 V8 - Log de alterações salvo: ${changes.length} mudanças registradas`);
            
        } catch (error) {
            console.error('❌ V8 - Erro ao salvar log de alterações:', error);
        }
    }

    // Método legacy para fallback
    processOfertasDataLegacy(existingCsv, newCsv, timestamp) {
        console.log('🔄 V8 - Usando método legacy (hash) devido à ausência de ID Oferta');
        
        const existingLines = existingCsv ? existingCsv.split('\n').filter(line => line.trim()) : [];
        const existingHashes = new Set();
        
        existingLines.forEach(line => {
            if (line.trim() && !line.startsWith('PERÍODO')) {
                const hash = this.generateHash(line.trim());
                existingHashes.add(hash);
            }
        });

        const newLines = newCsv.split('\n').filter(line => line.trim() && !line.startsWith('PERÍODO'));
        const uniqueNewLines = [];
        let duplicatesFound = 0;

        newLines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                const hash = this.generateHash(trimmedLine);
                if (!existingHashes.has(hash)) {
                    uniqueNewLines.push(trimmedLine);
                    existingHashes.add(hash);
                } else {
                    duplicatesFound++;
                }
            }
        });

        let finalCsv = existingCsv || '';
        if (uniqueNewLines.length > 0) {
            finalCsv += (finalCsv ? '\n' : '') + uniqueNewLines.join('\n');
        }

        return {
            siaa_data_csv: finalCsv,
            siaa_data_timestamp: timestamp,
            siaa_data_status: 'completed_legacy',
            siaa_data_stats: {
                new_lines: uniqueNewLines.length,
                duplicates_prevented: duplicatesFound,
                total_lines: finalCsv.split('\n').filter(line => line.trim()).length
            }
        };
    }

    // Processar dados de alunos evitando duplicação
    processStudentsData(existingCsv, newCsv, timestamp) {
        console.log('🔍 V7 - Processando dados de alunos (evitando duplicação)...');
        
        if (!newCsv || !newCsv.trim()) {
            console.log('⚠️ V7 - Nenhum dado novo de alunos para processar');
            return {
                siaa_students_csv: existingCsv || '',
                siaa_students_timestamp: timestamp,
                siaa_students_status: 'no_new_data'
            };
        }

        // Processar linhas existentes
        const existingLines = existingCsv ? existingCsv.split('\n').filter(line => line.trim()) : [];
        const existingHashes = new Set();
        
        // Gerar hashes das linhas existentes (exceto cabeçalho)
        existingLines.forEach(line => {
            if (line.trim() && !line.includes('INSTITUIÇÃO')) {
                const hash = this.generateHash(line.trim());
                existingHashes.add(hash);
            }
        });

        // Processar novas linhas
        const newLines = newCsv.split('\n').filter(line => line.trim() && !line.includes('INSTITUIÇÃO'));
        const uniqueNewLines = [];
        let duplicatesFound = 0;

        newLines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                const hash = this.generateHash(trimmedLine);
                if (!existingHashes.has(hash)) {
                    uniqueNewLines.push(trimmedLine);
                    existingHashes.add(hash);
                } else {
                    duplicatesFound++;
                    console.log('🚫 V7 - Duplicata de aluno detectada e ignorada');
                }
            }
        });

        console.log('📊 V7 - Novas linhas únicas de alunos:', uniqueNewLines.length);
        console.log('📊 V7 - Duplicatas de alunos encontradas:', duplicatesFound);

        // Construir CSV final
        let finalCsv = existingCsv || '';
        if (uniqueNewLines.length > 0) {
            finalCsv += (finalCsv ? '\n' : '') + uniqueNewLines.join('\n');
        }

        console.log('✅ V7 - Dados de alunos processados sem duplicação');
        return {
            siaa_students_csv: finalCsv,
            siaa_students_timestamp: timestamp,
            siaa_students_status: 'completed',
            siaa_students_stats: {
                new_lines: uniqueNewLines.length,
                duplicates_prevented: duplicatesFound,
                total_lines: finalCsv.split('\n').filter(line => line.trim()).length
            }
        };
    }

    getStats() {
        return {
            version: this.version,
            message: 'DataDeduplicationHelper V7 funcionando'
        };
    }
}

// ========================================
// MESSAGE HANDLER V7 (preservado da V6)
// ========================================
class MessageHandler {
    constructor(extractionManager, dataDeduplicationHelper) {
        this.extractionManager = extractionManager;
        this.dataDeduplicationHelper = dataDeduplicationHelper;
        this.version = 'V7-MessageHandler';
        this.messageHistory = [];
        this.maxHistorySize = 50;
        console.log('📨 MessageHandler V7 inicializado - preservado da V6');
    }

    handleMessage(request, sender, sendResponse) {
        // Log da mensagem
        this._logMessage(request, sender);
        
    // Filtrar apenas mensagens com actions válidas
    if (!request || !request.action) {
            console.warn('⚠️ V7 - Mensagem sem action recebida no background:', request);
        return;
    }
    
        console.log('📨 V7 MessageHandler - Mensagem recebida:', request.action);
    if (request.cursoSelecionado) {
            console.log('📌 V7 MessageHandler - cursoSelecionado:', request.cursoSelecionado);
        }
        
        // Roteamento centralizado
        switch (request.action) {
            case 'executeExtraction':
                return this._handleExecuteExtraction(request, sendResponse);
            
            case 'captureData':
                return this._handleCaptureData(request, sendResponse);
            
            case 'captureStudentData':
                return this._handleCaptureStudentData(request, sendResponse);
            
            case 'extractionComplete':
                return this._handleExtractionComplete(request, sendResponse);
            
            case 'extractionProgress':
                return this._handleExtractionProgress(request, sendResponse);
            
            default:
                console.warn('⚠️ V7 MessageHandler - Ação não reconhecida:', request.action);
                sendResponse({ success: false, error: `Ação não reconhecida V7: ${request.action}` });
                return;
        }
    }

    _handleExecuteExtraction(request, sendResponse) {
        console.log('🎯 V7 MessageHandler - Processando executeExtraction para tab:', request.tabId);
        
        this.extractionManager.executeExtraction(request.tabId, request.cursoSelecionado)
            .then(result => {
                console.log('✅ V7 MessageHandler - Extração concluída:', result);
                sendResponse(result);
            })
            .catch(error => {
                console.error('❌ V7 MessageHandler - Erro na extração:', error);
                sendResponse({ success: false, error: error.message });
            });
        
        return true; // Resposta assíncrona
    }

    _handleCaptureData(request, sendResponse) {
        console.log('💾 V7 MessageHandler - Salvando dados de ofertas...');
        
        chrome.storage.local.get(['siaa_data_csv'], (result) => {
            try {
                const processedData = this.dataDeduplicationHelper.processOfertasData(
                    result.siaa_data_csv,
                    request.csv,
                    request.timestamp || Date.now()
                );
                
                chrome.storage.local.set(processedData, () => {
                    if (chrome.runtime.lastError) {
                        console.error('❌ V7 MessageHandler - Erro ao salvar ofertas:', chrome.runtime.lastError);
                    } else {
                        console.log(`💾 V7 MessageHandler - Ofertas salvas`);
                        chrome.runtime.sendMessage({action: 'dataStored'}).catch(err => console.log('ℹ️ V7 MessageHandler - Popup pode estar fechado:', err));
                    }
                });
            } catch (error) {
                console.error('❌ V7 MessageHandler - Erro no processamento de ofertas:', error);
            }
        });
        
        sendResponse({success: true});
        return true;
    }

    _handleCaptureStudentData(request, sendResponse) {
        console.log('🎓 V7 MessageHandler - Salvando dados de alunos...');
        
        chrome.storage.local.get(['siaa_students_csv'], (result) => {
            try {
                const processedData = this.dataDeduplicationHelper.processStudentsData(
                    result.siaa_students_csv,
                    request.csv,
                    request.timestamp || Date.now()
                );
                
                chrome.storage.local.set(processedData, () => {
                if (chrome.runtime.lastError) {
                        console.error('❌ V7 MessageHandler - Erro ao salvar alunos:', chrome.runtime.lastError);
                } else {
                        console.log(`💾 V7 MessageHandler - Alunos salvos`);
                        chrome.runtime.sendMessage({action: 'studentsDataStored'}).catch(err => console.log('ℹ️ V7 MessageHandler - Popup pode estar fechado:', err));
                }
            });
            } catch (error) {
                console.error('❌ V7 MessageHandler - Erro no processamento de alunos:', error);
            }
        });
        
        sendResponse({success: true});
        return true;
    }
    
    _handleExtractionComplete(request, sendResponse) {
        console.log('🎉 V7 MessageHandler - Extração completa recebida');
        chrome.runtime.sendMessage({action: 'extractionComplete'}).catch(err => console.log('ℹ️ V7 MessageHandler - Popup pode estar fechado:', err));
        sendResponse({success: true});
        return true;
    }
    
    _handleExtractionProgress(request, sendResponse) {
        console.log('📈 V7 MessageHandler - Progresso da extração:', request.message);
        chrome.runtime.sendMessage({
            action: 'extractionProgress',
            message: request.message
        }).catch(err => console.log('ℹ️ V7 MessageHandler - Popup pode estar fechado:', err));
        sendResponse({success: true});
        return true;
    }
    
    _logMessage(request, sender) {
        this.messageHistory.push({
            timestamp: new Date().toISOString(),
            action: request?.action || 'unknown',
            sender: sender?.tab?.id || 'unknown',
            hasData: !!(request?.csv || request?.data)
        });

        // Manter apenas as últimas mensagens
        if (this.messageHistory.length > this.maxHistorySize) {
            this.messageHistory.shift();
        }
    }

    getStats() {
        return {
            version: this.version,
            totalMessages: this.messageHistory.length,
            recentMessages: this.messageHistory.slice(-5),
            message: 'MessageHandler V7 funcionando'
        };
    }
}

// ========================================
// TAB MANAGER V7 (nova classe)
// ========================================
class TabManager {
    constructor() {
        this.version = 'V7-TabManager';
        this.monitoredTabs = new Map();
        this.siaaBaseUrl = 'siaa.cruzeirodosul.edu.br';
        this.siaaHomeUrl = 'novo-siaa/secure/core/home.jsf';
        this.targetUrl = 'https://siaa.cruzeirodosul.edu.br/novo-siaa/secure/core/home.jsf';
        console.log('🔗 TabManager V7 inicializado');
    }

    setupListeners() {
        chrome.action.onClicked.addListener(this.handleActionClick.bind(this));
        chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
        chrome.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));
        console.log('🎧 TabManager V7 listeners configurados');
    }

    async handleActionClick(tab) {
        console.log('🖱️ V7 TabManager - Ícone da extensão clicado na aba:', tab.id);

        try {
            if (!this.isSiaaUrl(tab.url)) {
                console.log('🧭 V7 TabManager - Navegando para SIAA...');
                await chrome.tabs.update(tab.id, { url: this.targetUrl });
                return;
            }
            
            console.log('✅ V7 TabManager - Usuário no SIAA - Popup será exibido');
            
        } catch (error) {
            console.error('❌ V7 TabManager - Erro ao processar clique:', error);
        }
    }

    handleTabUpdated(tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete' && tab.url) {
            if (this.isSiaaUrl(tab.url)) {
                this.handleSiaaNavigation(tabId, tab);
                } else {
                this.handleNonSiaaNavigation(tabId, tab);
            }
        }
    }

    handleTabRemoved(tabId) {
        if (this.monitoredTabs.has(tabId)) {
            this.monitoredTabs.delete(tabId);
            console.log('🗑️ V7 TabManager - Aba removida do monitoramento:', tabId);
        }
    }

    handleSiaaNavigation(tabId, tab) {
        console.log('📍 V7 TabManager - Navegação no SIAA detectada:', tab.url);

        this.monitoredTabs.set(tabId, {
            url: tab.url,
            isSiaa: true,
            isHomePage: this.isSiaaHomePage(tab.url),
            lastUpdate: Date.now()
        });

        if (this.isSiaaHomePage(tab.url)) {
            console.log('✅ V7 TabManager - Usuário na página inicial do SIAA');
            this.setBadge(tabId, '✓', '#ebb55e');
        } else {
            this.clearBadge(tabId);
        }
    }

    handleNonSiaaNavigation(tabId, tab) {
        console.log('📍 V7 TabManager - Navegação fora do SIAA detectada');
        this.clearBadge(tabId);
        if (this.monitoredTabs.has(tabId)) {
            this.monitoredTabs.delete(tabId);
        }
    }

    isSiaaUrl(url) {
        return url && url.includes(this.siaaBaseUrl);
    }

    isSiaaHomePage(url) {
        return url && url.includes(this.siaaBaseUrl) && url.includes(this.siaaHomeUrl);
    }

    setBadge(tabId, text, color) {
        try {
            chrome.action.setBadgeText({ tabId, text });
            chrome.action.setBadgeBackgroundColor({ tabId, color });
    } catch (error) {
            // Ignorar erros de badge
        }
    }

    clearBadge(tabId) {
        try {
            chrome.action.setBadgeText({ tabId, text: '' });
        } catch (error) {
            // Ignorar erros de badge
        }
    }

    getStats() {
        return {
            version: this.version,
            monitoredTabs: this.monitoredTabs.size,
            siaaHomeTabs: Array.from(this.monitoredTabs.values()).filter(tab => tab.isHomePage).length,
            message: 'TabManager V7 funcionando'
        };
    }
}

// ========================================
// FUNÇÃO ORIGINAL (preservada para compatibilidade)
// ========================================
async function executeExtraction(tabId, cursoSelecionado = null) {
    return extractionManagerInstance.executeExtraction(tabId, cursoSelecionado);
}

// ========================================
// INICIALIZAÇÃO V7
// ========================================

// Criar instâncias
const extractionManagerInstance = new ExtractionManager();
const dataDeduplicationHelperInstance = new DataDeduplicationHelper();
const messageHandlerInstance = new MessageHandler(extractionManagerInstance, dataDeduplicationHelperInstance);
const tabManagerInstance = new TabManager();

// Configurar TabManager listeners
tabManagerInstance.setupListeners();

// Listener para instalação da extensão
chrome.runtime.onInstalled.addListener((details) => {
    console.log('📦 V7 - Extensão instalada:', details.reason);
    
    if (details.reason === 'install') {
        console.log('✅ V7 - Primeira instalação da extensão SIAA Data Extractor');
    } else if (details.reason === 'update') {
        console.log('🔄 V7 - Extensão atualizada para versão:', chrome.runtime.getManifest().version);
    }
});

// Listener para mensagens (usando MessageHandler)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    return messageHandlerInstance.handleMessage(request, sender, sendResponse);
});

// Função de diagnóstico V7
self.diagnoseV7 = function() {
    console.log('🔍 Diagnóstico V7:');
    console.log('📊 ExtractionManager Stats:', extractionManagerInstance.getStats());
    console.log('📊 DataDeduplicationHelper Stats:', dataDeduplicationHelperInstance.getStats());
    console.log('📊 MessageHandler Stats:', messageHandlerInstance.getStats());
    console.log('📊 TabManager Stats:', tabManagerInstance.getStats());
    
    return {
        version: 'V7-TabManager-Complete',
        extractionManager: extractionManagerInstance.getStats(),
        deduplicationHelper: dataDeduplicationHelperInstance.getStats(),
        messageHandler: messageHandlerInstance.getStats(),
        tabManager: tabManagerInstance.getStats(),
        message: 'Background V7 COMPLETO - todas as 4 classes modulares funcionando'
    };
};

console.log('✅ SIAA Data Extractor - Background Script V7 (TabManager COMPLETO) configurado');
console.log('🔗 TabManager V7 ativo para gerenciamento de abas');
console.log('🎉 MODULARIZAÇÃO COMPLETA: 4 classes modulares funcionando');
