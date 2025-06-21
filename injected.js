// Função para buscar cursos disponíveis
async function getCursosDisponiveis() {
    try {
        const url = 'https://siaa.cruzeirodosul.edu.br/siaa/mod/academico/wacdcon12/comboCurso.xml.jsp?ano_leti=2025&sem_leti=2';
        console.log('🌐 Buscando cursos disponíveis...');
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'text/xml, application/xml, */*',
                'Accept-Charset': 'ISO-8859-1',
                'User-Agent': 'Mozilla/5.0 (compatible; DataExtractor/1.0)'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Usar ISO-8859-1 para decodificar corretamente os acentos
        const arrayBuffer = await response.arrayBuffer();
        const decoder = new TextDecoder('iso-8859-1');
        const xmlText = decoder.decode(arrayBuffer);
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        const options = xmlDoc.querySelectorAll('option');
        const cursos = [];
        
        options.forEach(option => {
            const value = option.getAttribute('value');
            const text = option.textContent.trim();
            const isSelected = option.hasAttribute('selected');
            
            if (value && text) {
                cursos.push({
                    codigo: value,
                    nome: text,
                    selected: isSelected
                });
            }
        });
        
        console.log(`📚 ${cursos.length} cursos encontrados:`, cursos);
        return cursos;
        
    } catch (error) {
        console.error('❌ Erro ao buscar cursos:', error);
        throw error;
    }
}

