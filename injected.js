// Variável global para armazenar mapeamento de código -> nome do curso
window.__SIAA_CURSO_MAPPING = new Map();

class CourseMapper {
    constructor() {
        this.version = 'V13-CourseMapper';
        this.mapping = window.__SIAA_CURSO_MAPPING;
    }

    async extractAndStoreCursoNames(idOfert, periodo) {
        return this._extractAndStoreCursoNamesOriginal(idOfert, periodo);
    }

    async _extractAndStoreCursoNamesOriginal(idOfert, periodo) {
        if (!idOfert || !periodo) return;
        
        try {
            const urlCurso = `https://siaa.cruzeirodosul.edu.br/siaa_academico/secure/academico/wacdcon12/grid_curso_ofe.xml.jsp?id_ofert=${idOfert}&ano_leti=${periodo.ano_leti}&sem_leti=${periodo.sem_leti}`;
            const xml = await fetchXML(urlCurso);
            const rows = xml.querySelectorAll('row');
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('cell');
                if (cells.length >= 2) {
                    const cursoText = cells[1].textContent.trim();
                    // Formato: "68 - CST EM ANÁLISE E DESENVOLVIMENTO DE SISTEMAS"
                    const match = cursoText.match(/^(\d+)\s*-\s*(.+)$/);
                    if (match) {
                        const codigo = match[1].trim();
                        const nome = match[2].trim();
                        this.mapping.set(codigo, nome);
                    }
                }
            });
        } catch (error) {
            console.warn(`⚠️ V13 - Erro ao extrair nomes de cursos da oferta ${idOfert}:`, error);
        }
    }

    getCursoNomeFromMapping(codigoCurso) {
        return this._getCursoNomeFromMappingOriginal(codigoCurso);
    }

    _getCursoNomeFromMappingOriginal(codigoCurso) {
        if (!codigoCurso) return '';
        return this.mapping.get(codigoCurso.toString()) || '';
    }

    debugCursoMapping() {
        this._debugCursoMappingOriginal();
    }

    _debugCursoMappingOriginal() {
        if (this.mapping.size === 0) {
            console.log('  📭 Nenhum curso mapeado ainda');
        } else {
            this.mapping.forEach((nome, codigo) => {
                console.log(`  📚 ${codigo} -> ${nome}`);
            });
        }
    }

    getStats() {
        return {
            version: this.version,
            totalCursos: this.mapping.size,
            cursos: Array.from(this.mapping.entries()).slice(0, 5) // primeiros 5 para debug
        };
    }
}

// Instância global do CourseMapper V13
const courseMapperV13 = new CourseMapper();

//14 OverlayManager Class =====
class OverlayManager {
    constructor() {
        this.version = 'V14-OverlayManager';
    }

    // V14: Criar overlay de seleção de curso
    createCourseSelectionOverlay(cursos) {
        return this._createCourseSelectionOverlayOriginal(cursos);
    }

