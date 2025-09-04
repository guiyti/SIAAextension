/**
 * @fileoverview Serviços específicos para dados de ofertas
 * @description Lógica de negócio específica para ofertas de disciplinas
 * @version 1.0.0
 */

import { getDataStore } from './data-store.js';

/**
 * Serviços para dados de ofertas
 * @class OfertasService
 */
export class OfertasService {
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
            // Campos obrigatórios esperados
            required: [
                'Cód. Disc.', 'Nome Disciplina', 'Carga Horária', 
                'Cód. Campus', 'Sigla Campus', 'Nome Campus', 'Período',
                'Vagas', 'Matriculados', 'Pré-matriculados', 'Total Matriculados', 
                'Vagas Restantes', 'Sala', 'Descrição', 'Cód. Horário', 
                'ID Oferta', 'Hora', 'Curso', 'Cód. Prof.', 'Nome Professor'
            ],
            
            // Aliases para compatibilidade
            aliases: {
                'Total': 'Total Matriculados',
                'Total Matriculados': 'Total'
            },

            // Campos calculados
            calculated: [
                'Ocupação %', 'Status Vagas', 'Período Formatado', 'Campus Completo'
            ]
        };
    }

    /**
     * Valida estrutura dos dados de ofertas
     * @param {Array} data - Dados para validar
     * @returns {Object} Resultado da validação
     */
    validateData(data) {
        const result = {
            isValid: false,
            missingFields: [],
            extraFields: [],
            aliasedFields: [],
            warnings: [],
            errors: []
        };

        if (!Array.isArray(data) || data.length === 0) {
            result.errors.push('Dados estão vazios ou não são um array');
            return result;
        }

        const headers = Object.keys(data[0]);
        const required = this.fieldMappings.required;

        // Verificar campos obrigatórios
        result.missingFields = required.filter(field => !headers.includes(field));
        
        // Verificar campos extras
        result.extraFields = headers.filter(field => !required.includes(field));
        
        // Verificar aliases
        Object.entries(this.fieldMappings.aliases).forEach(([alias, original]) => {
            if (headers.includes(alias) && !headers.includes(original)) {
                result.aliasedFields.push({ alias, original });
            }
        });

        // Validar se há pelo menos campos essenciais
        const essential = ['ID Oferta', 'Nome Disciplina', 'Sigla Campus', 'Período'];
        const hasEssential = essential.every(field => headers.includes(field));

        if (!hasEssential) {
            result.errors.push('Faltam campos essenciais: ' + essential.filter(f => !headers.includes(f)).join(', '));
        }

        // Validar dados das primeiras linhas
        const sampleSize = Math.min(5, data.length);
        for (let i = 0; i < sampleSize; i++) {
            const row = data[i];
            
            // Verificar se ID Oferta existe
            if (!row['ID Oferta']) {
                result.warnings.push(`Linha ${i + 1}: ID Oferta está vazio`);
            }
            
            // Verificar se valores numéricos são válidos
            const numericFields = ['Vagas', 'Matriculados', 'Total Matriculados'];
            numericFields.forEach(field => {
                if (row[field] && isNaN(parseInt(row[field]))) {
                    result.warnings.push(`Linha ${i + 1}: ${field} não é numérico`);
                }
            });
        }

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * Processa dados de ofertas adicionando campos calculados
     * @param {Array} rawData - Dados brutos
     * @returns {Array} Dados processados
     */
    processData(rawData) {
        if (!Array.isArray(rawData) || rawData.length === 0) {
            return rawData;
        }

        // Reconciliar aliases (compatibilidade Total ↔ Total Matriculados)
        const processed = rawData.map(row => {
            const processedRow = { ...row };
            
            // Aplicar aliases
            Object.entries(this.fieldMappings.aliases).forEach(([alias, original]) => {
                if (processedRow[alias] && !processedRow[original]) {
                    processedRow[original] = processedRow[alias];
                } else if (processedRow[original] && !processedRow[alias]) {
                    processedRow[alias] = processedRow[original];
                }
            });

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
        // Ocupação %
        const vagas = parseInt(row['Vagas']) || 0;
        const matriculados = parseInt(row['Total Matriculados'] || row['Total']) || 0;
        
        if (vagas > 0) {
            row['Ocupação %'] = Math.round((matriculados / vagas) * 100);
        } else {
            row['Ocupação %'] = 0;
        }

        // Status Vagas
        const vagasRestantes = parseInt(row['Vagas Restantes']) || 0;
        if (vagasRestantes === 0) {
            row['Status Vagas'] = 'Lotada';
        } else if (vagasRestantes <= 5) {
            row['Status Vagas'] = 'Poucas Vagas';
        } else {
            row['Status Vagas'] = 'Disponível';
        }

        // Período Formatado
        const periodo = row['Período'] || '';
        row['Período Formatado'] = this.formatPeriodo(periodo);

        // Campus Completo
        const siglaCampus = row['Sigla Campus'] || '';
        const nomeCampus = row['Nome Campus'] || '';
        row['Campus Completo'] = siglaCampus && nomeCampus 
            ? `${siglaCampus} - ${nomeCampus}` 
            : siglaCampus || nomeCampus;
    }

    /**
     * Formata período para exibição
     * @param {string} periodo - Período bruto
     * @returns {string} Período formatado
     */
    formatPeriodo(periodo) {
        if (!periodo) return '';
        
        // Remover caracteres especiais e normalizar
        const clean = periodo.toString().trim();
        
        // Detectar padrões comuns
        if (clean.match(/^\d{4}\.\d$/)) {
            // Formato: 2024.1
            const [ano, semestre] = clean.split('.');
            return `${semestre}º Semestre ${ano}`;
        } else if (clean.match(/^\d{4}-\d$/)) {
            // Formato: 2024-1
            const [ano, semestre] = clean.split('-');
            return `${semestre}º Semestre ${ano}`;
        } else if (clean.match(/^\d{4}\/\d$/)) {
            // Formato: 2024/1
            const [ano, semestre] = clean.split('/');
            return `${semestre}º Semestre ${ano}`;
        }
        
        return clean; // Retornar como está se não reconhecer o padrão
    }

    /**
     * Filtra ofertas por critérios específicos
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
            
            // Filtro por período
            if (criteria.periodo && !this.matchesPeriodo(row, criteria.periodo)) {
                return false;
            }
            
            // Filtro por status de vagas
            if (criteria.statusVagas && row['Status Vagas'] !== criteria.statusVagas) {
                return false;
            }
            
            // Filtro por ocupação mínima
            if (criteria.ocupacaoMin && (row['Ocupação %'] || 0) < criteria.ocupacaoMin) {
                return false;
            }
            
            // Filtro por ocupação máxima
            if (criteria.ocupacaoMax && (row['Ocupação %'] || 0) > criteria.ocupacaoMax) {
                return false;
            }
            
            // Filtro por curso
            if (criteria.curso && !this.matchesCurso(row, criteria.curso)) {
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
        const nomeCampus = (row['Nome Campus'] || '').toLowerCase();
        const searchTerm = campus.toLowerCase();
        
        return siglaCampus.includes(searchTerm) || nomeCampus.includes(searchTerm);
    }

    /**
     * Verifica se linha corresponde ao período
     * @param {Object} row - Linha de dados
     * @param {string} periodo - Período para verificar
     * @returns {boolean} True se corresponde
     */
    matchesPeriodo(row, periodo) {
        const periodoRow = (row['Período'] || '').toLowerCase();
        const periodoFormatado = (row['Período Formatado'] || '').toLowerCase();
        const searchTerm = periodo.toLowerCase();
        
        return periodoRow.includes(searchTerm) || periodoFormatado.includes(searchTerm);
    }

    /**
     * Verifica se linha corresponde ao curso
     * @param {Object} row - Linha de dados
     * @param {string} curso - Curso para verificar
     * @returns {boolean} True se corresponde
     */
    matchesCurso(row, curso) {
        const cursoRow = (row['Curso'] || '').toLowerCase();
        const searchTerm = curso.toLowerCase();
        
        return cursoRow.includes(searchTerm);
    }

    /**
     * Obtém estatísticas das ofertas
     * @param {Array} data - Dados para analisar
     * @returns {Object} Estatísticas
     */
    getStatistics(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return {
                total: 0,
                campus: {},
                periodos: {},
                statusVagas: {},
                ocupacaoMedia: 0,
                vagasTotais: 0,
                matriculadosTotais: 0
            };
        }

        const stats = {
            total: data.length,
            campus: {},
            periodos: {},
            statusVagas: {},
            ocupacaoMedia: 0,
            vagasTotais: 0,
            matriculadosTotais: 0,
            disciplinasUnicas: new Set(),
            professoresUnicos: new Set()
        };

        let somaOcupacao = 0;
        let countOcupacao = 0;

        data.forEach(row => {
            // Campus
            const campus = row['Sigla Campus'] || 'Não informado';
            stats.campus[campus] = (stats.campus[campus] || 0) + 1;
            
            // Períodos
            const periodo = row['Período'] || 'Não informado';
            stats.periodos[periodo] = (stats.periodos[periodo] || 0) + 1;
            
            // Status de vagas
            const status = row['Status Vagas'] || 'Não calculado';
            stats.statusVagas[status] = (stats.statusVagas[status] || 0) + 1;
            
            // Vagas e matriculados
            const vagas = parseInt(row['Vagas']) || 0;
            const matriculados = parseInt(row['Total Matriculados'] || row['Total']) || 0;
            
            stats.vagasTotais += vagas;
            stats.matriculadosTotais += matriculados;
            
            // Ocupação média
            const ocupacao = row['Ocupação %'];
            if (ocupacao !== undefined && ocupacao !== null) {
                somaOcupacao += ocupacao;
                countOcupacao++;
            }
            
            // Disciplinas únicas
            const disciplina = row['Nome Disciplina'];
            if (disciplina) {
                stats.disciplinasUnicas.add(disciplina);
            }
            
            // Professores únicos
            const professor = row['Nome Professor'];
            if (professor) {
                stats.professoresUnicos.add(professor);
            }
        });

        // Calcular ocupação média
        stats.ocupacaoMedia = countOcupacao > 0 ? Math.round(somaOcupacao / countOcupacao) : 0;
        
        // Converter Sets para números
        stats.disciplinasUnicas = stats.disciplinasUnicas.size;
        stats.professoresUnicos = stats.professoresUnicos.size;

        return stats;
    }

    /**
     * Exporta dados de ofertas para CSV
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
     * Agrupa ofertas por critério
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
     * Busca ofertas por texto
     * @param {Array} data - Dados para buscar
     * @param {string} searchTerm - Termo de busca
     * @param {Array} searchFields - Campos para buscar (opcional)
     * @returns {Array} Resultados da busca
     */
    search(data, searchTerm, searchFields = null) {
        if (!Array.isArray(data) || !searchTerm) return data;
        
        const fields = searchFields || [
            'Nome Disciplina', 'Nome Professor', 'Curso', 
            'Sigla Campus', 'Nome Campus', 'Sala', 'Descrição'
        ];
        
        const term = searchTerm.toLowerCase();
        
        return data.filter(row => {
            return fields.some(field => {
                const value = row[field] || '';
                return value.toString().toLowerCase().includes(term);
            });
        });
    }
}

// Para compatibilidade com código existente
if (typeof window !== 'undefined') {
    window.OfertasService = OfertasService;
}
