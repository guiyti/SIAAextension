/**
 * @fileoverview Gerenciador de duplicatas
 * @description Sistema avançado para detecção e remoção de registros duplicados
 * @version 1.0.0
 */

/**
 * Gerenciador de duplicatas com múltiplos critérios
 * @class DuplicateManager
 */
export class DuplicateManager {
    constructor() {
        this.strategies = {
            rgm: this.findByRGM.bind(this),
            'nome+campus': this.findByNameAndCampus.bind(this),
            email: this.findByEmail.bind(this),
            'id-oferta': this.findByOfertaId.bind(this),
            custom: this.findByCustomKey.bind(this)
        };
    }

    /**
     * Encontra duplicatas usando estratégia especificada
     * @param {Array} data - Dados para analisar
     * @param {string} strategy - Estratégia de detecção
     * @param {string} type - Tipo de dados ('ofertas' ou 'alunos')
     * @param {Object} options - Opções adicionais
     * @returns {Object} Resultado da análise
     */
    findDuplicates(data, strategy = 'auto', type = 'ofertas', options = {}) {
        if (!Array.isArray(data) || data.length === 0) {
            return this.createEmptyResult();
        }

        // Auto-detectar estratégia baseado no tipo
        if (strategy === 'auto') {
            strategy = this.autoDetectStrategy(data, type);
        }

        // Executar estratégia
        const strategyFn = this.strategies[strategy];
        if (!strategyFn) {
            throw new Error(`Estratégia '${strategy}' não encontrada`);
        }

        const result = strategyFn(data, options);
        result.strategy = strategy;
        result.type = type;
        result.analyzedAt = new Date().toISOString();

        return result;
    }

    /**
     * Auto-detecta melhor estratégia baseado nos dados
     * @param {Array} data - Dados para analisar
     * @param {string} type - Tipo de dados
     * @returns {string} Estratégia recomendada
     */
    autoDetectStrategy(data, type) {
        if (!data.length) return 'custom';
        
        const headers = Object.keys(data[0]);
        
        if (type === 'alunos') {
            if (headers.includes('RGM')) {
                return 'rgm';
            } else if (headers.includes('Nome') && (headers.includes('Cód. Campus') || headers.includes('Campus'))) {
                return 'nome+campus';
            } else if (headers.includes('E-mail')) {
                return 'email';
            }
        } else if (type === 'ofertas') {
            if (headers.includes('ID Oferta')) {
                return 'id-oferta';
            }
        }
        
        return 'custom';
    }

    /**
     * Encontra duplicatas por RGM
     * @param {Array} data - Dados de alunos
     * @param {Object} options - Opções
     * @returns {Object} Resultado
     */
    findByRGM(data, options = {}) {
        const {
            ignoreEmpty = true,
            caseSensitive = false
        } = options;

        const rgmMap = new Map();
        const duplicates = [];

        data.forEach((record, index) => {
            let rgm = record['RGM'];
            
            if (!rgm) {
                if (!ignoreEmpty) {
                    rgm = '__EMPTY__';
                } else {
                    return;
                }
            }

            if (!caseSensitive && typeof rgm === 'string') {
                rgm = rgm.toLowerCase();
            }

            const key = rgm.toString();

            if (rgmMap.has(key)) {
                const existing = rgmMap.get(key);
                
                // Se é a primeira duplicata para esta chave
                if (!existing.isDuplicate) {
                    existing.isDuplicate = true;
                    existing.records = [existing.firstRecord];
                    duplicates.push(existing);
                }
                
                existing.records.push({
                    index: index,
                    data: record,
                    displayData: {
                        rgm: record['RGM'],
                        nome: record['Nome'],
                        email: record['E-mail'],
                        curso: record['Curso'],
                        campus: record['Sigla Campus']
                    }
                });
            } else {
                rgmMap.set(key, {
                    key: key,
                    keyName: 'RGM',
                    isDuplicate: false,
                    firstRecord: {
                        index: index,
                        data: record,
                        displayData: {
                            rgm: record['RGM'],
                            nome: record['Nome'],
                            email: record['E-mail'],
                            curso: record['Curso'],
                            campus: record['Sigla Campus']
                        }
                    }
                });
            }
        });

        return this.buildResult(duplicates, data.length);
    }

