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

console.log('✅ SIAA Data Extractor - Content Script inicializado'); 