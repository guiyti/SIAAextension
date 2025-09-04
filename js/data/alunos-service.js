/**
 * @fileoverview Serviços específicos para dados de alunos
 * @description Lógica de negócio específica para alunos e estudantes
 * @version 1.0.0
 */

import { getDataStore } from './data-store.js';

/**
 * Serviços para dados de alunos
 * @class AlunosService
 */
export class AlunosService {
    constructor() {
        this.dataStore = getDataStore();
        this.fieldMappings = this.initializeFieldMappings();
    }

    /**
     * Inicializa mapeamentos de campos
     * @returns {Object} Mapeamentos de campos
     */
    initializeFieldMappings() {
        return {
            // Campos essenciais esperados
            essential: [
                'RGM', 'Nome', 'E-mail', 'Curso', 'Cód. Campus', 
                'Sigla Campus', 'Situação', 'Período'
            ],
            
            // Campos opcionais comuns
            optional: [
                'CPF', 'Data Nascimento', 'Telefone', 'Endereço',
                'Cidade', 'Estado', 'CEP', 'Nome Curso', 'Modalidade',
                'Data Matrícula', 'Data Conclusão', 'CR', 'Status'
            ],

            // Campos calculados
            calculated: [
                'Nome + Campus', 'Campus Completo', 'Situação Formatada',
                'Tempo Curso', 'Status Ativo'
            ],

            // Situações válidas
            situacoes: [
                'Ativo', 'Formado', 'Trancado', 'Transferido', 
                'Jubilado', 'Cancelado', 'Evadido'
            ]
        };
    }