    /**
     * Encontra duplicatas por nome + campus
     * @param {Array} data - Dados de alunos
     * @param {Object} options - Opções
     * @returns {Object} Resultado
     */
    findByNameAndCampus(data, options = {}) {
        const {
            ignoreCase = true,
            trimValues = true,
            ignoreEmpty = true
        } = options;

        const keyMap = new Map();
        const duplicates = [];

        data.forEach((record, index) => {
            let nome = record['Nome'] || '';
            let campusCodigo = record['Cód. Campus'] || '';

            if (trimValues) {
                nome = nome.trim();
                campusCodigo = campusCodigo.trim();
            }

            if (ignoreEmpty && (!nome || !campusCodigo)) {
                return;
            }

            if (ignoreCase) {
                nome = nome.toLowerCase();
                campusCodigo = campusCodigo.toLowerCase();
            }

            const key = `${nome}|${campusCodigo}`;

            if (keyMap.has(key)) {
                const existing = keyMap.get(key);
                
                if (!existing.isDuplicate) {
                    existing.isDuplicate = true;
                    existing.records = [existing.firstRecord];
                    duplicates.push(existing);
                }
                
                existing.records.push({
                    index: index,
                    data: record,
                    displayData: {
                        nome: record['Nome'],
                        curso: record['Curso'],
                        campusCodigo: record['Cód. Campus'],
                        siglaCampus: record['Sigla Campus'],
                        situacao: record['Situação'],
                        rgm: record['RGM']
                    }
                });
            } else {
                keyMap.set(key, {
                    key: key,
                    keyName: 'Nome + Campus',
                    isDuplicate: false,
                    firstRecord: {
                        index: index,
                        data: record,
                        displayData: {
                            nome: record['Nome'],
                            curso: record['Curso'],
                            campusCodigo: record['Cód. Campus'],
                            siglaCampus: record['Sigla Campus'],
                            situacao: record['Situação'],
                            rgm: record['RGM']
                        }
                    }
                });
            }
        });

        return this.buildResult(duplicates, data.length);
    }

    /**
     * Encontra duplicatas por email
     * @param {Array} data - Dados de alunos
     * @param {Object} options - Opções
     * @returns {Object} Resultado
     */
    findByEmail(data, options = {}) {
        const {
            ignoreCase = true,
            ignoreEmpty = true
        } = options;

        const emailMap = new Map();
        const duplicates = [];

        data.forEach((record, index) => {
            let email = record['E-mail'] || '';

            if (ignoreEmpty && !email) {
                return;
            }

            if (ignoreCase) {
                email = email.toLowerCase();
            }

            const key = email;

            if (emailMap.has(key)) {
                const existing = emailMap.get(key);
                
                if (!existing.isDuplicate) {
                    existing.isDuplicate = true;
                    existing.records = [existing.firstRecord];
                    duplicates.push(existing);
                }
                
                existing.records.push({
                    index: index,
                    data: record,
                    displayData: {
                        email: record['E-mail'],
                        nome: record['Nome'],
                        rgm: record['RGM'],
                        curso: record['Curso']
                    }
                });
            } else {
                emailMap.set(key, {
                    key: key,
                    keyName: 'E-mail',
                    isDuplicate: false,
                    firstRecord: {
                        index: index,
                        data: record,
                        displayData: {
                            email: record['E-mail'],
                            nome: record['Nome'],
                            rgm: record['RGM'],
                            curso: record['Curso']
                        }
                    }
                });
            }
        });

        return this.buildResult(duplicates, data.length);
    }

