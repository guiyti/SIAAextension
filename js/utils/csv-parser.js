/**
 * @fileoverview Módulo para parsing de arquivos CSV
 * @description Utilitários para converter CSV em objetos JavaScript
 * @version 1.0.0
 */

/**
 * Parser para arquivos CSV com suporte a aspas e caracteres especiais
 * @namespace CSVParser
 */
export const CSVParser = {
    /**
     * Converte conteúdo CSV em array de objetos
     * @param {string} csvContent - Conteúdo do arquivo CSV
     * @param {Object} options - Opções de parsing
     * @param {string} options.delimiter - Delimitador de campo (default: ',')
     * @param {string} options.lineBreak - Quebra de linha (default: '\n')
     * @param {boolean} options.hasHeader - Se tem cabeçalho (default: true)
     * @param {boolean} options.trimValues - Se deve fazer trim dos valores (default: true)
     * @returns {Array<Object>} Array de objetos representando as linhas
     */
    parse(csvContent, options = {}) {
        const {
            delimiter = ',',
            lineBreak = '\n',
            hasHeader = true,
            trimValues = true
        } = options;

        if (!csvContent || typeof csvContent !== 'string') {
            console.warn('CSV content is empty or invalid');
            return [];
        }

        const lines = csvContent.split(lineBreak);
        if (lines.length < (hasHeader ? 2 : 1)) {
            console.warn('CSV has insufficient lines');
            return [];
        }

        let headers;
        let dataStartIndex;

        if (hasHeader) {
            headers = this.parseLine(lines[0], delimiter).map(h => 
                trimValues ? h.replace(/"/g, '').trim() : h.replace(/"/g, '')
            );
            dataStartIndex = 1;
        } else {
            // Gerar headers genéricos se não houver cabeçalho
            const firstLineValues = this.parseLine(lines[0], delimiter);
            headers = firstLineValues.map((_, index) => `Column${index + 1}`);
            dataStartIndex = 0;
        }

        const data = [];

        for (let i = dataStartIndex; i < lines.length; i++) {
            const line = trimValues ? lines[i].trim() : lines[i];
            if (!line) continue;

            const values = this.parseLine(line, delimiter);

            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    const value = values[index] || '';
                    row[header] = trimValues ? value.trim() : value;
                });
                data.push(row);
            } else {
                console.warn(`Line ${i + 1} has ${values.length} values but expected ${headers.length}`);
            }
        }

        return data;
    },

    /**
     * Faz parsing de uma única linha CSV considerando aspas
     * @param {string} line - Linha do CSV
     * @param {string} delimiter - Delimitador (default: ',')
     * @returns {Array<string>} Array de valores da linha
     */
    parseLine(line, delimiter = ',') {
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Aspas escapadas ("")
                    currentValue += '"';
                    i += 2;
                } else {
                    // Início ou fim de aspas
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === delimiter && !inQuotes) {
                // Delimitador fora de aspas
                values.push(currentValue);
                currentValue = '';
                i++;
            } else {
                // Caractere normal
                currentValue += char;
                i++;
            }
        }

        // Adicionar último valor
        values.push(currentValue);

        return values;
    },

    /**
     * Converte array de objetos em CSV
     * @param {Array<Object>} data - Array de objetos
     * @param {Object} options - Opções de conversão
     * @param {string} options.delimiter - Delimitador (default: ',')
     * @param {string} options.lineBreak - Quebra de linha (default: '\n')
     * @param {boolean} options.includeHeader - Incluir cabeçalho (default: true)
     * @param {Array<string>} options.columns - Colunas específicas para incluir
     * @returns {string} Conteúdo CSV
     */
    stringify(data, options = {}) {
        const {
            delimiter = ',',
            lineBreak = '\n',
            includeHeader = true,
            columns = null
        } = options;

        if (!Array.isArray(data) || data.length === 0) {
            return '';
        }

        // Determinar colunas
        const headers = columns || Object.keys(data[0]);
        
        const lines = [];

        // Adicionar cabeçalho se solicitado
        if (includeHeader) {
            const headerLine = headers
                .map(header => this.escapeValue(header, delimiter))
                .join(delimiter);
            lines.push(headerLine);
        }

        // Adicionar dados
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] || '';
                return this.escapeValue(String(value), delimiter);
            });
            lines.push(values.join(delimiter));
        });

        return lines.join(lineBreak);
    },

    /**
     * Escapa um valor para CSV (adiciona aspas se necessário)
     * @param {string} value - Valor para escapar
     * @param {string} delimiter - Delimitador usado
     * @returns {string} Valor escapado
     */
    escapeValue(value, delimiter = ',') {
        if (typeof value !== 'string') {
            value = String(value);
        }

        // Verificar se precisa de aspas
        const needsQuotes = value.includes(delimiter) || 
                           value.includes('"') || 
                           value.includes('\n') || 
                           value.includes('\r');

        if (needsQuotes) {
            // Escapar aspas internas duplicando-as
            const escapedValue = value.replace(/"/g, '""');
            return `"${escapedValue}"`;
        }

        return value;
    },

    /**
     * Valida se o conteúdo é um CSV válido
     * @param {string} csvContent - Conteúdo para validar
     * @param {Object} options - Opções de validação
     * @returns {Object} Resultado da validação
     */
    validate(csvContent, options = {}) {
        const result = {
            isValid: false,
            errors: [],
            warnings: [],
            lineCount: 0,
            columnCount: 0,
            preview: null
        };

        try {
            if (!csvContent || typeof csvContent !== 'string') {
                result.errors.push('Conteúdo CSV vazio ou inválido');
                return result;
            }

            const lines = csvContent.split('\n').filter(line => line.trim());
            result.lineCount = lines.length;

            if (lines.length === 0) {
                result.errors.push('CSV não contém linhas válidas');
                return result;
            }

            // Validar primeira linha (cabeçalho)
            const firstLineValues = this.parseLine(lines[0]);
            result.columnCount = firstLineValues.length;

            if (result.columnCount === 0) {
                result.errors.push('Cabeçalho não contém colunas');
                return result;
            }

            // Validar consistência de colunas nas primeiras linhas
            const sampleSize = Math.min(5, lines.length);
            for (let i = 1; i < sampleSize; i++) {
                const lineValues = this.parseLine(lines[i]);
                if (lineValues.length !== result.columnCount) {
                    result.warnings.push(
                        `Linha ${i + 1} tem ${lineValues.length} colunas, esperado ${result.columnCount}`
                    );
                }
            }

            // Gerar preview
            try {
                const preview = this.parse(csvContent);
                result.preview = preview.slice(0, 3); // Primeiras 3 linhas
            } catch (parseError) {
                result.warnings.push('Erro ao gerar preview: ' + parseError.message);
            }

            result.isValid = result.errors.length === 0;

        } catch (error) {
            result.errors.push('Erro durante validação: ' + error.message);
        }

        return result;
    }
};

/**
 * Função de compatibilidade com código existente
 * @param {string} csvContent - Conteúdo CSV
 * @returns {Array<Object>} Array de objetos
 */
export function parseCSV(csvContent) {
    return CSVParser.parse(csvContent);
}

/**
 * Função de compatibilidade com código existente
 * @param {string} line - Linha CSV
 * @returns {Array<string>} Array de valores
 */
export function parseCSVLine(line) {
    return CSVParser.parseLine(line);
}

// Para compatibilidade com código existente
if (typeof window !== 'undefined') {
    window.CSVParser = CSVParser;
    window.parseCSV = parseCSV;
    window.parseCSVLine = parseCSVLine;
}
