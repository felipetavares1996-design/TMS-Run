const app = document.getElementById('app');

// --- PWA & Estado Local ---
let deferredPrompt = null;
let isOnline = navigator.onLine;
let scannedProductsData = [
    {
        id: 'PRD-init-1',
        code: '6457897',
        name: 'Ana Maria Silva',
        address: 'Rua Augusta, 450 - Consolação, São Paulo - SP',
        route: 'SP',
        timestamp: new Date().toLocaleString('pt-BR'),
        status: 'Roteirizado'
    }
];

let currentState = {
    screen: 'login', // login, home, deliveries, collection, calendar, messages, profile, settings, control_tower, finance, fleet
    activeTab: 'todo', // todo, done, problems
    activeSettingsTab: 'access', // access, tabs
    userRole: 'admin', // admin, gestao, operador
    selectedDeliveryId: null, // Controle do card selecionado (Desktop)
    deliveryActionState: null, // null, 'entregar', 'problema'
    isForgotPassword: false, // Controle de toggle no login
    hasRoute: false, // Controle de exibição da Home
    scannerContext: 'driver_route' // driver_route, admin_product
};

function saveStateToLocalStorage() {
    try {
        localStorage.setItem('tms_run_state', JSON.stringify(currentState));
        localStorage.setItem('tms_run_deliveries', JSON.stringify(deliveriesData));
        localStorage.setItem('tms_run_vehicles', JSON.stringify(vehiclesData));
        localStorage.setItem('tms_run_custom_tabs', JSON.stringify(customTabsData));
        localStorage.setItem('tms_run_scanned_products', JSON.stringify(scannedProductsData));
    } catch (e) {
        console.error('Falha ao salvar no localStorage:', e);
    }
}

function loadStateFromLocalStorage() {
    try {
        const savedState = localStorage.getItem('tms_run_state');
        const savedDeliveries = localStorage.getItem('tms_run_deliveries');
        const savedVehicles = localStorage.getItem('tms_run_vehicles');
        const savedTabs = localStorage.getItem('tms_run_custom_tabs');
        const savedProducts = localStorage.getItem('tms_run_scanned_products');
        
        if (savedState) {
            const parsed = JSON.parse(savedState);
            Object.assign(currentState, parsed);
            currentState.isScanning = false;
            currentState.selectedDeliveryId = null;
            currentState.deliveryActionState = null;
        }
        if (savedDeliveries) {
            const parsed = JSON.parse(savedDeliveries);
            deliveriesData.length = 0;
            deliveriesData.push(...parsed);
        }
        if (savedVehicles) {
            vehiclesData.length = 0;
            vehiclesData.push(...JSON.parse(savedVehicles));
        }
        if (savedTabs) {
            customTabsData.length = 0;
            customTabsData.push(...JSON.parse(savedTabs));
        }
        if (savedProducts) {
            scannedProductsData.length = 0;
            scannedProductsData.push(...JSON.parse(savedProducts));
        }
    } catch (e) {
        console.error('Falha ao carregar do localStorage:', e);
    }
}

function renderOnlineBadge() {
    if (isOnline) {
        return `<span class="online-badge online" title="Você está conectado à internet"><span class="badge-dot"></span> Online</span>`;
    } else {
        return `<span class="online-badge offline" title="Modo offline ativo. Alterações serão salvas localmente"><span class="badge-dot"></span> Offline</span>`;
    }
}

// Listeners de Conexão
window.addEventListener('online', () => {
    isOnline = true;
    showToast('Conexão restabelecida! Você está online.');
    render();
});

window.addEventListener('offline', () => {
    isOnline = false;
    showToast('Sem conexão de rede. O app continuará funcionando offline.');
    render();
});

// Capturar evento de instalação PWA
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    render();
});

function triggerPWAInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            showToast('Obrigado por instalar o TMS RUN!');
        }
        deferredPrompt = null;
        render();
    });
}

function dismissPWAInstall() {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
        banner.style.animation = 'slideOutBottom 0.3s forwards';
        setTimeout(() => {
            render();
        }, 300);
    }
}

function renderInstallBanner() {
    if (!deferredPrompt || localStorage.getItem('pwa_prompt_dismissed') === 'true') return '';
    return `
        <div id="pwa-install-banner" class="pwa-install-banner">
            <div class="pwa-banner-content">
                <span class="pwa-banner-icon">📲</span>
                <div>
                    <h4 class="pwa-banner-title">Instalar TMS RUN</h4>
                    <p class="pwa-banner-desc">Adicione à tela inicial para acesso rápido e modo offline.</p>
                </div>
            </div>
            <div class="pwa-banner-actions">
                <button class="btn-pwa-install" onclick="triggerPWAInstall()">Instalar</button>
                <button class="btn-pwa-dismiss" onclick="dismissPWAInstall()">Depois</button>
            </div>
        </div>
    `;
}


// --- Funções de Chat (Logística e Resposta Automática) ---
function sendMessage() {
    const input = document.getElementById('msg-input');
    if (!input || !input.value.trim()) return;
    const chatArea = document.getElementById('msg-chat-area');
    if (!chatArea) return;

    const text = input.value.trim();
    
    // 1. Mensagem do Usuário
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg-user';
    userMsg.textContent = text;
    chatArea.appendChild(userMsg);
    chatArea.scrollTop = chatArea.scrollHeight;
    input.value = '';

    // 2. Simular Agente Digitando
    const typingId = 'typing-' + Date.now();
    const typingMsg = document.createElement('div');
    typingMsg.id = typingId;
    typingMsg.className = 'chat-msg-typing';
    typingMsg.textContent = 'Agente RUN está digitando...';
    chatArea.appendChild(typingMsg);
    chatArea.scrollTop = chatArea.scrollHeight;

    // 3. Responder após pequeno delay (500ms)
    setTimeout(() => {
        const area = document.getElementById('msg-chat-area');
        if (!area) return;

        const indicator = document.getElementById(typingId);
        if (indicator) indicator.remove();

        const msg = text.toLowerCase();
        let reply = "Recebi sua mensagem. Um supervisor foi notificado e entrará em contato.";

        if (msg.includes('oi') || msg.includes('ola') || msg.includes('olá')) {
            reply = "Olá! Como posso ajudar na sua operação hoje?";
        } else if (msg.includes('ajuda') || msg.includes('suporte')) {
            reply = "Estou aqui para ajudar. Você precisa de auxílio com uma rota ou com o aplicativo?";
        } else if (msg.includes('entrega') || msg.includes('pacote') || msg.includes('pedido')) {
            reply = "Entendi. Se houver algum problema, use o botão 'Reportar Problema' na aba de Entregas.";
        } else if (msg.includes('obrigado') || msg.includes('ok') || msg.includes('valeu')) {
            reply = "Por nada! Tenha uma excelente rota. 🚛";
        }

        const botMsg = document.createElement('div');
        botMsg.className = 'chat-msg-bot';
        botMsg.textContent = reply;
        area.appendChild(botMsg);
        area.scrollTop = area.scrollHeight;
    }, 500);
}

const deliveriesData = [
    { id: '101', name: 'João Silva', address: 'Rua das Flores, 123', cep: '01234-000', status: 'todo', lat: -23.5684, lng: -46.6502 },
    { id: '102', name: 'Maria Santos', address: 'Av. Paulista, 1500', cep: '01311-200', status: 'todo', lat: -23.5615, lng: -46.6562 },
    { id: '103', name: 'Pedro Oliveira', address: 'Rua Augusta, 500', cep: '01305-000', status: 'done', lat: -23.5489, lng: -46.6496 },
    { id: '104', name: 'Ana Costa', address: 'Alameda Santos, 200', cep: '01419-001', status: 'problems', lat: -23.5721, lng: -46.6431 },
    { id: '105', name: 'Carlos Souza', address: 'Rua Haddock Lobo, 800', cep: '01414-001', status: 'todo', lat: -23.5583, lng: -46.6669 },
    { id: '106', name: 'Lucia Lima', address: 'Rua Oscar Freire, 1000', cep: '01426-000', status: 'done', lat: -23.5651, lng: -46.6698 }
];

let vehiclesData = [
    { name: 'Mercedes Sprinter', plate: 'ABC-1234', health: 80, info: 'Próxima Troca de Óleo: 200km', color: '#EF4444' },
    { name: 'Fiorino Cargo', plate: 'XYZ-9876', health: 10, info: 'Manutenção em dia', color: '#22C55E' }
];

let customTabsData = [];

function renderDeliveryCard(d) {
    const isSelected = currentState.selectedDeliveryId === d.id ? 'selected' : '';
    return `
        <div class="delivery-card ${isSelected}" style="padding: 20px; border-radius: 15px; margin-bottom: 15px; background: white; border: 1px solid #E2E8F0; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; cursor: pointer; transition: all 0.2s;" onclick="selectDelivery('${d.id}')">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div class="name" style="font-size: 1.1rem; color: var(--primary-blue); font-weight: 800;">👤 ${d.name}</div>
                <div style="font-size: 0.8rem; font-weight: 700; color: ${d.status === 'done' ? '#22C55E' : (d.status === 'problems' ? '#EF4444' : '#64748B')};">
                    ${d.status === 'done' ? '✅ FEITO' : (d.status === 'problems' ? '⚠️ PROBLEMA' : '⏳ A FAZER')}
                </div>
            </div>
            <div style="font-weight: 600; color: #475569; font-size: 0.9rem;">📍 ${d.address}</div>
            <div style="color: #94A3B8; font-size: 0.85rem; margin-top: 5px;">📮 CEP: ${d.cep}</div>
            
            <!-- Ações Mobile (Oculto no Desktop) -->
            <div class="delivery-card-actions-mobile" style="display: none; gap: 10px; margin-top: 15px;">
                ${d.status === 'todo' ? `
                    <button class="btn-success" style="flex: 1; padding: 10px; font-size: 0.85rem;" onclick="event.stopPropagation(); setDeliveryAction('${d.id}', 'entregar')">Entregar</button>
                    <button class="btn-danger" style="flex: 1; padding: 10px; font-size: 0.85rem;" onclick="event.stopPropagation(); setDeliveryAction('${d.id}', 'problema')">Problema</button>
                ` : ''}
            </div>
        </div>
    `;
}