    /**
     * Encontra duplicatas por ID da oferta
     * @param {Array} data - Dados de ofertas
     * @param {Object} options - Opções
     * @returns {Object} Resultado
     */
    findByOfertaId(data, options = {}) {
        const {
            ignoreEmpty = true
        } = options;

        const idMap = new Map();
        const duplicates = [];

        data.forEach((record, index) => {
            const idOferta = record['ID Oferta'];

            if (ignoreEmpty && !idOferta) {
                return;
            }

            const key = idOferta.toString();

            if (idMap.has(key)) {
                const existing = idMap.get(key);
                
                if (!existing.isDuplicate) {
                    existing.isDuplicate = true;
                    existing.records = [existing.firstRecord];
                    duplicates.push(existing);
                }
                
                existing.records.push({
                    index: index,
                    data: record,
                    displayData: {
                        idOferta: record['ID Oferta'],
                        disciplina: record['Nome Disciplina'],
                        professor: record['Nome Professor'],
                        campus: record['Sigla Campus'],
                        periodo: record['Período']
                    }
                });
            } else {
                idMap.set(key, {
                    key: key,
                    keyName: 'ID Oferta',
                    isDuplicate: false,
                    firstRecord: {
                        index: index,
                        data: record,
                        displayData: {
                            idOferta: record['ID Oferta'],
                            disciplina: record['Nome Disciplina'],
                            professor: record['Nome Professor'],
                            campus: record['Sigla Campus'],
                            periodo: record['Período']
                        }
                    }
                });
            }
        });

        return this.buildResult(duplicates, data.length);
    }

    /**
     * Encontra duplicatas por chave customizada
     * @param {Array} data - Dados
     * @param {Object} options - Opções com função keyExtractor
     * @returns {Object} Resultado
     */
    findByCustomKey(data, options = {}) {
        const {
            keyExtractor,
            keyName = 'Custom Key',
            displayFields = []
        } = options;

        if (typeof keyExtractor !== 'function') {
            throw new Error('keyExtractor deve ser uma função');
        }

        const keyMap = new Map();
        const duplicates = [];

        data.forEach((record, index) => {
            try {
                const key = keyExtractor(record, index);
                
                if (key === null || key === undefined) {
                    return;
                }

                const keyStr = key.toString();

                if (keyMap.has(keyStr)) {
                    const existing = keyMap.get(keyStr);
                    
                    if (!existing.isDuplicate) {
                        existing.isDuplicate = true;
                        existing.records = [existing.firstRecord];
                        duplicates.push(existing);
                    }
                    
                    const displayData = {};
                    displayFields.forEach(field => {
                        displayData[field] = record[field];
                    });
                    
                    existing.records.push({
                        index: index,
                        data: record,
                        displayData: displayData
                    });
                } else {
                    const displayData = {};
                    displayFields.forEach(field => {
                        displayData[field] = record[field];
                    });

                    keyMap.set(keyStr, {
                        key: keyStr,
                        keyName: keyName,
                        isDuplicate: false,
                        firstRecord: {
                            index: index,
                            data: record,
                            displayData: displayData
                        }
                    });
                }
            } catch (error) {
                console.warn(`Erro ao extrair chave do registro ${index}:`, error);
            }
        });

        return this.buildResult(duplicates, data.length);
    }

    /**
     * Remove duplicatas mantendo registros especificados
     * @param {Array} data - Dados originais
     * @param {Object} duplicatesResult - Resultado de findDuplicates
     * @param {Object} keepOptions - Opções de qual manter
     * @returns {Object} Resultado da remoção
     */
    removeDuplicates(data, duplicatesResult, keepOptions = { strategy: 'first' }) {
        if (!duplicatesResult.duplicatesFound) {
            return {
                originalData: data,
                cleanedData: [...data],
                removedRecords: [],
                keptRecords: data.map((_, index) => index),
                removedCount: 0,
                summary: 'Nenhuma duplicata encontrada'
            };
        }

        const toRemove = new Set();
        const keptRecords = [];
        const removedRecords = [];

        duplicatesResult.duplicates.forEach(duplicate => {
            const records = duplicate.records;
            
            // Determinar qual manter
            let indexToKeep;
            
            switch (keepOptions.strategy) {
                case 'first':
                    indexToKeep = 0;
                    break;
                case 'last':
                    indexToKeep = records.length - 1;
                    break;
                case 'custom':
                    if (typeof keepOptions.selector === 'function') {
                        indexToKeep = keepOptions.selector(records);
                    } else {
                        indexToKeep = 0;
                    }
                    break;
                default:
                    indexToKeep = 0;
            }
            
            // Marcar outros para remoção
            records.forEach((record, i) => {
                if (i === indexToKeep) {
                    keptRecords.push(record.index);
                } else {
                    toRemove.add(record.index);
                    removedRecords.push({
                        originalIndex: record.index,
                        data: record.data,
                        reason: `Duplicata de ${duplicate.keyName}`,
                        key: duplicate.key
                    });
                }
            });
        });

        // Criar dados limpos
        const cleanedData = data.filter((_, index) => !toRemove.has(index));

        return {
            originalData: data,
            cleanedData: cleanedData,
            removedRecords: removedRecords,
            keptRecords: keptRecords,
            removedCount: toRemove.size,
            summary: `Removidas ${toRemove.size} duplicatas de ${duplicatesResult.duplicates.length} grupos`
        };
    }