    /**
     * Valida estrutura dos dados de alunos
     * @param {Array} data - Dados para validar
     * @returns {Object} Resultado da validação
     */
    validateData(data) {
        const result = {
            isValid: false,
            missingFields: [],
            extraFields: [],
            warnings: [],
            errors: [],
            duplicateRGMs: [],
            invalidEmails: []
        };

        if (!Array.isArray(data) || data.length === 0) {
            result.errors.push('Dados estão vazios ou não são um array');
            return result;
        }

        const headers = Object.keys(data[0]);
        const essential = this.fieldMappings.essential;

        // Verificar campos essenciais
        result.missingFields = essential.filter(field => !headers.includes(field));
        
        // Verificar campos extras
        const allKnownFields = [...essential, ...this.fieldMappings.optional];
        result.extraFields = headers.filter(field => !allKnownFields.includes(field));

        // Validar se há pelo menos campos mínimos
        const minimal = ['RGM', 'Nome'];
        const hasMinimal = minimal.every(field => headers.includes(field));

        if (!hasMinimal) {
            result.errors.push('Faltam campos mínimos: ' + minimal.filter(f => !headers.includes(f)).join(', '));
        }

        // Verificar duplicatas de RGM
        const rgmMap = new Map();
        const emailMap = new Map();

        data.forEach((row, index) => {
            const rgm = row['RGM'];
            const email = row['E-mail'];

            // Verificar RGM duplicado
            if (rgm) {
                if (rgmMap.has(rgm)) {
                    result.duplicateRGMs.push({
                        rgm: rgm,
                        lines: [rgmMap.get(rgm), index + 1]
                    });
                } else {
                    rgmMap.set(rgm, index + 1);
                }
            }

            // Verificar email válido
            if (email && !this.isValidEmail(email)) {
                result.invalidEmails.push({
                    email: email,
                    line: index + 1
                });
            }
        });

        // Validar situações
        const invalidSituacoes = data
            .map((row, index) => ({ situacao: row['Situação'], line: index + 1 }))
            .filter(item => item.situacao && !this.fieldMappings.situacoes.includes(item.situacao));

        if (invalidSituacoes.length > 0) {
            result.warnings.push(
                `Situações não reconhecidas: ${invalidSituacoes.map(s => `"${s.situacao}" (linha ${s.line})`).join(', ')}`
            );
        }

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * Valida formato de email
     * @param {string} email - Email para validar
     * @returns {boolean} True se válido
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Processa dados de alunos adicionando campos calculados
     * @param {Array} rawData - Dados brutos
     * @returns {Array} Dados processados
     */
    processData(rawData) {
        if (!Array.isArray(rawData) || rawData.length === 0) {
            return rawData;
        }

        const processed = rawData.map(row => {
            const processedRow = { ...row };
            
            // Adicionar campos calculados
            this.addCalculatedFields(processedRow);
            
            return processedRow;
        });

        return processed;
    }

    /**
     * Adiciona campos calculados a uma linha
     * @param {Object} row - Linha de dados
     */
    addCalculatedFields(row) {
        // Nome + Campus (para detecção de duplicatas)
        const nome = row['Nome'] || '';
        const campusCodigo = row['Cód. Campus'] || '';
        row['Nome + Campus'] = `${nome}|${campusCodigo}`;

        // Campus Completo
        const siglaCampus = row['Sigla Campus'] || '';
        const nomeCampus = row['Nome Campus'] || '';
        row['Campus Completo'] = siglaCampus && nomeCampus 
            ? `${siglaCampus} - ${nomeCampus}` 
            : siglaCampus || nomeCampus || campusCodigo;

        // Situação Formatada
        const situacao = row['Situação'] || '';
        row['Situação Formatada'] = this.formatSituacao(situacao);

        // Status Ativo
        row['Status Ativo'] = this.isAlunoAtivo(situacao);

        // Tempo no Curso (se tiver data de matrícula)
        const dataMatricula = row['Data Matrícula'];
        if (dataMatricula) {
            row['Tempo Curso'] = this.calculateTempoCurso(dataMatricula);
        }
    }

    /**
     * Formata situação do aluno
     * @param {string} situacao - Situação bruta
     * @returns {string} Situação formatada
     */
    formatSituacao(situacao) {
        if (!situacao) return 'Não informado';
        
        const situacaoLower = situacao.toLowerCase();
        
        // Normalizar situações comuns
        const mappings = {
            'ativo': 'Ativo',
            'formado': 'Formado',
            'graduado': 'Formado',
            'concluido': 'Formado',
            'trancado': 'Trancado',
            'transferido': 'Transferido',
            'jubilado': 'Jubilado',
            'cancelado': 'Cancelado',
            'evadido': 'Evadido',
            'desistente': 'Evadido'
        };

        return mappings[situacaoLower] || situacao;
    }

    /**
     * Verifica se aluno está ativo
     * @param {string} situacao - Situação do aluno
     * @returns {boolean} True se ativo
     */
    isAlunoAtivo(situacao) {
        const situacaoFormatada = this.formatSituacao(situacao);
        const ativas = ['Ativo', 'Não informado'];
        return ativas.includes(situacaoFormatada);
    }

    /**
     * Calcula tempo no curso
     * @param {string} dataMatricula - Data de matrícula
     * @returns {string} Tempo formatado
     */
    calculateTempoCurso(dataMatricula) {
        try {
            const matricula = new Date(dataMatricula);
            const agora = new Date();
            const diffTime = Math.abs(agora - matricula);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 30) {
                return `${diffDays} dias`;
            } else if (diffDays < 365) {
                const months = Math.floor(diffDays / 30);
                return `${months} mês${months > 1 ? 'es' : ''}`;
            } else {
                const years = Math.floor(diffDays / 365);
                const months = Math.floor((diffDays % 365) / 30);
                return `${years} ano${years > 1 ? 's' : ''}${months > 0 ? ` e ${months} mês${months > 1 ? 'es' : ''}` : ''}`;
            }
        } catch (error) {
            return 'Não calculado';
        }
    }

    /**
     * Filtra alunos por critérios específicos
     * @param {Array} data - Dados para filtrar
     * @param {Object} criteria - Critérios de filtro
     * @returns {Array} Dados filtrados
     */
    filterByCriteria(data, criteria) {
        if (!Array.isArray(data)) return [];
        
        return data.filter(row => {
            // Filtro por campus
            if (criteria.campus && !this.matchesCampus(row, criteria.campus)) {
                return false;
            }
            
            // Filtro por situação
            if (criteria.situacao && !this.matchesSituacao(row, criteria.situacao)) {
                return false;
            }
            
            // Filtro por curso
            if (criteria.curso && !this.matchesCurso(row, criteria.curso)) {
                return false;
            }
            
            // Filtro apenas ativos
            if (criteria.apenasAtivos && !row['Status Ativo']) {
                return false;
            }
            
            // Filtro por período
            if (criteria.periodo && !this.matchesPeriodo(row, criteria.periodo)) {
                return false;
            }
            
            return true;
        });
    }