function selectDelivery(id) {
    currentState.selectedDeliveryId = id;
    currentState.deliveryActionState = null; // reset action
    render();
}

function setDeliveryAction(id, action) {
    currentState.selectedDeliveryId = id;
    currentState.deliveryActionState = action;
    render();
}

function renderDeliveryRightPanel() {
    if (!currentState.selectedDeliveryId) {
        return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #94A3B8; text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 20px;">📦</div>
                <h3 style="font-size: 1.2rem; font-weight: 600;">Selecione uma entrega</h3>
                <p style="font-size: 0.9rem;">Clique em um card na lista à esquerda para ver os detalhes ou realizar uma baixa.</p>
            </div>
        `;
    }

    const d = deliveriesData.find(x => x.id === currentState.selectedDeliveryId);
    if (!d) return '';

    if (d.status !== 'todo') {
        return `
            <div class="form-section-title">Detalhes da Entrega</div>
            <div style="margin-bottom: 20px;">
                <h2 style="color: var(--text-main); margin-bottom: 5px;">${d.name}</h2>
                <p style="color: var(--text-muted);">${d.address} - ${d.cep}</p>
            </div>
            <div style="padding: 20px; background: ${d.status === 'done' ? '#F0FDF4' : '#FEF2F2'}; border-radius: var(--radius-md); border-left: 5px solid ${d.status === 'done' ? 'var(--success)' : 'var(--error)'};">
                <h3 style="color: ${d.status === 'done' ? 'var(--success)' : 'var(--error)'}; margin-bottom: 10px;">
                    ${d.status === 'done' ? '✅ Entrega Realizada' : '⚠️ Problema Reportado'}
                </h3>
                <p style="font-size: 0.9rem; color: var(--text-muted);">Esta entrega já foi processada.</p>
            </div>
        `;
    }

    if (!currentState.deliveryActionState) {
        return `
            <div class="form-section-title">Ações da Entrega</div>
            <div style="margin-bottom: 20px;">
                <h2 style="color: var(--text-main); margin-bottom: 5px;">${d.name}</h2>
                <p style="color: var(--text-muted);">${d.address}</p>
            </div>
            <div class="action-grid" style="display: flex; flex-direction: column; gap: 15px;">
                <button class="btn-success" onclick="setDeliveryAction('${d.id}', 'entregar')">✅ Confirmar Entrega</button>
                <button class="btn-danger" onclick="setDeliveryAction('${d.id}', 'problema')">⚠️ Reportar Problema</button>
                <button class="btn-entrar" style="background: var(--text-muted); color: white;" onclick="openGPS('${d.id}')">📍 Abrir no GPS</button>
            </div>
        `;
    }

    if (currentState.deliveryActionState === 'entregar') {
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #F0F0F0; padding-bottom: 10px;">
                <div style="font-size: 1.2rem; font-weight: 700; color: var(--success);">Confirmar Entrega</div>
                <button onclick="setDeliveryAction('${d.id}', null)" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.5rem;">&times;</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 15px; flex: 1; overflow-y: auto; padding-right: 5px;">
                <div class="input-group">
                    <label style="font-weight: 600; font-size: 0.9rem;">Nome do Recebedor</label>
                    <input type="text" class="input-field" placeholder="Ex: João da Silva">
                </div>
                <div class="input-group">
                    <label style="font-weight: 600; font-size: 0.9rem;">RG ou CPF</label>
                    <input type="text" class="input-field" placeholder="000.000.000-00">
                </div>
                <div class="input-group">
                    <label style="font-weight: 600; font-size: 0.9rem;">Parentesco</label>
                    <input type="text" class="input-field" placeholder="Ex: Próprio, Mãe, Porteiro">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="upload-box" onclick="showToast('Abrindo câmera...')">
                        <span style="font-size: 1.5rem;">📸</span>
                        <span style="font-size: 0.8rem; font-weight: 600;">Foto Local</span>
                    </div>
                    <div class="upload-box" onclick="showToast('Abrindo câmera...')">
                        <span style="font-size: 1.5rem;">📦</span>
                        <span style="font-size: 0.8rem; font-weight: 600;">Foto Pacote</span>
                    </div>
                </div>
                <div class="input-group">
                    <label style="font-weight: 600; font-size: 0.9rem;">Assinatura</label>
                    <div class="signature-pad"></div>
                </div>
                <button class="btn-success" style="margin-top: 10px;" onclick="updateDeliveryStatus('${d.id}', 'done')">Finalizar Entrega</button>
            </div>
        `;
    }

    if (currentState.deliveryActionState === 'problema') {
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #F0F0F0; padding-bottom: 10px;">
                <div style="font-size: 1.2rem; font-weight: 700; color: var(--error);">Reportar Problema</div>
                <button onclick="setDeliveryAction('${d.id}', null)" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.5rem;">&times;</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 15px; flex: 1; overflow-y: auto; padding-right: 5px;">
                <div class="input-group">
                    <label style="font-weight: 600; font-size: 0.9rem;">Motivo da Falha</label>
                    <select class="input-field">
                        <option value="">Selecione um motivo...</option>
                        <option value="ausente">Ausente</option>
                        <option value="nao_localizado">Não localizado</option>
                        <option value="carro_quebrado">Carro quebrado</option>
                        <option value="fora_rota">Fora de rota</option>
                        <option value="furto">Furto</option>
                        <option value="recusa">Recusa em receber</option>
                    </select>
                </div>
                <div class="upload-box" style="padding: 30px;" onclick="showToast('Abrindo câmera...')">
                    <span style="font-size: 2rem;">📸</span>
                    <span style="font-size: 0.9rem; font-weight: 600;">Adicionar Foto do Ocorrido</span>
                </div>
                <div class="input-group">
                    <label style="font-weight: 600; font-size: 0.9rem;">Observação</label>
                    <textarea class="input-field" placeholder="Descreva o problema detalhadamente..."></textarea>
                </div>
                <button class="btn-danger" style="margin-top: 10px;" onclick="updateDeliveryStatus('${d.id}', 'problems')">Registrar Problema</button>
            </div>
        `;
    }
}


function sidebarTemplate() {
    const items = [
        { id: 'home', label: 'Home', icon: '🏠', roles: ['admin', 'gestao', 'operador'] },
        { id: 'control_tower', label: 'Torre de Controle', icon: '📡', roles: ['admin', 'gestao'] },
        { id: 'deliveries', label: 'Entregas', icon: '📦', roles: ['admin', 'gestao'] },
        { id: 'collection', label: 'Coleta', icon: '📥', roles: ['admin', 'gestao'] },
        { id: 'finance', label: 'Financeiro', icon: '💰', roles: ['admin'] },
        { id: 'fleet', label: 'Frota', icon: '🚛', roles: ['admin', 'gestao'] },
        { id: 'calendar', label: 'Calendário', icon: '📅', roles: ['admin', 'gestao'] },
        { id: 'messages', label: 'Mensagens', icon: '💬', roles: ['admin', 'gestao', 'operador'] },
        { id: 'profile', label: 'Perfil', icon: '👤', roles: ['admin', 'gestao', 'operador'] }
    ];

    // Adiciona as abas customizadas
    customTabsData.forEach((tab, index) => {
        items.push({ id: 'custom_' + index, label: tab, icon: '📁', roles: ['admin', 'gestao'] });
    });

    const allowedItems = items.filter(item => item.roles.includes(currentState.userRole));

    const showSettings = currentState.userRole === 'admin';

    return `
        <aside class="sidebar">
            <div class="sidebar-header" style="padding: 20px; background: white; margin-bottom: 20px; border-bottom: 2px solid #F0F0F0; display: flex; align-items: center; justify-content: center;">
                <img src="assets/logo_run.png" style="width: 100%; max-width: 180px; height: auto; object-fit: contain;" alt="RUN">
            </div>
            <div class="sidebar-menu">
                ${allowedItems.map(item => `
                    <div class="nav-item-sidebar ${currentState.screen === item.id ? 'active' : ''}" onclick="navigate('${item.id}')">
                        ${item.icon} ${item.label}
                    </div>
                `).join('')}
            </div>
            <div class="sidebar-footer" style="padding: 20px;">
                ${showSettings ? `<div class="nav-item-sidebar ${currentState.screen === 'settings' ? 'active' : ''}" onclick="navigate('settings')">⚙️ Configurações</div>` : ''}
                <div class="nav-item-sidebar" onclick="handleLogout()">🚪 Sair</div>
            </div>
        </aside>
    `;
}

function progressBar(label, value, color) {
    const max = 25; // Baseado em pacotes da rota
    const width = (value / max) * 100;
    return `
        <div class="bar-row">
            <div class="bar-info">
                <div class="dot" style="background: ${color};"></div>
                ${label}
            </div>
            <div class="bar-container">
                <div class="bar-fill" style="width: ${width}%; background: ${color};"></div>
                <span class="bar-value">${value}</span>
            </div>
        </div>
    `;
}

const screens = {
    login: () => `
        <div class="login-page-container">
            <header class="login-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="assets/logo_run.png" style="height: 60px; width: auto; object-fit: contain;" alt="RUN">
                </div>
                <nav class="login-nav">
                    <span style="cursor: pointer;" onclick="showToast('Em breve!')">Enviar pacotes</span>
                    <span style="cursor: pointer;" onclick="showToast('Em breve!')">Rastrear pacotes</span>
                    <span style="cursor: pointer;" onclick="showToast('Em breve!')">Fazer entregas</span>
                    <span style="cursor: pointer;" onclick="showToast('Em breve!')">Central de Ajuda</span>
                </nav>
            </header>
            
            <main class="login-main">
                <div class="login-content-wrapper">
                    <div class="login-hero">
                        <h1>Vem com a RUN!</h1>
                        <p>Tecnologia que simplifica sua experiência de envios.</p>
                    </div>

                    <div class="login-form-container">
                        ${currentState.isForgotPassword ? `
                            <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 25px; color: #1E293B;">Recuperar Senha</h2>
                            <p style="color: #64748B; margin-bottom: 15px;">Digite seu e-mail para receber as instruções.</p>
                            <div class="input-group" style="margin-bottom: 20px;">
                                <input type="email" id="forgot-email" class="input-field" placeholder="Seu Email" autocapitalize="none" autocorrect="off" spellcheck="false">
                            </div>
                            <button class="btn-entrar" onclick="handleForgotPassword()">Enviar Link</button>
                            <div style="text-align: center; margin-top: 20px;">
                                <a href="javascript:void(0)" onclick="toggleForgotPassword(false)" class="forgot-password" style="font-weight: 600; color: #64748B;">← Voltar ao Login</a>
                            </div>
                        ` : `
                            <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 25px; color: #1E293B;">Login</h2>
                            <div class="input-group" style="margin-bottom: 5px;">
                                <input type="text" id="login-email" class="input-field" placeholder="Email ou Telefone" autocapitalize="none" autocorrect="off" spellcheck="false">
                            </div>
                            <div class="input-group" style="margin-bottom: 5px;">
                                <input type="password" id="login-password" class="input-field" placeholder="Senha">
                            </div>
                            <div style="display: flex; justify-content: flex-end; align-items: center; width: 100%; margin: 10px 0 20px;">
                                 <a href="javascript:void(0)" onclick="toggleForgotPassword(true)" class="forgot-password" style="font-weight: 600; color: #64748B;">esqueceu a senha?</a>
                            </div>
                            <button class="btn-entrar" onclick="handleLogin()">Entrar</button>
                        `}
                    </div>
                </div>
            </main>
        </div>
    `,
    home: () => {
        const today = new Date().toLocaleDateString('pt-BR');
        const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        // Se estiver escaneando (seja operador ou admin)
        if (currentState.isScanning) {
            const isAdminProduct = currentState.scannerContext === 'admin_product';
            return `
            <div class="app-layout">
                ${sidebarTemplate()}
                <div class="main-content" style="background: var(--background-light);">
                    <header class="content-header" style="flex-direction: column; align-items: flex-start; padding: 25px 20px; background: var(--primary-blue); color: white; border-radius: 0 0 25px 25px; width: 100%; border: none;">
                        <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 5px;">
                            <div style="font-weight: 700; font-size: 1.1rem; display: flex; align-items: center; gap: 10px;">
                                📷 ${isAdminProduct ? 'Bipar Produto' : 'Scanner de Rota'}
                            </div>
                            <div style="font-weight: 600;">${nowTime}</div>
                        </div>
                        <div style="font-size: 0.9rem; opacity: 0.9;">🗓️ ${today}</div>
                    </header>
                    <div class="associar-rota-container" style="padding: 20px 10px;">
                        <div class="associar-rota-card" style="gap: 15px; max-width: 550px; width: 100%; margin: 0 auto; box-shadow: var(--shadow-premium); border-radius: var(--radius-xl);">
                            <h3 style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); text-align: center;">
                                ${isAdminProduct ? 'Bipar Produto' : 'Escanear Pacote'}
                            </h3>
                            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 5px; text-align: center;">
                                ${isAdminProduct ? 'Aponte o leitor para o QR Code do pacote ou utilize a simulação de bipe abaixo.' : 'Aponte o leitor para o QR Code impresso na etiqueta do pacote.'}
                            </p>
                            
                            <div class="scanner-viewport" style="margin-bottom: 15px;">
                                <video id="scanner-video-feed" class="scanner-video" autoplay playsinline style="display: none;"></video>
                                <div id="scanner-mock" class="scanner-mock-preview" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);">
                                    <span class="scanner-mock-qrcode" style="animation: pulse 2s infinite;">🔳</span>
                                    <small style="color: rgba(255,255,255,0.7); font-weight: 600;">Leitor Ativo (Câmera Simulada)</small>
                                </div>
                                <div class="scanner-target-box"></div>
                                <div class="scanner-corner tl"></div>
                                <div class="scanner-corner tr"></div>
                                <div class="scanner-corner bl"></div>
                                <div class="scanner-corner br"></div>
                                <div class="scanner-laser-line"></div>
                            </div>
                            
                            ${isAdminProduct ? `
                            <!-- Simulador de Bipe de Pacote específico (Exigido pelo Usuário) -->
                            <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: var(--radius-lg); padding: 18px; width: 100%; display: flex; flex-direction: column; gap: 12px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); margin-bottom: 5px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-bottom: 4px;">
                                    <span style="font-weight: 800; font-size: 0.85rem; color: var(--primary-blue); text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">📦 Pacote Detectado (Bipado)</span>
                                    <span style="background: #D1FFED; color: #00875A; font-weight: 800; font-size: 0.75rem; padding: 2px 8px; border-radius: 20px;">Leitura OK</span>
                                </div>
                                
                                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.9rem;">
                                    <div><strong>Número do Pacote:</strong> <span style="font-family: monospace; font-weight: 700; color: #1E293B; background: #E2E8F0; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem;">6457897</span></div>
                                    <div><strong>Destinatário:</strong> <span style="color: #475569; font-weight: 600;">Ana Maria Silva</span></div>
                                    <div><strong>Endereço:</strong> <span style="color: #475569; font-size: 0.85rem;">Rua Augusta, 450 - Consolação, São Paulo - SP</span></div>
                                </div>

                                <div style="border-top: 1px solid #E2E8F0; padding-top: 12px; display: flex; flex-direction: column; gap: 6px;">
                                    <label for="route-select" style="font-weight: 700; color: var(--text-main); font-size: 0.85rem; display: flex; align-items: center; gap: 4px;">🚚 Incluir em qual rota ?</label>
                                    <select id="route-select" class="input-field" style="padding: 10px; border-radius: 8px; border: 1.5px solid #CBD5E1; font-weight: 600; background: white; cursor: pointer; color: #1E293B;">
                                        <option value="SP">São Paulo (SP)</option>
                                        <option value="RJ">Rio de Janeiro (RJ)</option>
                                        <option value="GO">Goiás (GO)</option>
                                    </select>
                                </div>

                                <button class="btn-entrar" style="background: var(--success); padding: 12px; font-weight: 700; font-size: 0.95rem; display: flex; justify-content: center; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2); margin-top: 5px;" onclick="confirmAdminBipe()">
                                    ✅ Confirmar e Incluir na Rota
                                </button>
                            </div>
                            ` : ''}
                            
                            <div style="display: flex; flex-direction: column; width: 100%; gap: 10px; margin-top: 5px;">
                                ${!isAdminProduct ? `<button class="btn-entrar" style="background: var(--success); padding: 12px;" onclick="triggerScanSuccess()">⚡ Forçar Bipe de Sucesso</button>` : ''}
                                <button class="btn-entrar" style="background: #64748B; padding: 12px;" onclick="cancelQRScanner()">Cancelar Leitura</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }

        if (currentState.userRole === 'operador') {
            if (!currentState.hasRoute) {
                return `
                <div class="app-layout">
                    ${sidebarTemplate()}
                    <div class="main-content" style="background: var(--background-light);">
                        <header class="content-header" style="flex-direction: column; align-items: flex-start; padding: 25px 20px; background: var(--primary-blue); color: white; border-radius: 0 0 25px 25px; width: 100%; border: none;">
                            <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 5px;">
                                <div style="font-weight: 700; font-size: 1.1rem;">Sem Rota Ativa</div>
                                <div style="font-weight: 600;">${nowTime}</div>
                            </div>
                            <div style="font-size: 0.9rem; opacity: 0.9;">🗓️ ${today}</div>
                        </header>
                        <div class="associar-rota-container">
                            <div class="associar-rota-card">
                                <div style="font-size: 4.5rem; margin-bottom: 10px;">📲</div>
                                <h2 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main);">Associar Rota</h2>
                                <p style="color: var(--text-muted); line-height: 1.5; font-size: 0.95rem;">Escanear o QR Code de um pacote de entrega para vincular a rota correspondente ao seu perfil de motorista.</p>
                                <button class="btn-entrar" style="padding: 16px; font-size: 1.05rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-premium); background: var(--primary-blue); margin-top: 15px;" onclick="startQRScanner()">📷 Escanear QR Code</button>
                                <button class="btn-entrar" style="padding: 12px; font-size: 0.9rem; border-radius: var(--radius-lg); background: #F1F5F9; color: var(--text-main); border: 1.5px dashed #CBD5E1; box-shadow: none;" onclick="simulateQuickScan()">Simular Associação Direta</button>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            }

            const total = deliveriesData.length;
            const done = deliveriesData.filter(d => d.status === 'done').length;
            const problems = deliveriesData.filter(d => d.status === 'problems').length;
            const todo = deliveriesData.filter(d => d.status === 'todo').length;

            return `
            <div class="app-layout">
                ${sidebarTemplate()}
                <div class="main-content" style="background: #F8FAFC;">
                    <div class="driver-home-active-layout">
                        <header class="content-header" style="flex-direction: column; align-items: flex-start; padding: 20px 20px; background: var(--primary-blue); color: white; border-radius: 0 0 25px 25px; flex-shrink: 0; border: none;">
                            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; margin-bottom: 5px;">
                                <div style="font-weight: 800; font-size: 1.25rem; display: flex; align-items: center; gap: 10px;">🛣️ Rota Zona Sul <span class="badge green" style="font-size: 0.7rem; font-weight: 800; padding: 3px 8px; border-radius: 20px; background: #D1FFED; color: #00875A;">ATIVA</span></div>
                                <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.8;">${nowTime}</div>
                            </div>
                            <div style="font-size: 0.8rem; opacity: 0.8; font-weight: 500;">🗓️ ${today} | Felipe (Motorista)</div>
                        </header>
                        
                        <div class="driver-map-wrapper">
                            <div id="driver-map"></div>
                        </div>
                        
                        <div class="driver-route-bottom-sheet">
                            <div style="width: 40px; height: 5px; background: #CBD5E1; border-radius: 10px; margin: 0 auto 15px; flex-shrink: 0;"></div>
                            
                            <div class="driver-header-summary" style="margin-bottom: 15px; flex-shrink: 0;">
                                <div class="driver-stat-box">
                                    <div class="val" style="color: var(--text-main); font-size: 1.5rem;">${total}</div>
                                    <div class="lbl" style="font-size: 0.65rem;">Total</div>
                                </div>
                                <div class="driver-stat-box" style="border: 2.5px solid var(--primary-blue);">
                                    <div class="val" style="color: var(--primary-blue); font-size: 1.5rem;">${todo}</div>
                                    <div class="lbl" style="color: var(--primary-blue); font-size: 0.65rem;">A Fazer</div>
                                </div>
                                <div class="driver-stat-box">
                                    <div class="val" style="color: var(--error); font-size: 1.5rem;">${problems}</div>
                                    <div class="lbl" style="color: var(--error); font-size: 0.65rem;">Problemas</div>
                                </div>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-shrink: 0;">
                                <h4 style="font-weight: 800; color: var(--text-main); font-size: 1.05rem; margin: 0;">Lista de Entregas</h4>
                                <div style="display: flex; gap: 5px;">
                                    <button class="tab active" style="font-size: 0.75rem; padding: 6px 12px; border-radius: 15px; background: #EFF6FF; color: var(--primary-blue); font-weight: 700; border: none; cursor: default;">Roteiro Atual</button>
                                </div>
                            </div>
                            
                            <div class="delivery-list" style="overflow-y: auto;">
                                ${deliveriesData.map(renderDeliveryCardDriver).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                ${renderDriverModal()}
            </div>
            `;
        }

        // --- Admin / Gestão View ---
        const total = deliveriesData.length;
        const done = deliveriesData.filter(d => d.status === 'done').length;
        const problems = deliveriesData.filter(d => d.status === 'problems').length;
        const todo = deliveriesData.filter(d => d.status === 'todo').length;
        const eff = total > 0 ? Math.round((done / total) * 100) : 0;

        return `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header">
                    <div style="font-weight: 700; color: var(--primary-blue); font-size: 1.1rem;">Rota #ROTA-SP-CENTRO</div>
                    <div style="display: flex; align-items: center; gap: 15px; color: #64748B; font-weight: 600;">
                        <span>🗓️ ${today}</span>
                    </div>
                </header>
                <div style="padding: 40px; overflow-y: auto;">
                    <h1 style="font-size: 2.2rem; font-weight: 800; margin-bottom: 30px;">Painel de Desempenho</h1>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px;">
                        <div class="stat-card" style="background: var(--primary-blue); color: white; border: none; padding: 25px;">
                            <div class="label" style="color: rgba(255,255,255,0.8); font-size: 0.9rem;">Eficiência</div>
                            <div style="font-size: 2.5rem; font-weight: 800;">${eff}%</div>
                        </div>
                        <div class="stat-card" style="padding: 25px;">
                            <div class="label" style="color: var(--text-muted); font-size: 0.9rem;">Total de Pacotes</div>
                            <div style="font-size: 2.5rem; font-weight: 800; color: var(--text-main);">${total}</div>
                        </div>
                        <div class="stat-card" style="padding: 25px; border-bottom: 4px solid var(--success);">
                            <div class="label" style="color: var(--text-muted); font-size: 0.9rem;">Feitos</div>
                            <div style="font-size: 2.5rem; font-weight: 800; color: var(--success);">${done}</div>
                        </div>
                        <div class="stat-card" style="padding: 25px; border-bottom: 4px solid var(--warning);">
                            <div class="label" style="color: var(--text-muted); font-size: 0.9rem;">Em Aberto</div>
                            <div style="font-size: 2.5rem; font-weight: 800; color: var(--warning);">${todo}</div>
                        </div>
                        <div class="stat-card" style="padding: 25px; border-bottom: 4px solid var(--error);">
                            <div class="label" style="color: var(--text-muted); font-size: 0.9rem;">Problemas</div>
                            <div style="font-size: 2.5rem; font-weight: 800; color: var(--error);">${problems}</div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr; gap: 30px;">
                        <div style="background: white; padding: 30px; border-radius: var(--radius-xl); box-shadow: var(--shadow-sm);">
                            <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 20px;">Progresso da Rota</h2>
                            <div class="delivery-bars">
                                ${progressBar('Completado', done, 'var(--success)')}
                                ${progressBar('Em rota', todo, 'var(--primary-blue)')}
                                ${progressBar('Problemas', problems, 'var(--error)')}
                            </div>
                        </div>

                        <!-- Seção de Leitor de Códigos de Produto -->
                        <div style="background: white; padding: 30px; border-radius: var(--radius-xl); box-shadow: var(--shadow-sm);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px;">
                                <div>
                                    <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-main);">📸 Bipar Produto</h2>
                                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 5px;">Gerencie o bipamento de pacotes para o motorista e faça a alocação instantânea em rotas.</p>
                                </div>
                                <button class="btn-entrar" style="width: auto; padding: 12px 24px; display: flex; align-items: center; gap: 8px; font-weight: 700;" onclick="startAdminProductScanner()">
                                    📷 Bipar Produto
                                </button>
                            </div>
                            
                            <div style="overflow-x: auto;">
                                <table class="scanned-products-table" style="width: 100%; border-collapse: collapse; text-align: left;">
                                    <thead>
                                        <tr style="border-bottom: 2px solid #E2E8F0; color: #475569; font-weight: 700; font-size: 0.9rem;">
                                            <th style="padding: 12px 15px;">Nº Pacote</th>
                                            <th style="padding: 12px 15px;">Destinatário e Endereço</th>
                                            <th style="padding: 12px 15px;">Rota</th>
                                            <th style="padding: 12px 15px;">Data/Hora</th>
                                            <th style="padding: 12px 15px;">Status</th>
                                            <th style="padding: 12px 15px; text-align: center;">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${scannedProductsData.length === 0 ? `
                                            <tr>
                                                <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted); font-weight: 500;">
                                                    Nenhum pacote bipado nesta sessão. Clique em "Bipar Produto" para iniciar.
                                                </td>
                                            </tr>
                                        ` : scannedProductsData.map(p => `
                                            <tr style="border-bottom: 1px solid #E2E8F0; font-size: 0.95rem;">
                                                <td style="padding: 15px; font-weight: 700; color: var(--primary-blue); font-family: monospace; font-size: 1.05rem;">🏷️ ${p.code}</td>
                                                <td style="padding: 15px;">
                                                    <div style="font-weight: 700; color: var(--text-main);">${p.name || 'Produto Geral'}</div>
                                                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 3px;">📍 ${p.address || 'Sem endereço especificado'}</div>
                                                </td>
                                                <td style="padding: 15px;">
                                                    <span class="badge blue" style="font-size: 0.8rem; font-weight: 700; padding: 4px 10px; border-radius: 12px; background: #E0F2FE; color: #0369A1; border: none;">
                                                        📌 Rota ${p.route || 'N/A'}
                                                    </span>
                                                </td>
                                                <td style="padding: 15px; color: #475569; white-space: nowrap;">🕒 ${p.timestamp}</td>
                                                <td style="padding: 15px;">
                                                    <span class="badge green" style="font-size: 0.75rem; font-weight: 800; padding: 4px 10px; border-radius: 20px; background: #D1FFED; color: #00875A;">
                                                        ${p.status}
                                                    </span>
                                                </td>
                                                <td style="padding: 15px; text-align: center;">
                                                    <button onclick="removerProdutoEscaneado('${p.id}')" style="background: none; border: none; color: var(--error); font-weight: 700; cursor: pointer; padding: 5px 10px; border-radius: 5px; transition: background 0.2s;" onmouseover="this.style.background='#FEF2F2'" onmouseout="this.style.background='none'">
                                                        🗑️ Excluir
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    },
    control_tower: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header">
                    <h1 style="font-size: 1.5rem; font-weight: 800; color: var(--primary-blue);">Torre de Controle (Real-time)</h1>
                </header>
                <div style="padding: 40px; display: grid; grid-template-columns: 2fr 1fr; gap: 30px;">
                    <div style="background: #e5e7eb; border-radius: 30px; height: 500px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; box-shadow: inset 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="font-size: 1.2rem; color: #4b5563; z-index: 1;">MAPA DE OPERAÇÕES EM TEMPO REAL</div>
                        <!-- Marcadores Simulados -->
                        <div style="position: absolute; top: 30%; left: 40%; background: #22C55E; color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; box-shadow: 0 5px 15px rgba(34,197,94,0.4);">🚛 Felipe - EM ROTA</div>
                        <div style="position: absolute; top: 60%; left: 70%; background: #EF4444; color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; box-shadow: 0 5px 15px rgba(239,68,68,0.4);">🚛 Marcos - PARADO</div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div style="background: white; padding: 25px; border-radius: 20px; box-shadow: var(--shadow-sm);">
                            <h3 style="margin-bottom: 15px;">Operadores Ativos</h3>
                            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 15px;">
                                <div style="width: 10px; height: 10px; background: #22C55E; border-radius: 50%;"></div>
                                <span>12 Motoristas em rota</span>
                            </div>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <div style="width: 10px; height: 10px; background: #EF4444; border-radius: 50%;"></div>
                                <span>2 Motoristas com problemas</span>
                            </div>
                        </div>
                        <div style="background: white; padding: 25px; border-radius: 20px; box-shadow: var(--shadow-sm);">
                            <h3 style="margin-bottom: 15px;">Alertas Críticos</h3>
                            <div style="padding: 10px; background: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 10px; font-size: 0.85rem; margin-bottom: 10px;">
                                <strong>Atraso detectado:</strong> Rota #992 está 15min atrasada.
                            </div>
                            <div style="padding: 10px; background: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 10px; font-size: 0.85rem;">
                                <strong>Sem sinal:</strong> Motorista "Carlos" há 30min sem GPS.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    finance: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header">
                    <h1 style="font-size: 1.5rem; font-weight: 800; color: var(--primary-blue);">Gestão Financeira</h1>
                </header>
                <div style="padding: 40px;">
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px;">
                        <div style="background: white; padding: 25px; border-radius: 25px; border-bottom: 5px solid #22C55E; box-shadow: var(--shadow-sm);">
                            <small style="color: #666;">Faturamento Mensal</small>
                            <h2 style="font-size: 1.8rem; font-weight: 800; color: #1e293b; margin-top: 5px;">R$ 45.200,00</h2>
                        </div>
                        <div style="background: white; padding: 25px; border-radius: 25px; border-bottom: 5px solid #EF4444; box-shadow: var(--shadow-sm);">
                            <small style="color: #666;">Custos Operacionais</small>
                            <h2 style="font-size: 1.8rem; font-weight: 800; color: #1e293b; margin-top: 5px;">R$ 12.850,00</h2>
                        </div>
                        <div style="background: white; padding: 25px; border-radius: 25px; border-bottom: 5px solid var(--primary-blue); box-shadow: var(--shadow-sm);">
                            <small style="color: #666;">Lucro Previsto</small>
                            <h2 style="font-size: 1.8rem; font-weight: 800; color: #1e293b; margin-top: 5px;">R$ 32.350,00</h2>
                        </div>
                    </div>

                    <div style="background: white; border-radius: 25px; overflow: hidden; box-shadow: var(--shadow-sm);">
                        <div style="padding: 20px; background: #f8fafc; border-bottom: 2px solid #EEE; display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="margin: 0;">Últimos Faturamentos</h3>
                            <button class="btn-entrar" style="width: auto; padding: 8px 15px; font-size: 0.8rem;" onclick="exportarPDF()">Exportar PDF</button>
                        </div>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="text-align: left; background: #f8fafc;">
                                    <th style="padding: 15px;">Data</th>
                                    <th>Cliente</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="border-bottom: 1px solid #F0F0F0;">
                                    <td style="padding: 15px;">05/03/2026</td>
                                    <td>Ecommerce Global</td>
                                    <td>R$ 2.450,00</td>
                                    <td><span style="background: #D1FFED; color: #00875A; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 800;">PAGO</span></td>
                                </tr>
                                <tr style="border-bottom: 1px solid #F0F0F0;">
                                    <td style="padding: 15px;">04/03/2026</td>
                                    <td>Logística Express</td>
                                    <td>R$ 1.100,00</td>
                                    <td><span style="background: #FFE8D1; color: #D47A00; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 800;">PENDENTE</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
    fleet: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header">
                    <h1 style="font-size: 1.5rem; font-weight: 800; color: var(--primary-blue);">Gestão de Frota</h1>
                </header>
                <div style="padding: 40px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                        <h2 style="font-size: 1.2rem;">Veículos Ativos (${vehiclesData.length})</h2>
                        <button class="btn-entrar" style="width: auto; padding: 10px 25px;" onclick="adicionarVeiculo()">+ Novo Veículo</button>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 25px;">
                        ${vehiclesData.map(v => `
                            <div style="background: white; padding: 25px; border-radius: 25px; box-shadow: var(--shadow-sm); display: flex; gap: 20px;">
                                <div style="font-size: 3rem;">🚛</div>
                                <div style="flex: 1;">
                                    <h3 style="margin: 0;">${v.name}</h3>
                                    <div style="color: #666; font-size: 0.9rem; margin-bottom: 10px;">Placa: ${v.plate}</div>
                                    <div style="height: 4px; background: #eee; border-radius: 2px; position: relative;">
                                        <div style="width: ${v.health}%; height: 100%; background: ${v.color}; border-radius: 2px;"></div>
                                    </div>
                                    <small style="display: block; margin-top: 5px; color: ${v.color}; font-weight: 700;">${v.info}</small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `,
    deliveries: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header">
                    <h1 style="font-size: 1.5rem; font-weight: 800; color: var(--primary-blue);">Gestão de Entregas</h1>
                </header>
                
                <div class="tabs-container" style="margin: 20px 40px; margin-top: 20px;">
                    <div class="tab ${currentState.activeTab === 'todo' ? 'active' : ''}" onclick="setTab('todo')">A FAZER</div>
                    <div class="tab ${currentState.activeTab === 'done' ? 'active' : ''}" onclick="setTab('done')">FEITO</div>
                    <div class="tab ${currentState.activeTab === 'problems' ? 'active' : ''}" onclick="setTab('problems')">PROBLEMAS</div>
                </div>

                <div class="content-padding" style="padding: 0 40px 40px;">
                    <div class="delivery-split-view">
                        <div class="deliveries-left-col">
                            <div class="search-container" style="margin-bottom: 25px;">
                                <input type="text" id="search-input" class="input-field" placeholder="Buscar por nome, endereço ou CEP...">
                            </div>
                            <div class="delivery-list" id="delivery-list-container">
                                <!-- Gerado dinamicamente -->
                            </div>
                        </div>
                        <div class="deliveries-right-col right-panel-desktop" id="delivery-details-container">
                            ${renderDeliveryRightPanel()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    collection: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header"><h1>Coleta</h1></header>
                <div style="padding: 40px; text-align: center;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">📥</div>
                    <h2>Nenhuma coleta agendada para hoje</h2>
                </div>
            </div>
        </div>
    `,
    calendar: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header"><h1>Calendário</h1></header>
                <div style="padding: 40px;">
                    <h3>Março 2026</h3>
                    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-top: 20px; background: white; padding: 20px; border-radius: 20px;">
                        ${Array.from({ length: 31 }, (_, i) => `<div style="padding: 15px; border: 1px solid #EEE; text-align: center; border-radius: 10px;">${i + 1}</div>`).join('')}
                    </div>
                </div>
            </div>
        </div>
    `,
    messages: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header"><h1>Mensagens & Suporte</h1></header>
                <div style="display: flex; flex-direction: column; height: calc(100vh - 70px);">
                    <div id="msg-chat-area" style="flex: 1; padding: 40px; overflow-y: auto; background: #F0F2F5; display: flex; flex-direction: column;">
                        <div style="background: white; padding: 15px 20px; border-radius: 15px 15px 15px 0; max-width: 70%; margin-bottom: 15px;">
                            Olá Felipe! Como podemos ajudar você hoje?
                        </div>
                    </div>
                    <div style="padding: 20px; background: white; border-top: 1px solid #EEE; display: flex; gap: 10px;">
                        <input type="text" id="msg-input" class="input-field" placeholder="Digite sua mensagem..." onkeydown="if(event.key==='Enter') sendMessage()">
                        <button class="btn-entrar" style="width: auto; padding: 0 30px;" onclick="sendMessage()">Enviar</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    profile: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header"><h1>Meu Perfil</h1></header>
                <div style="padding: 40px; max-width: 600px;">
                    <div style="background: white; padding: 40px; border-radius: 30px; box-shadow: var(--shadow-sm);">
                        <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 30px;">
                            <div style="width: 80px; height: 80px; background: var(--primary-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: 800;">F</div>
                            <div>
                                <h2 style="margin: 0;">Felipe Moreira</h2>
                                <p style="color: #666; margin: 5px 0 0;">Motorista Agente</p>
                            </div>
                        </div>
                        <div class="input-group" style="margin-bottom: 20px;">
                            <label>Telefone</label>
                            <input type="text" class="input-field" value="(11) 99999-8888" disabled>
                        </div>
                        <div class="input-group">
                            <label>CNH</label>
                            <input type="text" class="input-field" value="12345678910" disabled>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    settings: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header">
                    <h1 style="font-size: 1.5rem; font-weight: 800; color: var(--primary-blue);">Configurações</h1>
                </header>

                <div class="tabs-container" style="margin: 20px 40px;">
                    <button class="tab ${currentState.activeSettingsTab === 'access' ? 'active' : ''}" onclick="setSettingsTab('access')">Gestão de Acessos</button>
                    <button class="tab ${currentState.activeSettingsTab === 'tabs' ? 'active' : ''}" onclick="setSettingsTab('tabs')">Gerenciar Abas</button>
                    <button class="tab ${currentState.activeSettingsTab === 'pwa' ? 'active' : ''}" onclick="setSettingsTab('pwa')">Aplicativo PWA</button>
                </div>

                <div style="padding: 0 40px 40px;">
                    ${currentState.activeSettingsTab === 'access' ? `
                        <div style="background: white; padding: 30px; border-radius: 20px; box-shadow: var(--shadow-sm);">
                            <h2 style="margin-bottom: 20px;">Classificação de Níveis</h2>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px;">
                                <div style="padding: 20px; background: #EEF2FF; border-radius: 15px; border: 2px solid ${currentState.userRole === 'admin' ? 'var(--primary-blue)' : 'transparent'}">
                                    <h3 style="color: var(--primary-blue);">ADMIN</h3>
                                    <p style="font-size: 0.85rem; color: #666;">Acesso total ao sistema, configurações e gestão financeira.</p>
                                    <button class="btn-entrar" style="margin-top: 10px; font-size: 0.8rem; padding: 8px;" onclick="setRole('admin')">Ativar</button>
                                </div>
                                <div style="padding: 20px; background: #F0FDF4; border-radius: 15px; border: 2px solid ${currentState.userRole === 'gestao' ? 'var(--success)' : 'transparent'}">
                                    <h3 style="color: var(--success);">GESTÃO</h3>
                                    <p style="font-size: 0.85rem; color: #666;">Acesso às visualizações permitidas pelo Administrador.</p>
                                    <button class="btn-entrar" style="margin-top: 10px; font-size: 0.8rem; padding: 8px; background: var(--success);" onclick="setRole('gestao')">Ativar</button>
                                </div>
                                <div style="padding: 20px; background: #FFF7ED; border-radius: 15px; border: 2px solid ${currentState.userRole === 'operador' ? 'var(--accent-orange)' : 'transparent'}">
                                    <h3 style="color: var(--accent-orange);">OPERADOR</h3>
                                    <p style="font-size: 0.85rem; color: #666;">Acesso limitado às ferramentas de operação diária.</p>
                                    <button class="btn-entrar" style="margin-top: 10px; font-size: 0.8rem; padding: 8px;" onclick="setRole('operador')">Ativar</button>
                                </div>
                            </div>

                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="text-align: left; border-bottom: 2px solid #EEE;">
                                        <th style="padding: 15px;">Módulo</th>
                                        <th>Admin</th>
                                        <th>Gestão</th>
                                        <th>Operador</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style="border-bottom: 1px solid #F0F0F0;">
                                        <td style="padding: 15px;">Financeiro</td>
                                        <td>✅</td>
                                        <td>❌</td>
                                        <td>❌</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid #F0F0F0;">
                                        <td style="padding: 15px;">Relatórios Avançados</td>
                                        <td>✅</td>
                                        <td>✅</td>
                                        <td>❌</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 15px;">Operação (Entregas)</td>
                                        <td>✅</td>
                                        <td>✅</td>
                                        <td>✅</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ` : currentState.activeSettingsTab === 'tabs' ? `
                        <div style="background: white; padding: 30px; border-radius: 20px; box-shadow: var(--shadow-sm); text-align: center;">
                            <div style="font-size: 3rem; margin-bottom: 20px;">📂</div>
                            <h2>Adicionar Novas Abas</h2>
                            <p style="color: #666; margin-bottom: 30px;">Personalize o menu lateral adicionando módulos específicos.</p>
                            <div style="max-width: 400px; margin: 0 auto; display: flex; gap: 10px;">
                                <input type="text" id="new-tab-input" class="input-field" placeholder="Nome da nova aba...">
                                <button class="btn-entrar" style="width: auto; white-space: nowrap; padding: 0 20px;" onclick="adicionarAba()">Adicionar</button>
                            </div>
                        </div>
                    ` : `
                        <div style="background: white; padding: 30px; border-radius: 20px; box-shadow: var(--shadow-sm); text-align: center; max-width: 600px; margin: 0 auto;">
                            <div style="font-size: 4rem; margin-bottom: 20px;">📲</div>
                            <h2>Versão do Aplicativo (PWA)</h2>
                            <p style="color: #666; margin-bottom: 25px; line-height: 1.5;">O TMS RUN pode ser instalado diretamente no seu celular ou computador sem precisar usar a Google Play Store ou App Store. Isso permite acesso instantâneo e funcionamento offline.</p>
                            
                            <div style="margin: 20px 0; padding: 20px; border-radius: 15px; background: #F8FAFC; display: flex; flex-direction: column; align-items: center; gap: 10px; border: 1px solid #E2E8F0;">
                                <span style="font-weight: 700; color: #475569;">Status do Dispositivo:</span>
                                <span id="pwa-status-text" style="padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 800; background: #EFF6FF; color: var(--primary-blue);">Verificando...</span>
                            </div>
                            
                            <div style="margin-top: 30px;">
                                <button id="btn-settings-install" class="btn-entrar" style="max-width: 300px; margin: 0 auto; display: none;" onclick="triggerPWAInstall()">Instalar Aplicativo</button>
                                <p id="pwa-installed-msg" style="color: var(--success); font-weight: 700; display: none; font-size: 1.1rem;">✓ O aplicativo já está instalado e pronto para uso offline!</p>
                            </div>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `,
    forgot: () => `
        <div class="screen-login" style="justify-content: flex-start; background-color: var(--primary-blue); height: 100vh; display: flex; flex-direction: column; align-items: center;">
             <div class="login-top" style="padding-top: 40px; margin-bottom: 20px; text-align: center;">
                <div class="logo-container" style="margin-bottom: 10px;">
                     <img src="assets/logo_run.png" style="height: 60px; filter: brightness(0) invert(1);" alt="RUN">
                </div>
                <h2 style="font-size: 3rem; font-weight: 700; color: white; margin-bottom: 15px;">Esqueceu<br>a senha?</h2>
                <p style="opacity: 0.9; font-size: 0.9rem; max-width: 250px; margin: 0 auto; line-height: 1.4; color: white;">NÃO SE PREOCUPE, LOGO ENVIAREMOS NO SEU E-MAIL</p>
            </div>
            <div class="login-form-container" style="flex: 1; border-radius: 40px 40px 0 0; max-width: 500px; width: 100%; display: flex; flex-direction: column; align-items: stretch; padding: 40px 30px;">
                <div class="input-group" style="margin-bottom: 20px;">
                    <label style="color: var(--text-main); font-weight: 500; margin-bottom: 8px; font-size: 0.95rem;">Email</label>
                    <div style="position: relative;">
                         <input type="email" id="forgot-email" class="input-field" placeholder="Enter your Email" style="padding-left: 20px;" autocapitalize="none" autocorrect="off" spellcheck="false">
                    </div>
                </div>
                <button class="btn-entrar" onclick="handleForgotPassword()" style="background: var(--primary-blue); box-shadow: 0 5px 15px rgba(0, 80, 160, 0.3);">Redefinir Senha</button>
                
                <a href="javascript:void(0)" onclick="navigate('login')" class="forgot-password" style="margin-top: 30px; color: var(--text-main); font-weight: 500; font-size: 1rem;">← Voltar ao Login</a>
            </div>
        </div>
    `
};

function handleLogin() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pass = document.getElementById('login-password').value;
    const btn = document.querySelector('.btn-entrar[onclick="handleLogin()"]');

    if (!email || !pass) {
        showToast('Preencha email e senha.');
        return;
    }

    if (btn) { btn.textContent = 'Entrando...'; btn.disabled = true; }

    setTimeout(() => {
        if (email === 'felipe.dev@gmail.com' && pass === '123456') {
            currentState.userRole = 'admin';
            navigate('home');
        } else if (email === 'motorista123@gmail.com' && pass === '123456') {
            currentState.userRole = 'operador';
            navigate('home');
        } else {
            showToast('Credenciais incorretas. Tente novamente.');
            if (btn) { btn.textContent = 'Entrar'; btn.disabled = false; }
        }
    }, 600);
}

function navigate(screen) {
    app.classList.add('fade-out');
    setTimeout(() => {
        currentState.screen = screen;
        render();
        app.classList.remove('fade-out');
        app.classList.add('fade-in');
        setTimeout(() => app.classList.remove('fade-in'), 300);
    }, 200);
}

function setTab(tab) {
    currentState.activeTab = tab;
    render();
}

function setSettingsTab(tab) {
    currentState.activeSettingsTab = tab;
    render();
}

function setRole(role) {
    currentState.userRole = role;
    render();
    showToast(`Nível de acesso alterado para: ${role.toUpperCase()}`);
}

function updateDeliveryStatus(id, status) {
    const item = deliveriesData.find(d => d.id === id);
    if (item) {
        item.status = status;
        render();
        showToast(status === 'done' ? 'Entrega confirmada!' : 'Problema reportado com sucesso.');
    }
}

function render() {
    saveStateToLocalStorage();

    // If the active screen is a custom tab
    if (currentState.screen.startsWith('custom_')) {
        const tabIndex = parseInt(currentState.screen.replace('custom_', ''));
        const tabName = customTabsData[tabIndex];
        app.innerHTML = `
            <div class="app-layout">
                ${sidebarTemplate()}
                <div class="main-content">
                    <header class="content-header">
                        <h1 style="font-size: 1.5rem; font-weight: 800; color: var(--primary-blue);">${tabName}</h1>
                    </header>
                    <div style="padding: 40px; text-align: center;">
                        <div style="font-size: 4rem; margin-bottom: 20px;">📂</div>
                        <h2>Aba ${tabName} (Módulo Vazio)</h2>
                        <p style="color: #666;">O conteúdo para este módulo customizado ainda não foi definido.</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        app.innerHTML = screens[currentState.screen]();
    }

    if (currentState.screen === 'home' && currentState.userRole === 'operador' && currentState.hasRoute) {
        initDriverMap();
    }

    if (currentState.screen === 'deliveries') {
        const listContainer = document.getElementById('delivery-list-container');
        if (listContainer) {
            const filtered = deliveriesData.filter(d => d.status === currentState.activeTab);
            listContainer.innerHTML = filtered.length > 0 ? filtered.map(renderDeliveryCard).join('') : '<div style="text-align:center; padding: 60px; opacity: 0.5;"><h3>Nenhuma entrega encontrada nesta aba</h3></div>';
        }
    }

    // Injetar o banner de instalação se o prompt de PWA estiver ativo
    const installBannerHtml = renderInstallBanner();
    if (installBannerHtml) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = installBannerHtml;
        app.appendChild(tempDiv.firstElementChild);
    }

    // Injetar o badge de status de conexão em todos os headers presentes na tela
    const headers = document.querySelectorAll('.content-header');
    headers.forEach(header => {
        if (header.querySelector('.online-badge')) return;
        
        const badgeContainer = document.createElement('div');
        badgeContainer.innerHTML = renderOnlineBadge();
        const badgeEl = badgeContainer.firstElementChild;
        
        // Se for o header do motorista ativo (que possui style flexDirection "column" ou classes associadas)
        if (header.style.flexDirection === 'column' || header.closest('.driver-home-active-layout')) {
            const flexRow = header.querySelector('div[style*="display: flex"]');
            if (flexRow) {
                const titleContainer = flexRow.querySelector('div[style*="font-weight: 800"]');
                if (titleContainer) {
                    titleContainer.appendChild(badgeEl);
                } else {
                    flexRow.appendChild(badgeEl);
                }
            } else {
                header.appendChild(badgeEl);
            }
        } else {
            // Headers padrão: insere após o primeiro título H1 ou Div
            const titleElement = header.querySelector('h1') || header.querySelector('div');
            if (titleElement) {
                titleElement.style.display = 'flex';
                titleElement.style.alignItems = 'center';
                titleElement.style.gap = '10px';
                titleElement.appendChild(badgeEl);
            } else {
                header.appendChild(badgeEl);
            }
        }
    });

    // Atualizar status do PWA na tela de configurações
    if (currentState.screen === 'settings' && currentState.activeSettingsTab === 'pwa') {
        setTimeout(() => {
            const statusText = document.getElementById('pwa-status-text');
            const btnInstall = document.getElementById('btn-settings-install');
            const installedMsg = document.getElementById('pwa-installed-msg');
            
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
            
            if (statusText) {
                if (isStandalone) {
                    statusText.textContent = 'Executando como Aplicativo (Instalado)';
                    statusText.style.background = '#D1FFED';
                    statusText.style.color = '#00875A';
                    if (installedMsg) installedMsg.style.display = 'block';
                    if (btnInstall) btnInstall.style.display = 'none';
                } else if (deferredPrompt) {
                    statusText.textContent = 'Pronto para Instalação';
                    statusText.style.background = '#EFF6FF';
                    statusText.style.color = 'var(--primary-blue)';
                    if (installedMsg) installedMsg.style.display = 'none';
                    if (btnInstall) btnInstall.style.display = 'block';
                } else {
                    statusText.textContent = 'Acessado via Navegador';
                    statusText.style.background = '#FFE8D1';
                    statusText.style.color = '#D47A00';
                    if (installedMsg) installedMsg.style.display = 'none';
                    if (btnInstall) btnInstall.style.display = 'none';
                }
            }
        }, 20);
    }
}

// Carregar estado salvo antes do render inicial
loadStateFromLocalStorage();

// Initial render
render();

// ---- Helper Functions ----

function showToast(msg) {
    let toast = document.getElementById('toast-msg');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-msg';
        toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#1E293B;color:white;padding:12px 24px;border-radius:30px;font-weight:600;z-index:9999;box-shadow:0 8px 20px rgba(0,0,0,0.2);transition:opacity 0.3s;';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

function handleLogout() {
    if (confirm('Deseja realmente sair?')) {
        navigate('login');
    }
}

function exportarPDF() {
    window.print();
    showToast('Iniciando impressão / exportação de PDF...');
}

function adicionarVeiculo() {
    const nome = prompt('Nome do novo veículo:');
    if (nome && nome.trim()) {
        const placa = prompt('Placa do veículo (ex: ABC-1234):') || '---';
        vehiclesData.push({
            name: nome.trim(),
            plate: placa.toUpperCase(),
            health: 10,
            info: 'Manutenção em dia',
            color: '#22C55E'
        });
        render();
        showToast(`Veículo "${nome.trim()}" adicionado com sucesso!`);
    }
}

function adicionarAba() {
    const input = document.getElementById('new-tab-input');
    if (!input || !input.value.trim()) { showToast('Digite o nome da aba.'); return; }
    const tabName = input.value.trim();
    customTabsData.push(tabName);
    render();
    showToast(`Aba "${tabName}" adicionada!`);
    input.value = '';
}




function handleForgotPassword() {
    const emailInput = document.getElementById('forgot-email');
    if (!emailInput || !emailInput.value.trim()) {
        showToast('Digite seu e-mail para redefinir a senha.');
        return;
    }
    showToast(`Link de redefinição enviado para ${emailInput.value.trim()}`);
}

function openGPS(deliveryId) {
    const item = deliveriesData.find(d => d.id === deliveryId);
    if (item) {
        const query = encodeURIComponent(item.address + ', ' + item.cep);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
}

// Busca funcional na tela de entregas
document.addEventListener('input', function(e) {
    if (e.target && e.target.id === 'search-input') {
        const query = e.target.value.toLowerCase();
        const container = document.getElementById('delivery-list-container');
        if (!container) return;
        const filtered = deliveriesData.filter(d =>
            d.status === currentState.activeTab &&
            (d.name.toLowerCase().includes(query) ||
             d.address.toLowerCase().includes(query) ||
             d.cep.includes(query))
        );
        if (filtered.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding: 60px; opacity: 0.5;"><h3>Nenhuma entrega encontrada</h3></div>';
        } else {
            container.innerHTML = filtered.map(renderDeliveryCard).join('');
        }
    }
});

function toggleForgotPassword(show) {
    currentState.isForgotPassword = show;
    render();
}

// --- Funções Exclusivas do Motorista (Mobile-First) ---
function renderDeliveryCardDriver(d) {
    return `
        <div class="delivery-card" style="padding: 20px; border-radius: 15px; margin-bottom: 15px; background: white; border: 1px solid #E2E8F0; box-shadow: var(--shadow-sm); display: flex; flex-direction: column;" onclick="openDriverModal('${d.id}')">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div class="name" style="font-size: 1.1rem; color: var(--primary-blue); font-weight: 800;">👤 ${d.name}</div>
                <button class="btn-entrar" style="width: auto; padding: 5px 10px; font-size: 0.8rem; background: #F1F5F9; color: var(--text-main); border: 1px solid #CBD5E1; box-shadow: none;" onclick="event.stopPropagation(); openGPS('${d.id}')">📍 GPS</button>
            </div>
            <div style="font-weight: 600; color: #475569; font-size: 0.9rem;">📍 ${d.address}</div>
            <div style="color: #94A3B8; font-size: 0.85rem; margin-top: 5px;">📮 CEP: ${d.cep}</div>
            
            ${d.status === 'todo' ? `
                <div style="color: var(--primary-blue); font-weight: 700; font-size: 0.85rem; margin-top: 15px; text-align: center; background: #EFF6FF; padding: 10px; border-radius: 10px;">Tocar para opções de entrega</div>
            ` : `
                <div style="font-size: 0.85rem; font-weight: 700; color: ${d.status === 'done' ? '#22C55E' : '#EF4444'}; margin-top: 15px;">
                    ${d.status === 'done' ? '✅ FEITO' : '⚠️ PROBLEMA'}
                </div>
            `}
        </div>
    `;
}

function openDriverModal(id) {
    if (currentState.userRole !== 'operador') return;
    const d = deliveriesData.find(x => x.id === id);
    if (!d || d.status !== 'todo') return; 
    currentState.selectedDeliveryId = id;
    currentState.deliveryActionState = null;
    render();
}

function closeDriverModal() {
    currentState.selectedDeliveryId = null;
    currentState.deliveryActionState = null;
    render();
}

function renderDriverModal() {
    if (!currentState.selectedDeliveryId) return '';
    const d = deliveriesData.find(x => x.id === currentState.selectedDeliveryId);
    if (!d) return '';

    let content = '';

    if (!currentState.deliveryActionState) {
        content = `
            <h2 style="font-size: 1.5rem; margin-bottom: 10px; color: var(--primary-blue);">Opções de Entrega</h2>
            <p style="color: var(--text-muted); margin-bottom: 25px; font-weight: 600;">${d.name} <br> <span style="font-size: 0.9rem; font-weight: 400;">${d.address}</span></p>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <button class="btn-success" style="padding: 20px; font-size: 1.1rem; border-radius: 15px;" onclick="setDeliveryAction('${d.id}', 'entregar')">✅ Entregar Pacote</button>
                <button class="btn-danger" style="padding: 20px; font-size: 1.1rem; border-radius: 15px;" onclick="setDeliveryAction('${d.id}', 'problema')">⚠️ Relatar Problema</button>
            </div>
        `;
    } else if (currentState.deliveryActionState === 'entregar') {
        content = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="font-size: 1.3rem; color: var(--success); margin: 0;">✅ Confirmar Entrega</h2>
                <button onclick="setDeliveryAction('${d.id}', null)" style="background: none; border: none; font-size: 1.5rem; color: #94A3B8; cursor: pointer;">&larr;</button>
            </div>
            <div class="input-group" style="margin-bottom: 15px;">
                <label style="font-weight: 600; font-size: 0.9rem;">Nome do Recebedor</label>
                <input type="text" class="input-field" placeholder="Quem recebeu?">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div class="input-group">
                    <label style="font-weight: 600; font-size: 0.9rem;">RG ou CPF</label>
                    <input type="text" class="input-field" placeholder="000.000.000-00">
                </div>
                <div class="input-group">
                    <label style="font-weight: 600; font-size: 0.9rem;">Parentesco</label>
                    <input type="text" class="input-field" placeholder="Ex: Próprio...">
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div class="upload-box" style="padding: 20px; background: #F8FAFC;" onclick="showToast('Abrindo câmera...')">
                    <span style="font-size: 1.5rem;">📸</span><br><small style="font-weight:600;">Foto Local</small>
                </div>
                <div class="upload-box" style="padding: 20px; background: #F8FAFC;" onclick="showToast('Abrindo câmera...')">
                    <span style="font-size: 1.5rem;">📦</span><br><small style="font-weight:600;">Foto Pacote</small>
                </div>
            </div>
            <div class="input-group" style="margin-bottom: 20px;">
                <label style="font-weight: 600; font-size: 0.9rem;">Assinatura</label>
                <div class="signature-pad" style="height: 100px;"></div>
            </div>
            <button class="btn-success" style="padding: 20px; font-size: 1.1rem; border-radius: 15px;" onclick="closeAndComplete('${d.id}', 'done')">Finalizar Entrega</button>
        `;
    } else if (currentState.deliveryActionState === 'problema') {
        content = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="font-size: 1.3rem; color: var(--error); margin: 0;">⚠️ Relatar Problema</h2>
                <button onclick="setDeliveryAction('${d.id}', null)" style="background: none; border: none; font-size: 1.5rem; color: #94A3B8; cursor: pointer;">&larr;</button>
            </div>
            <div class="input-group" style="margin-bottom: 15px;">
                <label style="font-weight: 600; font-size: 0.9rem;">Motivo da Falha</label>
                <select class="input-field">
                    <option value="">Selecione um motivo...</option>
                    <option value="ausente">Ausente</option>
                    <option value="nao_localizado">Não localizado</option>
                    <option value="carro_quebrado">Carro quebrado</option>
                    <option value="fora_rota">Fora de rota</option>
                    <option value="furto">Furto</option>
                    <option value="recusa">Recusa em receber</option>
                </select>
            </div>
            <div class="upload-box" style="padding: 30px; margin-bottom: 15px; background: #F8FAFC;" onclick="showToast('Abrindo câmera...')">
                <span style="font-size: 2rem;">📸</span><br><small style="font-weight:600;">Adicionar Foto do Ocorrido</small>
            </div>
            <div class="input-group" style="margin-bottom: 20px;">
                <label style="font-weight: 600; font-size: 0.9rem;">Observação</label>
                <textarea class="input-field" placeholder="Descreva o problema detalhadamente..."></textarea>
            </div>
            <button class="btn-danger" style="padding: 20px; font-size: 1.1rem; border-radius: 15px;" onclick="closeAndComplete('${d.id}', 'problems')">Registrar Problema</button>
        `;
    }

    return `
        <div class="driver-modal-overlay" onclick="closeDriverModal()">
            <div class="driver-modal-content" onclick="event.stopPropagation()">
                <div style="width: 50px; height: 6px; background: #E2E8F0; border-radius: 10px; margin: 0 auto 20px;"></div>
                ${content}
            </div>
        </div>
    `;
}

function closeAndComplete(id, status) {
    updateDeliveryStatus(id, status);
    closeDriverModal();
}

// --- Funções de Scanner e Mapa (Nova Funcionalidade) ---
let streamRef = null;
let driverMapInstance = null;

function playBeepSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
            audioCtx.close();
        }, 150);
    } catch (e) {
        console.error("Audio error:", e);
    }
}

