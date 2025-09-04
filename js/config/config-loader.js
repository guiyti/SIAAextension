/**
 * @fileoverview Módulo para carregamento e gerenciamento do siaa-config.json
 * @description Fornece interface para acessar configurações centralizadas
 * @version 1.0.0
 */

/**
 * Gerenciador de configuração centralizada
 * @namespace ConfigLoader
 */
export class ConfigLoader {
    constructor() {
        this.config = null;
        this.isLoaded = false;
        this.loadPromise = null;
    }

    /**
     * Carrega a configuração do siaa-config.json
     * @param {boolean} forceReload - Força recarregamento mesmo se já carregado
     * @returns {Promise<Object>} Configuração carregada
     */
    async load(forceReload = false) {
        if (this.isLoaded && !forceReload) {
            return this.config;
        }

        // Se já está carregando, retorna a promise existente
        if (this.loadPromise && !forceReload) {
            return this.loadPromise;
        }

        this.loadPromise = this._loadConfig();
        return this.loadPromise;
    }

    /**
     * Implementação interna do carregamento
     * @private
     * @returns {Promise<Object>} Configuração carregada
     */
    async _loadConfig() {
        try {
            const response = await fetch('/siaa-config.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.config = await response.json();
            this.isLoaded = true;
            
            console.log('✅ Configuração SIAA carregada:', this.config.version);
            return this.config;

        } catch (error) {
            console.error('❌ Erro ao carregar siaa-config.json:', error);
            
            // Fallback para configuração mínima
            this.config = this._getDefaultConfig();
            this.isLoaded = true;
            
            console.warn('⚠️ Usando configuração fallback');
            return this.config;
        }
    }

    /**
     * Obtém configuração padrão como fallback
     * @private
     * @returns {Object} Configuração padrão
     */
    _getDefaultConfig() {
        return {
            version: 'fallback',
            app: {
                name: 'SIAA Data Extractor',
                description: 'Fallback configuration'
            },
            presets: {
                ofertas: {
                    PRESET_1_BASICO: {
                        name: 'Básico',
                        description: 'Preset básico de ofertas',
                        order: ['Cód. Disc.', 'Nome Disciplina', 'Sigla Campus'],
                        visible: ['Cód. Disc.', 'Nome Disciplina', 'Sigla Campus']
                    }
                },
                alunos: {
                    PRESET_1_BASICO: {
                        name: 'Básico',
                        description: 'Preset básico de alunos',
                        order: ['RGM', 'Nome', 'E-mail'],
                        visible: ['RGM', 'Nome', 'E-mail']
                    }
                }
            },
            features: {
                enableStudentView: true,
                enableColumnReordering: true,
                enablePresets: true
            }
        };
    }

    /**
     * Obtém a configuração completa
     * @returns {Object|null} Configuração atual ou null se não carregada
     */
    getConfig() {
        return this.config;
    }

    /**
     * Obtém uma seção específica da configuração
     * @param {string} path - Caminho da configuração (ex: 'presets.ofertas')
     * @returns {*} Valor da configuração ou undefined
     */
    get(path) {
        if (!this.config) {
            console.warn('⚠️ Configuração não carregada ainda');
            return undefined;
        }

        const keys = path.split('.');
        let current = this.config;

        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return undefined;
            }
        }

        return current;
    }

    /**
     * Verifica se uma feature está habilitada
     * @param {string} featureName - Nome da feature
     * @returns {boolean} True se habilitada
     */
    isFeatureEnabled(featureName) {
        const features = this.get('features') || {};
        return features[featureName] === true;
    }

    /**
     * Obtém presets para um modo específico
     * @param {string} mode - Modo ('ofertas' ou 'alunos')
     * @returns {Object} Presets do modo ou objeto vazio
     */
    getPresets(mode) {
        const presets = this.get(`presets.${mode}`);
        return presets || {};
    }

    /**
     * Obtém um preset específico
     * @param {string} mode - Modo ('ofertas' ou 'alunos')
     * @param {string} presetKey - Chave do preset
     * @returns {Object|null} Preset encontrado ou null
     */
    getPreset(mode, presetKey) {
        const presets = this.getPresets(mode);
        return presets[presetKey] || null;
    }

    /**
     * Obtém informações da aplicação
     * @returns {Object} Informações da app
     */
    getAppInfo() {
        return this.get('app') || { name: 'SIAA Extension', version: 'unknown' };
    }

    /**
     * Obtém configurações de API
     * @returns {Object} Configurações de API
     */
    getApiConfig() {
        return this.get('api') || {};
    }

    /**
     * Verifica se a configuração foi carregada
     * @returns {boolean} True se carregada
     */
    isConfigLoaded() {
        return this.isLoaded;
    }

    /**
     * Recarrega a configuração
     * @returns {Promise<Object>} Nova configuração
     */
    async reload() {
        this.isLoaded = false;
        this.loadPromise = null;
        return this.load(true);
    }
}

// Instância singleton
let configInstance = null;

/**
 * Obtém a instância singleton do ConfigLoader
 * @returns {ConfigLoader} Instância do carregador
 */
export function getConfigLoader() {
    if (!configInstance) {
        configInstance = new ConfigLoader();
    }
    return configInstance;
}

/**
 * Carrega a configuração (método de conveniência)
 * @param {boolean} forceReload - Força recarregamento
 * @returns {Promise<Object>} Configuração carregada
 */
export async function loadConfig(forceReload = false) {
    const loader = getConfigLoader();
    return loader.load(forceReload);
}

/**
 * Obtém configuração (método de conveniência)
 * @param {string} path - Caminho da configuração
 * @returns {*} Valor da configuração
 */
export function getConfig(path = null) {
    const loader = getConfigLoader();
    return path ? loader.get(path) : loader.getConfig();
}

// Para compatibilidade com código existente
if (typeof window !== 'undefined') {
    window.ConfigLoader = ConfigLoader;
    window.getConfigLoader = getConfigLoader;
    window.loadConfig = loadConfig;
    window.getConfig = getConfig;
}