    /**
     * Cria diálogo de seleção de duplicatas
     * @param {Object} duplicatesResult - Resultado de findDuplicates
     * @param {Function} onSelection - Callback para seleção
     * @returns {HTMLElement} Elemento do diálogo
     */
    createSelectionDialog(duplicatesResult, onSelection) {
        if (!duplicatesResult.duplicatesFound) {
            return this.createInfoDialog('Nenhuma duplicata encontrada');
        }

        const dialog = document.createElement('div');
        dialog.className = 'duplicates-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            max-width: 80vw;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 10000;
            padding: 20px;
        `;

        // Cabeçalho
        const header = document.createElement('div');
        header.innerHTML = `
            <h3>🔍 Duplicatas Encontradas</h3>
            <p>Encontradas <strong>${duplicatesResult.totalDuplicates}</strong> duplicatas em <strong>${duplicatesResult.duplicates.length}</strong> grupos.</p>
            <p>Critério: <em>${duplicatesResult.strategy}</em></p>
        `;
        dialog.appendChild(header);

        // Lista de duplicatas
        const list = document.createElement('div');
        list.className = 'duplicates-list';
        
        duplicatesResult.duplicates.forEach((duplicate, groupIndex) => {
            const group = this.createDuplicateGroup(duplicate, groupIndex, duplicatesResult.type);
            list.appendChild(group);
        });
        
        dialog.appendChild(list);

        // Botões
        const buttons = document.createElement('div');
        buttons.style.cssText = 'margin-top: 20px; text-align: right;';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.onclick = () => {
            dialog.remove();
            if (onSelection) onSelection(null);
        };
        
        const autoBtn = document.createElement('button');
        autoBtn.textContent = 'Remover Automático (Manter Primeiro)';
        autoBtn.style.marginLeft = '10px';
        autoBtn.onclick = () => {
            const result = this.removeDuplicates([], duplicatesResult, { strategy: 'first' });
            dialog.remove();
            if (onSelection) onSelection(result);
        };
        
        buttons.appendChild(cancelBtn);
        buttons.appendChild(autoBtn);
        dialog.appendChild(buttons);

        return dialog;
    }

    /**
     * Cria grupo de duplicatas na interface
     * @param {Object} duplicate - Grupo de duplicatas
     * @param {number} groupIndex - Índice do grupo
     * @param {string} type - Tipo de dados
     * @returns {HTMLElement} Elemento do grupo
     */
    createDuplicateGroup(duplicate, groupIndex, type) {
        const group = document.createElement('div');
        group.className = 'duplicate-group';
        group.style.cssText = `
            border: 1px solid #eee;
            border-radius: 4px;
            margin: 10px 0;
            padding: 10px;
            background: #fafafa;
        `;

        // Cabeçalho do grupo
        const groupHeader = document.createElement('div');
        groupHeader.style.fontWeight = 'bold';
        groupHeader.style.marginBottom = '10px';
        
        let keyDisplay = duplicate.key;
        if (type === 'alunos' && duplicate.keyName === 'Nome + Campus') {
            keyDisplay = keyDisplay.replace('|', ' - Campus: ');
        }
        
        groupHeader.textContent = `${duplicate.keyName}: ${keyDisplay} (${duplicate.records.length} registros)`;
        group.appendChild(groupHeader);

        // Lista de registros
        duplicate.records.forEach((record, recordIndex) => {
            const recordDiv = document.createElement('div');
            recordDiv.style.cssText = `
                margin: 5px 0;
                padding: 8px;
                background: white;
                border-radius: 3px;
                border-left: 3px solid ${recordIndex === 0 ? '#28a745' : '#ffc107'};
            `;

            let displayText = '';
            if (type === 'alunos') {
                const d = record.displayData;
                if (duplicate.keyName === 'Nome + Campus') {
                    displayText = `${d.nome} | ${d.curso} | ${d.campusCodigo} (${d.siglaCampus}) | ${d.situacao} | RGM: ${d.rgm}`;
                } else {
                    displayText = `${d.nome} | ${d.email} | ${d.curso} | RGM: ${d.rgm}`;
                }
            } else {
                const d = record.displayData;
                displayText = `${d.disciplina} | ${d.professor} | ${d.campus} | ${d.periodo}`;
            }

            recordDiv.innerHTML = `
                <input type="radio" name="keep_${groupIndex}" value="${record.index}" ${recordIndex === 0 ? 'checked' : ''}>
                ${displayText}
                ${recordIndex === 0 ? ' <span style="color: #28a745; font-weight: bold;">(Recomendado)</span>' : ''}
            `;
            
            group.appendChild(recordDiv);
        });

        return group;
    }

    /**
     * Cria diálogo informativo
     * @param {string} message - Mensagem
     * @returns {HTMLElement} Elemento do diálogo
     */
    createInfoDialog(message) {
        const dialog = document.createElement('div');
        dialog.className = 'info-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            padding: 20px;
            z-index: 10000;
            text-align: center;
        `;

        dialog.innerHTML = `
            <p>${message}</p>
            <button onclick="this.parentElement.remove()">OK</button>
        `;

        return dialog;
    }