    /**
     * Verifica se linha corresponde ao campus
     * @param {Object} row - Linha de dados
     * @param {string} campus - Campus para verificar
     * @returns {boolean} True se corresponde
     */
    matchesCampus(row, campus) {
        const siglaCampus = (row['Sigla Campus'] || '').toLowerCase();
        const campusCodigo = (row['Cód. Campus'] || '').toLowerCase();
        const searchTerm = campus.toLowerCase();
        
        return siglaCampus.includes(searchTerm) || campusCodigo.includes(searchTerm);
    }

    /**
     * Verifica se linha corresponde à situação
     * @param {Object} row - Linha de dados
     * @param {string} situacao - Situação para verificar
     * @returns {boolean} True se corresponde
     */
    matchesSituacao(row, situacao) {
        const situacaoRow = (row['Situação'] || '').toLowerCase();
        const situacaoFormatada = (row['Situação Formatada'] || '').toLowerCase();
        const searchTerm = situacao.toLowerCase();
        
        return situacaoRow.includes(searchTerm) || situacaoFormatada.includes(searchTerm);
    }

    /**
     * Verifica se linha corresponde ao curso
     * @param {Object} row - Linha de dados
     * @param {string} curso - Curso para verificar
     * @returns {boolean} True se corresponde
     */
    matchesCurso(row, curso) {
        const cursoRow = (row['Curso'] || '').toLowerCase();
        const nomeCurso = (row['Nome Curso'] || '').toLowerCase();
        const searchTerm = curso.toLowerCase();
        
        return cursoRow.includes(searchTerm) || nomeCurso.includes(searchTerm);
    }

    /**
     * Verifica se linha corresponde ao período
     * @param {Object} row - Linha de dados
     * @param {string} periodo - Período para verificar
     * @returns {boolean} True se corresponde
     */
    matchesPeriodo(row, periodo) {
        const periodoRow = (row['Período'] || '').toLowerCase();
        const searchTerm = periodo.toLowerCase();
        
        return periodoRow.includes(searchTerm);
    }

    /**
     * Obtém estatísticas dos alunos
     * @param {Array} data - Dados para analisar
     * @returns {Object} Estatísticas
     */
    getStatistics(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return {
                total: 0,
                ativos: 0,
                porCampus: {},
                porSituacao: {},
                porCurso: {},
                porPeriodo: {}
            };
        }

        const stats = {
            total: data.length,
            ativos: 0,
            porCampus: {},
            porSituacao: {},
            porCurso: {},
            porPeriodo: {},
            cursosUnicos: new Set(),
            campusUnicos: new Set()
        };

        data.forEach(row => {
            // Contagem de ativos
            if (row['Status Ativo']) {
                stats.ativos++;
            }

            // Por campus
            const campus = row['Sigla Campus'] || 'Não informado';
            stats.porCampus[campus] = (stats.porCampus[campus] || 0) + 1;
            stats.campusUnicos.add(campus);
            
            // Por situação
            const situacao = row['Situação Formatada'] || 'Não informado';
            stats.porSituacao[situacao] = (stats.porSituacao[situacao] || 0) + 1;
            
            // Por curso
            const curso = row['Curso'] || 'Não informado';
            stats.porCurso[curso] = (stats.porCurso[curso] || 0) + 1;
            stats.cursosUnicos.add(curso);
            
            // Por período
            const periodo = row['Período'] || 'Não informado';
            stats.porPeriodo[periodo] = (stats.porPeriodo[periodo] || 0) + 1;
        });

        // Converter Sets para números
        stats.cursosUnicos = stats.cursosUnicos.size;
        stats.campusUnicos = stats.campusUnicos.size;

        // Adicionar percentuais
        stats.percentualAtivos = stats.total > 0 ? Math.round((stats.ativos / stats.total) * 100) : 0;

