/**
 * @fileoverview Sistema de eventos centralizado
 * @description Event bus para comunicação reativa entre módulos
 * @version 1.0.0
 */

/**
 * Sistema de eventos centralizado usando padrão pub/sub
 * @class EventBus
 */
export class EventBus {
    constructor() {
        this.events = new Map();
        this.wildcardListeners = new Map();
        this.maxListeners = 50; // Limite para evitar memory leaks
        this.debug = false;
        this.history = []; // Histórico para debugging
        this.maxHistory = 100;
    }

    /**
     * Adiciona listener para um evento
     * @param {string} eventName - Nome do evento
     * @param {Function} callback - Função callback
     * @param {Object} options - Opções do listener
     * @returns {Function} Função para remover o listener
     */
    on(eventName, callback, options = {}) {
        const {
            once = false,
            priority = 0,
            context = null
        } = options;

        if (typeof callback !== 'function') {
            throw new Error('Callback deve ser uma função');
        }

        // Verificar limite de listeners
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const listeners = this.events.get(eventName);
        if (listeners.length >= this.maxListeners) {
            console.warn(`Muitos listeners para evento "${eventName}". Limite: ${this.maxListeners}`);
        }

        const listener = {
            callback,
            once,
            priority,
            context,
            id: this.generateListenerId()
        };

        // Inserir ordenado por prioridade (maior prioridade primeiro)
        const insertIndex = listeners.findIndex(l => l.priority < priority);
        if (insertIndex === -1) {
            listeners.push(listener);
        } else {
            listeners.splice(insertIndex, 0, listener);
        }

        this.log(`Listener adicionado: ${eventName}`, { listenerId: listener.id, priority });

        // Retornar função para remover o listener
        return () => this.off(eventName, listener.id);
    }

    /**
     * Adiciona listener que executa apenas uma vez
     * @param {string} eventName - Nome do evento
     * @param {Function} callback - Função callback
     * @param {Object} options - Opções do listener
     * @returns {Function} Função para remover o listener
     */
    once(eventName, callback, options = {}) {
        return this.on(eventName, callback, { ...options, once: true });
    }

    /**
     * Remove listener de um evento
     * @param {string} eventName - Nome do evento
     * @param {string|Function} listenerIdOrCallback - ID do listener ou função callback
     */
    off(eventName, listenerIdOrCallback) {
        if (!this.events.has(eventName)) {
            return;
        }

        const listeners = this.events.get(eventName);
        
        if (typeof listenerIdOrCallback === 'string') {
            // Remover por ID
            const index = listeners.findIndex(l => l.id === listenerIdOrCallback);
            if (index !== -1) {
                listeners.splice(index, 1);
                this.log(`Listener removido por ID: ${eventName}`, { listenerId: listenerIdOrCallback });
            }
        } else if (typeof listenerIdOrCallback === 'function') {
            // Remover por função callback
            const index = listeners.findIndex(l => l.callback === listenerIdOrCallback);
            if (index !== -1) {
                const listener = listeners[index];
                listeners.splice(index, 1);
                this.log(`Listener removido por callback: ${eventName}`, { listenerId: listener.id });
            }
        }

        // Limpar array vazio
        if (listeners.length === 0) {
            this.events.delete(eventName);
        }
    }

    /**
     * Emite um evento para todos os listeners
     * @param {string} eventName - Nome do evento
     * @param {*} data - Dados do evento
     * @param {Object} options - Opções de emissão
     * @returns {Promise<Array>} Array com resultados dos listeners
     */
    async emit(eventName, data = null, options = {}) {
        const {
            async = false,
            stopOnError = false,
            timeout = 5000
        } = options;

        this.addToHistory(eventName, data);
        this.log(`Evento emitido: ${eventName}`, { data, async, stopOnError });

        const listeners = this.events.get(eventName) || [];
        const results = [];
        const errors = [];

        // Processar listeners
        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];
            