    _createCourseSelectionOverlayOriginal(cursos) {
        const overlay = document.createElement('div');
        overlay.id = 'siaa-course-selection-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: Arial, sans-serif;
        `;
        
        const selectionBox = document.createElement('div');
        selectionBox.style.cssText = `
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            text-align: center;
            min-width: 500px;
            max-width: 700px;
            max-height: 80vh;
            overflow-y: auto;
            border: 2px solid #ebb55e;
        `;
        
        let cursosOptions = '';
        cursos.forEach(curso => {
            const selected = curso.selected ? 'selected' : '';
            cursosOptions += `<option value="${curso.codigo}" ${selected}>${curso.nome}</option>`;
        });
        
        selectionBox.innerHTML = `
            <div style="margin-bottom: 30px;">
                <h2 style="color: #333; margin: 0 0 15px 0;">📚 Seleção de Curso - SIAA</h2>
                <p style="color: #666; margin: 0; font-size: 16px;">
                    Escolha o curso para extrair os dados das ofertas de disciplinas
                </p>
            </div>
            
            <div style="margin-bottom: 30px; text-align: left;">
                <label for="curso-select" style="display: block; margin-bottom: 10px; color: #333; font-weight: bold;">
                    Curso:
                </label>
                <select id="curso-select" style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    font-size: 14px;
                    background: white;
                    color: #333;
                    outline: none;
                    transition: border-color 0.3s;
                " onchange="this.style.borderColor='#3498db'">
                    ${cursosOptions}
                </select>
            </div>
            
            <div style="background: #e8f4f8; border-radius: 8px; padding: 15px; margin-bottom: 25px; text-align: left;">
                <div style="color: #2c3e50; font-size: 14px; margin-bottom: 8px;">
                    <strong>ℹ️ Informações:</strong>
                </div>
                <ul style="color: #666; font-size: 13px; margin: 0; padding-left: 20px;">
                    <li>Os dados extraídos incluem disciplinas, professores e vagas</li>
                    <li>A extração é feita em lotes para otimizar a performance</li>
                    <li>Os dados serão salvos para download posterior</li>
                    <li>Período: Dinâmico (obtido automaticamente do SIAA)</li>
                </ul>
            </div>
            
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="start-extraction-button" style="
                    background: linear-gradient(to bottom, #ebb55e 0%, #FFF 100%);
                    color: #2c3e50;
                    border: 1px solid #ebb55e;
                    padding: 15px 30px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    transition: all 0.3s;
                    flex: 1;
                    max-width: 200px;
                " onmouseover="this.style.background='#ebb55e'; this.style.color='white'" onmouseout="this.style.background='linear-gradient(to bottom, #ebb55e 0%, #FFF 100%)'; this.style.color='#2c3e50'">
                    🚀 Iniciar Captura
                </button>
                <button id="cancel-selection-button" style="
                    background: #95a5a6;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    transition: background-color 0.3s;
                    flex: 1;
                    max-width: 200px;
                " onmouseover="this.style.background='#7f8c8d'" onmouseout="this.style.background='#95a5a6'">
                    ❌ Cancelar
                </button>
            </div>
        `;
        
        overlay.appendChild(selectionBox);
        document.body.appendChild(overlay);
        
        return new Promise((resolve, reject) => {
            // Evento do botão iniciar
            document.getElementById('start-extraction-button').addEventListener('click', () => {
                const select = document.getElementById('curso-select');
                const selectedCourse = {
                    codigo: select.value,
                    nome: select.options[select.selectedIndex].text
                };
                
                document.body.removeChild(overlay);
                resolve(selectedCourse);
            });
            
            // Evento do botão cancelar
            document.getElementById('cancel-selection-button').addEventListener('click', () => {
                document.body.removeChild(overlay);
                reject(new Error('Seleção cancelada pelo usuário'));
            });
        });
    }

    // V14: Estatísticas para debug
    getStats() {
        return {
            version: this.version,
            overlaySupported: typeof document !== 'undefined',
            activeOverlays: document?.querySelectorAll('#siaa-course-selection-overlay')?.length || 0
        };
    }
}

// Instância global do OverlayManager V14
const overlayManagerV14 = new OverlayManager();

//15 SIAAConnector Class =====
class SIAAConnector {
    constructor() {
        this.version = 'V15-SIAAConnector';
        this.defaultTimeout = 15000;
    }

    // V15: Buscar XML do SIAA
    async fetchXML(url, timeout = this.defaultTimeout) {
        return this._fetchXMLOriginal(url, timeout);
    }

    async _fetchXMLOriginal(url, timeout = 15000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, { 
                signal: controller.signal,
                headers: {
                    'Accept': 'text/xml, application/xml, */*',
                    'Accept-Charset': 'ISO-8859-1',
                    'User-Agent': 'Mozilla/5.0 (compatible; DataExtractor/1.0)'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Usar ISO-8859-1 para decodificar corretamente
            const arrayBuffer = await response.arrayBuffer();
            const decoder = new TextDecoder('iso-8859-1');
            const xmlText = decoder.decode(arrayBuffer);
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            return xmlDoc;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`Timeout de ${timeout}ms excedido para ${url}`);
            }
            console.error('❌ V15 - Erro ao buscar XML:', error);
            throw error;
        }
    }

    // V15: Obter período acadêmico atual
    async getCurrentAcademicPeriod() {
        return this._getCurrentAcademicPeriodOriginal();
    }

    async _getCurrentAcademicPeriodOriginal() {
        try {
            const url = 'https://siaa.cruzeirodosul.edu.br/siaa_academico/secure/academico/wacdcon12/comboPeriodo.xml.jsp';
            const xmlDoc = await this.fetchXML(url);
            
            // Buscar opção selecionada
            const selectedOption = xmlDoc.querySelector('option[selected="true"]') || 
                                 xmlDoc.querySelector('option[selected="selected"]') ||
                                 xmlDoc.querySelector('option');
            
            if (!selectedOption) {
                throw new Error('Nenhuma opção de período encontrada');
            }
            
            const periodoCompleto = selectedOption.getAttribute('value');
            const [ano_leti, sem_leti] = periodoCompleto.split('/');
            
            
            // Forçar período para teste
            const periodo = {
                ano_leti: "2025",
                sem_leti: "1",
                periodoCompleto: "2025/1"
            };
            
            return periodo;
        } catch (error) {
            console.error('❌ V15 - Erro ao obter período acadêmico:', error);
            // Fallback para valores que funcionem como padrão
            return {
                ano_leti: '2025',
                sem_leti: '2',
                periodoCompleto: '2025/2',
                fallback: true
            };
        }
    }

    // V15: Estatísticas para debug
    getStats() {
        return {
            version: this.version,
            defaultTimeout: this.defaultTimeout,
            fetchSupported: typeof fetch !== 'undefined',
            domParserSupported: typeof DOMParser !== 'undefined'
        };
    }
}

// Instância global do SIAAConnector V15
const siaaConnectorV15 = new SIAAConnector();

//16 ExtractionEngine Class =====
class ExtractionEngine {
    constructor() {
        this.version = 'V16-ExtractionEngine';
    }

    // V16: Função principal de extração
    async exportarTabelaSIAA(cursoSelecionado = null) {
        // Por enquanto, chamar a implementação original
        return await exportarTabelaSIAAOriginalLegacy(cursoSelecionado);
    }

    // V16: Função completa de extração (wrapper)
    async exportarTabelaSIAAOriginal(cursoSelecionado = null) {
        // Por enquanto, chamar a implementação original
        return await exportarTabelaSIAAOriginalLegacy(cursoSelecionado);
    }

    // V16: Estatísticas para debug
    getStats() {
        return {
            version: this.version,
            chromeRuntimeAvailable: typeof chrome?.runtime?.sendMessage === 'function'
        };
    }
}

// Instância global do ExtractionEngine V16
const extractionEngineV16 = new ExtractionEngine();

// Função para buscar cursos disponíveis - REMOVIDA (usar XMLProcessor)

async function extractAndStoreCursoNames(idOfert, periodo) {
    return courseMapperV13.extractAndStoreCursoNames(idOfert, periodo);
}

function getCursoNomeFromMapping(codigoCurso) {
    return courseMapperV13.getCursoNomeFromMapping(codigoCurso);
}

function debugCursoMapping() {
    return courseMapperV13.debugCursoMapping();
}

// Salvar mapeamento de cursos no storage
async function saveCursoMapping() {
    try {
        const mappingObj = {};
        window.__SIAA_CURSO_MAPPING.forEach((nome, codigo) => {
            mappingObj[codigo] = nome;
        });
        
        await chrome.storage.local.set({ siaa_curso_mapping: mappingObj });
        console.log('💾 Mapeamento de cursos salvo no storage:', Object.keys(mappingObj).length, 'cursos');
    } catch (error) {
        console.error('❌ Erro ao salvar mapeamento de cursos:', error);
    }
}

// Carregar mapeamento de cursos do storage
async function loadCursoMapping() {
    try {
        const storage = await chrome.storage.local.get(['siaa_curso_mapping']);
        const mappingObj = storage.siaa_curso_mapping || {};
        
        // Limpar mapeamento atual
        window.__SIAA_CURSO_MAPPING.clear();
        
        // Carregar do storage
        Object.entries(mappingObj).forEach(([codigo, nome]) => {
            window.__SIAA_CURSO_MAPPING.set(codigo, nome);
        });
        
        console.log('🔄 Mapeamento de cursos carregado do storage:', Object.keys(mappingObj).length, 'cursos');
        return Object.keys(mappingObj).length;
    } catch (error) {
        console.error('❌ Erro ao carregar mapeamento de cursos:', error);
        return 0;
    }
}

// Função para criar interface de seleção de curso
// V14: Redirecionamento para OverlayManager
function createCourseSelectionOverlay(cursos) {
    return overlayManagerV14.createCourseSelectionOverlay(cursos);
}

async function exportarTabelaSIAA(cursoSelecionado = null) {
    return extractionEngineV16.exportarTabelaSIAA(cursoSelecionado);
}

async function exportarTabelaSIAAOriginal(cursoSelecionado = null) {
    return extractionEngineV16.exportarTabelaSIAAOriginal(cursoSelecionado);
}

// Sistema original mantido como fallback interno
async function exportarTabelaSIAAOriginalLegacy(cursoSelecionado = null) {
    // Funções auxiliares visíveis para todo o escopo (incluindo catch)
    function updateStatus(message, progress = null) {
        const payload = { action: 'extractionProgress', message };
        if (progress !== null) payload.progress = progress;
        chrome.runtime?.sendMessage(payload);
    }
    function updateBatchInfo(current, total) {
        updateStatus(`📦 Lote ${current}/${total}`);
    }
    function updateProgress(processed, total, startTime) {
        if (!startTime || total === 0) return;
        const percent = Math.min(100, Math.floor((processed / total) * 100));
        updateStatus(`⌛ ${percent}%`, percent);
    }

    let isCanceled = false;
    let loadingOverlay = null;
    
    try {
        console.log('📥 exportarTabelaSIAA iniciado. Param cursoSelecionado:', cursoSelecionado, 'Global:', window.__SIAA_SELECTED_COURSE);

        // A seleção de curso agora é feita no popup da extensão.
        if (!cursoSelecionado) {
            // Tentar recuperar do global definido pelo background
            cursoSelecionado = window.__SIAA_SELECTED_COURSE || null;
        }
        if (!cursoSelecionado) {
            throw new Error('Curso não informado pelo popup');
        }
        
        // Armazenar nome do curso selecionado no mapeamento global
        if (cursoSelecionado.codigo && cursoSelecionado.nome) {
            window.__SIAA_CURSO_MAPPING.set(cursoSelecionado.codigo, cursoSelecionado.nome);
            console.log(`📚 Curso selecionado mapeado: ${cursoSelecionado.codigo} -> ${cursoSelecionado.nome}`);
            
            // Salvar mapeamento atualizado no storage
            saveCursoMapping().catch(err => console.warn('⚠️ Erro ao salvar mapeamento:', err));
        }
        
        // Configurações
        const BATCH_SIZE = 10;
        const DELAY_BETWEEN_BATCHES = 800;
        
        // Informar início ao popup
        chrome.runtime?.sendMessage({
            action: 'extractionProgress',
            message: `🚀 Iniciando extração para ${cursoSelecionado.nome}`
        });

        // Funções de overlay removidas - não utilizadas
        
        updateStatus('Buscando dados das disciplinas...');
        
        // URLs base com período dinâmico
        const periodo = await getCurrentAcademicPeriod();
        const baseUrl = `https://siaa.cruzeirodosul.edu.br/siaa_academico/secure/academico/wacdcon12/grid_oferta.xml.jsp?ano_leti=${periodo.ano_leti}&sem_leti=${periodo.sem_leti}&cod_curs=${cursoSelecionado.codigo}`;
        
        // Usar função fetchXML global (movida para fora do escopo)
        
        // Buscar dados principais
        console.log('🌐 Fazendo requisição para:', baseUrl);
        const xmlDoc = await fetchXML(baseUrl);
        
        // Verificar se há erro no XML
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            throw new Error('Erro ao processar XML: ' + parseError.textContent);
        }
        
        // Buscar linhas de dados
        const rows = Array.from(xmlDoc.querySelectorAll('row'));
        const totalRecords = rows.length;
        
        if (totalRecords === 0) {
            throw new Error('Nenhuma disciplina encontrada para este curso');
        }
        
        console.log(`📊 ${totalRecords} disciplinas encontradas para processamento`);
        
        updateStatus(`${totalRecords} disciplinas encontradas. Iniciando processamento...`);
        
        // Função para buscar professor (genérica)
        async function getProfessorData(idOfert) {
            if (!idOfert) return { codigo: '', nome: '' };
            try {
                const urlProf = `https://siaa.cruzeirodosul.edu.br/siaa_academico/secure/academico/wacdcon12/grid_teacher_ofe.xml.jsp?id_ofert=${idOfert}&ano_leti=${periodo.ano_leti}&sem_leti=${periodo.sem_leti}`;
                const xml = await fetchXML(urlProf);
                const row = xml.querySelector('row');
                if (!row) return { codigo: '', nome: '' };
                const cells = row.querySelectorAll('cell');
                if (cells.length < 2) return { codigo: '', nome: '' };
                const txt = cells[1].textContent.trim();
                const [codigo, ...nomeParts] = txt.split(' - ');
                return { codigo: codigo || '', nome: nomeParts.join(' - ').trim() };
            } catch (e) {
                return { codigo: '', nome: '' };
            }
        }
        
        // Função para buscar cursos associados à oferta
        async function getCursoData(idOfert) {
            if (!idOfert) return '';
            try {
                const urlCurso = `https://siaa.cruzeirodosul.edu.br/siaa_academico/secure/academico/wacdcon12/grid_curso_ofe.xml.jsp?id_ofert=${idOfert}&ano_leti=${periodo.ano_leti}&sem_leti=${periodo.sem_leti}`;
                const xml = await fetchXML(urlCurso);
                const rows = xml.querySelectorAll('row');
                if (!rows || rows.length === 0) return '';
                const cursos = [];
                rows.forEach(r => {
                    const cells = r.querySelectorAll('cell');
                    if (cells.length >= 2) {
                        const txt = cells[1].textContent.trim();
                        if (txt) {
                            cursos.push(`(${txt})`);
                            
                            // Também armazenar no mapeamento global
                            const match = txt.match(/^(\d+)\s*-\s*(.+)$/);
                            if (match) {
                                const codigo = match[1].trim();
                                const nome = match[2].trim();
                                window.__SIAA_CURSO_MAPPING.set(codigo, nome);
                                
                                // Salvar mapeamento atualizado no storage (async sem await para não bloquear)
                                saveCursoMapping().catch(err => console.warn('⚠️ Erro ao salvar mapeamento:', err));
                            }
                        }
                    }
                });
                return cursos.join(' - ');
            } catch (e) {
                return '';
            }
        }
        
        // Função para processar cada registro
        async function processRecord(row, index) {
            if (isCanceled) throw new Error('Operação cancelada');
            
            try {

                
                // Extrair dados das células em posições específicas
                const cells = row.querySelectorAll('cell');
                
                if (cells.length === 0) {
                    console.warn(`⚠️ Nenhuma célula encontrada no registro ${index}`);
                    return { index, error: 'Nenhuma célula encontrada' };
                }
                
                // Mapear posições baseado na estrutura XML observada
                const codigoDisciplinaCompleto = cells[0]?.textContent.trim() || '';
                const nomeCampus = cells[1]?.textContent.trim() || '';
                const sala = cells[2]?.textContent.trim() || '';
                const periodo = cells[3]?.textContent.trim() || '';
                const cargaHoraria = cells[4]?.textContent.trim() || '';
                const vagas = cells[5]?.textContent.trim() || '';
                const matriculados = cells[6]?.textContent.trim() || '';
                const preMatriculados = cells[7]?.textContent.trim() || '';
                const total = cells[8]?.textContent.trim() || '';
                const vagasRestantes = cells[9]?.textContent.trim() || '';
            const descricaoCompleta = cells[10]?.textContent.trim() || '';
                const idOfertaReal = cells[13]?.textContent.trim() || '';
                
                // Extrair código e nome da disciplina
                const disciplinaParts = codigoDisciplinaCompleto.split('-');
                const codigoDisciplina = disciplinaParts[0] || '';
                const nomeDisciplina = disciplinaParts.slice(1).join('-') || '';
                
                // Extrair horários do atributo title da célula 3
                const horarioTitle = cells[3]?.getAttribute('title') || '';
                // Processar horário para melhor legibilidade
                // Exemplo: "Segunda das 19:10 às 20:25.Segunda das 20:35 às 21:50." 
                // -> "Segunda 19:10-20:25 | Segunda 20:35-21:50"
                let hora = '';
                if (horarioTitle) {
                    hora = horarioTitle
                        .replace(/\.$/, '') // Remove ponto final
                        .split('.') // Divide por pontos
                        .map(periodo => periodo.trim()) // Remove espaços
                        .filter(periodo => periodo) // Remove vazios
                        .map(periodo => {
                            // Simplificar formato: "Segunda das 19:10 às 20:25" -> "Segunda 19:10-20:25"
                            return periodo
                                .replace(/\s+das\s+/g, ' ')
                                .replace(/\s+às\s+/g, '-');
                        })
                        .join(' | '); // Junta com separador
                }
                
                // Extrair ID da oferta da descrição (posição 13 é mais confiável)
                const idOferta = idOfertaReal || row.getAttribute('id') || '';
                
                // Mapear campus para sigla baseado nos dados reais do CSV
                const getCampusInfo = (nomeCampus) => {
                    const mapping = {
                        'SÃO MIGUEL': { sigla: 'SM', codigo: '1' },
                        'ANÁLIA FRANCO': { sigla: 'AF', codigo: '5' },
                        'LIBERDADE': { sigla: 'LIB', codigo: '6' },
                        'VILLA LOBOS': { sigla: 'VL', codigo: '40' },
                        'GUARULHOS': { sigla: 'GRU', codigo: '58' },
                        'PAULISTA': { sigla: 'PTA', codigo: '59' },
                        'SANTO AMARO': { sigla: 'SA', codigo: '72' },
                        'EAD': { sigla: 'EAD', codigo: '09' }
                    };
                    return mapping[nomeCampus.toUpperCase()] || { sigla: '', codigo: '' };
                };
                
                const campusInfo = getCampusInfo(nomeCampus);
                
                // Processar descrição para extrair campos adicionais
                const parseDescriptionField = (desc) => {
                    if (!desc) return { descricaoLimpa: '', codigoHorario: '', idOfertaDesc: '' };
                    
                    // Remover tags HTML se existirem
                    let cleanDesc = desc.replace(/<[^>]*>/g, '');
                    
                    // Extrair ID Oferta (número entre parênteses)
                    const idOfertaMatch = cleanDesc.match(/\((\d+)\)/);
                    const idOfertaDesc = idOfertaMatch ? idOfertaMatch[1] : '';
                    
                    // Procurar por padrões comuns de código horário
                    let codigoHorario = '';
                    const patterns = [
                        /_(\d+\.\d+)/,           // _2.1910
                        /(\d+\.\d+)$/,           // 2.1910 no final
                        /_(\d+\.\d+)(?=<|\(|$)/  // _2.1910 antes de < ou ( ou fim
                    ];
                    
                    for (const pattern of patterns) {
                        const match = cleanDesc.match(pattern);
                        if (match) {
                            codigoHorario = match[1];
                            break;
                        }
                    }
                    
                    // Limpar descrição removendo ID Oferta e código horário
                    let descricaoLimpa = cleanDesc
                        .replace(/\(\d+\)/, '') // Remove ID Oferta
                        .replace(/_\d+\.\d+/, '') // Remove código horário
                        .replace(/\d+\.\d+$/, '') // Remove código no final
                        .trim();
                    
                    const result = { descricaoLimpa, codigoHorario, idOfertaDesc };
                    
                    return result;
                };
                
                const parsedDesc = parseDescriptionField(descricaoCompleta);
                

                
                const finalData = {
                    idOferta,
                codigoDisciplina,
                nomeDisciplina,
                    cargaHoraria,
                    siglaCampus: campusInfo.sigla,
                    nomeCampus,
                    periodo,
                    vagas,
                    matriculados,
                    preMatriculados,
                    total,
                    vagasRestantes,
                    sala,
                    descricao: parsedDesc.descricaoLimpa,
                    codigoHorario: parsedDesc.codigoHorario,
                    idOfertaDesc: parsedDesc.idOfertaDesc,
                    hora
                };
                
                // Função getCodigoCampus agora usa o código já mapeado
                const codigoCampus = campusInfo.codigo;
                
                // Definir curso utilizando apenas o curso selecionado
                let curso = '';
                if (finalData.idOferta) {
                    curso = await getCursoData(finalData.idOferta);
                }
                if (!curso && cursoSelecionado) {
                    curso = `(${cursoSelecionado.codigo} - ${cursoSelecionado.nome})`;
                }
                
                let professor = { codigo: '', nome: '' };
                if (finalData.idOferta) {
                    professor = await getProfessorData(finalData.idOferta);
                }
                
                return {
                    index,
                    codigoDisciplina: finalData.codigoDisciplina,
                    nomeDisciplina: finalData.nomeDisciplina,
                    cargaHoraria: finalData.cargaHoraria,
                    codigoCampus: codigoCampus,
                    siglaCampus: finalData.siglaCampus,
                    nomeCampus: finalData.nomeCampus,
                    periodo: finalData.periodo,
                    vagas: finalData.vagas,
                    matriculados: finalData.matriculados,
                    preMatriculados: finalData.preMatriculados,
                    total: finalData.total,
                    vagasRestantes: finalData.vagasRestantes,
                    sala: finalData.sala,
                    descricao: finalData.descricao,
                    codigoHorario: finalData.codigoHorario,
                    idOfertaDesc: finalData.idOfertaDesc,
                    hora: finalData.hora,
                    idOferta: finalData.idOferta,
                curso,
                    codigoProfessor: professor.codigo,
                    nomeProfessor: professor.nome
                };
                
            } catch (error) {
                console.error(`❌ Erro ao processar registro ${index}:`, error);
                return { index, error: error.message };
            }
        }
        
        // Inicializar progresso
        updateProgress(0, totalRecords, null);
        
        // Storage para resultados
        const results = new Array(totalRecords);
        let processedCount = 0;
        const startTime = Date.now();
        
        // Processar em lotes
        const totalBatches = Math.ceil(totalRecords / BATCH_SIZE);
        console.log(`📦 Total de lotes: ${totalBatches} (${BATCH_SIZE} registros por lote)`);
        
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            if (isCanceled) {
                updateStatus('Operação cancelada pelo usuário');
                setTimeout(removeLoadingOverlay, 2000);
                return;
            }
            
            const startIdx = batchIndex * BATCH_SIZE;
            const endIdx = Math.min(startIdx + BATCH_SIZE, totalRecords);
            const batchRows = rows.slice(startIdx, endIdx);
            
            updateBatchInfo(batchIndex + 1, totalBatches);
            updateStatus(`Processando lote ${batchIndex + 1}/${totalBatches} (${totalRecords} registros)...`);
            
            // Processar lote em paralelo
            const batchPromises = batchRows.map((row, idx) => 
                processRecord(row, startIdx + idx)
            );
            
            try {
                const batchResults = await Promise.all(batchPromises);
                
                // Armazenar resultados na posição correta
                batchResults.forEach(result => {
                    results[result.index] = result;
                });
                
                processedCount += batchResults.length;
                updateProgress(processedCount, totalRecords, startTime);
                
                // Pausa entre lotes para não sobrecarregar o servidor
                if (batchIndex < totalBatches - 1) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
                }
                
            } catch (error) {
                if (error.message === 'Operação cancelada') throw error;
                console.error(`❌ Erro no lote ${batchIndex + 1}:`, error);
                // Continuar com o próximo lote
            }
        }
        