function startQRScanner() {
    if (currentState.scannerContext !== 'admin_product') {
        currentState.scannerContext = 'driver_route';
    }
    currentState.isScanning = true;
    render();
    
    const video = document.getElementById('scanner-video-feed');
    const mock = document.getElementById('scanner-mock');
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            streamRef = stream;
            if (video) {
                video.srcObject = stream;
                video.style.display = 'block';
            }
            if (mock) {
                mock.style.display = 'none';
            }
            
            setTimeout(() => {
                if (currentState.isScanning) {
                    triggerScanSuccess();
                }
            }, 3000);
        })
        .catch(err => {
            console.log("Erro na câmera (usando simulador):", err);
            if (mock) {
                const label = mock.querySelector('small');
                if (label) label.textContent = 'Simulando Scanner...';
            }
            
            setTimeout(() => {
                if (currentState.isScanning) {
                    triggerScanSuccess();
                }
            }, 3000);
        });
}

function startAdminProductScanner() {
    currentState.scannerContext = 'admin_product';
    startQRScanner();
}

function cancelQRScanner() {
    if (streamRef) {
        streamRef.getTracks().forEach(track => track.stop());
        streamRef = null;
    }
    currentState.isScanning = false;
    render();
}

function simulateQuickScan() {
    triggerScanSuccess();
}