        return stats;
    }

    /**
     * Busca alunos por texto
     * @param {Array} data - Dados para buscar
     * @param {string} searchTerm - Termo de busca
     * @param {Array} searchFields - Campos para buscar (opcional)
     * @returns {Array} Resultados da busca
     */
    search(data, searchTerm, searchFields = null) {
        if (!Array.isArray(data) || !searchTerm) return data;
        
        const fields = searchFields || [
            'Nome', 'RGM', 'E-mail', 'Curso', 'Sigla Campus', 'Situação'
        ];
        
        const term = searchTerm.toLowerCase();
        
        return data.filter(row => {
            return fields.some(field => {
                const value = row[field] || '';
                return value.toString().toLowerCase().includes(term);
            });
        });
    }

    /**
     * Exporta dados de alunos para CSV
     * @param {Array} data - Dados para exportar
     * @param {Array} columns - Colunas para incluir (opcional)
     * @returns {string} Dados em formato CSV
     */
    exportToCSV(data, columns = null) {
        if (!Array.isArray(data) || data.length === 0) {
            return '';
        }

        const headers = columns || Object.keys(data[0]);
        const csvLines = [headers.join(',')];

        data.forEach(row => {
            const line = headers.map(header => {
                const value = row[header] || '';
                // Escapar vírgulas e aspas
                return value.toString().includes(',') || value.toString().includes('"')
                    ? `"${value.toString().replace(/"/g, '""')}"`
                    : value;
            }).join(',');
            csvLines.push(line);
        });

        return csvLines.join('\n');
    }

    /**
     * Agrupa alunos por critério
     * @param {Array} data - Dados para agrupar
     * @param {string} groupBy - Campo para agrupar
     * @returns {Object} Dados agrupados
     */
    groupBy(data, groupBy) {
        if (!Array.isArray(data)) return {};
        
        return data.reduce((groups, row) => {
            const key = row[groupBy] || 'Não informado';
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(row);
            return groups;
        }, {});
    }

    /**
     * Gera relatório de duplicatas baseado em nome + campus
     * @param {Array} data - Dados para analisar
     * @returns {Object} Relatório de duplicatas
     */
    findDuplicatesByCombinedKey(data) {
        if (!Array.isArray(data)) return { duplicates: [], total: 0 };

        const keyMap = new Map();
        const duplicates = [];

        data.forEach((row, index) => {
            const nome = (row['Nome'] || '').trim();
            const campusCodigo = (row['Cód. Campus'] || '').trim();
            const key = `${nome}|${campusCodigo}`;

            if (!nome || !campusCodigo) return; // Pular registros incompletos

            if (keyMap.has(key)) {
                const existingEntry = keyMap.get(key);
                
                // Se é a primeira duplicata encontrada para esta chave
                if (!existingEntry.isDuplicate) {
                    existingEntry.isDuplicate = true;
                    existingEntry.records = [existingEntry.record];
                    duplicates.push(existingEntry);
                }
                
                // Adicionar registro atual
                existingEntry.records.push({
                    index: index,
                    data: row
                });
            } else {
                keyMap.set(key, {
                    key: key,
                    nome: nome,
                    campusCodigo: campusCodigo,
                    isDuplicate: false,
                    record: {
                        index: index,
                        data: row
                    }
                });
            }
        });

        return {
            duplicates: duplicates,
            total: duplicates.reduce((sum, dup) => sum + dup.records.length, 0),
            uniqueKeys: duplicates.length
        };
    }

    /**
     * Remove alunos duplicados mantendo o primeiro encontrado
     * @param {Array} data - Dados para processar
     * @param {string} criteria - Critério para duplicatas ('rgm' ou 'nome+campus')
     * @returns {Object} Resultado da remoção
     */
    removeDuplicates(data, criteria = 'nome+campus') {
        if (!Array.isArray(data)) return { cleaned: [], removed: [] };

        const cleaned = [];
        const removed = [];
        const seen = new Set();

        data.forEach((row, index) => {
            let key;
            
            if (criteria === 'rgm') {
                key = row['RGM'] || '';
            } else { // nome+campus
                const nome = (row['Nome'] || '').trim();
                const campusCodigo = (row['Cód. Campus'] || '').trim();
                key = `${nome}|${campusCodigo}`;
            }

            if (key && seen.has(key)) {
                removed.push({
                    index: index,
                    data: row,
                    reason: `Duplicata por ${criteria}`,
                    key: key
                });
            } else {
                if (key) seen.add(key);
                cleaned.push(row);
            }
        });

        return {
            cleaned: cleaned,
            removed: removed,
            originalCount: data.length,
            cleanedCount: cleaned.length,
            removedCount: removed.length
        };
    }
}

// Para compatibilidade com código existente
if (typeof window !== 'undefined') {
    window.AlunosService = AlunosService;
}