        if (isCanceled) {
            updateStatus('Operação cancelada pelo usuário');
            setTimeout(removeLoadingOverlay, 2000);
            return;
        }
        
        updateStatus('Gerando arquivo CSV...');
        
        // Montar CSV
        const csvData = [];
        
        // Cabeçalho
        const headers = [
            'Cód. Disc.',
            'Nome Disciplina',
            'Carga Horária',
            'Cód. Campus',
            'Sigla Campus',
            'Nome Campus',
            'Período',
            'Vagas',
            'Matriculados',
            'Pré-matriculados',
            'Total Matriculados',
            'Vagas Restantes',
            'Sala',
            'Descrição',
            'Cód. Horário',
            'ID Oferta',
            'Hora',
            'Curso',
            'Cód. Prof.',
            'Nome Professor'
        ];
        
        csvData.push(headers);
        
        // Dados
        results.forEach((result, index) => {
            if (result) {
                const row = [
                    result.codigoDisciplina,
                    result.nomeDisciplina,
                    result.cargaHoraria,
                    result.codigoCampus,
                    result.siglaCampus,
                    result.nomeCampus,
                    result.periodo,
                    result.vagas,
                    result.matriculados,
                    result.preMatriculados,
                    result.total,
                    result.vagasRestantes,
                    result.sala,
                    result.descricao,
                    result.codigoHorario,
                    result.idOfertaDesc,
                    result.hora,
                    result.curso,
                    result.codigoProfessor,
                    result.nomeProfessor
                ];
                
                csvData.push(row);
            }
        });
        