// Função para criar interface de seleção de curso
function createCourseSelectionOverlay(cursos) {
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
                <li>Período: 2025/2 (conforme configuração)</li>
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
            
            console.log('📚 Curso selecionado:', selectedCourse);
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

async function exportarTabelaSIAA(cursoSelecionado = null) {
    let isCanceled = false;
    let loadingOverlay = null;
    
    try {
        // Se não foi passado um curso, mostrar interface de seleção
        if (!cursoSelecionado) {
            console.log('🔍 Buscando cursos disponíveis...');
            
            try {
                const cursos = await getCursosDisponiveis();
                if (cursos.length === 0) {
                    throw new Error('Nenhum curso encontrado');
                }
                
                // Mostrar interface de seleção
                cursoSelecionado = await createCourseSelectionOverlay(cursos);
                console.log('✅ Curso selecionado pelo usuário:', cursoSelecionado);
                
            } catch (error) {
                if (error.message === 'Seleção cancelada pelo usuário') {
                    console.log('ℹ️ Usuário cancelou a seleção de curso');
                    return;
                }
                console.error('❌ Erro ao buscar cursos:', error);
                alert('Erro ao buscar cursos disponíveis: ' + error.message);
                return;
            }
        }
        
        // Configurações
        const BATCH_SIZE = 10;
        const DELAY_BETWEEN_BATCHES = 800;
        
        // Criar overlay de loading
        loadingOverlay = createLoadingOverlay();
        
        function createLoadingOverlay() {
            const overlay = document.createElement('div');
            overlay.id = 'siaa-loading-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                z-index: 10001;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: Arial, sans-serif;
            `;
            
            const content = document.createElement('div');
            content.style.cssText = `
                background: white;
                padding: 40px;
                border-radius: 15px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                border: 2px solid #ebb55e;
                min-width: 400px;
                max-width: 600px;
            `;
            
            content.innerHTML = `
                <div style="margin-bottom: 25px;">
                    <div style="width: 60px; height: 60px; border: 4px solid #f3f3f3; border-top: 4px solid #ebb55e; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px auto;"></div>
                    <h2 style="color: #333; margin: 0;">⚡ Extração em Andamento</h2>
                </div>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #666; font-size: 14px;">
                        <strong>Curso:</strong> ${cursoSelecionado.nome}
                    </p>
                </div>
                
                <div id="status-message" style="margin-bottom: 15px; font-size: 14px; color: #666;">
                    Iniciando extração...
                </div>
                
                <div id="batch-info" style="margin-bottom: 15px; font-size: 12px; color: #999; display: none;">
                    Lote: 0/0
                </div>
                
                <div id="progress-info" style="margin-bottom: 20px; font-size: 12px; color: #999; display: none;">
                    Processados: 0/0 | Tempo: 0s
                </div>
                
            <button id="cancel-button" style="
                background: #e74c3c;
                color: white;
                border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.3s;
            " onmouseover="this.style.background='#c0392b'" onmouseout="this.style.background='#e74c3c'">
                    ❌ Cancelar
            </button>
                
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            
            overlay.appendChild(content);
        document.body.appendChild(overlay);
        
            // Evento do botão cancelar
        document.getElementById('cancel-button').addEventListener('click', () => {
            isCanceled = true;
                updateStatus('Cancelando...', '#e74c3c');
        });
        
        return overlay;
    }
    
    function updateStatus(message, color = '#666') {
            const statusElement = document.getElementById('status-message');
            if (statusElement) {
                statusElement.textContent = message;
                statusElement.style.color = color;
            }
        }
        
        function updateBatchInfo(current, total) {
            const batchElement = document.getElementById('batch-info');
            if (batchElement) {
                batchElement.textContent = `Lote: ${current}/${total}`;
                batchElement.style.display = 'block';
            }
        }
        
        function updateProgress(processed, total, startTime) {
            const progressElement = document.getElementById('progress-info');
            if (progressElement && startTime) {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const remaining = total - processed;
                const rate = processed / (Date.now() - startTime) * 1000;
                const eta = remaining > 0 ? (remaining / rate).toFixed(1) : 0;
                
                progressElement.innerHTML = `
                    Processados: ${processed}/${total} | 
                    Tempo: ${elapsed}s | 
                    ETA: ${eta}s | 
                    Taxa: ${rate.toFixed(1)}/s
                `;
                progressElement.style.display = 'block';
            }
        }
        
    function removeLoadingOverlay() {
            const overlay = document.getElementById('siaa-loading-overlay');
            if (overlay) {
                document.body.removeChild(overlay);
            }
        }
        
        updateStatus('Buscando dados das disciplinas...');
        
        // URLs base
        const baseUrl = `https://siaa.cruzeirodosul.edu.br/siaa/mod/academico/wacdcon12/grid_oferta.xml.jsp?ano_leti=2025&sem_leti=2&cod_curs=${cursoSelecionado.codigo}`;
        
        // Função auxiliar para fazer fetch com timeout
        async function fetchXML(url, timeout = 15000) {
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
                return parser.parseFromString(xmlText, 'text/xml');
                
            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
        }
        
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
        
        // Função para buscar dados do curso
        async function getCursoData(idOfert) {
            if (!idOfert || idOfert.trim() === '') {
                return '';
            }
            
            try {
                const cursoUrl = `https://siaa.cruzeirodosul.edu.br/siaa/mod/academico/wacdcon12/grid_curso_ofe.xml.jsp?id_ofert=${idOfert}&ano_leti=2025&sem_leti=2`;
                const cursoXml = await fetchXML(cursoUrl);
                
                const selectedOption = cursoXml.querySelector('option[selected]');
                return selectedOption ? selectedOption.textContent.trim() : '';
            } catch (error) {
                console.warn('⚠️ Erro ao buscar curso para ID:', idOfert, error);
                return '';
            }
        }
        
        // Função para buscar dados do professor
        async function getProfessorData(idOfert) {
            if (!idOfert || idOfert.trim() === '') {
                return { codigo: '', nome: '' };
            }
            
            try {
                const profUrl = `https://siaa.cruzeirodosul.edu.br/siaa/mod/academico/wacdcon12/grid_teacher_ofe.xml.jsp?id_ofert=${idOfert}&ano_leti=2025&sem_leti=2`;
                const profXml = await fetchXML(profUrl);
                
                const selectedOption = profXml.querySelector('option[selected]');
                if (selectedOption) {
                    const profText = selectedOption.textContent.trim();
                    const profValue = selectedOption.getAttribute('value');
                    return { codigo: profValue, nome: profText };
                }
                return { codigo: '', nome: '' };
            } catch (error) {
                console.warn('⚠️ Erro ao buscar professor para ID:', idOfert, error);
                return { codigo: '', nome: '' };
            }
        }
        
        // Função para processar cada registro
        async function processRecord(row, index) {
            if (isCanceled) throw new Error('Operação cancelada');
            
            try {
                // Debug: mostrar todos os atributos disponíveis no primeiro registro
                if (index === 0) {
                    console.log('🔍 Atributos disponíveis no primeiro registro:');
                    for (let i = 0; i < row.attributes.length; i++) {
                        const attr = row.attributes[i];
                        console.log(`  ${attr.name}: "${attr.value}"`);
                    }
                    
                    // Verificar se há elementos filhos
                    console.log('🔍 Elementos filhos:');
                    for (let i = 0; i < row.children.length; i++) {
                        const child = row.children[i];
                        console.log(`  <${child.tagName}>: "${child.textContent}"`);
                        
                        // Mostrar atributos dos filhos também
                        for (let j = 0; j < child.attributes.length; j++) {
                            const attr = child.attributes[j];
                            console.log(`    ${attr.name}: "${attr.value}"`);
                        }
                    }
                    
                    // Mostrar estrutura XML completa do primeiro registro
                    console.log('🔍 XML completo do primeiro registro:');
                    console.log(row.outerHTML);
                }
                
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
                const hora = horarioTitle.replace(/\./g, ' | ') || '';
                
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
                    descricao: descricaoCompleta,
                    hora
                };
                
                // Função getCodigoCampus agora usa o código já mapeado
                const codigoCampus = campusInfo.codigo;
                
                // Buscar dados de curso e professor via APIs XML com fallback inteligente
                let curso = '';
                let professor = { codigo: '', nome: '' };
                
                if (finalData.idOferta && finalData.idOferta.trim() !== '') {
                    try {
                        // Tentar APIs primeiro
                        [curso, professor] = await Promise.all([
                            getCursoData(finalData.idOferta),
                            getProfessorData(finalData.idOferta)
                        ]);
                    } catch (error) {
                        console.warn(`⚠️ APIs indisponíveis para oferta ${finalData.idOferta}, usando fallback`);
                        
                        // Fallback: extrair informações do próprio XML
                        const cursoCell = cells[11]?.textContent.trim() || '';
                        const professorCell = cells[12]?.textContent.trim() || '';
                        
                        // Extrair curso da descrição (posição 10) ou usar curso selecionado
                        const descricaoCell = cells[10]?.textContent.trim() || '';
                        
                        if (descricaoCell.includes('COMP_OFERTA')) {
                            // COMP_OFERTA indica disciplinas compartilhadas entre múltiplos cursos
                            // Usar o curso selecionado pelo usuário como referência
                            curso = mapearCursoPorCodigo(cursoSelecionado?.codigo);
                        } else if (descricaoCell.includes('_OFERTA')) {
                            // Disciplinas específicas de um curso
                            curso = extrairCursoDaDescricao(descricaoCell, cursoSelecionado?.codigo);
                        } else {
                            // Fallback: usar curso selecionado
                            curso = mapearCursoPorCodigo(cursoSelecionado?.codigo);
                        }
                        
                        // Extrair professor do JavaScript ou usar mapeamento conhecido
                        if (professorCell.includes('teacher_ofe')) {
                            const match = professorCell.match(/teacher_ofe\("(\d+)","(\d+)"\)/);
                            if (match) {
                                const profId = match[2]; // ID da oferta
                                professor = buscarProfessorConhecido(profId) || { codigo: match[1], nome: 'Professor não encontrado' };
                            }
                        }
                    }
                } else {
                    console.log(`⚠️ ID Oferta vazio para registro ${index}, usando dados do curso selecionado`);
                    curso = mapearCursoPorCodigo(cursoSelecionado?.codigo);
                }
                
                // Função auxiliar para mapear curso por código
                function mapearCursoPorCodigo(codigoCurso) {
                    const cursoMap = {
                        '68': '(68 - CST EM ANÁLISE E DESENVOLVIMENTO DE SISTEMAS)',
                        '16': '(16 - CIÊNCIA DA COMPUTAÇÃO (BACHARELADO))',
                        '121': '(121 - CST EM GESTÃO DA TECNOLOGIA DA INFORMAÇÃO)'
                    };
                    return cursoMap[codigoCurso] || '';
                }
                
                // Função auxiliar para extrair curso da descrição
                function extrairCursoDaDescricao(descricao, codigoCursoSelecionado) {
                    // Disciplinas específicas por sigla
                    if (descricao.includes('_ADS_') || descricao.includes('TASIII_') || descricao.includes('PDM_')) {
                        return '(68 - CST EM ANÁLISE E DESENVOLVIMENTO DE SISTEMAS)';
                    }
                    if (descricao.includes('_COMP_') || descricao.includes('ES_')) {
                        return '(16 - CIÊNCIA DA COMPUTAÇÃO (BACHARELADO))';
                    }
                    if (descricao.includes('_GTI_')) {
                        return '(121 - CST EM GESTÃO DA TECNOLOGIA DA INFORMAÇÃO)';
                    }
                    
                    // Se não conseguir determinar pela descrição, usar curso selecionado
                    return mapearCursoPorCodigo(codigoCursoSelecionado);
                }
                
                // Função auxiliar para buscar professor conhecido por ID da oferta
                function buscarProfessorConhecido(idOferta) {
                    const professoresConhecidos = {
                        '2129323': { codigo: '970706', nome: 'FABIO LUIZ PERAL' },
                        '2129339': { codigo: '31055', nome: 'GIULIO GUIYTI ROSSIGNOLO SUZUMURA' },
                        '2129348': { codigo: '948354', nome: 'EDIDIO RUBENS DANTAS LIMA' },
                        '2129608': { codigo: '942096', nome: 'NELSON MISSAGLIA' },
                        '2129614': { codigo: '974809', nome: 'KATIA ALVES BEZERRA' },
                        '2130026': { codigo: '945804', nome: 'SHIE CHEN FANG' },
                        '2129680': { codigo: '948354', nome: 'EDIDIO RUBENS DANTAS LIMA' },
                        '2129682': { codigo: '945302', nome: 'FABIO COSME RODRIGUES DOS SANTOS' },
                        '2129696': { codigo: '970799', nome: 'WAGNER ANTUNES DA SILVA' },
                        '2129703': { codigo: '970706', nome: 'FABIO LUIZ PERAL' },
                        '2129724': { codigo: '941332', nome: 'ALEXANDRE LEITE NUNES' },
                        '2132865': { codigo: '974024', nome: 'ANDRE LOZANO FERREIRA' },
                        '2132945': { codigo: '945804', nome: 'SHIE CHEN FANG' }
                    };
                    return professoresConhecidos[idOferta];
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
                updateStatus('Operação cancelada pelo usuário', '#e74c3c');
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
            updateStatus('Operação cancelada pelo usuário', '#e74c3c');
            setTimeout(removeLoadingOverlay, 2000);
            return;
        }
        
        updateStatus('Gerando arquivo CSV...', '#27ae60');
        
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
            'Total',
            'Vagas Restantes',
            'Sala',
            'Descrição',
            'Hora',
            'ID Oferta',
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
                    result.hora,
                    result.idOferta,
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
        updateStatus(`✅ Dados capturados! ${processedCount} registros em ${finalTime}s`, '#27ae60');
        console.log(`🎉 Dados processados com sucesso em ${finalTime}s!`);
        
        // Enviar dados para a extensão armazenar no storage
        try {
            chrome.runtime?.sendMessage({
                action: 'captureData',
                csv: csvWithBOM,
                timestamp: Date.now()
            }, () => {
                console.log('📡 Dados enviados para extensão (storage)');
            });
            
            // Notificar que a captura foi concluída
            chrome.runtime?.sendMessage({
                action: 'extractionComplete'
            });
        } catch (e) {
            console.log('ℹ️ Não foi possível enviar mensagem para extensão:', e);
        }
        
        setTimeout(removeLoadingOverlay, 3000);
        
    } catch (error) {
        if (error.message !== 'Operação cancelada') {
            console.error('❌ Erro durante a captura:', error);
            updateStatus(`❌ Erro: ${error.message}`, '#e74c3c');
            setTimeout(removeLoadingOverlay, 5000);
        }
    }
}

// Expor a função no escopo global para que a extensão possa acessá-la
window.exportarTabelaSIAA = exportarTabelaSIAA;

console.log('✅ Função exportarTabelaSIAA disponível globalmente');