            try {
                let result;
                
                if (async) {
                    // Executar com timeout se async
                    result = await this.executeWithTimeout(
                        listener.callback.bind(listener.context), 
                        [data, eventName], 
                        timeout
                    );
                } else {
                    // Executar sincrono
                    result = listener.callback.call(listener.context, data, eventName);
                }

                results.push({ listenerId: listener.id, result, error: null });

                // Remover listener "once"
                if (listener.once) {
                    listeners.splice(i, 1);
                    i--; // Ajustar índice
                }

            } catch (error) {
                const errorInfo = { 
                    listenerId: listener.id, 
                    result: null, 
                    error: error.message 
                };
                
                results.push(errorInfo);
                errors.push(errorInfo);

                this.log(`Erro no listener: ${eventName}`, errorInfo);

                if (stopOnError) {
                    break;
                }
            }
        }

        // Processar wildcard listeners
        await this.processWildcardListeners(eventName, data, async, timeout);

        if (errors.length > 0 && stopOnError) {
            throw new Error(`Erro ao processar evento "${eventName}": ${errors[0].error}`);
        }

        return results;
    }

    /**
     * Emite evento de forma síncrona
     * @param {string} eventName - Nome do evento
     * @param {*} data - Dados do evento
     * @returns {Array} Resultados dos listeners
     */
    emitSync(eventName, data = null) {
        return this.emit(eventName, data, { async: false });
    }

    /**
     * Emite evento de forma assíncrona
     * @param {string} eventName - Nome do evento
     * @param {*} data - Dados do evento
     * @param {number} timeout - Timeout em ms
     * @returns {Promise<Array>} Resultados dos listeners
     */
    emitAsync(eventName, data = null, timeout = 5000) {
        return this.emit(eventName, data, { async: true, timeout });
    }

    /**
     * Adiciona listener para padrão wildcard
     * @param {string} pattern - Padrão (ex: 'data.*', 'ui.filter.*')
     * @param {Function} callback - Função callback
     * @returns {Function} Função para remover o listener
     */
    onWildcard(pattern, callback) {
        if (!this.wildcardListeners.has(pattern)) {
            this.wildcardListeners.set(pattern, []);
        }

        const listener = {
            callback,
            id: this.generateListenerId(),
            pattern: this.patternToRegex(pattern)
        };

        this.wildcardListeners.get(pattern).push(listener);

        return () => {
            const listeners = this.wildcardListeners.get(pattern);
            if (listeners) {
                const index = listeners.findIndex(l => l.id === listener.id);
                if (index !== -1) {
                    listeners.splice(index, 1);
                }
                if (listeners.length === 0) {
                    this.wildcardListeners.delete(pattern);
                }
            }
        };
    }

    /**
     * Processa listeners wildcard
     * @param {string} eventName - Nome do evento
     * @param {*} data - Dados do evento
     * @param {boolean} async - Se deve executar async
     * @param {number} timeout - Timeout
     */
    async processWildcardListeners(eventName, data, async, timeout) {
        for (const [pattern, listeners] of this.wildcardListeners) {
            for (const listener of listeners) {
                if (listener.pattern.test(eventName)) {
                    try {
                        if (async) {
                            await this.executeWithTimeout(
                                listener.callback, 
                                [data, eventName, pattern], 
                                timeout
                            );
                        } else {
                            listener.callback(data, eventName, pattern);
                        }
                    } catch (error) {
                        this.log(`Erro no wildcard listener: ${pattern}`, { error: error.message });
                    }
                }
            }
        }
    }

    /**
     * Executa função com timeout
     * @param {Function} fn - Função para executar
     * @param {Array} args - Argumentos
     * @param {number} timeout - Timeout em ms
     * @returns {Promise} Resultado da função
     */
    executeWithTimeout(fn, args, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Timeout de ${timeout}ms excedido`));
            }, timeout);

            try {
                const result = fn(...args);
                
                if (result instanceof Promise) {
                    result
                        .then(res => {
                            clearTimeout(timer);
                            resolve(res);
                        })
                        .catch(err => {
                            clearTimeout(timer);
                            reject(err);
                        });
                } else {
                    clearTimeout(timer);
                    resolve(result);
                }
            } catch (error) {
                clearTimeout(timer);
                reject(error);
            }
        });
    }

    /**
     * Converte padrão wildcard para regex
     * @param {string} pattern - Padrão com * e ?
     * @returns {RegExp} Expressão regular
     */
    patternToRegex(pattern) {
        const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
        const withWildcards = escaped.replace(/\*/g, '.*').replace(/\?/g, '.');
        return new RegExp(`^${withWildcards}$`);
    }

    /**
     * Lista todos os eventos registrados
     * @returns {Array} Array com informações dos eventos
     */
    listEvents() {
        const events = [];
        
        for (const [eventName, listeners] of this.events) {
            events.push({
                name: eventName,
                listenerCount: listeners.length,
                listeners: listeners.map(l => ({
                    id: l.id,
                    priority: l.priority,
                    once: l.once,
                    hasContext: !!l.context
                }))
            });
        }

        return events.sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Remove todos os listeners de um evento
     * @param {string} eventName - Nome do evento
     */
    removeAllListeners(eventName) {
        if (this.events.has(eventName)) {
            const count = this.events.get(eventName).length;
            this.events.delete(eventName);
            this.log(`Removidos ${count} listeners do evento: ${eventName}`);
        }
    }

    /**
     * Remove todos os listeners de todos os eventos
     */
    removeAll() {
        const eventCount = this.events.size;
        const wildcardCount = this.wildcardListeners.size;
        
        this.events.clear();
        this.wildcardListeners.clear();
        this.history = [];
        
        this.log(`Removidos todos os listeners`, { 
            eventCount, 
            wildcardCount 
        });
    }

    /**
     * Gera ID único para listener
     * @returns {string} ID único
     */
    generateListenerId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Adiciona evento ao histórico
     * @param {string} eventName - Nome do evento
     * @param {*} data - Dados do evento
     */
    addToHistory(eventName, data) {
        this.history.push({
            eventName,
            data,
            timestamp: new Date().toISOString(),
            listeners: this.events.get(eventName)?.length || 0
        });

        // Manter apenas os últimos eventos
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    /**
     * Obtém histórico de eventos
     * @param {number} limit - Limite de eventos
     * @returns {Array} Histórico de eventos
     */
    getHistory(limit = 20) {
        return this.history.slice(-limit);
    }

    /**
     * Limpa histórico de eventos
     */
    clearHistory() {
        this.history = [];
    }

    /**
     * Habilita/desabilita modo debug
     * @param {boolean} enabled - Se deve habilitar debug
     */
    setDebug(enabled) {
        this.debug = enabled;
        this.log(`Debug ${enabled ? 'habilitado' : 'desabilitado'}`);
    }

    /**
     * Log interno para debugging
     * @param {string} message - Mensagem
     * @param {Object} data - Dados adicionais
     */
    log(message, data = {}) {
        if (this.debug) {
            console.log(`[EventBus] ${message}`, data);
        }
    }

    /**
     * Obtém estatísticas do event bus
     * @returns {Object} Estatísticas
     */
    getStats() {
        const totalListeners = Array.from(this.events.values())
            .reduce((sum, listeners) => sum + listeners.length, 0);
        
        const totalWildcardListeners = Array.from(this.wildcardListeners.values())
            .reduce((sum, listeners) => sum + listeners.length, 0);

        return {
            totalEvents: this.events.size,
            totalListeners,
            totalWildcardPatterns: this.wildcardListeners.size,
            totalWildcardListeners,
            historySize: this.history.length,
            maxListeners: this.maxListeners,
            debugEnabled: this.debug
        };
    }
}

// Instância singleton
let eventBusInstance = null;

/**
 * Obtém instância singleton do EventBus
 * @returns {EventBus} Instância do event bus
 */
export function getEventBus() {
    if (!eventBusInstance) {
        eventBusInstance = new EventBus();
    }
    return eventBusInstance;
}

// Para compatibilidade com código existente
if (typeof window !== 'undefined') {
    window.EventBus = EventBus;
    window.getEventBus = getEventBus;
}