        console.log(`📊 Total de linhas no CSV: ${csvData.length} (incluindo cabeçalho)`);
        
        // Converter para CSV
        const csvContent = csvData.map(row => 
            row.map(cell => {
                const cellStr = String(cell).replace(/"/g, '""');
                return cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n') 
                    ? `"${cellStr}"` 
                    : cellStr;
            }).join(',')
        ).join('\n');
        
        // Adicionar BOM para UTF-8
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;
        
        const finalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        updateStatus(`✅ Dados capturados! ${processedCount} registros em ${finalTime}s`);
        console.log(`🎉 Dados processados com sucesso em ${finalTime}s!`);
        
        // Enviar dados para a extensão armazenar no storage (via content script)
        try {
            console.log('🔍 Tentando enviar dados de ofertas para extensão...');
            console.log('📊 Tamanho do CSV:', csvWithBOM.length, 'caracteres');
            
            window.postMessage({
                action: 'captureData',
                csv: csvWithBOM,
                timestamp: Date.now()
            }, '*');
            console.log('📡 Dados de ofertas enviados para extensão (storage)');
            
            // Aguardar resposta por 3 segundos
            let responseReceived = false;
            const responseHandler = (event) => {
                if (event.data && event.data.action === 'extensionResponse' && 
                    event.data.originalAction === 'captureData') {
                    responseReceived = true;
                    
                    if (event.data.contextInvalidated) {
                        console.error('🔄 Contexto da extensão invalidado! Recarregue a página e tente novamente.');
                        updateStatus('⚠️ Extensão foi reiniciada. Recarregue a página!');
                    } else if (event.data.success) {
                        console.log('✅ Dados de ofertas armazenados com sucesso:', event.data);
                    } else {
                        console.error('❌ Erro ao armazenar dados de ofertas:', event.data.error);
                        updateStatus('⚠️ Falha no salvamento. Recarregue a página do SIAA!');
                    }
                    
                    window.removeEventListener('message', responseHandler);
                }
            };
            window.addEventListener('message', responseHandler);
            
            setTimeout(() => {
                if (!responseReceived) {
                    console.warn('⚠️ Nenhuma resposta recebida do content script em 3s - verificar se content script está ativo');
                    console.warn('📊 Dados de ofertas foram coletados mas podem não ter sido salvos no storage');
                    updateStatus('⚠️ Dados coletados mas não salvos. Recarregue a página do SIAA!');
                    window.removeEventListener('message', responseHandler);
                }
            }, 3000);
            
        } catch (e) {
            console.error('❌ Erro ao enviar mensagem para extensão:', e);
            updateStatus('⚠️ Erro na comunicação. Recarregue a página do SIAA!');
        }

        // ===== CAPTURAR DADOS DE ALUNOS =====
        updateStatus('Capturando dados de alunos...');
        
        // Debug: mostrar mapeamento de cursos coletado
        debugCursoMapping();
        
        try {
            const studentsCsv = await captureStudentData(cursoSelecionado, updateStatus);
            
            console.log('🔍 CSV de alunos gerado:', {
                length: studentsCsv ? studentsCsv.length : 0,
                preview: studentsCsv ? studentsCsv.substring(0, 200) : 'undefined',
                type: typeof studentsCsv
            });
            
            // Enviar dados de alunos para a extensão (via content script)
            try {
                console.log('🔍 Tentando enviar dados de alunos para extensão...');
                console.log('📊 Tamanho do CSV de alunos:', studentsCsv ? studentsCsv.length : 0, 'caracteres');
                
                window.postMessage({
                    action: 'captureStudentData',
                    csv: studentsCsv,
                    timestamp: Date.now()
                }, '*');
                console.log('📡 Dados de alunos enviados para extensão (storage)');
                
                // Aguardar resposta por 3 segundos
                let responseReceived = false;
                const responseHandler = (event) => {
                    if (event.data && event.data.action === 'extensionResponse' && 
                        event.data.originalAction === 'captureStudentData') {
                        responseReceived = true;
                        
                        if (event.data.contextInvalidated) {
                            console.error('🔄 Contexto da extensão invalidado! Recarregue a página e tente novamente.');
                            updateStatus('⚠️ Extensão foi reiniciada. Recarregue a página!');
                        } else if (event.data.success) {
                            console.log('✅ Dados de alunos armazenados com sucesso:', event.data);
                        } else {
                            console.error('❌ Erro ao armazenar dados de alunos:', event.data.error);
                            updateStatus('⚠️ Falha no salvamento. Recarregue a página do SIAA!');
                        }
                        
                        window.removeEventListener('message', responseHandler);
                    }
                };
                window.addEventListener('message', responseHandler);
                
                setTimeout(() => {
                    if (!responseReceived) {
                        console.warn('⚠️ Nenhuma resposta recebida do content script para alunos em 3s');
                        console.warn('📊 Dados de alunos foram coletados mas podem não ter sido salvos no storage');
                        updateStatus('⚠️ Dados coletados mas não salvos. Recarregue a página do SIAA!');
                        window.removeEventListener('message', responseHandler);
                    }
                }, 3000);
                
            } catch (e) {
                console.error('❌ Erro ao enviar dados de alunos para extensão:', e);
                updateStatus('⚠️ Erro na comunicação. Recarregue a página do SIAA!');
            }
            
            // Verificar se dados foram realmente salvos no storage
            setTimeout(async () => {
                try {
                    const storedData = await chrome.storage.local.get(['siaa_data_csv', 'siaa_students_csv']);
                    const hasOfertas = storedData.siaa_data_csv && storedData.siaa_data_csv.length > 100;
                    const hasAlunos = storedData.siaa_students_csv && storedData.siaa_students_csv.length > 100;
                    
                    if (!hasOfertas && !hasAlunos) {
                        console.error('⚠️ NENHUM dado foi salvo no storage!');
                        updateStatus('⚠️ Dados NÃO foram salvos! Recarregue a página do SIAA!');
                    } else if (!hasOfertas) {
                        console.error('⚠️ Dados de OFERTAS não foram salvos no storage!');
                        updateStatus('⚠️ Ofertas NÃO salvas! Recarregue a página do SIAA!');
                    } else if (!hasAlunos) {
                        console.error('⚠️ Dados de ALUNOS não foram salvos no storage!');
                        updateStatus('⚠️ Alunos NÃO salvos! Recarregue a página do SIAA!');
                    } else {
                        updateStatus('✅ Ofertas e alunos capturados e salvos');
                        console.log('✅ Dados de alunos capturados e salvos com sucesso');
                    }
                } catch (error) {
                    console.error('❌ Erro ao verificar storage:', error);
                    updateStatus('⚠️ Erro na verificação. Recarregue a página do SIAA!');
                }
            }, 1000); // Aguardar 1 segundo para garantir que o salvamento foi processado
            
        } catch (studentError) {
            console.error('❌ Erro ao capturar dados de alunos:', studentError);
            updateStatus('⚠️ Ofertas capturadas. Erro nos dados de alunos.');
        }
            
            // Notificar que a captura foi concluída
        try {
            chrome.runtime?.sendMessage({
                action: 'extractionComplete'
            });
        } catch (e) {
            console.log('ℹ️ Não foi possível enviar mensagem para extensão:', e);
        }
        
        // Overlay removido
        
    } catch (error) {
        if (error.message !== 'Operação cancelada') {
            console.error('❌ Erro durante a captura:', error);
            updateStatus(`❌ Erro: ${error.message}`);
            // Overlay removido
        }
    }
}