    /**
     * Constrói resultado padronizado
     * @param {Array} duplicates - Lista de duplicatas
     * @param {number} totalRecords - Total de registros
     * @returns {Object} Resultado
     */
    buildResult(duplicates, totalRecords) {
        const totalDuplicates = duplicates.reduce((sum, dup) => sum + dup.records.length, 0);
        
        return {
            duplicatesFound: duplicates.length > 0,
            duplicates: duplicates,
            totalDuplicates: totalDuplicates,
            uniqueGroups: duplicates.length,
            totalRecords: totalRecords,
            cleanRecords: totalRecords - totalDuplicates,
            duplicatePercentage: totalRecords > 0 ? Math.round((totalDuplicates / totalRecords) * 100) : 0
        };
    }

    /**
     * Cria resultado vazio
     * @returns {Object} Resultado vazio
     */
    createEmptyResult() {
        return {
            duplicatesFound: false,
            duplicates: [],
            totalDuplicates: 0,
            uniqueGroups: 0,
            totalRecords: 0,
            cleanRecords: 0,
            duplicatePercentage: 0
        };
    }

    /**
     * Gera relatório de duplicatas
     * @param {Object} duplicatesResult - Resultado de findDuplicates
     * @returns {string} Relatório em texto
     */
    generateReport(duplicatesResult) {
        if (!duplicatesResult.duplicatesFound) {
            return 'Nenhuma duplicata encontrada nos dados analisados.';
        }

        const lines = [];
        lines.push('=== RELATÓRIO DE DUPLICATAS ===');
        lines.push(`Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
        lines.push(`Estratégia: ${duplicatesResult.strategy}`);
        lines.push(`Total de registros: ${duplicatesResult.totalRecords}`);
        lines.push(`Registros duplicados: ${duplicatesResult.totalDuplicates}`);
        lines.push(`Grupos de duplicatas: ${duplicatesResult.uniqueGroups}`);
        lines.push(`Percentual de duplicatas: ${duplicatesResult.duplicatePercentage}%`);
        lines.push('');

        duplicatesResult.duplicates.forEach((duplicate, index) => {
            lines.push(`--- Grupo ${index + 1} ---`);
            lines.push(`Chave: ${duplicate.key} (${duplicate.keyName})`);
            lines.push(`Registros: ${duplicate.records.length}`);
            
            duplicate.records.forEach((record, recordIndex) => {
                lines.push(`  ${recordIndex + 1}. Linha ${record.index + 1}`);
                Object.entries(record.displayData).forEach(([field, value]) => {
                    lines.push(`     ${field}: ${value}`);
                });
            });
            lines.push('');
        });

        return lines.join('\n');
    }
}

// Para compatibilidade com código existente
if (typeof window !== 'undefined') {
    window.DuplicateManager = DuplicateManager;
}
