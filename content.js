// Content Script - executa no contexto da página SIAA
console.log('🔧 SIAA Data Extractor - Content Script carregado');

// Verificar se está na página correta ao carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('📍 Página carregada:', window.location.href);
    
    if (window.location.href.includes('novo-siaa/secure/core/home.jsf')) {
        console.log('✅ Página SIAA detectada - Extensão pronta para uso');
    } else {
        console.log('ℹ️ Não está na página inicial do SIAA');
    }
});

// Adicionar estilo para possíveis overlays da extensão
const style = document.createElement('style');
style.textContent = `
    /* Estilos para overlays da extensão SIAA */
    #siaa-loading-overlay,
    #siaa-course-selection-overlay {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        z-index: 999999 !important;
    }
    
    /* Compatibilidade com o tema do SIAA */
    #siaa-loading-overlay .status-card,
    #siaa-course-selection-overlay .selection-box {
        border: 2px solid #ebb55e !important;
    }
    
    #siaa-loading-overlay .progress-bar,
    #siaa-course-selection-overlay .progress-bar {
        background: #ebb55e !important;
    }
`;
document.head.appendChild(style);

// Sistema de comunicação entre injected.js e background.js
window.addEventListener('message', (event) => {
    // Verificar se a mensagem vem do nosso injected script
    if (event.source !== window || !event.data || !event.data.action) {
        return;
    }
    
    // IMPORTANTE: Não repassar mensagens de resposta (evita loop infinito)
    if (event.data.action === 'extensionResponse') {
        return;
    }
    
    console.log('📨 [CONTENT] Mensagem recebida do injected.js:', event.data.action);
    
    // Log adicional para debug de storage
    if (event.data.action === 'captureData' || event.data.action === 'captureStudentData') {
        console.log('💾 [CONTENT] Dados para armazenamento:', {
            action: event.data.action,
            csvLength: event.data.csv ? event.data.csv.length : 0,
            timestamp: event.data.timestamp
        });
    }
    
    // Verificar se o contexto da extensão ainda é válido
    try {
        // Tentar acessar chrome.runtime.id para verificar se o contexto é válido
        if (!chrome.runtime?.id) {
            throw new Error('Extension context invalidated');
        }
    } catch (error) {
        console.warn('⚠️ [CONTENT] Contexto da extensão invalidado, página precisa ser recarregada...');
        
        // Enviar erro de volta para injected.js
        window.postMessage({
            action: 'extensionResponse',
            originalAction: event.data.action,
            success: false,
            error: 'Extension context invalidated - please reload page',
            contextInvalidated: true
        }, '*');
        
        return; // Não tentar comunicar com background
    }
    
    // Repassar mensagem para o background script
    chrome.runtime.sendMessage(event.data, (response) => {
        if (chrome.runtime.lastError) {
            console.error('❌ [CONTENT] Erro ao comunicar com background:', chrome.runtime.lastError);
            
            // Verificar se é erro de contexto invalidado
            if (chrome.runtime.lastError.message.includes('context invalidated') || 
                chrome.runtime.lastError.message.includes('receiving end does not exist')) {
                console.warn('⚠️ [CONTENT] Contexto invalidado detectado no callback');
                
                window.postMessage({
                    action: 'extensionResponse',
                    originalAction: event.data.action,
                    success: false,
                    error: 'Extension context invalidated - please reload page',
                    contextInvalidated: true
                }, '*');
            } else {
                // Enviar erro normal de volta para injected.js
                window.postMessage({
                    action: 'extensionResponse',
                    originalAction: event.data.action,
                    success: false,
                    error: chrome.runtime.lastError.message
                }, '*');
            }
        } else {
            console.log('✅ [CONTENT] Resposta do background recebida:', response);
            
            // Enviar resposta de volta para injected.js
            window.postMessage({
                action: 'extensionResponse',
                originalAction: event.data.action,
                success: true,
                data: response
            }, '*');
        }
    });
});

console.log('✅ SIAA Data Extractor - Content Script inicializado com sistema de comunicação');

// Função de teste do storage (apenas para debug)
window.testSIAAStorage = function() {
    console.log('🧪 Testando comunicação com background...');
    chrome.runtime.sendMessage({
        action: 'captureData',
        csv: '﻿Test Header\nTest Data',
        timestamp: Date.now()
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('❌ Erro no teste:', chrome.runtime.lastError);
        } else {
            console.log('✅ Teste de comunicação bem-sucedido:', response);
        }
    });
};

// Função de teste da mesclagem de alunos
window.testStudentsMerge = function() {
    console.log('🧪 Testando mesclagem de dados de alunos...');
    
    // Primeiro lote de alunos
    console.log('📤 Enviando primeiro lote de alunos...');
    chrome.runtime.sendMessage({
        action: 'captureStudentData',
        csv: '﻿RGM,Nome,Série,Turma,Turno,Situação,Fone Res.,Fone Cel.,Fone Com.,E-mail,ID Polo,Nome Polo,Código Curso,Código Campus\n12345,João Silva,1,A,Manhã,Ativo,1111-1111,9999-9999,,joao@teste.com,1,Polo A,121,SM\n67890,Maria Santos,2,B,Noite,Ativo,2222-2222,8888-8888,,maria@teste.com,2,Polo B,121,SM',
        timestamp: Date.now()
    }, (response1) => {
        if (chrome.runtime.lastError) {
            console.error('❌ Erro no primeiro lote:', chrome.runtime.lastError);
        } else {
            console.log('✅ Primeiro lote salvo:', response1);
            
            // Aguardar 2 segundos e enviar segundo lote com dados atualizados + novos alunos
            setTimeout(() => {
                console.log('📤 Enviando segundo lote com mesclagem...');
                chrome.runtime.sendMessage({
                    action: 'captureStudentData',
                    csv: '﻿RGM,Nome,Série,Turma,Turno,Situação,Fone Res.,Fone Cel.,Fone Com.,E-mail,ID Polo,Nome Polo,Código Curso,Código Campus\n12345,João Silva Atualizado,2,A,Manhã,Ativo,1111-1111,9999-9999,,joao.novo@teste.com,1,Polo A,121,SM\n11111,Pedro Costa,1,C,Tarde,Ativo,3333-3333,7777-7777,,pedro@teste.com,3,Polo C,68,AF\n22222,Ana Oliveira,3,D,Noite,Ativo,4444-4444,6666-6666,,ana@teste.com,4,Polo D,68,AF',
                    timestamp: Date.now()
                }, (response2) => {
                    if (chrome.runtime.lastError) {
                        console.error('❌ Erro no segundo lote:', chrome.runtime.lastError);
                    } else {
                        console.log('✅ Segundo lote mesclado:', response2);
                        
                        // Verificar storage final
                        setTimeout(() => {
                            chrome.storage.local.get(['siaa_students_csv'], (result) => {
                                console.log('📊 Estado final do storage de alunos:', {
                                    existe: !!result.siaa_students_csv,
                                    linhas: result.siaa_students_csv ? result.siaa_students_csv.split('\n').length - 1 : 0,
                                    preview: result.siaa_students_csv ? result.siaa_students_csv.substring(0, 500) + '...' : 'N/A'
                                });
                                
                                if (result.siaa_students_csv) {
                                    console.log('✅ Esperado: 4 alunos total (1 atualizado, 1 original, 2 novos)');
                                    console.log('📋 Dados completos:', result.siaa_students_csv);
                                }
                            });
                        }, 1000);
                    }
                });
            }, 2000);
        }
    });
}; 