// ===== FUNÇÃO AUXILIAR PARA PERÍODO ACADÊMICO =====

async function getCurrentAcademicPeriod() {
    return siaaConnectorV15.getCurrentAcademicPeriod();
}

// ===== FUNÇÃO AUXILIAR PARA FETCH XML =====

async function fetchXML(url, timeout = 15000) {
    return siaaConnectorV15.fetchXML(url, timeout);
}

// ===== CAPTURA DE DADOS DE ALUNOS =====

// Função para capturar dados de alunos
async function captureStudentData(cursoSelecionado, updateStatusFn) {
    console.log('🎓 Iniciando captura de dados de alunos...');
    
    try {
        // 1. Buscar campus disponíveis
        updateStatusFn('Buscando campus disponíveis...');
        
        // Enviar progresso inicial
        chrome.runtime?.sendMessage({
            action: 'studentCaptureProgress',
            message: 'Buscando campus disponíveis...',
            progress: 0
        });
        
        const campusList = await fetchCampusList();
        console.log('🏫 Campus encontrados:', campusList.length);
        
        // Enviar progresso após buscar campus
        chrome.runtime?.sendMessage({
            action: 'studentCaptureProgress',
            message: `${campusList.length} campus encontrados`,
            progress: 10
        });
        
        // 2. Capturar dados de alunos para cada campus
        const allStudents = [];
        let processedCampus = 0;
        
        for (const campus of campusList) {
            try {
                // Progresso: 10% (busca campus) + 80% (processamento) + 10% (finalização)
                const progressPercent = 10 + Math.floor((processedCampus / campusList.length) * 80);
                updateStatusFn(`Capturando alunos - Campus ${campus.nome} (${processedCampus + 1}/${campusList.length})`);
                
                // Enviar progresso para o popup
                chrome.runtime?.sendMessage({
                    action: 'studentCaptureProgress',
                    message: `Campus ${campus.nome} (${processedCampus + 1}/${campusList.length})`,
                    progress: progressPercent
                });
                
                const students = await fetchStudentsForCampus(cursoSelecionado.codigo, campus.codigo);
                allStudents.push(...students);
                
                processedCampus++;
                console.log(`📊 Campus ${campus.nome}: ${students.length} alunos`);
                
            } catch (campusError) {
                console.error(`❌ Erro no campus ${campus.nome}:`, campusError);
                // Continue com outros campus
            }
        }
        
        console.log(`🎓 Total de alunos capturados: ${allStudents.length}`);
        
        // 3. Converter para CSV
        chrome.runtime?.sendMessage({
            action: 'studentCaptureProgress',
            message: `Processando ${allStudents.length} alunos...`,
            progress: 90
        });
        
        if (allStudents.length === 0) {
            throw new Error('Nenhum aluno encontrado');
        }
        
        const csvContent = convertStudentsToCSV(allStudents, cursoSelecionado.nome || '');
        const csvWithBOM = '\uFEFF' + csvContent;
        
        // Progresso final
        chrome.runtime?.sendMessage({
            action: 'studentCaptureProgress',
            message: `✅ ${allStudents.length} alunos capturados`,
            progress: 100
        });
        
        return csvWithBOM;
        
    } catch (error) {
        console.error('❌ Erro na captura de alunos:', error);
        throw error;
    }
}

