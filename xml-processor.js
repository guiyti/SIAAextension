// Sistema de Processamento XML Modular para SIAA Data Extractor
// Baseado em configuração JSON para máxima flexibilidade

class XMLProcessor {
    constructor(config = null) {
        this.config = config;
        this.defaultConfig = null;
    }

    // Carregar configuração do arquivo JSON
    async loadConfig() {
        if (this.config) return this.config;
        
        try {
            // Em ambiente de extensão
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                const response = await fetch(chrome.runtime.getURL('xml-config.json'));
                this.config = await response.json();
            } else {
                // Em ambiente local/teste
                const response = await fetch('./xml-config.json');
                this.config = await response.json();
            }
            
            console.log('📋 Configuração XML carregada:', this.config);
            return this.config;
        } catch (error) {
            console.error('❌ Erro ao carregar configuração XML:', error);
            throw new Error('Não foi possível carregar a configuração XML');
        }
    }

    // Buscar XML com configuração automática
    async fetchXML(url, params = {}, options = {}) {
        await this.loadConfig();
        
        // Construir URL completa
        const fullUrl = this.buildUrl(url, params);
        
        // Configurar headers padrão
        const headers = {
            ...this.config.apiConfig.headers,
            ...options.headers
        };
        
        // Configurar timeout
        const timeout = options.timeout || this.config.apiConfig.timeout;
        
        console.log(`🌐 Fetching XML: ${fullUrl}`);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(fullUrl, {
                signal: controller.signal,
                headers,
                ...options
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Decodificar usando charset correto
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
            
            return xmlDoc;
            
        } catch (error) {
            console.error(`❌ Erro ao buscar XML ${fullUrl}:`, error);
            throw error;
        }
    }

    // Construir URL com parâmetros
    buildUrl(endpoint, params = {}) {
        const config = this.config.apiConfig;
        
        // Se endpoint não tem protocolo, usar basePath + endpoint
        let fullUrl;
        if (endpoint.startsWith('http')) {
            fullUrl = endpoint;
        } else if (endpoint.startsWith('/')) {
            fullUrl = config.baseUrl + endpoint;
        } else {
            // URL relativa - usar basePath
            fullUrl = config.baseUrl + config.basePath + endpoint;
        }
        
        const url = new URL(fullUrl);
        
        // Adicionar parâmetros específicos
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.set(key, value);
            }
        });
        
        return url.toString();
    }

    // Extrair dados baseado em configuração de step
    extractFromXML(xmlDoc, stepConfig) {
        const results = [];
        const rows = xmlDoc.querySelectorAll(stepConfig.xmlPath);
        
        console.log(`📊 Encontrados ${rows.length} registros para ${stepConfig.name}`);
        
        rows.forEach((row, index) => {
            const record = {};
            
            Object.entries(stepConfig.fields).forEach(([fieldName, selector]) => {
                try {
                    record[fieldName] = this.extractFieldValue(row, selector);
                } catch (error) {
                    console.warn(`⚠️ Erro ao extrair campo ${fieldName} do registro ${index}:`, error);
                    record[fieldName] = '';
                }
            });
            
            // Aplicar processadores de campo se especificados
            if (stepConfig.processFields) {
                Object.entries(stepConfig.processFields).forEach(([fieldName, processor]) => {
                    record[fieldName] = this.processField(record[fieldName], processor);
                });
            }
            
            results.push(record);
        });
        
        return results;
    }

    // Extrair valor de campo usando seletor
    extractFieldValue(element, selector) {
        // Seletor para atributo: @attribute
        if (selector.startsWith('@')) {
            const attrName = selector.substring(1);
            return element.getAttribute(attrName) || '';
        }
        
        // Seletor para texto direto
        if (selector === 'textContent') {
            return element.textContent?.trim() || '';
        }
        
        // Seletor CSS com atributo: cell[0]@title
        if (selector.includes('@')) {
            const [cssSelector, attrName] = selector.split('@');
            const targetElement = element.querySelector(cssSelector);
            return targetElement?.getAttribute(attrName) || '';
        }
        
        // Seletor CSS simples: cell[0]
        const targetElement = element.querySelector(selector);
        return targetElement?.textContent?.trim() || '';
    }

    // Processar campo usando processador configurado
    processField(value, processorName) {
        switch (processorName) {
            case 'parsePeriodo':
                // "2025/2" -> {ano_leti: "2025", sem_leti: "2"}
                const periodoParts = value.split('/');
                return {
                    ano_leti: periodoParts[0]?.trim() || '',
                    sem_leti: periodoParts[1]?.trim() || ''
                };
                
            case 'parseCursoNome':
                // "CST EM ANÁLISE E DESENVOLVIMENTO DE SISTEMAS - 68" -> {nome: "CST...", codigo: "68"}
                const cursoMatch = value.match(/^(.+?)\s*-\s*(\d+)$/);
                if (cursoMatch) {
                    return {
                        nome: cursoMatch[1].trim(),
                        codigo: cursoMatch[2].trim()
                    };
                }
                return { nome: value, codigo: '' };
                
            case 'parseDisciplinaCompleta':
                // "9870-APLICAÇÕES PARA INTERNET" -> {codigo: "9870", nome: "APLICAÇÕES PARA INTERNET"}
                const discParts = value.split('-');
                return {
                    codigo: discParts[0]?.trim() || '',
                    nome: discParts.slice(1).join('-').trim() || ''
                };
                
            case 'parseDescricaoOferta':
                // "API_COMP_TURMA_03_GRU_4.1910<b>(2027181)</b>" -> {descricao: "API_COMP_TURMA_03_GRU_4.1910", idOferta: "2027181"}
                // Remove tags HTML primeiro
                const cleanValue = value.replace(/<[^>]*>/g, '');
                const descMatch = cleanValue.match(/^(.+?)\s*\((\d+)\).*$/);
                if (descMatch) {
                    return {
                        descricao: descMatch[1].trim(),
                        idOferta: descMatch[2].trim()
                    };
                }
                return { descricao: cleanValue, idOferta: '' };
                
            case 'splitByDash':
                const parts = value.split(' - ');
                return {
                    codigo: parts[0]?.trim() || '',
                    nome: parts.slice(1).join(' - ').trim() || ''
                };
                
            case 'extractFromParentheses':
                const match = value.match(/\(([^)]+)\)/);
                return match ? match[1] : '';
                
            case 'parseHorario':
                return value
                    .replace(/\.$/, '')
                    .split('.')
                    .map(periodo => periodo.trim())
                    .filter(periodo => periodo)
                    .map(periodo => periodo
                        .replace(/\s+das\s+/g, ' ')
                        .replace(/\s+às\s+/g, '-')
                    )
                    .join(' | ');
                    
            case 'parseHorarioCompleto':
                // "Quarta das 19:10 às 20:25.Quarta das 20:35 às 21:50." -> "Quarta 19:10-20:25 | Quarta 20:35-21:50"
                if (!value) return '';
                return value
                    .replace(/\.$/, '') // Remove ponto final
                    .split('.') // Divide por pontos
                    .map(periodo => periodo.trim()) // Remove espaços
                    .filter(periodo => periodo) // Remove vazios
                    .map(periodo => periodo
                        .replace(/\s+das\s+/g, ' ') // "das" -> espaço
                        .replace(/\s+às\s+/g, '-') // "às" -> hífen
                    )
                    .join(' | '); // Junta com separador
                    
            default:
                console.warn(`⚠️ Processador desconhecido: ${processorName}`);
                return value;
        }
    }

    // Executar extração completa para um tipo de dados
    async extractDataType(dataTypeName, userParams = {}) {
        await this.loadConfig();
        
        const dataTypeConfig = this.config.dataTypes[dataTypeName];
        if (!dataTypeConfig) {
            throw new Error(`Tipo de dados não encontrado: ${dataTypeName}`);
        }
        
        if (!dataTypeConfig.enabled) {
            throw new Error(`Tipo de dados desabilitado: ${dataTypeName}`);
        }
        
        console.log(`🚀 Iniciando extração: ${dataTypeConfig.name}`);
        
        const results = {};
        
        // Executar cada step sequencialmente
        for (const step of dataTypeConfig.steps) {
            console.log(`📋 Executando step: ${step.name}`);
            
            // Preparar parâmetros para este step
            const stepParams = {};
            step.params.forEach(paramName => {
                if (userParams[paramName] !== undefined) {
                    stepParams[paramName] = userParams[paramName];
                }
            });
            
            // Buscar XML
            const xmlDoc = await this.fetchXML(step.url, stepParams);
            
            // Extrair dados
            const stepResults = this.extractFromXML(xmlDoc, step);
            results[step.id] = stepResults;
            
            console.log(`✅ Step ${step.name} concluído: ${stepResults.length} registros`);
            
            // Pequena pausa entre requests
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        return {
            dataType: dataTypeName,
            config: dataTypeConfig,
            results: results,
            timestamp: Date.now()
        };
    }

    // Converter resultados para CSV
    resultsToCSV(extractionResults) {
        const { config, results } = extractionResults;
        
        if (!config.output || config.output.format !== 'csv') {
            throw new Error('Configuração de output CSV não encontrada');
        }
        
        // Para tipos simples, usar o primeiro resultado
        const mainResults = Object.values(results)[0] || [];
        
        if (mainResults.length === 0) {
            return 'Nenhum dado encontrado';
        }
        
        // Usar headers configurados ou gerar automaticamente
        const headers = config.output.headers || Object.keys(mainResults[0]);
        
        // Construir CSV
        const csvRows = [headers];
        
        mainResults.forEach(record => {
            const row = headers.map(header => {
                const value = record[header] || '';
                const stringValue = String(value).replace(/"/g, '""');
                return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') 
                    ? `"${stringValue}"` 
                    : stringValue;
            });
            csvRows.push(row);
        });
        
        // Adicionar BOM para UTF-8
        const csvContent = csvRows.map(row => row.join(',')).join('\n');
        return '\uFEFF' + csvContent;
    }

    // Listar tipos de dados disponíveis
    async getAvailableDataTypes() {
        await this.loadConfig();
        
        return Object.entries(this.config.dataTypes).map(([key, config]) => ({
            id: key,
            name: config.name,
            description: config.description,
            enabled: config.enabled !== false,
            steps: config.steps.length
        }));
    }

    // Validar configuração
    validateConfig() {
        if (!this.config) {
            throw new Error('Configuração não carregada');
        }
        
        const required = ['apiConfig', 'dataTypes'];
        required.forEach(field => {
            if (!this.config[field]) {
                throw new Error(`Campo obrigatório ausente: ${field}`);
            }
        });
        
        // Validar cada tipo de dados
        Object.entries(this.config.dataTypes).forEach(([key, dataType]) => {
            if (!dataType.steps || !Array.isArray(dataType.steps)) {
                throw new Error(`Tipo de dados ${key} deve ter array de steps`);
            }
            
            dataType.steps.forEach((step, index) => {
                if (!step.url || !step.xmlPath || !step.fields) {
                    throw new Error(`Step ${index} do tipo ${key} está incompleto`);
                }
            });
        });
        
        console.log('✅ Configuração XML válida');
        return true;
    }
}

// Expor classe para uso na extensão
if (typeof window !== 'undefined') {
    window.XMLProcessor = XMLProcessor;
}

// Para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = XMLProcessor;
}

console.log('✅ XML Processor carregado e disponível');
