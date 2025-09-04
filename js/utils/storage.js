/**
 * @fileoverview Módulo de abstração do sistema de storage
 * @description Fornece interface unificada para chrome.storage e localStorage
 * @version 1.0.0
 */

/**
 * Sistema de storage universal (funciona em extensão e browser)
 * @namespace Storage
 */
export const Storage = {
    /**
     * Obtém valores do storage
     * @param {string[]} keys - Array de chaves para buscar
     * @returns {Promise<Object>} Objeto com os valores encontrados
     */
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
    
    /**
     * Salva valores no storage
     * @param {Object} data - Objeto com chave-valor para salvar
     * @returns {Promise<void>}
     */
    async set(data) {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return await chrome.storage.local.set(data);
        } else {
            // Fallback para localStorage
            Object.entries(data).forEach(([key, value]) => {
                localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            });
        }
    },

    /**
     * Remove valores do storage
     * @param {string|string[]} keys - Chave ou array de chaves para remover
     * @returns {Promise<void>}
     */
    async remove(keys) {
        const keysArray = Array.isArray(keys) ? keys : [keys];
        
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return await chrome.storage.local.remove(keysArray);
        } else {
            // Fallback para localStorage
            keysArray.forEach(key => {
                localStorage.removeItem(key);
            });
        }
    },

    /**
     * Limpa todo o storage
     * @returns {Promise<void>}
     */
    async clear() {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return await chrome.storage.local.clear();
        } else {
            // Fallback para localStorage
            localStorage.clear();
        }
    },

    /**
     * Obtém todas as chaves do storage
     * @returns {Promise<string[]>} Array com todas as chaves
     */
    async getAllKeys() {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            const all = await chrome.storage.local.get();
            return Object.keys(all);
        } else {
            // Fallback para localStorage
            return Object.keys(localStorage);
        }
    },

    /**
     * Verifica se uma chave existe no storage
     * @param {string} key - Chave para verificar
     * @returns {Promise<boolean>} True se a chave existe
     */
    async exists(key) {
        const result = await this.get([key]);
        return key in result;
    }
};

/**
 * Helper para trabalhar com storage de forma mais conveniente
 * @namespace StorageHelper
 */
export const StorageHelper = {
    /**
     * Obtém um valor com fallback
     * @param {string} key - Chave para buscar
     * @param {*} defaultValue - Valor padrão se não encontrado
     * @returns {Promise<*>} Valor encontrado ou padrão
     */
    async getWithDefault(key, defaultValue) {
        const result = await Storage.get([key]);
        return result[key] !== undefined ? result[key] : defaultValue;
    },

    /**
     * Atualiza um objeto no storage (merge)
     * @param {string} key - Chave do objeto
     * @param {Object} updates - Atualizações para fazer merge
     * @returns {Promise<void>}
     */
    async updateObject(key, updates) {
        const current = await this.getWithDefault(key, {});
        const updated = { ...current, ...updates };
        await Storage.set({ [key]: updated });
    },

    /**
     * Incrementa um valor numérico
     * @param {string} key - Chave do valor
     * @param {number} increment - Valor para incrementar (default: 1)
     * @returns {Promise<number>} Novo valor
     */
    async increment(key, increment = 1) {
        const current = await this.getWithDefault(key, 0);
        const newValue = current + increment;
        await Storage.set({ [key]: newValue });
        return newValue;
    },

    /**
     * Adiciona item a um array
     * @param {string} key - Chave do array
     * @param {*} item - Item para adicionar
     * @returns {Promise<Array>} Array atualizado
     */
    async pushToArray(key, item) {
        const array = await this.getWithDefault(key, []);
        array.push(item);
        await Storage.set({ [key]: array });
        return array;
    },

    /**
     * Remove item de um array
     * @param {string} key - Chave do array
     * @param {*} item - Item para remover
     * @returns {Promise<Array>} Array atualizado
     */
    async removeFromArray(key, item) {
        const array = await this.getWithDefault(key, []);
        const filtered = array.filter(x => x !== item);
        await Storage.set({ [key]: filtered });
        return filtered;
    }
};

// Para compatibilidade com código existente
if (typeof window !== 'undefined') {
    window.Storage = Storage;
    window.StorageHelper = StorageHelper;
}