// Buscar lista de campus
async function fetchCampusList() {
    const url = 'https://siaa.cruzeirodosul.edu.br/siaa_academico/secure/academico/relatorio/wacdrel31/XML/combo/XMLComboInst.jsp';
    
    try {
        console.log('🌐 Buscando campus em:', url);
        const xmlDoc = await fetchXML(url);
        const options = xmlDoc.querySelectorAll('option');
        
        console.log('🏫 Options encontradas:', options.length);
        
        const campusList = [];
        options.forEach((option, index) => {
            const codigo = option.getAttribute('value');
            const texto = option.textContent.trim();
            
            console.log(`Campus ${index}: codigo="${codigo}", texto="${texto}"`);
            
            if (codigo && texto) {
                // Extrair nome do campus do texto "1 - UNIVERSIDADE CRUZEIRO DO SUL - SM"
                const parts = texto.split(' - ');
                const nome = parts.length >= 3 ? parts[2] : parts[parts.length - 1];
                
                campusList.push({
                    codigo: codigo,
                    nome: nome,
                    textoCompleto: texto
                });
            }
        });
        
        console.log('🏫 Campus processados:', campusList);
        return campusList;
        
    } catch (error) {
        console.error('❌ Erro ao buscar campus:', error);
        throw error;
    }
}

