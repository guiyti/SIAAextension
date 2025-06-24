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
        
        // Configurações
        const BATCH_SIZE = 10;
        const DELAY_BETWEEN_BATCHES = 800;
        
        // Informar início ao popup
        chrome.runtime?.sendMessage({
            action: 'extractionProgress',
            message: `🚀 Iniciando extração para ${cursoSelecionado.nome}`
        });

        // Funções stub de overlay para compatibilidade
        function createLoadingOverlay() { return null; }
        function removeLoadingOverlay() { /* nada */ }
        
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
        
        // Função para buscar professor (genérica)
        async function getProfessorData(idOfert) {
            if (!idOfert) return { codigo: '', nome: '' };
            try {
                const urlProf = `https://siaa.cruzeirodosul.edu.br/siaa/mod/academico/wacdcon12/grid_teacher_ofe.xml.jsp?id_ofert=${idOfert}&ano_leti=2025&sem_leti=2`;
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
                const urlCurso = `https://siaa.cruzeirodosul.edu.br/siaa/mod/academico/wacdcon12/grid_curso_ofe.xml.jsp?id_ofert=${idOfert}&ano_leti=2025&sem_leti=2`;
                const xml = await fetchXML(urlCurso);
                const rows = xml.querySelectorAll('row');
                if (!rows || rows.length === 0) return '';
                const cursos = [];
                rows.forEach(r => {
                    const cells = r.querySelectorAll('cell');
                    if (cells.length >= 2) {
                        const txt = cells[1].textContent.trim();
                        if (txt) cursos.push(`(${txt})`);
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
                
                // Debug apenas para os primeiros registros
                if (index < 2) {
                    console.log(`🔍 Debug Registro ${index}:`, {
                        descricaoCompleta,
                        parsedDesc
                    });
                }
                
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
            'Total',
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
            updateStatus(`❌ Erro: ${error.message}`);
            setTimeout(removeLoadingOverlay, 5000);
        }
    }
}

// Expor a função no escopo global para que a extensão possa acessá-la
window.exportarTabelaSIAA = exportarTabelaSIAA;

console.log('✅ Função exportarTabelaSIAA disponível globalmente');