function triggerScanSuccess(scannedCode = null) {
    playBeepSound();
    if (streamRef) {
        streamRef.getTracks().forEach(track => track.stop());
        streamRef = null;
    }
    currentState.isScanning = false;
    
    if (currentState.scannerContext === 'admin_product') {
        let code = scannedCode;
        if (!code) {
            const userInput = prompt("Digite o código do produto (ou cancele para gerar automático):");
            code = (userInput && userInput.trim()) ? userInput.trim().toUpperCase() : `RUN-PRD-${Math.floor(1000 + Math.random() * 9000)}`;
        }
        
        const newProduct = {
            id: 'PRD-' + Date.now(),
            code: code,
            timestamp: new Date().toLocaleString('pt-BR'),
            status: 'Recebido'
        };
        scannedProductsData.unshift(newProduct);
        showToast(`Produto ${code} escaneado!`);
    } else {
        currentState.hasRoute = true;
        showToast("Pacote bipado! Rota Zona Sul associada com sucesso.");
    }
    
    navigate('home');
}

function confirmAdminBipe() {
    const routeSelect = document.getElementById('route-select');
    const route = routeSelect ? routeSelect.value : 'SP';
    
    playBeepSound();
    
    if (streamRef) {
        streamRef.getTracks().forEach(track => track.stop());
        streamRef = null;
    }
    currentState.isScanning = false;
    
    const newProduct = {
        id: 'PRD-' + Date.now(),
        code: '6457897',
        name: 'Ana Maria Silva',
        address: 'Rua Augusta, 450 - Consolação, São Paulo - SP',
        route: route,
        timestamp: new Date().toLocaleString('pt-BR'),
        status: 'Roteirizado'
    };
    
    scannedProductsData.unshift(newProduct);
    saveStateToLocalStorage();
    showToast(`Pacote 6457897 incluído na Rota ${route}!`);
    navigate('home');
}