// Buscar alunos para um campus específico
async function fetchStudentsForCampus(codigoCurso, codigoCampus) {
    // Construir URL com parâmetros
    // Obter período dinâmico para alunos (formato diferente: "2025,2")
    const periodo = await getCurrentAcademicPeriod();
    const anoSemFormatted = `${periodo.ano_leti},${periodo.sem_leti}`;
    const url = `https://siaa.cruzeirodosul.edu.br/siaa_academico/secure/academico/relatorio/wacdrel31/XML/grid/XMLGridRel.jsp?codCurs=${codigoCurso}&anoSem=${anoSemFormatted}&cod_inst=${codigoCampus}`;
    
    try {
        console.log(`🎓 Buscando alunos em: ${url}`);
        const xmlDoc = await fetchXML(url);
        
        // Verificar se há erro no XML
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            throw new Error('Erro ao processar XML de alunos');
        }
        
        // Extrair dados dos alunos
        const rows = xmlDoc.querySelectorAll('row');
        const students = [];
        
        console.log(`📊 Rows encontradas para campus ${codigoCampus}:`, rows.length);
        
        rows.forEach((row, index) => {
            try {
                const cells = row.querySelectorAll('cell');
                
                if (cells.length >= 12) {
                    const student = {
                        rgm: cells[0].textContent.trim(),
                        nome: cells[1].textContent.trim(),
                        serie: cells[2].textContent.trim(),
                        turma: cells[3].textContent.trim(),
                        turno: cells[4].textContent.trim(),
                        situacao: cells[5].textContent.trim(),
                        foneRes: cells[6].textContent.trim(),
                        foneCel: cells[7].textContent.trim(),
                        foneCom: cells[8].textContent.trim(),
                        email: cells[9].textContent.trim(),
                        idPolo: cells[10].textContent.trim(),
                        nomePolo: cells[11].textContent.trim(),
                        codigoCurso: codigoCurso,
                        codigoCampus: codigoCampus
                    };
                    
                    students.push(student);
                }
            } catch (rowError) {
                console.error(`❌ Erro ao processar linha ${index}:`, rowError);
            }
        });
        
        console.log(`✅ Campus ${codigoCampus}: ${students.length} alunos processados`);
        return students;
        
    } catch (error) {
        console.error(`❌ Erro ao buscar alunos do campus ${codigoCampus}:`, error);
        return []; // Retorna array vazio em caso de erro
    }
}

