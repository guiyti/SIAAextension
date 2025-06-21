// 🔍 SCRIPT DE DEBUG - SIAA JSF Monitor
// Cole este script no console da página home.jsf ANTES de clicar no menu

console.clear();
console.log('🔍 SIAA JSF Debug Monitor iniciado');
console.log('📋 Este script vai capturar tudo que acontece quando você clicar no menu');

// Arrays para armazenar os dados capturados
const debugData = {
    requests: [],
    events: [],
    domChanges: [],
    jsf: [],
    cookies: [],
    localStorage: [],
    sessionStorage: []
};

// 1. MONITORAR TODAS AS REQUISIÇÕES XHR/FETCH
const originalXHR = window.XMLHttpRequest;
const originalFetch = window.fetch;

// Interceptar XMLHttpRequest
window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const originalOpen = xhr.open;
    const originalSend = xhr.send;
    const originalSetRequestHeader = xhr.setRequestHeader;
    
    let requestData = {
        method: '',
        url: '',
        headers: {},
        body: '',
        timestamp: Date.now(),
        type: 'XHR'
    };
    
    xhr.open = function(method, url, ...args) {
        requestData.method = method;
        requestData.url = url;
        console.log(`📡 XHR OPEN: ${method} ${url}`);
        return originalOpen.apply(this, [method, url, ...args]);
    };
    
    xhr.setRequestHeader = function(header, value) {
        requestData.headers[header] = value;
        return originalSetRequestHeader.apply(this, [header, value]);
    };
    
    xhr.send = function(body) {
        requestData.body = body || '';
        debugData.requests.push(JSON.parse(JSON.stringify(requestData)));
        
        console.log(`🚀 XHR SEND: ${requestData.method} ${requestData.url}`);
        console.log('📄 Headers:', requestData.headers);
        if (body) console.log('📦 Body:', body);
        
        // Monitorar resposta
        xhr.addEventListener('readystatechange', function() {
            if (xhr.readyState === 4) {
                console.log(`📥 XHR RESPONSE (${xhr.status}): ${requestData.url}`);
                console.log('📄 Response Headers:', xhr.getAllResponseHeaders());
                if (xhr.responseText && xhr.responseText.length < 1000) {
                    console.log('📄 Response Body:', xhr.responseText);
                }
            }
        });
        
        return originalSend.apply(this, [body]);
    };
    
    return xhr;
};

// Interceptar Fetch
window.fetch = function(url, options = {}) {
    const requestData = {
        method: options.method || 'GET',
        url: url,
        headers: options.headers || {},
        body: options.body || '',
        timestamp: Date.now(),
        type: 'FETCH'
    };
    
    debugData.requests.push(JSON.parse(JSON.stringify(requestData)));
    console.log(`📡 FETCH: ${requestData.method} ${url}`);
    
    return originalFetch.apply(this, [url, options])
        .then(response => {
            console.log(`📥 FETCH RESPONSE (${response.status}): ${url}`);
            return response;
        });
};

// 2. MONITORAR EVENTOS JSF ESPECÍFICOS
['click', 'change', 'submit', 'focus', 'blur'].forEach(eventType => {
    document.addEventListener(eventType, function(event) {
        if (event.target) {
            const element = event.target;
            const eventData = {
                type: eventType,
                tagName: element.tagName,
                id: element.id,
                className: element.className,
                textContent: element.textContent?.substring(0, 100),
                title: element.title,
                onclick: element.onclick?.toString().substring(0, 200),
                href: element.href,
                timestamp: Date.now()
            };
            
            debugData.events.push(eventData);
            
            // Log apenas eventos relevantes
            if (element.textContent?.includes('Consulta') || 
                element.className?.includes('ui-') ||
                element.id?.includes('form') ||
                eventType === 'click') {
                console.log(`🖱️ EVENTO ${eventType.toUpperCase()}:`, eventData);
            }
        }
    }, true);
});