function removerProdutoEscaneado(id) {
    if (confirm("Deseja realmente remover este produto da lista de recebidos?")) {
        scannedProductsData = scannedProductsData.filter(p => p.id !== id);
        saveStateToLocalStorage();
        render();
        showToast("Produto removido.");
    }
}

function initDriverMap() {
    setTimeout(() => {
        const mapDiv = document.getElementById('driver-map');
        if (!mapDiv) return;

        if (driverMapInstance) {
            try {
                driverMapInstance.remove();
            } catch (e) {
                console.error("Map removal error:", e);
            }
            driverMapInstance = null;
        }

        const center = [-23.5615, -46.6562];
        driverMapInstance = L.map('driver-map', {
            zoomControl: false,
            attributionControl: false
        }).setView(center, 14);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 20
        }).addTo(driverMapInstance);

        L.control.zoom({
            position: 'bottomright'
        }).addTo(driverMapInstance);

        deliveriesData.forEach((d, idx) => {
            if (!d.lat || !d.lng) return;

            let markerColorClass = '';
            if (d.status === 'done') markerColorClass = 'done';
            else if (d.status === 'problems') markerColorClass = 'problem';

            const customIcon = L.divIcon({
                className: 'custom-leaflet-marker-wrapper',
                html: `<div class="custom-delivery-pin ${markerColorClass}">${idx + 1}</div>`,
                iconSize: [32, 40],
                iconAnchor: [16, 40],
                popupAnchor: [0, -36]
            });

            const marker = L.marker([d.lat, d.lng], { icon: customIcon }).addTo(driverMapInstance);
            
            const popupContent = `
                <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 5px;">
                    <div style="font-weight: 800; color: var(--primary-blue); font-size: 0.95rem; margin-bottom: 3px;">👤 ${d.name}</div>
                    <div style="font-weight: 600; color: #475569; font-size: 0.75rem; line-height: 1.3;">📍 ${d.address}</div>
                    <div style="margin-top: 8px; display: flex; gap: 5px;">
                        <span style="font-size: 0.7rem; font-weight: 800; padding: 2px 6px; border-radius: 10px; background: ${d.status === 'done' ? '#D1FFED' : (d.status === 'problems' ? '#FFD1D1' : '#EFF6FF')}; color: ${d.status === 'done' ? '#00875A' : (d.status === 'problems' ? '#D40000' : 'var(--primary-blue)')};">
                            ${d.status === 'done' ? 'FEITO' : (d.status === 'problems' ? 'PROBLEMA' : 'A FAZER')}
                        </span>
                    </div>
                </div>
            `;
            marker.bindPopup(popupContent);
        });
    }, 50);
}
