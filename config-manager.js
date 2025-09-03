// Sistema de Gerenciamento de Configuração para SIAA Data Extractor
// Carrega e gerencia configurações da aplicação de forma centralizada

class ConfigManager {
    constructor() {
        this.config = null;
        this.loaded = false;
    }

    /**
     * Carrega a configuração principal da aplicação
     * @returns {Promise<Object>} Configuração carregada
     */
    async loadConfig() {
        if (this.config && this.loaded) {
            return this.config;
        }
        
        try {
            // Em ambiente de extensão
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                const response = await fetch(chrome.runtime.getURL('siaa-config.json'));
                this.config = await response.json();
            } else {
                // Em ambiente local/teste
                const response = await fetch('./siaa-config.json');
                this.config = await response.json();
            }
            
            this.loaded = true;
            console.log('⚙️ Configuração da aplicação carregada:', this.config.app.name, 'v' + this.config.version);
            return this.config;
        } catch (error) {
            console.error('❌ Erro ao carregar configuração da aplicação:', error);
            throw new Error('Não foi possível carregar a configuração da aplicação');
        }
    }

    /**
     * Obtém configurações de extração de dados
     * @returns {Object} Configurações de extração
     */
    async getExtractionConfig() {
        const config = await this.loadConfig();
        return config.api.extraction;
    }

    /**
     * Obtém configurações de endpoints
     * @returns {Object} URLs dos endpoints
     */
    async getEndpoints() {
        const config = await this.loadConfig();
        return config.endpoints;
    }

    /**
     * Obtém presets para um tipo de dados específico
     * @param {string} dataType - 'ofertas' ou 'alunos'
     * @returns {Object} Presets disponíveis
     */
    async getPresets(dataType = 'ofertas') {
        const config = await this.loadConfig();
        return config.presets[dataType] || {};
    }

    /**
     * Obtém configurações de UI
     * @returns {Object} Configurações da interface
     */
    async getUIConfig() {
        const config = await this.loadConfig();
        return config.ui;
    }

    /**
     * Obtém chaves de storage
     * @returns {Object} Chaves para localStorage/chrome.storage
     */
    async getStorageKeys() {
        const config = await this.loadConfig();
        return config.storage.keys;
    }

    /**
     * Obtém configurações de validação
     * @returns {Object} Regras de validação
     */
    async getValidation() {
        const config = await this.loadConfig();
        return config.validation;
    }

    /**
     * Obtém configurações de funcionalidades habilitadas
     * @returns {Object} Features flags
     */
    async getFeatures() {
        const config = await this.loadConfig();
        return config.features;
    }

    /**
     * Obtém período acadêmico atual (dinâmico via XML)
     * @param {boolean} forceRefresh - Forçar nova consulta ao XML
     * @returns {Object} Ano e semestre letivo
     */
    async getAcademicPeriod(forceRefresh = false) {
        // Se já temos o período em cache e não é refresh forçado
        if (this._cachedPeriod && !forceRefresh) {
            return this._cachedPeriod;
        }

        try {
            // Buscar período do XML comboPeriodo
            const periodData = await this.fetchCurrentPeriod();
            
            // Cache do resultado
            this._cachedPeriod = periodData;
            
            console.log('📅 Período acadêmico obtido dinamicamente:', periodData);
            return periodData;
            
        } catch (error) {
            console.warn('⚠️ Erro ao obter período dinâmico, usando fallback:', error);
            
            // Fallback para valores padrão em caso de erro
            const config = await this.loadConfig();
            return config.api.academicPeriod.defaultValues || { ano_leti: null, sem_leti: null };
        }
    }

    /**
     * Busca o período acadêmico atual do XML comboPeriodo
     * @returns {Object} Período acadêmico com ano_leti e sem_leti
     */
    async fetchCurrentPeriod() {
        const config = await this.loadConfig();
        const url = config.api.baseUrl + config.api.basePaths.ofertas + 'comboPeriodo.xml.jsp';
        
        console.log('🌐 Buscando período acadêmico em:', url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.api.timeout);
        
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: config.api.headers,
                credentials: 'include'
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Decodificar usando ISO-8859-1
            const arrayBuffer = await response.arrayBuffer();
            const decoder = new TextDecoder('iso-8859-1');
            const xmlText = decoder.decode(arrayBuffer);
            
            // Parsear XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            // Verificar erros de parsing
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error('Erro ao processar XML: ' + parseError.textContent);
            }
            
            // Buscar opção selecionada (selected="true")
            const selectedOption = xmlDoc.querySelector('option[selected="true"]') || 
                                 xmlDoc.querySelector('option[selected="selected"]') ||
                                 xmlDoc.querySelector('option'); // fallback para primeira opção
            
            if (!selectedOption) {
                throw new Error('Nenhuma opção de período encontrada no XML');
            }
            
            const periodoCompleto = selectedOption.getAttribute('value');
            if (!periodoCompleto) {
                throw new Error('Valor do período não encontrado');
            }
            
            // Processar período: "2025/2" -> {ano_leti: "2025", sem_leti: "2"}
            const [ano_leti, sem_leti] = periodoCompleto.split('/');
            
            if (!ano_leti || !sem_leti) {
                throw new Error(`Formato de período inválido: ${periodoCompleto}`);
            }
            
            return {
                ano_leti: ano_leti.trim(),
                sem_leti: sem_leti.trim(),
                periodoCompleto,
                source: 'xml_dynamic'
            };
            
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Constrói URL com período acadêmico (dinâmico)
     * @param {string} baseUrl - URL base
     * @param {Object} extraParams - Parâmetros adicionais
     * @returns {string} URL completa com parâmetros
     */
    async buildAcademicUrl(baseUrl, extraParams = {}) {
        const period = await this.getAcademicPeriod();
        const url = new URL(baseUrl);
        
        // Só adicionar período se foi obtido com sucesso
        if (period.ano_leti && period.sem_leti) {
            url.searchParams.set('ano_leti', period.ano_leti);
            url.searchParams.set('sem_leti', period.sem_leti);
        }
        
        // Adicionar parâmetros extras
        Object.entries(extraParams).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.set(key, value);
            }
        });
        
        return url.toString();
    }

    /**
     * Valida se as configurações estão corretas
     * @returns {boolean} True se válida
     */
    validateConfig() {
        if (!this.config) {
            throw new Error('Configuração não carregada');
        }
        
        const required = ['app', 'extraction', 'presets', 'ui', 'storage'];
        required.forEach(field => {
            if (!this.config[field]) {
                throw new Error(`Campo obrigatório ausente na configuração: ${field}`);
            }
        });
        
        // Validar presets
        const presetTypes = ['ofertas', 'alunos'];
        presetTypes.forEach(type => {
            if (!this.config.presets[type]) {
                throw new Error(`Presets para ${type} não encontrados`);
            }
        });
        
        console.log('✅ Configuração da aplicação válida');
        return true;
    }

    /**
     * Obtém configuração para um preset específico
     * @param {string} presetKey - Chave do preset
     * @param {string} dataType - Tipo de dados ('ofertas' ou 'alunos')
     * @param {Array} availableHeaders - Headers disponíveis nos dados
     * @returns {Object} Configuração do preset
     */
    async getPresetConfig(presetKey, dataType = 'ofertas', availableHeaders = []) {
        const presets = await this.getPresets(dataType);
        
        if (!presets[presetKey]) {
            console.warn(`⚠️ Preset ${presetKey} não encontrado para ${dataType}`);
            return null;
        }
        
        const preset = presets[presetKey];
        
        // Se é preset completo, usar todos os headers disponíveis
        if (presetKey === 'PRESET_COMPLETO' && availableHeaders.length > 0) {
            return {
                name: preset.name,
                description: preset.description,
                order: [...availableHeaders],
                visible: [...availableHeaders]
            };
        }
        
        // Filtrar apenas colunas que existem nos dados atuais
        if (availableHeaders.length > 0) {
            const validOrder = preset.order.filter(col => availableHeaders.includes(col));
            const remainingHeaders = availableHeaders.filter(col => !validOrder.includes(col));
            const validVisible = preset.visible.filter(col => availableHeaders.includes(col));
            
            return {
                name: preset.name,
                description: preset.description,
                order: [...validOrder, ...remainingHeaders],
                visible: validVisible
            };
        }
        
        return {
            name: preset.name,
            description: preset.description,
            order: preset.order,
            visible: preset.visible
        };
    }

    /**
     * Lista todos os presets disponíveis para um tipo de dados
     * @param {string} dataType - Tipo de dados ('ofertas' ou 'alunos')
     * @returns {Array} Lista de presets com metadados
     */
    async listPresets(dataType = 'ofertas') {
        const presets = await this.getPresets(dataType);
        
        return Object.entries(presets).map(([key, preset]) => ({
            key,
            name: preset.name,
            description: preset.description,
            columnsCount: preset.order ? preset.order.length : 0,
            visibleCount: preset.visible ? preset.visible.length : 0
        }));
    }

    /**
     * Obtém configurações de desenvolvedor
     * @returns {Object} Configurações para desenvolvimento
     */
    async getDeveloperConfig() {
        const config = await this.loadConfig();
        return config.developer || { debugMode: false, enableLogging: true, logLevel: 'info' };
    }

    /**
     * Verifica se uma funcionalidade está habilitada
     * @param {string} featureName - Nome da funcionalidade
     * @returns {boolean} True se habilitada
     */
    async isFeatureEnabled(featureName) {
        const features = await this.getFeatures();
        return features[featureName] === true;
    }

    /**
     * Obtém configurações de tema/cores
     * @returns {Object} Configurações visuais
     */
    async getThemeConfig() {
        const uiConfig = await this.getUIConfig();
        return uiConfig.colors || {};
    }

    /**
     * Aplicar configurações CSS dinâmicas baseadas na configuração
     */
    async applyCSSVariables() {
        try {
            const theme = await this.getThemeConfig();
            
            if (document && document.documentElement) {
                // Aplicar variáveis CSS
                Object.entries(theme).forEach(([key, value]) => {
                    const cssVarName = `--siaa-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
                    document.documentElement.style.setProperty(cssVarName, value);
                });
                
                console.log('🎨 Tema CSS aplicado');
            }
        } catch (error) {
            console.warn('⚠️ Erro ao aplicar tema CSS:', error);
        }
    }

    /**
     * Verifica a saúde dos endpoints do SIAA
     * @param {Array|string} endpointTypes - Tipos de endpoints a verificar ('ofertas', 'alunos' ou ['ofertas', 'alunos'])
     * @param {number} timeout - Timeout em milissegundos
     * @returns {Object} Status de cada endpoint
     */
    async checkEndpointsHealth(endpointTypes = ['ofertas', 'alunos'], timeout = 5000) {
        const config = await this.loadConfig();
        const healthEndpoints = config.endpoints.health;
        
        // Normalizar para array
        const types = Array.isArray(endpointTypes) ? endpointTypes : [endpointTypes];
        
        const results = {};
        
        for (const type of types) {
            if (!healthEndpoints[type]) {
                results[type] = {
                    available: false,
                    error: `Endpoint de ${type} não configurado`
                };
                continue;
            }
            
            try {
                console.log(`🔍 Verificando endpoint ${type}: ${healthEndpoints[type]}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                
                const response = await fetch(healthEndpoints[type], {
                    method: 'GET',
                    headers: config.api.headers,
                    credentials: 'include',
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    // Verificar se a resposta contém XML válido
                    const text = await response.text();
                    const isValidXML = text.includes('<') && (text.includes('<complete>') || text.includes('<option'));
                    
                    results[type] = {
                        available: isValidXML,
                        status: response.status,
                        statusText: response.statusText,
                        url: healthEndpoints[type],
                        validXML: isValidXML
                    };
                    
                    console.log(`✅ Endpoint ${type} disponível:`, results[type]);
                } else {
                    results[type] = {
                        available: false,
                        status: response.status,
                        statusText: response.statusText,
                        url: healthEndpoints[type],
                        error: `HTTP ${response.status}: ${response.statusText}`
                    };
                    
                    console.log(`❌ Endpoint ${type} não disponível:`, results[type]);
                }
                
            } catch (error) {
                results[type] = {
                    available: false,
                    url: healthEndpoints[type],
                    error: error.name === 'AbortError' ? 'Timeout' : error.message
                };
                
                console.log(`❌ Erro ao verificar endpoint ${type}:`, error.message);
            }
        }
        
        return results;
    }

    /**
     * Constrói URL completa baseada na configuração de endpoints
     * @param {string} endpointPath - Caminho do endpoint (ex: 'ofertas.cursos', 'alunos.campus')
     * @param {Object} params - Parâmetros para a URL
     * @returns {string} URL completa
     */
    async buildEndpointUrl(endpointPath, params = {}) {
        const config = await this.loadConfig();
        const [type, endpoint] = endpointPath.split('.');
        
        if (!config.endpoints[type] || !config.endpoints[type][endpoint]) {
            throw new Error(`Endpoint não encontrado: ${endpointPath}`);
        }
        
        const basePath = config.api.basePaths[type];
        const endpointFile = config.endpoints[type][endpoint];
        const fullUrl = config.api.baseUrl + basePath + endpointFile;
        
        return this.buildAcademicUrl(fullUrl, params);
    }

    /**
     * Obtém configuração de mapeamento de campus
     * @returns {Object} Mapeamento de campus
     */
    async getCampusMapping() {
        const config = await this.loadConfig();
        return config.campusMapping;
    }

    /**
     * Obtém configuração de processadores de campo
     * @returns {Object} Processadores disponíveis
     */
    async getFieldProcessors() {
        const config = await this.loadConfig();
        return config.fieldProcessors;
    }

    /**
     * Obtém configuração de um tipo de dados específico
     * @param {string} dataType - Tipo de dados ('ofertas_disciplinas', 'dados_alunos')
     * @returns {Object} Configuração do tipo de dados
     */
    async getDataTypeConfig(dataType) {
        const config = await this.loadConfig();
        return config.dataTypes[dataType];
    }
}

// Instância global do gerenciador de configuração
const configManager = new ConfigManager();

// Expor para uso na extensão
if (typeof window !== 'undefined') {
    window.ConfigManager = ConfigManager;
    window.configManager = configManager;
}

// Para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConfigManager, configManager };
}

console.log('✅ Config Manager carregado e disponível');