// Funções auxiliares para enriquecimento de dados
function parseCursoNome(codigoCurso, nomeCompletoTurma = '') {
    // Primeiro tentar usar o mapeamento global coletado durante a extração de ofertas
    const nomeFromMapping = getCursoNomeFromMapping(codigoCurso);
    if (nomeFromMapping) {
        return {
            nome: nomeFromMapping,
            codigo: codigoCurso
        };
    }
    
    // Fallback: tentar extrair nome do curso da turma se disponível
    // Formato esperado: "CST EM ANÁLISE E DESENVOLVIMENTO DE SISTEMAS - 68"
    const cursoMatch = nomeCompletoTurma.match(/^(.+?)\s*-\s*(\d+)$/);
    if (cursoMatch && cursoMatch[2] === codigoCurso) {
        return {
            nome: cursoMatch[1].trim(),
            codigo: cursoMatch[2].trim()
        };
    }
    
    // Se não conseguir extrair, retornar apenas o código
    return { nome: '', codigo: codigoCurso };
}

function getCampusSigla(codigoCampus) {
    // Mapping baseado no siaa-config.json
    const campusMapping = {
        "1": { "nome": "SÃO MIGUEL", "sigla": "SM" },
        "5": { "nome": "ANÁLIA FRANCO", "sigla": "AF" },
        "6": { "nome": "LIBERDADE", "sigla": "LIB" },
        "40": { "nome": "VILLA LOBOS", "sigla": "VL" },
        "58": { "nome": "GUARULHOS", "sigla": "GRU" },
        "59": { "nome": "PAULISTA", "sigla": "PTA" },
        "72": { "nome": "SANTO AMARO", "sigla": "SA" },
        "09": { "nome": "EAD", "sigla": "EAD" }
    };
    
    return campusMapping[codigoCampus]?.sigla || '';
}

// Converter dados de alunos para CSV
function convertStudentsToCSV(students, cursoNomeCompleto = '') {
    if (!students || students.length === 0) {
        return 'RGM,Nome,Série,Turma,Turno,Situação,Fone Res.,Fone Cel.,Fone Com.,E-mail,ID Polo,Nome Polo,Código Curso,Código Campus,Nome do Curso,Sigla Campus\n';
    }
    
    // Cabeçalho atualizado com novas colunas
    const headers = [
        'RGM', 'Nome', 'Série', 'Turma', 'Turno', 'Situação',
        'Fone Res.', 'Fone Cel.', 'Fone Com.', 'E-mail',
        'ID Polo', 'Nome Polo', 'Código Curso', 'Código Campus',
        'Nome do Curso', 'Sigla Campus'
    ];
    
    // Construir linhas
    const lines = [headers.join(',')];
    
    students.forEach(student => {
        // Enriquecer dados do aluno com nome do curso e sigla do campus
        const cursoInfo = parseCursoNome(student.codigoCurso, cursoNomeCompleto);
        const siglaCampus = getCampusSigla(student.codigoCampus);
        
        const values = [
            student.rgm || '',
            student.nome || '',
            student.serie || '',
            student.turma || '',
            student.turno || '',
            student.situacao || '',
            student.foneRes || '',
            student.foneCel || '',
            student.foneCom || '',
            student.email || '',
            student.idPolo || '',
            student.nomePolo || '',
            student.codigoCurso || '',
            student.codigoCampus || '',
            cursoInfo.nome || '',           // Nome do Curso
            siglaCampus || ''               // Sigla Campus
        ];
        
        // Escapar valores com vírgulas ou aspas
        const escapedValues = values.map(value => {
            const strValue = String(value).replace(/"/g, '""');
            return strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')
                ? `"${strValue}"`
                : strValue;
        });
        
        lines.push(escapedValues.join(','));
    });
    
    return lines.join('\n');
}

// Expor a função no escopo global para que a extensão possa acessá-la
window.exportarTabelaSIAA = exportarTabelaSIAA;

// Expor funções de mapeamento de cursos
window.debugCursoMapping = debugCursoMapping;
window.saveCursoMapping = saveCursoMapping;
window.loadCursoMapping = loadCursoMapping;
window.getCursoNomeFromMapping = getCursoNomeFromMapping;

console.log('✅ Função exportarTabelaSIAA disponível globalmente');