// 3. MONITORAR MUDANÇAS NO DOM
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    const changeData = {
                        type: 'DOM_ADD',
                        tagName: node.tagName,
                        id: node.id,
                        className: node.className,
                        innerHTML: node.innerHTML?.substring(0, 200),
                        timestamp: Date.now()
                    };
                    
                    debugData.domChanges.push(changeData);
                    
                    // Log apenas mudanças relevantes
                    if (node.id?.includes('form') || 
                        node.className?.includes('ui-') ||
                        node.innerHTML?.includes('WACDCON12')) {
                        console.log('🔄 DOM CHANGE:', changeData);
                    }
                }
            });
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true
});

// 4. MONITORAR JSESSIONID E COOKIES
const originalSetCookie = document.__lookupSetter__('cookie');
if (originalSetCookie) {
    document.__defineSetter__('cookie', function(value) {
        console.log('🍪 COOKIE SET:', value);
        debugData.cookies.push({ value, timestamp: Date.now() });
        return originalSetCookie.call(this, value);
    });
}

// 5. MONITORAR STORAGE
const originalLocalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    console.log('💾 LOCAL STORAGE SET:', key, value);
    debugData.localStorage.push({ key, value, timestamp: Date.now() });
    return originalLocalSetItem.apply(this, [key, value]);
};

const originalSessionSetItem = sessionStorage.setItem;
sessionStorage.setItem = function(key, value) {
    console.log('💾 SESSION STORAGE SET:', key, value);
    debugData.sessionStorage.push({ key, value, timestamp: Date.now() });
    return originalSessionSetItem.apply(this, [key, value]);
};

// 6. BUSCAR INFORMAÇÕES SOBRE O ELEMENTO ESPECÍFICO
const targetElement = document.querySelector('span[title*="WACDCON12"]');
if (targetElement) {
    console.log('🎯 ELEMENTO ENCONTRADO:', targetElement);
    console.log('📋 Elemento pai:', targetElement.parentElement);
    console.log('📋 Onclick do pai:', targetElement.parentElement?.onclick?.toString());
    console.log('📋 Todos os event listeners:', getEventListeners?.(targetElement));
} else {
    console.log('❌ Elemento com WACDCON12 não encontrado');
}

// 7. FUNÇÃO PARA EXPORTAR DADOS COLETADOS
window.exportDebugData = function() {
    console.log('📊 DADOS COLETADOS:');
    console.log('📡 Requisições:', debugData.requests);
    console.log('🖱️ Eventos:', debugData.events);
    console.log('🔄 Mudanças DOM:', debugData.domChanges);
    console.log('🍪 Cookies:', debugData.cookies);
    console.log('💾 Local Storage:', debugData.localStorage);
    console.log('💾 Session Storage:', debugData.sessionStorage);
    
    // Criar relatório
    const report = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        data: debugData
    };
    
    // Baixar como JSON
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `siaa-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    return report;
};

console.log('✅ Monitor configurado!');
console.log('📋 INSTRUÇÕES:');
console.log('1. Agora CLIQUE no item "Consulta De Oferta Por Curso"');
console.log('2. Aguarde as requisições serem feitas');
console.log('3. Execute: exportDebugData() para baixar o relatório');
console.log('4. Envie o arquivo JSON gerado');

// 8. FUNÇÃO HELPER PARA ANALISAR FORMULÁRIOS JSF
window.analyzeJSFForms = function() {
    const forms = document.querySelectorAll('form');
    console.log('📋 FORMULÁRIOS JSF ENCONTRADOS:');
    
    forms.forEach((form, index) => {
        console.log(`📋 Formulário ${index + 1}:`, {
            id: form.id,
            action: form.action,
            method: form.method,
            enctype: form.enctype,
            inputs: Array.from(form.querySelectorAll('input')).map(input => ({
                name: input.name,
                type: input.type,
                value: input.value,
                id: input.id
            }))
        });
    });
};

// Executar análise inicial
analyzeJSFForms(); 