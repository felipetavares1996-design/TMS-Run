// --- TMS RUN - LOGISTICS SYSTEM & PWA ---

// --- DADOS FICTÍCIOS DE INICIALIZAÇÃO ---
const DEFAULT_DRIVERS = [
    { id: 'DRV-001', name: 'João Silva', plate: 'BRA2E19', vehicle: 'Fiorino Cargo', battery: 88, status: 'Em Rota', lat: -23.5582, lng: -46.6611 },
    { id: 'DRV-002', name: 'Maria Souza', plate: 'FLT8C42', vehicle: 'Vito Furgão', battery: 95, status: 'Em Rota', lat: -23.5422, lng: -46.6218 },
    { id: 'DRV-003', name: 'Carlos Lima', plate: 'RUN1A90', vehicle: 'Mobi Trekking', battery: 62, status: 'Pendente', lat: -23.5701, lng: -46.6402 }
];

const DEFAULT_DELIVERIES = [
    {
        id: 'NF-100234',
        nf: '00234',
        recipient: 'Ana Maria Silva',
        address: 'Alameda Santos, 1000 - Cerqueira César, São Paulo - SP',
        lat: -23.5654,
        lng: -46.6512,
        status: 'em rota',
        sla: '16:00',
        base: 'SMT',
        driverId: 'DRV-001',
        pod: null,
        occurrence: null
    },
    {
        id: 'NF-100235',
        nf: '00235',
        recipient: 'Roberto Oliveira',
        address: 'Rua Augusta, 1200 - Consolação, São Paulo - SP',
        lat: -23.5534,
        lng: -46.6575,
        status: 'pendente',
        sla: '17:30',
        base: 'SMT',
        driverId: 'DRV-001',
        pod: null,
        occurrence: null
    },
    {
        id: 'NF-100236',
        nf: '00236',
        recipient: 'Lúcia Fernandes',
        address: 'Av. Paulista, 2000 - Bela Vista, São Paulo - SP',
        lat: -23.5592,
        lng: -46.6586,
        status: 'entregue',
        sla: '14:00',
        base: 'MCO',
        driverId: 'DRV-001',
        pod: {
            signature: '', 
            photo: '',
            receiverName: 'Lucia Fernandes',
            receiverDoc: '42.981.821-X',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            gps: { lat: -23.5593, lng: -46.6585 }
        },
        occurrence: null
    },
    {
        id: 'NF-100237',
        nf: '00237',
        recipient: 'Claudio Souza',
        address: 'Rua Domingos de Morais, 500 - Vila Mariana, São Paulo - SP',
        lat: -23.5790,
        lng: -46.6341,
        status: 'em rota',
        sla: '18:00',
        base: 'MCO',
        driverId: 'DRV-002',
        pod: null,
        occurrence: null
    },
    {
        id: 'NF-100238',
        nf: '00238',
        recipient: 'Juliana Costa',
        address: 'Rua Vergueiro, 1500 - Paraíso, São Paulo - SP',
        lat: -23.5721,
        lng: -46.6408,
        status: 'insucesso',
        sla: '15:30',
        base: 'FO2',
        driverId: 'DRV-002',
        pod: null,
        occurrence: {
            reason: 'Destinatário Ausente',
            notes: 'Fiquei esperando 15 minutos na portaria, morador não atendeu chamados.',
            timestamp: new Date(Date.now() - 7200000).toISOString()
        }
    },
    {
        id: 'NF-100239',
        nf: '00239',
        recipient: 'Marcos Rocha',
        address: 'Av. Brigadeiro Luís Antônio, 2500 - Jardim Paulista, São Paulo - SP',
        lat: -23.5688,
        lng: -46.6482,
        status: 'pendente',
        sla: '19:00',
        base: 'FO2',
        driverId: 'DRV-003',
        pod: null,
        occurrence: null
    }
];

const DEFAULT_VEHICLES = [
    { name: 'Mercedes Sprinter', plate: 'ABC-1234', health: 85, info: 'Manutenção em dia • Pneus novos', color: '#198754' },
    { name: 'Fiorino Cargo', plate: 'XYZ-9876', health: 40, info: 'Troca de óleo necessária em 120km', color: '#FFC107' },
    { name: 'Vito Furgão', plate: 'FLT-8C42', health: 95, info: 'Revisão preventiva efetuada', color: '#198754' }
];

const DEFAULT_MESSAGES = [
    { sender: 'João Silva', text: 'Boa tarde central, acabo de finalizar a parada da NF-00236.', type: 'received', time: '14:02' },
    { sender: 'Central', text: 'Excelente João. Rota seguindo dentro do SLA previsto.', type: 'sent', time: '14:03' },
    { sender: 'Maria Souza', text: 'Tive um insucesso na entrega da NF-00238. Cliente ausente.', type: 'received', time: '15:31' }
];

// --- ESTADO GLOBAL ---
let currentState = {
    screen: 'login', // login, home, control_tower, deliveries, collection, finance, fleet, calendar, messages, profile, settings
    activeTab: 'todo', // deliveries sub-tabs: todo, done, problems
    userRole: 'admin', // admin, gestao, operador
    selectedDeliveryId: null
};

let driversData = [];
let deliveriesData = [];
let vehiclesData = [];
let customTabsData = [];
let scannedProductsData = [];
let chatMessages = [];

// Bases operacionais disponíveis para triagem e atribuição
const AVAILABLE_BASES = ['SMT', 'MCO', 'FO2'];
let currentAutoAssignBase = '';
let currentAutoAssignDriver = '';

let currentFilter = 'all';
let currentSearch = '';
let activeView = 'admin'; // 'admin' ou 'driver' (Visão PWA)
let selectedDriverId = 'DRV-001';
let activeDriverTab = 'list'; // 'list' ou 'map' no PWA

// Controle de ações do motorista (PWA)
let activeDeliveryIdForAction = null;
let capturedPhotoUrl = '';

// Mapas Leaflet
let adminMap = null;
let driverMap = null;
let adminMapGroup = null;
let driverMapGroup = null;

// --- PERSISTÊNCIA ---
function loadState() {
    try {
        const savedState = localStorage.getItem('tms_run_state');
        const savedDrivers = localStorage.getItem('tms_run_drivers');
        const savedDeliveries = localStorage.getItem('tms_run_deliveries');
        const savedVehicles = localStorage.getItem('tms_run_vehicles');
        const savedTabs = localStorage.getItem('tms_run_custom_tabs');
        const savedScanned = localStorage.getItem('tms_run_scanned');
        const savedMessages = localStorage.getItem('tms_run_messages');
        const savedView = localStorage.getItem('tms_run_active_view');
        const savedDriverId = localStorage.getItem('tms_run_selected_driver');

        if (savedState) {
            Object.assign(currentState, JSON.parse(savedState));
        }
        if (savedDrivers) {
            driversData = JSON.parse(savedDrivers);
        } else {
            driversData = JSON.parse(JSON.stringify(DEFAULT_DRIVERS));
        }
        if (savedDeliveries) {
            deliveriesData = JSON.parse(savedDeliveries);
        } else {
            deliveriesData = JSON.parse(JSON.stringify(DEFAULT_DELIVERIES));
        }
        if (savedVehicles) {
            vehiclesData = JSON.parse(savedVehicles);
        } else {
            vehiclesData = JSON.parse(JSON.stringify(DEFAULT_VEHICLES));
        }
        if (savedTabs) {
            customTabsData = JSON.parse(savedTabs);
        } else {
            customTabsData = ['Recebimento', 'Devoluções'];
        }
        if (savedScanned) {
            scannedProductsData = JSON.parse(savedScanned);
        } else {
            scannedProductsData = [];
        }
        if (savedMessages) {
            chatMessages = JSON.parse(savedMessages);
        } else {
            chatMessages = JSON.parse(JSON.stringify(DEFAULT_MESSAGES));
        }
        if (savedView) activeView = savedView;
        if (savedDriverId) selectedDriverId = savedDriverId;

        const savedAutoBase = localStorage.getItem('tms_run_auto_base');
        const savedAutoDriver = localStorage.getItem('tms_run_auto_driver');
        if (savedAutoBase && AVAILABLE_BASES.includes(savedAutoBase)) {
            currentAutoAssignBase = savedAutoBase;
            if (savedAutoDriver) currentAutoAssignDriver = savedAutoDriver;
        }
        
        saveState();
    } catch (e) {
        console.error('Falha ao carregar localStorage, usando padrões:', e);
        driversData = JSON.parse(JSON.stringify(DEFAULT_DRIVERS));
        deliveriesData = JSON.parse(JSON.stringify(DEFAULT_DELIVERIES));
        vehiclesData = JSON.parse(JSON.stringify(DEFAULT_VEHICLES));
        chatMessages = JSON.parse(JSON.stringify(DEFAULT_MESSAGES));
    }
}

function saveState() {
    try {
        localStorage.setItem('tms_run_state', JSON.stringify(currentState));
        localStorage.setItem('tms_run_drivers', JSON.stringify(driversData));
        localStorage.setItem('tms_run_deliveries', JSON.stringify(deliveriesData));
        localStorage.setItem('tms_run_vehicles', JSON.stringify(vehiclesData));
        localStorage.setItem('tms_run_custom_tabs', JSON.stringify(customTabsData));
        localStorage.setItem('tms_run_scanned', JSON.stringify(scannedProductsData));
        localStorage.setItem('tms_run_messages', JSON.stringify(chatMessages));
        localStorage.setItem('tms_run_active_view', activeView);
        localStorage.setItem('tms_run_selected_driver', selectedDriverId);
        localStorage.setItem('tms_run_auto_base', currentAutoAssignBase);
        localStorage.setItem('tms_run_auto_driver', currentAutoAssignDriver);
    } catch (e) {
        console.error('Erro ao salvar no localStorage:', e);
    }
}

// --- HIGIENIZAÇÃO DE HTML (ANTI-XSS) ---
function escapeHTML(str) {
    if (!str) return '';
    return str.toString().replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// --- MENU ESQUERDO (SIDEBAR) ---
function sidebarTemplate() {
    const items = [
        { id: 'home', label: 'Home', icon: '🏠', roles: ['admin', 'gestao', 'operador'] },
        { id: 'control_tower', label: 'Torre de Controle', icon: '📡', roles: ['admin', 'gestao'] },
        { id: 'deliveries', label: 'Entregas', icon: '📦', roles: ['admin', 'gestao'] },
        { id: 'collection', label: 'Bipagem & Coleta', icon: '🏷️', roles: ['admin', 'gestao'] },
        { id: 'finance', label: 'Financeiro', icon: '💰', roles: ['admin'] },
        { id: 'fleet', label: 'Frota', icon: '🚛', roles: ['admin', 'gestao'] },
        { id: 'calendar', label: 'Calendário', icon: '📅', roles: ['admin', 'gestao'] },
        { id: 'messages', label: 'Mensagens', icon: '💬', roles: ['admin', 'gestao', 'operador'] },
        { id: 'profile', label: 'Perfil', icon: '👤', roles: ['admin', 'gestao', 'operador'] }
    ];

    // Adiciona abas customizadas configuradas
    customTabsData.forEach((tab, index) => {
        items.push({ id: 'custom_' + index, label: escapeHTML(tab), icon: '📁', roles: ['admin', 'gestao'] });
    });

    const allowedItems = items.filter(item => item.roles.includes(currentState.userRole));
    const showSettings = currentState.userRole === 'admin';

    return `
        <aside class="sidebar">
            <div class="sidebar-header">
                <img src="assets/logo_run.png" alt="RUN Logo" class="sidebar-logo" onerror="this.src='assets/icon-192.png'">
            </div>
            <div class="sidebar-menu">
                ${allowedItems.map(item => `
                    <div class="nav-item-sidebar ${currentState.screen === item.id ? 'active' : ''}" onclick="navigate('${item.id}')">
                        <span>${item.icon}</span> <span>${item.label}</span>
                    </div>
                `).join('')}
            </div>
            <div class="sidebar-footer">
                ${showSettings ? `
                    <div class="nav-item-sidebar ${currentState.screen === 'settings' ? 'active' : ''}" onclick="navigate('settings')">
                        <span>⚙️</span> <span>Configurações</span>
                    </div>
                ` : ''}
                <div class="nav-item-sidebar" onclick="handleLogout()">
                    <span>🚪</span> <span>Sair</span>
                </div>
            </div>
        </aside>
    `;
}

// --- ELEMENTOS DO GRÁFICO SVG DONUT ---
function getChartSVG() {
    const successCount = deliveriesData.filter(d => d.status === 'entregue').length;
    const pendingCount = deliveriesData.filter(d => d.status === 'pendente' || d.status === 'em rota').length;
    const failureCount = deliveriesData.filter(d => d.status === 'insucesso').length;
    const total = successCount + pendingCount + failureCount;

    const pctSuccess = total > 0 ? (successCount / total) * 100 : 0;
    const pctPending = total > 0 ? (pendingCount / total) * 100 : 0;
    const pctFailure = total > 0 ? (failureCount / total) * 100 : 0;

    return `
    <div class="chart-card" style="padding: 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 20px; background-color: var(--surface);">
        <div class="chart-svg-container" style="position: relative; width: 105px; height: 105px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="105" height="105" viewBox="0 0 36 36" style="transform: rotate(-90deg); width: 100%; height: 100%;">
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--border-light)" stroke-width="4.2"></circle>
                
                <!-- Success Segment -->
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--status-success)" stroke-width="4.2" class="donut-segment"
                    stroke-dasharray="${pctSuccess} ${100 - pctSuccess}" stroke-dashoffset="0"></circle>
                
                <!-- Pending Segment -->
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--status-route)" stroke-width="4.2" class="donut-segment"
                    stroke-dasharray="${pctPending} ${100 - pctPending}" stroke-dashoffset="-${pctSuccess}"></circle>
                
                <!-- Failure Segment -->
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--status-failure)" stroke-width="4.2" class="donut-segment"
                    stroke-dasharray="${pctFailure} ${100 - pctFailure}" stroke-dashoffset="-${pctSuccess + pctPending}"></circle>
            </svg>
            <div style="position: absolute; font-size: 0.725rem; font-weight: 700; color: var(--text-muted); text-align: center; display: flex; flex-direction: column; line-height: 1.1;">
                <span style="font-size: 1.25rem; color: var(--text); font-weight: 800;">${total}</span>
                <span>Total</span>
            </div>
        </div>
        <div class="chart-legend" style="flex: 1; display: flex; flex-direction: column; gap: 8px; font-size: 0.815rem;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 6px; font-weight: 600;"><span style="width: 10px; height: 10px; border-radius: 50%; background-color: var(--status-success); display: inline-block;"></span> Entregues</span>
                <span style="font-weight: 700; color: var(--status-success);">${successCount} (${Math.round(pctSuccess)}%)</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 6px; font-weight: 600;"><span style="width: 10px; height: 10px; border-radius: 50%; background-color: var(--status-route); display: inline-block;"></span> Pendentes</span>
                <span style="font-weight: 700; color: var(--status-route);">${pendingCount} (${Math.round(pctPending)}%)</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 6px; font-weight: 600;"><span style="width: 10px; height: 10px; border-radius: 50%; background-color: var(--status-failure); display: inline-block;"></span> Ocorrências</span>
                <span style="font-weight: 700; color: var(--status-failure);">${failureCount} (${Math.round(pctFailure)}%)</span>
            </div>
        </div>
    </div>
    `;
}

// --- RENDERIZAÇÃO DAS TELAS ADMINISTRATIVAS ---
const screens = {
    // LOGIN
    login: () => `
        <div class="login-container">
            <div class="login-card">
                <div class="login-logo-container">
                    <img src="assets/logo_run.png" alt="RUN Logo" class="login-logo" onerror="this.src='assets/icon-192.png'">
                </div>
                <div style="text-align: center;">
                    <h2 style="font-weight: 800; font-size: 1.5rem;">Acesse sua Conta</h2>
                    <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 4px;">Sistema de Gestão de Transportes e Entregas</p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                    <div class="form-group">
                        <label class="form-label">E-mail Corporativo</label>
                        <input type="email" class="form-input" id="login-email" value="felipe.dev@gmail.com" placeholder="exemplo@gmail.com">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Senha de Acesso</label>
                        <input type="password" class="form-input" id="login-password" value="123456" placeholder="******">
                    </div>
                    <button class="btn-entrar" style="margin-top: 10px;" id="btn-login-submit">Entrar no Sistema</button>
                </div>
                <div style="text-align: center; font-size: 0.775rem; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 16px;">
                    <span>Desenvolvido por <strong>Agily</strong> em parceria com a <strong>RUN</strong>.</span>
                </div>
            </div>
        </div>
    `,

    // HOME (Painel Geral)
    home: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header">
                    <div class="content-title">🏠 Home <span>/ Visão Geral Operacional</span></div>
                    <div class="header-actions" id="admin-header-actions-placeholder"></div>
                </header>
                <div class="content-body" style="display:flex; flex-direction:column; gap:24px;">
                    <div style="background-color:var(--surface); border: 1px solid var(--border); border-radius:var(--radius-lg); padding:30px; display:flex; justify-content:space-between; align-items:center; box-shadow:var(--shadow-sm);">
                        <div>
                            <h2 style="font-size:1.6rem; font-weight:800; color:var(--primary-dark);">Olá, Felipe!</h2>
                            <p style="color:var(--text-muted); font-size:0.95rem; margin-top:4px;">As operações da RUN estão ativas. Você tem motoristas realizando entregas agora.</p>
                        </div>
                        <button class="btn-toggle active" onclick="navigate('control_tower')" style="padding:12px 24px; border-radius:var(--radius-md);">📡 Acessar Torre de Controle</button>
                    </div>

                    <div class="card-grid">
                        <div class="info-card">
                            <span style="font-size: 2rem;">🚚</span>
                            <h3 style="margin-top:10px;">Status da Frota</h3>
                            <p style="color:var(--text-muted); font-size:0.875rem;">3 veículos operando em São Paulo nas últimas 24h.</p>
                            <a href="#" onclick="navigate('fleet')" style="color:var(--primary); font-weight:600; font-size:0.85rem; text-decoration:none; margin-top:8px;">Ver frota &rarr;</a>
                        </div>
                        <div class="info-card">
                            <span style="font-size: 2rem;">💰</span>
                            <h3 style="margin-top:10px;">Faturamento do Dia</h3>
                            <p style="color:var(--text-muted); font-size:0.875rem;">R$ 3.550,00 previstos de faturamento em fretes hoje.</p>
                            <a href="#" onclick="navigate('finance')" style="color:var(--primary); font-weight:600; font-size:0.85rem; text-decoration:none; margin-top:8px;">Ver financeiro &rarr;</a>
                        </div>
                        <div class="info-card">
                            <span style="font-size: 2rem;">📥</span>
                            <h3 style="margin-top:10px;">Bipar Carga</h3>
                            <p style="color:var(--text-muted); font-size:0.875rem;">Registre novas entradas de notas fiscais no sistema.</p>
                            <a href="#" onclick="navigate('collection')" style="color:var(--primary); font-weight:600; font-size:0.85rem; text-decoration:none; margin-top:8px;">Abrir bipagem &rarr;</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    // TORRE DE CONTROLE
    control_tower: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header">
                    <div class="content-title">📡 Torre de Controle <span>/ Monitoramento em tempo real</span></div>
                    <div class="header-actions" id="admin-header-actions-placeholder"></div>
                </header>
                <div class="content-body" style="padding: 16px; overflow:hidden;">
                    <div class="view-admin">
                        <div class="kpi-row">
                            <div class="kpi-card kpi-total">
                                <div class="kpi-info">
                                    <span class="kpi-label">Total Entregas</span>
                                    <span class="kpi-value" id="kpi-total-val">0</span>
                                    <span class="kpi-sub">Cargas importadas</span>
                                </div>
                                <div class="kpi-icon-wrapper">📋</div>
                            </div>
                            <div class="kpi-card kpi-route">
                                <div class="kpi-info">
                                    <span class="kpi-label">Em Rota</span>
                                    <span class="kpi-value" id="kpi-route-val">0</span>
                                    <span class="kpi-sub">Com motoristas</span>
                                </div>
                                <div class="kpi-icon-wrapper">🚚</div>
                            </div>
                            <div class="kpi-card kpi-success">
                                <div class="kpi-info">
                                    <span class="kpi-label">Entregues</span>
                                    <span class="kpi-value" id="kpi-success-val">0</span>
                                    <span class="kpi-sub" id="kpi-success-sub">0% de sucesso</span>
                                </div>
                                <div class="kpi-icon-wrapper">✅</div>
                            </div>
                            <div class="kpi-card kpi-failure">
                                <div class="kpi-info">
                                    <span class="kpi-label">Ocorrências</span>
                                    <span class="kpi-value" id="kpi-failure-val">0</span>
                                    <span class="kpi-sub">Insucessos registrados</span>
                                </div>
                                <div class="kpi-icon-wrapper">⚠️</div>
                            </div>
                            <div class="kpi-card kpi-sla">
                                <div class="kpi-info">
                                    <span class="kpi-label">SLA no Prazo</span>
                                    <span class="kpi-value" id="kpi-sla-val">100%</span>
                                    <span class="kpi-sub">Meta: &gt;95%</span>
                                </div>
                                <div class="kpi-icon-wrapper">⏱️</div>
                            </div>
                        </div>
                        
                        <div class="admin-workspace">
                            <div class="admin-sidebar">
                                <!-- Donut Chart Injected Here dynamically -->
                                <div id="admin-chart-container"></div>
                                
                                <div class="sidebar-search-box">
                                    <div class="search-input-wrapper">
                                        <span class="search-icon">🔍</span>
                                        <input type="text" class="search-input" id="search-delivery" placeholder="Buscar por NF ou destinatário...">
                                    </div>
                                    <div class="filters-container">
                                        <button class="btn-filter active" data-status="all">Todos</button>
                                        <button class="btn-filter" data-status="pendente">Pendente</button>
                                        <button class="btn-filter" data-status="em rota">Em Rota</button>
                                        <button class="btn-filter" data-status="entregue">Entregue</button>
                                        <button class="btn-filter" data-status="insucesso">Ocorrências</button>
                                    </div>
                                </div>
                                <div class="delivery-list" id="admin-delivery-list">
                                    <!-- Cards das Notas Fiscais -->
                                </div>
                                <div class="sidebar-footer-actions">
                                    <button class="btn-primary" id="btn-import-cargas">Importar Carga (Lote)</button>
                                </div>
                            </div>
                            <div class="map-panel">
                                <div id="map"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    // ENTREGAS (LISTA TABELA GERAL)
    deliveries: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header">
                    <div class="content-title">📦 Gestão de Entregas <span>/ Listagem e Detalhes</span></div>
                    <div class="header-actions" id="admin-header-actions-placeholder"></div>
                </header>
                <div class="content-body" style="display:flex; flex-direction:column; gap:20px;">
                    <div style="background-color: var(--surface); padding: 14px 20px; border-radius: var(--radius-md); border: 1px solid var(--border); display:flex; justify-content:space-between; gap:20px;">
                        <input type="text" class="form-input" id="deliveries-page-search" placeholder="Pesquisar entregas por destinatário ou NF..." style="max-width:360px;">
                        <div class="toggle-container" style="border:1px solid var(--border)">
                            <button class="btn-toggle ${currentState.activeTab === 'todo' ? 'active' : ''}" onclick="setDeliveriesTab('todo')">Pendentes/Em Rota</button>
                            <button class="btn-toggle ${currentState.activeTab === 'done' ? 'active' : ''}" onclick="setDeliveriesTab('done')">Entregues</button>
                            <button class="btn-toggle ${currentState.activeTab === 'problems' ? 'active' : ''}" onclick="setDeliveriesTab('problems')">Insucessos</button>
                        </div>
                    </div>

                    <div class="table-wrapper">
                        <table class="table-custom">
                            <thead>
                                <tr>
                                    <th>NF</th>
                                    <th>Destinatário</th>
                                    <th>Endereço</th>
                                    <th>SLA</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="deliveries-page-table-body">
                                <!-- Injetado via JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,

    // BIPAGEM & COLETA (TERMINAL DE TRIAGEM DE TRANSPORTADORA)
    collection: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header">
                    <div class="content-title">🏷️ Bipagem & Coleta <span>/ Recepção e Triagem de Carga</span></div>
                    <div class="header-actions" id="admin-header-actions-placeholder"></div>
                </header>
                <div class="content-body" style="display:grid; grid-template-columns: 400px 1fr; gap:24px;">
                    <!-- Terminal de Bipagem -->
                    <div class="bip-terminal-card">
                        <div class="bip-terminal-header">
                            <div class="bip-status-badge">
                                <span class="pulse-dot green"></span>
                                <span>Pistola USB Conectada (Laser Ativo)</span>
                            </div>
                            <button class="btn-sound-toggle" id="btn-toggle-bip-sound" title="Alternar som do leitor">
                                ${isSoundEnabled ? '🔊 Som Ativo' : '🔇 Mudo'}
                            </button>
                        </div>

                        <div class="bip-input-box">
                            <div class="bip-input-label">
                                <span>Código de Barras / NF / DANFE:</span>
                                <span style="font-size:0.7rem; color:var(--text-muted); font-weight:400;">Bipe a qualquer momento (Captura global ativa)</span>
                            </div>
                            <div class="bip-input-row">
                                <input type="text" id="barcode-scanner-input" class="form-input bip-input" placeholder="Aponte a pistola USB ou digite..." autocomplete="off" autofocus>
                                <button class="btn-primary" id="btn-execute-bip" style="padding:10px 16px;">⚡ Bipar</button>
                            </div>
                            <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">
                                ⚡ Suporte nativo: Chave DANFE (44 dígitos), NF-e e etiquetas de pacote.
                            </div>
                        </div>

                        <!-- Atribuição Automática Sequencial (1º Base -> 2º Motorista) -->
                        <div class="bip-assignment-card">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">
                                    ⚙️ Atribuição Automática ao Bipar
                                </span>
                                <span style="font-size:0.68rem; background:var(--primary-light); color:var(--primary); padding:2px 8px; border-radius:12px; font-weight:700;">
                                    Sequencial
                                </span>
                            </div>

                            <!-- 1º PASSO: ATRIBUIR BASE -->
                            <div class="form-group" style="margin:0;">
                                <label style="font-size:0.8rem; font-weight:700; color:var(--text-main); margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                                    <span class="bip-step-badge">1</span>
                                    1º Atribuir à Base:
                                </label>
                                <select class="form-select" id="auto-assign-base-select" style="font-size:0.85rem; padding:8px 10px; width:100%;">
                                    <option value="">-- Não atribuir base (apenas triar) --</option>
                                    <option value="SMT" ${currentAutoAssignBase === 'SMT' ? 'selected' : ''}>🏢 Base SMT</option>
                                    <option value="MCO" ${currentAutoAssignBase === 'MCO' ? 'selected' : ''}>🏢 Base MCO</option>
                                    <option value="FO2" ${currentAutoAssignBase === 'FO2' ? 'selected' : ''}>🏢 Base FO2</option>
                                </select>
                            </div>

                            <!-- 2º PASSO: ATRIBUIR MOTORISTA (HABILITADO SOMENTE APÓS ATRIBUIR A BASE) -->
                            <div class="form-group" style="margin:0;">
                                <label style="font-size:0.8rem; font-weight:700; color:var(--text-main); margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                                    <span class="bip-step-badge ${currentAutoAssignBase ? '' : 'inactive'}" id="step-driver-badge">2</span>
                                    2º Atribuir ao Motorista:
                                </label>
                                <select class="form-select" id="auto-assign-driver-select" ${currentAutoAssignBase ? '' : 'disabled'} style="font-size:0.85rem; padding:8px 10px; width:100%; ${currentAutoAssignBase ? '' : 'opacity:0.65; cursor:not-allowed;'}">
                                    ${currentAutoAssignBase ? 
                                        `<option value="">-- Não vincular motorista (apenas Base ${currentAutoAssignBase}) --</option>` +
                                        driversData.map(d => `<option value="${d.id}" ${currentAutoAssignDriver === d.id ? 'selected' : ''}>${escapeHTML(d.name)} (${escapeHTML(d.vehicle)} - ${escapeHTML(d.plate)})</option>`).join('')
                                        : `<option value="">🔒 Selecione uma base no 1º passo primeiro...</option>`
                                    }
                                </select>
                                <small id="auto-assign-helper" style="font-size:0.72rem; color:var(--text-muted); display:block; margin-top:4px;">
                                    ${currentAutoAssignBase ? 
                                        `✓ Base <strong>${currentAutoAssignBase}</strong> definida. Opcional: selecione o motorista da base para vincular ao bipar.` : 
                                        `ℹ️ A sequência exige atribuir primeiro a Base para depois liberar o motorista.`
                                    }
                                </small>
                            </div>
                        </div>

                        <div class="bip-quick-actions">
                            <div style="font-size:0.72rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; letter-spacing:0.5px;">
                                Modos de Bipagem Rápida:
                            </div>
                            <div style="display:flex; flex-direction:column; gap:6px;">
                                <button class="bip-shortcut-btn" id="btn-quick-bipe-random">
                                    <span>⚡ <strong>Bipe Rápido de Teste</strong></span>
                                    <span style="font-size:0.72rem; color:var(--primary); font-weight:700;">Simular Pistola &rarr;</span>
                                </button>
                                <button class="bip-shortcut-btn" id="btn-quick-bipe-pending">
                                    <span>📦 <strong>Bipar Carga Pendente</strong></span>
                                    <span style="font-size:0.72rem; color:var(--primary); font-weight:700;">Próxima da Base &rarr;</span>
                                </button>
                                <button class="bip-shortcut-btn" id="btn-quick-bipe-batch">
                                    <span>🚀 <strong>Bipar Lote (5 volumes)</strong></span>
                                    <span style="font-size:0.72rem; color:var(--primary); font-weight:700;">Conferência Gaiola &rarr;</span>
                                </button>
                            </div>
                        </div>

                        <!-- Card de Destaque do Último Volume Bipado -->
                        <div class="last-biped-card" id="last-biped-box">
                            <div class="last-biped-header">
                                <span style="font-size:0.72rem; font-weight:800; text-transform:uppercase;">Último Volume Bipado</span>
                                <span class="last-biped-status" id="last-biped-tag">AGUARDANDO LEITURA</span>
                            </div>
                            <div class="last-biped-code" id="last-biped-code">---</div>
                            <div class="last-biped-recipient" id="last-biped-recipient">Aponte a pistola ou use os atalhos acima</div>
                            <div class="last-biped-meta" id="last-biped-meta">
                                <span>Status: Pronto para leitura</span>
                            </div>
                        </div>
                    </div>

                    <!-- Tabela do Lote Coletado Hoje -->
                    <div class="table-wrapper" style="height:100%; display:flex; flex-direction:column;">
                        <div class="table-header-custom" style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <h3 style="margin:0;">Lote de Conferência de Hoje</h3>
                                <small style="color:var(--text-muted); font-size:0.8rem;">Entradas registradas por leitor laser e bipagens rápidas</small>
                            </div>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <span style="font-size:0.8rem; background:var(--primary-light); color:var(--primary); font-weight:700; padding:4px 10px; border-radius:20px;" id="scanned-count">0 pacotes</span>
                                <button class="btn-secondary" id="btn-clear-scanned-batch" style="padding:4px 10px; font-size:0.75rem; border-radius:var(--radius-sm); color:var(--status-failure);">🗑️ Limpar Lote</button>
                            </div>
                        </div>
                        <div style="flex:1; overflow-y:auto;">
                            <table class="table-custom">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Destinatário</th>
                                        <th>Status</th>
                                        <th>Base</th>
                                        <th>Atribuído a</th>
                                        <th>Timestamp</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="collection-table-body">
                                    <!-- Injetado via JS -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    // FINANCEIRO
    finance: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header">
                    <div class="content-title">💰 Gestão Financeira <span>/ Auditoria e Custos</span></div>
                    <div class="header-actions" id="admin-header-actions-placeholder"></div>
                </header>
                <div class="content-body" style="display:flex; flex-direction:column; gap:24px;">
                    <!-- Cards de Resumo Financeiro com Gráficos Sparkline de Linha -->
                    <div class="finance-kpi-grid">
                        <div class="finance-kpi-card revenue">
                            <div class="finance-kpi-top">
                                <span class="finance-kpi-title">📈 Faturamento Previsto</span>
                                <span class="finance-kpi-badge up">↑ +18.4%</span>
                            </div>
                            <div class="finance-kpi-content">
                                <div>
                                    <div class="finance-kpi-val">R$ 8.420,00</div>
                                    <div class="finance-kpi-sub">Receita projetada do lote ativo</div>
                                </div>
                                <div class="finance-sparkline-wrap">
                                    ${getMiniSparklineSVG([980, 1450, 1220, 1840, 1630, 1800, 1500], '#10B981', 'revenue')}
                                </div>
                            </div>
                        </div>

                        <div class="finance-kpi-card cost">
                            <div class="finance-kpi-top">
                                <span class="finance-kpi-title">📉 Custos Operacionais</span>
                                <span class="finance-kpi-badge down">↓ -6.2% Economia</span>
                            </div>
                            <div class="finance-kpi-content">
                                <div>
                                    <div class="finance-kpi-val">R$ 1.250,00</div>
                                    <div class="finance-kpi-sub">Despesas de frota e rotas</div>
                                </div>
                                <div class="finance-sparkline-wrap">
                                    ${getMiniSparklineSVG([160, 240, 190, 280, 210, 230, 140], '#0A58CA', 'cost')}
                                </div>
                            </div>
                        </div>

                        <div class="finance-kpi-card profit">
                            <div class="finance-kpi-top">
                                <span class="finance-kpi-title">💎 Margem Operacional Líquida</span>
                                <span class="finance-kpi-badge neutral">85.2% Margem</span>
                            </div>
                            <div class="finance-kpi-content">
                                <div>
                                    <div class="finance-kpi-val">R$ 7.170,00</div>
                                    <div class="finance-kpi-sub">Rentabilidade líquida retida</div>
                                </div>
                                <div class="finance-sparkline-wrap">
                                    ${getMiniSparklineSVG([820, 1210, 1030, 1560, 1420, 1570, 1360], '#8B5CF6', 'profit')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Card do Gráfico de Linhas Interativo (Evolução Financeira) -->
                    <div class="finance-chart-card">
                        <div class="finance-chart-header">
                            <div class="finance-chart-title-box">
                                <h3>📊 Evolução Financeira: Faturamento vs Custos Operacionais</h3>
                                <small>Desempenho comparativo diário das receitas e custos operacionais</small>
                            </div>
                            <div class="finance-period-pills">
                                <button class="finance-period-btn ${currentFinancePeriod === '7d' ? 'active' : ''}" data-period="7d">Últimos 7 Dias</button>
                                <button class="finance-period-btn ${currentFinancePeriod === '15d' ? 'active' : ''}" data-period="15d">15 Dias</button>
                                <button class="finance-period-btn ${currentFinancePeriod === '30d' ? 'active' : ''}" data-period="30d">Mensal (30 Dias)</button>
                            </div>
                        </div>

                        <div class="finance-legend-bar">
                            <div class="finance-legend-item">
                                <span class="finance-legend-dot" style="background:#10B981; box-shadow:0 0 8px rgba(16, 185, 129, 0.6);"></span>
                                <span>Faturamento Previsto (R$ 8.420,00)</span>
                            </div>
                            <div class="finance-legend-item">
                                <span class="finance-legend-dot" style="background:#0A58CA; box-shadow:0 0 8px rgba(10, 88, 202, 0.5);"></span>
                                <span>Custos Operacionais (R$ 1.250,00)</span>
                            </div>
                            <div class="finance-legend-item" style="color:var(--text-muted); font-size:0.75rem; margin-left:auto;">
                                <span>💡 Passe o cursor sobre os pontos para visualizar o extrato diário</span>
                            </div>
                        </div>

                        <div class="finance-chart-svg-wrap">
                            <div id="finance-chart-tooltip" class="finance-chart-tooltip"></div>
                            <div id="finance-line-chart-container" style="width:100%; height:260px;"></div>
                        </div>
                    </div>

                    <div class="table-wrapper">
                        <div class="table-header-custom">
                            <h3 style="margin:0;">Lançamentos de Frete</h3>
                            <button class="btn-secondary" onclick="showToast('Exportando dados financeiro...')">Exportar Planilha</button>
                        </div>
                        <table class="table-custom">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Motorista</th>
                                    <th>Carga</th>
                                    <th>Custo Total</th>
                                    <th>Valor Cobrado</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>19/08/2026</td>
                                    <td>João Silva</td>
                                    <td>Rota Zona Sul (3 NFs)</td>
                                    <td>R$ 450,00</td>
                                    <td>R$ 1.800,00</td>
                                    <td><span class="status-label-badge entregue">Compensado</span></td>
                                </tr>
                                <tr>
                                    <td>19/08/2026</td>
                                    <td>Maria Souza</td>
                                    <td>Rota Zona Oeste (2 NFs)</td>
                                    <td>R$ 380,00</td>
                                    <td>R$ 1.450,00</td>
                                    <td><span class="status-label-badge em-rota">A Purar</span></td>
                                </tr>
                                <tr>
                                    <td>19/08/2026</td>
                                    <td>Carlos Lima</td>
                                    <td>Rota Zona Norte (1 NFs)</td>
                                    <td>R$ 120,00</td>
                                    <td>R$ 550,00</td>
                                    <td><span class="status-label-badge pendente">Pendente</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,

    // FROTA
    fleet: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header">
                    <div class="content-title">🚛 Gestão de Frota <span>/ Status dos Veículos</span></div>
                    <div class="header-actions" id="admin-header-actions-placeholder"></div>
                </header>
                <div class="content-body" style="display:flex; flex-direction:column; gap:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h2 style="font-size:1.15rem; font-weight:700;">Veículos Cadastrados</h2>
                        <button class="btn-primary" style="width:auto; padding:10px 20px;" onclick="simulateAddVehicle()">+ Adicionar Veículo</button>
                    </div>

                    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:20px;" id="fleet-vehicles-grid">
                        <!-- Injetado via JS -->
                    </div>
                </div>
            </div>
        </div>
    `,

    // CALENDÁRIO
    calendar: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header">
                    <div class="content-title">📅 Calendário Operacional <span>/ Agendamento de Cargas</span></div>
                    <div class="header-actions" id="admin-header-actions-placeholder"></div>
                </header>
                <div class="content-body" style="display:flex; flex-direction:column; gap:20px;">
                    <div style="background-color: var(--surface); padding: 20px; border-radius: var(--radius-lg); border: 1px solid var(--border); box-shadow: var(--shadow-sm);">
                        <h3 style="font-size:1.2rem; font-weight:800; color:var(--primary); margin-bottom:12px;">Agendas de Agosto 2026</h3>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            <div style="padding:14px; background:var(--bg-light); border-left:4px solid var(--primary); border-radius:var(--radius-sm); display:flex; justify-content:space-between;">
                                <div>
                                    <strong>Carga Grande - CD Cajamar para CD São Paulo</strong>
                                    <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">Previsto para as 08:00 • Van Sprinter</div>
                                </div>
                                <span class="status-label-badge entregue" style="height:fit-content;">Finalizado</span>
                            </div>
                            <div style="padding:14px; background:var(--bg-light); border-left:4px solid var(--status-route); border-radius:var(--radius-sm); display:flex; justify-content:space-between;">
                                <div>
                                    <strong>Roteamento Lote Norte - 10 Clientes</strong>
                                    <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">Saída às 13:30 • Fiorino</div>
                                </div>
                                <span class="status-label-badge em-rota" style="height:fit-content;">Em Rota</span>
                            </div>
                            <div style="padding:14px; background:var(--bg-light); border-left:4px solid var(--status-pending); border-radius:var(--radius-sm); display:flex; justify-content:space-between;">
                                <div>
                                    <strong>Carregamento Rota Leste - 15 Clientes</strong>
                                    <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">Previsto para amanhã, 07:00 • Vito</div>
                                </div>
                                <span class="status-label-badge pendente" style="height:fit-content;">Agendado</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    // MENSAGENS
    messages: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header">
                    <div class="content-title">💬 Mensagens <span>/ Chat da Central</span></div>
                    <div class="header-actions" id="admin-header-actions-placeholder"></div>
                </header>
                <div class="content-body" style="padding: 24px; height: 100%; display: flex; flex-direction: column;">
                    <div class="chat-window">
                        <div style="padding:16px; background-color:var(--bg-light); border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px;">
                            <div style="width:12px; height:12px; border-radius:50%; background-color:var(--status-success);"></div>
                            <h4 style="margin:0;">Chat Geral com Motoristas</h4>
                        </div>
                        <div class="chat-messages" id="chat-messages-container">
                            <!-- Injetado via JS -->
                        </div>
                        <div class="chat-input-bar">
                            <input type="text" class="form-input" id="chat-input-text" placeholder="Digite uma mensagem para os motoristas...">
                            <button class="btn-primary" style="width:auto; padding:0 24px;" id="btn-chat-send">Enviar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    // PERFIL
    profile: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header">
                    <div class="content-title">👤 Perfil do Usuário <span>/ Seus dados</span></div>
                    <div class="header-actions" id="admin-header-actions-placeholder"></div>
                </header>
                <div class="content-body">
                    <div class="profile-grid">
                        <div style="display:flex; flex-direction:column; align-items:center; gap:14px; border-right:1px solid var(--border); padding-right:30px;">
                            <img src="assets/logo_run.png" style="width:120px; height:120px; border-radius:50%; object-fit:contain; border: 4px solid var(--primary-light); background-color:white;" alt="Avatar" onerror="this.src='https://api.dicebear.com/7.x/adventurer/svg?seed=Felipe'">
                            <span style="font-weight:700; font-size:1.1rem; text-align:center;">Felipe Tavares</span>
                            <span class="status-label-badge em-rota" style="font-size:0.75rem;">Administrador</span>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:16px;">
                            <div class="form-group">
                                <label class="form-label">Nome Completo</label>
                                <input type="text" class="form-input" value="Felipe Tavares" disabled>
                            </div>
                            <div class="form-group">
                                <label class="form-label">E-mail Corporativo</label>
                                <input type="email" class="form-input" value="felipe.dev@gmail.com" disabled>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Departamento</label>
                                <input type="text" class="form-input" value="Torre de Controle Logística" disabled>
                            </div>
                            <button class="btn-primary" style="width:fit-content; padding: 10px 24px;" onclick="showToast('As alterações de perfil estão desativadas neste simulado.')">Salvar Alterações</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    // CONFIGURAÇÕES
    settings: () => `
        <div class="app-layout">
            ${sidebarTemplate()}
            <div class="main-content">
                <header class="content-header">
                    <div class="content-title">⚙️ Configurações <span>/ Acesso do Sistema</span></div>
                    <div class="header-actions" id="admin-header-actions-placeholder"></div>
                </header>
                <div class="content-body" style="display:flex; flex-direction:column; gap:24px;">
                    <div class="info-card">
                        <h3 style="font-weight:700;">Nível de Acesso (Simulação de Perfil)</h3>
                        <p style="color:var(--text-muted); font-size:0.875rem; margin-bottom:12px;">Altere o papel do usuário atual para testar a visibilidade de abas no menu esquerdo.</p>
                        <div style="display:flex; gap:10px;">
                            <button class="btn-toggle ${currentState.userRole === 'admin' ? 'active' : ''}" onclick="setRole('admin')">Admin</button>
                            <button class="btn-toggle ${currentState.userRole === 'gestao' ? 'active' : ''}" onclick="setRole('gestao')">Gestão</button>
                            <button class="btn-toggle ${currentState.userRole === 'operador' ? 'active' : ''}" onclick="setRole('operador')">Operador/Motorista</button>
                        </div>
                    </div>

                    <div class="info-card">
                        <h3 style="font-weight:700;">Gerenciar Módulos Customizados</h3>
                        <p style="color:var(--text-muted); font-size:0.875rem; margin-bottom:12px;">Crie abas extras que aparecerão dinamicamente no menu lateral.</p>
                        <div style="display:flex; gap:10px; margin-bottom:16px;">
                            <input type="text" class="form-input" id="new-tab-name-input" placeholder="Nome do novo módulo..." style="max-width:280px;">
                            <button class="btn-primary" style="width:auto; padding:0 20px;" onclick="simulateAddCustomTab()">+ Criar Aba</button>
                        </div>
                        <div style="display:flex; flex-wrap:wrap; gap:8px;" id="custom-tabs-settings-list">
                            <!-- Injetado via JS -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

// --- NAVEGAÇÃO ---
function navigate(screenId) {
    currentState.screen = screenId;
    saveState();
    render();
}

function handleLogout() {
    if (confirm('Deseja realmente sair do painel TMS RUN?')) {
        currentState.screen = 'login';
        currentState.userRole = 'admin';
        saveState();
        render();
        showToast('Você saiu do sistema.', 'info');
    }
}

function setRole(role) {
    currentState.userRole = role;
    saveState();
    render();
    showToast(`Papel operacional alterado para: ${role.toUpperCase()}`, 'success');
}

// --- RENDERIZADORES DE MOCK PAGES ---

// Renderizar lista na página de entregas (`deliveries`)
function renderDeliveriesPageList() {
    const tableBody = document.getElementById('deliveries-page-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    // Filtro e Busca da Página
    const searchVal = (document.getElementById('deliveries-page-search')?.value || '').toLowerCase().trim();
    
    let filtered = [];
    if (currentState.activeTab === 'todo') {
        filtered = deliveriesData.filter(d => d.status === 'pendente' || d.status === 'em rota');
    } else if (currentState.activeTab === 'done') {
        filtered = deliveriesData.filter(d => d.status === 'entregue');
    } else if (currentState.activeTab === 'problems') {
        filtered = deliveriesData.filter(d => d.status === 'insucesso');
    }

    if (searchVal) {
        filtered = filtered.filter(d => 
            d.nf.includes(searchVal) || 
            d.recipient.toLowerCase().includes(searchVal) || 
            d.address.toLowerCase().includes(searchVal)
        );
    }

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">Nenhuma entrega encontrada com as especificações.</td></tr>`;
        return;
    }

    const statusTexts = {
        'pendente': 'Pendente',
        'em rota': 'Em Rota',
        'entregue': 'Entregue',
        'insucesso': 'Ocorrência'
    };

    filtered.forEach(del => {
        const tr = document.createElement('tr');
        
        let actionBtn = '';
        if (del.status === 'entregue' || del.status === 'insucesso') {
            actionBtn = `<button class="btn-secondary" style="padding:6px 12px; font-size:0.75rem;" onclick="openPodViewer('${del.id}')">Ver Comprovante</button>`;
        } else {
            actionBtn = `<button class="btn-primary" style="padding:6px 12px; font-size:0.75rem; width:auto;" onclick="simulateAdminForceDeliver('${del.id}')">Baixar Central</button>`;
        }

        tr.innerHTML = `
            <td style="font-weight:700;">#${del.nf}</td>
            <td><strong>${del.recipient}</strong></td>
            <td style="font-size:0.8rem; color:var(--text-muted);">${del.address}</td>
            <td>${del.sla}</td>
            <td><span class="status-label-badge ${del.status.replace(' ', '-')}">${statusTexts[del.status]}</span></td>
            <td>${actionBtn}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function setDeliveriesTab(tab) {
    currentState.activeTab = tab;
    saveState();
    render();
}

// --- SISTEMA DE ÁUDIO E HÁPTICO DE BIPAGEM (PADRÃO TRANSPORTADORAS) ---
let isSoundEnabled = localStorage.getItem('tms_run_sound_enabled') !== 'false';
let lastBipedItem = null;

function toggleBipSound() {
    isSoundEnabled = !isSoundEnabled;
    localStorage.setItem('tms_run_sound_enabled', isSoundEnabled ? 'true' : 'false');
    const btn = document.getElementById('btn-toggle-bip-sound');
    if (btn) btn.innerHTML = isSoundEnabled ? '🔊 Som Ativo' : '🔇 Mudo';
    showToast(`Som do leitor ${isSoundEnabled ? 'ativado' : 'desativado'}`, 'info');
}

function playScannerBeep(type = 'success') {
    if (!isSoundEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        if (type === 'success') {
            // Frequência do leitor laser Zebra/Honeywell: 1450Hz puro e curto (75ms)
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1450, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.075);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
            if (navigator.vibrate) navigator.vibrate(45);
        } else if (type === 'error') {
            // Tom duplo grave de alerta/erro/duplicidade: 320Hz seguido de 220Hz
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.type = 'sawtooth';
            osc2.type = 'sawtooth';
            osc1.frequency.setValueAtTime(320, ctx.currentTime);
            osc2.frequency.setValueAtTime(220, ctx.currentTime + 0.09);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            osc1.start();
            osc1.stop(ctx.currentTime + 0.09);
            osc2.start(ctx.currentTime + 0.09);
            osc2.stop(ctx.currentTime + 0.28);
            if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
        } else if (type === 'batch') {
            // Tom ascendente harmônico de lote finalizado
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.14);
            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.16);
            if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
        }
    } catch (e) {
        console.warn('Falha na reprodução do som de leitor:', e);
    }
}

// --- DECODIFICADOR INTELIGENTE DE CÓDIGOS DE BARRAS / DANFE (44 DÍGITOS) ---
function parseBarcodeOrDanfe(rawCode) {
    const clean = (rawCode || '').toString().trim().replace(/[\r\n]/g, '');
    // Verifica se é chave DANFE de 44 dígitos numéricos da NF-e
    if (clean.length === 44 && /^\d{44}$/.test(clean)) {
        // Na NF-e de 44 dígitos: posições 25..33 (índices 25 a 34 exclusive) é o número da NF (9 dígitos)
        const rawNf = clean.substring(25, 34);
        const cleanNf = parseInt(rawNf, 10).toString(); // remove zeros à esquerda (ex: 000100234 -> 100234)
        return {
            original: clean,
            isDanfe: true,
            nf: cleanNf,
            nfPadded: rawNf,
            displayCode: cleanNf
        };
    }
    return {
        original: clean,
        isDanfe: false,
        nf: clean,
        nfPadded: clean,
        displayCode: clean
    };
}

function updateLastBipedCard(item, isDuplicate = false) {
    const box = document.getElementById('last-biped-box');
    const codeEl = document.getElementById('last-biped-code');
    const recipEl = document.getElementById('last-biped-recipient');
    const tagEl = document.getElementById('last-biped-tag');
    const metaEl = document.getElementById('last-biped-meta');
    if (!box || !codeEl) return;

    box.classList.remove('flash', 'duplicate');
    void box.offsetWidth; // Forçar reflow para reiniciar animação

    if (isDuplicate) {
        box.classList.add('duplicate');
        if (tagEl) {
            tagEl.innerText = 'CÓDIGO DUPLICADO';
            tagEl.style.background = 'var(--status-failure)';
        }
    } else {
        box.classList.add('flash');
        if (tagEl) {
            tagEl.innerText = 'BIPADO COM SUCESSO';
            tagEl.style.background = '#10B981';
        }
    }

    codeEl.innerText = '#' + item.code;
    if (recipEl) recipEl.innerText = item.recipient;
    if (metaEl) {
        const baseBadge = item.base ? 
            `<span class="base-badge base-${item.base.toLowerCase()}">🏢 Base ${escapeHTML(item.base)}</span>` : 
            `<span class="base-badge base-none">🏢 Sem Base</span>`;
        const driverBadge = item.driverName ? 
            `<span>🚚 ${escapeHTML(item.driverName)}</span>` : 
            `<span style="color:var(--text-muted);">🚚 Sem motorista</span>`;
        const danfeBadge = item.danfeKey ?
            `<span style="background:rgba(10,88,202,0.12); color:var(--primary); padding:2px 6px; border-radius:4px; font-weight:700; font-size:0.7rem;" title="Chave: ${escapeHTML(item.danfeKey)}">📄 DANFE 44 DÍGITOS</span> • ` : '';

        metaEl.innerHTML = `
            <span>⏰ ${item.timestamp}</span> • 
            ${danfeBadge}
            ${baseBadge} • 
            ${driverBadge}
        `;
    }

    setTimeout(() => box?.classList.remove('flash', 'duplicate'), 1200);
}

function processBip(rawCode, targetDriverId = null, targetBase = null) {
    const parsed = parseBarcodeOrDanfe(rawCode);
    const code = parsed.displayCode;
    if (!code) {
        playScannerBeep('error');
        showToast('Por favor, informe ou bipe um código válido.', 'error');
        return false;
    }

    // Verificar se o código já foi bipado anteriormente nesta sessão/lote
    const alreadyScanned = scannedProductsData.find(item => {
        const itemCode = (item.code || '').toLowerCase();
        const targetCode = code.toLowerCase();
        const targetOrig = parsed.original.toLowerCase();
        if (itemCode === targetCode || itemCode === targetOrig) return true;
        if (item.danfeKey && item.danfeKey.toLowerCase() === targetOrig) return true;
        if (parsed.isDanfe && (itemCode === parsed.nf.toLowerCase() || itemCode === parsed.nfPadded.toLowerCase())) return true;
        return false;
    });

    if (alreadyScanned) {
        playScannerBeep('error');
        showToast(`⚠️ Pacote #${code} já foi bipado anteriormente!`, 'error');
        updateLastBipedCard(alreadyScanned, true);
        return false;
    }

    // Se houver uma entrega pré-existente com essa NF/código, puxamos seus dados
    const matchedDelivery = deliveriesData.find(d => {
        const dNf = (d.nf || '').toLowerCase();
        const dId = (d.id || '').toLowerCase();
        const targetCode = code.toLowerCase();
        const targetOrig = parsed.original.toLowerCase();
        
        if (dNf === targetCode || dNf === targetOrig || dId === targetCode || dId === targetOrig) return true;
        if (dId === ('nf-' + targetCode) || dId === ('nf-' + targetOrig)) return true;
        if (parsed.isDanfe) {
            const nfNum = parsed.nf.toLowerCase();
            const nfPadded = parsed.nfPadded.toLowerCase();
            return dNf === nfNum || dNf === nfPadded || dId === ('nf-' + nfNum) || dId === ('nf-' + nfPadded);
        }
        return false;
    });
    
    const names = ['Felipe Tavares', 'Amanda Reis', 'Juliano Souza', 'Renata Lima', 'Diego Costa', 'Carla Mendes', 'Lucas Ribeiro'];
    const addresses = [
        'Alameda Santos, 1000 - Cerqueira César, São Paulo - SP',
        'Rua Augusta, 1200 - Consolação, São Paulo - SP',
        'Av. Paulista, 2000 - Bela Vista, São Paulo - SP',
        'Rua Vergueiro, 1500 - Paraíso, São Paulo - SP',
        'Av. Brigadeiro Luís Antônio, 2500 - Jardim Paulista, São Paulo - SP'
    ];
    
    const recipient = matchedDelivery ? matchedDelivery.recipient : names[Math.floor(Math.random() * names.length)];
    const address = matchedDelivery ? matchedDelivery.address : addresses[Math.floor(Math.random() * addresses.length)];

    // 1º PASSO: BASE (SMT, MCO, FO2)
    const autoBaseSelect = document.getElementById('auto-assign-base-select');
    const autoBaseVal = targetBase !== null ? targetBase : (autoBaseSelect ? autoBaseSelect.value : currentAutoAssignBase);
    const assignedBase = autoBaseVal || (matchedDelivery && matchedDelivery.base ? matchedDelivery.base : null);

    // 2º PASSO: MOTORISTA (Regra Estrita: Só pode atribuir motorista SE houver Base atribuída!)
    let assignedDriver = null;
    if (assignedBase) {
        const autoDriverSelect = document.getElementById('auto-assign-driver-select');
        const autoDriverVal = targetDriverId !== null ? targetDriverId : (autoDriverSelect ? autoDriverSelect.value : currentAutoAssignDriver);
        if (autoDriverVal) {
            assignedDriver = driversData.find(d => d.id === autoDriverVal) || null;
        } else if (matchedDelivery && matchedDelivery.driverId) {
            assignedDriver = driversData.find(d => d.id === matchedDelivery.driverId) || null;
        }
    }

    let statusText = 'Triado / Roteirizado';
    if (assignedDriver) {
        statusText = 'Atribuído';
    } else if (assignedBase) {
        statusText = `Na Base ${assignedBase}`;
    }

    const newItem = {
        code: code,
        danfeKey: parsed.isDanfe ? parsed.original : null,
        recipient: recipient,
        address: address,
        base: assignedBase,
        status: statusText,
        driverId: assignedDriver ? assignedDriver.id : null,
        driverName: assignedDriver ? assignedDriver.name : null,
        timestamp: new Date().toLocaleTimeString('pt-BR')
    };

    // Sincroniza em deliveriesData se houver motorista ou se for adicionada com base
    if (matchedDelivery) {
        if (assignedBase) matchedDelivery.base = assignedBase;
        if (assignedDriver) matchedDelivery.driverId = assignedDriver.id;
    } else if (assignedDriver || assignedBase) {
        const newDelivery = {
            id: 'NF-' + code,
            nf: code,
            recipient: recipient,
            address: address,
            lat: -23.5505 + (Math.random() - 0.5) * 0.05,
            lng: -46.6333 + (Math.random() - 0.5) * 0.05,
            status: 'pendente',
            sla: '18:00',
            base: assignedBase,
            driverId: assignedDriver ? assignedDriver.id : null,
            checkedInVehicle: false,
            pod: null,
            occurrence: null
        };
        deliveriesData.unshift(newDelivery);
    }

    scannedProductsData.unshift(newItem);
    lastBipedItem = newItem;

    // Dispara o bip autêntico de leitor laser e salva estado
    playScannerBeep('success');
    saveState();
    updateLastBipedCard(newItem, false);
    renderCollectionList();

    const danfeNote = parsed.isDanfe ? ' (reconhecido via DANFE 44 dígitos)' : '';
    if (assignedBase && assignedDriver) {
        showToast(`Pacote #${code}${danfeNote} atribuído à Base ${assignedBase} e vinculado a ${assignedDriver.name}!`, 'success');
    } else if (assignedBase) {
        showToast(`Pacote #${code}${danfeNote} recebido e atribuído à Base ${assignedBase}!`, 'success');
    } else {
        showToast(`Pacote #${code}${danfeNote} bipado com sucesso no lote!`, 'success');
    }

    return true;
}

function simulateBipeSuccess() {
    const randomCode = Math.floor(1000000 + Math.random() * 9000000).toString();
    const autoBaseSelect = document.getElementById('auto-assign-base-select');
    const autoDriverSelect = document.getElementById('auto-assign-driver-select');
    const targetBase = autoBaseSelect ? autoBaseSelect.value : currentAutoAssignBase;
    const targetDriver = targetBase ? (autoDriverSelect ? autoDriverSelect.value : currentAutoAssignDriver) : null;
    processBip(randomCode, targetDriver, targetBase);
}

function simulateBipePending() {
    // Procura uma entrega que ainda não foi bipada
    const pendingDel = deliveriesData.find(d => !scannedProductsData.some(s => s.code.toLowerCase() === d.nf.toLowerCase()));
    const autoBaseSelect = document.getElementById('auto-assign-base-select');
    const autoDriverSelect = document.getElementById('auto-assign-driver-select');
    const targetBase = autoBaseSelect ? autoBaseSelect.value : currentAutoAssignBase;
    const targetDriver = targetBase ? (autoDriverSelect ? autoDriverSelect.value : currentAutoAssignDriver) : null;
    if (pendingDel) {
        processBip(pendingDel.nf, targetDriver || (targetBase ? pendingDel.driverId : null), targetBase || pendingDel.base);
    } else {
        simulateBipeSuccess();
    }
}

function simulateBipeBatch(count = 5) {
    let index = 0;
    const interval = setInterval(() => {
        if (index >= count) {
            clearInterval(interval);
            playScannerBeep('batch');
            showToast(`Lote de ${count} volumes bipado e conferido com sucesso!`, 'success');
            return;
        }
        simulateBipeSuccess();
        index++;
    }, 180);
}

function clearScannedBatch() {
    if (scannedProductsData.length === 0) return;
    if (confirm('Deseja limpar todo o lote de pacotes bipados hoje?')) {
        scannedProductsData = [];
        lastBipedItem = null;
        saveState();
        renderCollectionList();
        const codeEl = document.getElementById('last-biped-code');
        if (codeEl) codeEl.innerText = '---';
        const recipEl = document.getElementById('last-biped-recipient');
        if (recipEl) recipEl.innerText = 'Nenhum pacote bipado na sessão';
        const tagEl = document.getElementById('last-biped-tag');
        if (tagEl) {
            tagEl.innerText = 'AGUARDANDO LEITURA';
            tagEl.style.background = 'var(--text-muted)';
        }
        showToast('Lote de bipagens limpo.', 'info');
    }
}

function assignPackageBase(code, base) {
    if (!base) {
        showToast('Por favor, selecione uma Base válida (SMT, MCO ou FO2).', 'error');
        return;
    }
    const packageItem = scannedProductsData.find(item => item.code === code);
    if (!packageItem) return;

    packageItem.base = base;
    if (!packageItem.driverId) {
        packageItem.status = `Na Base ${base}`;
    }

    const existingDel = deliveriesData.find(d => d.nf === code || d.id === 'NF-' + code);
    if (existingDel) {
        existingDel.base = base;
    } else {
        const newDelivery = {
            id: 'NF-' + code,
            nf: code,
            recipient: packageItem.recipient,
            address: packageItem.address || 'São Paulo - SP',
            lat: -23.5505 + (Math.random() - 0.5) * 0.05,
            lng: -46.6333 + (Math.random() - 0.5) * 0.05,
            status: 'pendente',
            sla: '18:00',
            base: base,
            driverId: null,
            checkedInVehicle: false,
            pod: null,
            occurrence: null
        };
        deliveriesData.unshift(newDelivery);
    }

    playScannerBeep('success');
    saveState();
    showToast(`NF #${code} atribuída à Base ${base}! Agora você pode vincular o motorista.`, 'success');
    renderCollectionList();
}

function assignPackageToDriver(code, driverId) {
    const packageItem = scannedProductsData.find(item => item.code === code);
    if (!packageItem) return;

    // Regra estrita: 1º Base -> 2º Motorista
    if (!packageItem.base) {
        playScannerBeep('error');
        showToast('⚠️ A sequência exige atribuir primeiro a Base (SMT, MCO ou FO2) antes de vincular ao motorista!', 'warning');
        return;
    }

    if (!driverId) {
        showToast('Por favor, selecione um motorista para fazer a atribuição.', 'error');
        return;
    }
    
    const driver = driversData.find(drv => drv.id === driverId);
    if (!driver) return;
    
    // 1. Vincula o motorista no item do scanner
    packageItem.driverId = driver.id;
    packageItem.driverName = driver.name;
    packageItem.status = 'Atribuído';
    
    // 2. Cria ou atualiza a entrega vinculada ao motorista
    const existingDel = deliveriesData.find(d => d.nf === code || d.id === 'NF-' + code);
    if (existingDel) {
        existingDel.base = packageItem.base;
        existingDel.driverId = driver.id;
    } else {
        const newDelivery = {
            id: 'NF-' + code,
            nf: code,
            recipient: packageItem.recipient,
            address: packageItem.address || 'Endereço cadastrado na Bipagem - São Paulo - SP',
            lat: -23.5505 + (Math.random() - 0.5) * 0.05,
            lng: -46.6333 + (Math.random() - 0.5) * 0.05,
            status: 'pendente',
            sla: '18:00',
            base: packageItem.base,
            driverId: driver.id,
            checkedInVehicle: false,
            pod: null,
            occurrence: null
        };
        deliveriesData.unshift(newDelivery);
    }
    
    playScannerBeep('success');
    saveState();
    showToast(`NF #${code} vinculada ao motorista ${driver.name} (Base ${packageItem.base})!`, 'success');
    renderCollectionList();
}

function setupCollectionScreen() {
    renderCollectionList();

    const input = document.getElementById('barcode-scanner-input');
    const btnBip = document.getElementById('btn-execute-bip');
    const btnRandom = document.getElementById('btn-quick-bipe-random');
    const btnPending = document.getElementById('btn-quick-bipe-pending');
    const btnBatch = document.getElementById('btn-quick-bipe-batch');
    const btnClear = document.getElementById('btn-clear-scanned-batch');
    const btnSound = document.getElementById('btn-toggle-bip-sound');

    // Configuração dos selects de auto-atribuição sequencial
    const autoBaseSelect = document.getElementById('auto-assign-base-select');
    const autoDriverSelect = document.getElementById('auto-assign-driver-select');
    const stepDriverBadge = document.getElementById('step-driver-badge');
    const helperText = document.getElementById('auto-assign-helper');

    if (autoBaseSelect && autoDriverSelect) {
        autoBaseSelect.addEventListener('change', () => {
            const chosenBase = autoBaseSelect.value;
            currentAutoAssignBase = chosenBase;

            if (chosenBase) {
                // Habilita motorista
                autoDriverSelect.disabled = false;
                autoDriverSelect.style.opacity = '1';
                autoDriverSelect.style.cursor = 'pointer';
                if (stepDriverBadge) stepDriverBadge.classList.remove('inactive');

                let driverOpts = `<option value="">-- Não vincular motorista (apenas Base ${chosenBase}) --</option>`;
                driversData.forEach(d => {
                    const sel = currentAutoAssignDriver === d.id ? 'selected' : '';
                    driverOpts += `<option value="${d.id}" ${sel}>${escapeHTML(d.name)} (${escapeHTML(d.vehicle)} - ${escapeHTML(d.plate)})</option>`;
                });
                autoDriverSelect.innerHTML = driverOpts;

                if (helperText) {
                    helperText.innerHTML = `✓ Base <strong>${chosenBase}</strong> ativa. Opcional: selecione o motorista da base para vincular ao bipar.`;
                    helperText.style.color = 'var(--primary)';
                }
            } else {
                // Desabilita motorista e reseta seleção
                currentAutoAssignDriver = '';
                autoDriverSelect.value = '';
                autoDriverSelect.disabled = true;
                autoDriverSelect.style.opacity = '0.65';
                autoDriverSelect.style.cursor = 'not-allowed';
                autoDriverSelect.innerHTML = `<option value="">🔒 Selecione uma base no 1º passo primeiro...</option>`;
                if (stepDriverBadge) stepDriverBadge.classList.add('inactive');

                if (helperText) {
                    helperText.innerHTML = `ℹ️ A sequência exige atribuir primeiro a Base para depois liberar o motorista.`;
                    helperText.style.color = 'var(--text-muted)';
                }
            }
            saveState();
        });

        autoDriverSelect.addEventListener('change', () => {
            currentAutoAssignDriver = autoDriverSelect.value;
            saveState();
        });
    }

    if (input && btnBip) {
        btnBip.addEventListener('click', () => {
            const val = input.value.trim();
            if (val) {
                processBip(val);
                input.value = '';
            } else {
                playScannerBeep('error');
                showToast('Informe ou bipe um código de barras!', 'error');
            }
            input.focus();
        });

        // Escuta Enter enviado tanto pelo teclado quanto pelo leitor laser USB (com preventDefault anti-submissão)
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const val = input.value.trim();
                if (val) {
                    processBip(val);
                    input.value = '';
                } else {
                    playScannerBeep('error');
                    showToast('Informe ou bipe um código de barras!', 'error');
                }
                input.focus();
            }
        });

        // Foco automático garantido para leitura direta de pistola laser
        setTimeout(() => input.focus(), 150);
    }

    if (btnRandom) {
        btnRandom.addEventListener('click', () => {
            simulateBipeSuccess();
            input?.focus();
        });
    }

    if (btnPending) {
        btnPending.addEventListener('click', () => {
            simulateBipePending();
            input?.focus();
        });
    }

    if (btnBatch) {
        btnBatch.addEventListener('click', () => {
            simulateBipeBatch(5);
            input?.focus();
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', clearScannedBatch);
    }

    if (btnSound) {
        btnSound.addEventListener('click', toggleBipSound);
    }

    // Se já havia um item bipado na sessão, restaura o card
    if (lastBipedItem) {
        updateLastBipedCard(lastBipedItem, false);
    }
}

function renderCollectionList() {
    const tbody = document.getElementById('collection-table-body');
    const countEl = document.getElementById('scanned-count');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (countEl) countEl.innerText = `${scannedProductsData.length} pacotes`;

    if (scannedProductsData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">Nenhum pacote bipado neste lote ainda.</td></tr>`;
        return;
    }

    scannedProductsData.forEach(item => {
        const tr = document.createElement('tr');
        
        // Coluna Base
        let baseHTML = '';
        if (item.base) {
            baseHTML = `<span class="base-badge base-${item.base.toLowerCase()}">🏢 ${escapeHTML(item.base)}</span>`;
        } else {
            baseHTML = `<span class="base-badge base-none">Sem Base</span>`;
        }

        // Coluna Atribuído a
        const assignedTo = item.driverName ? 
            `<strong>${escapeHTML(item.driverName)}</strong>` : 
            '<span style="color:var(--text-muted); font-style:italic;">Não atribuído</span>';
        
        // Coluna Ações (Regra estrita: 1º Base -> 2º Motorista)
        let actionsHTML = '';
        if (item.driverId) {
            actionsHTML = `<span style="color:var(--status-success); font-weight:700; font-size:0.85rem;">✓ Vinculado</span>`;
        } else if (!item.base) {
            // Etapa 1: Atribuir Base
            actionsHTML = `
                <div style="display:flex; align-items:center; gap:6px;">
                    <select class="form-input" style="padding:4px 8px; font-size:0.75rem; width:130px; height:auto; margin:0;" onchange="if(this.value) assignPackageBase('${escapeHTML(item.code)}', this.value)">
                        <option value="">1º Definir Base...</option>
                        <option value="SMT">🏢 Base SMT</option>
                        <option value="MCO">🏢 Base MCO</option>
                        <option value="FO2">🏢 Base FO2</option>
                    </select>
                    <span style="font-size:0.72rem; color:var(--text-muted);" title="Defina a Base primeiro para liberar a seleção de motorista">🔒 Motorista</span>
                </div>
            `;
        } else {
            // Etapa 2: Base já definida, permite vincular motorista
            let driverOpts = '<option value="">-- Selecione Motorista --</option>';
            driversData.forEach(drv => {
                driverOpts += `<option value="${drv.id}">${escapeHTML(drv.name)} (${escapeHTML(drv.plate)})</option>`;
            });
            actionsHTML = `
                <div style="display:flex; align-items:center; gap:6px;">
                    <select class="form-input" id="table-driver-select-${escapeHTML(item.code)}" style="padding:4px 8px; font-size:0.75rem; width:160px; height:auto; margin:0;">
                        ${driverOpts}
                    </select>
                    <button class="btn-primary" style="padding:4px 10px; font-size:0.75rem; border-radius:var(--radius-sm);" onclick="assignPackageToDriver('${escapeHTML(item.code)}', document.getElementById('table-driver-select-${escapeHTML(item.code)}').value)">Atribuir</button>
                </div>
            `;
        }

        const danfeBadge = item.danfeKey ? 
            `<span title="Chave DANFE: ${escapeHTML(item.danfeKey)}" style="font-size:0.65rem; background:#E0F2FE; color:#0369A1; padding:1px 5px; border-radius:3px; margin-left:4px; font-weight:700; cursor:help;">DANFE</span>` : '';

        tr.innerHTML = `
            <td style="font-family:monospace; font-weight:700;">#${escapeHTML(item.code)}${danfeBadge}</td>
            <td><strong>${escapeHTML(item.recipient)}</strong></td>
            <td><span class="status-label-badge ${item.driverId ? 'entregue' : (item.base ? 'em-rota' : 'pendente')}">${escapeHTML(item.status)}</span></td>
            <td>${baseHTML}</td>
            <td>${assignedTo}</td>
            <td style="color:var(--text-muted); font-size:0.8rem;">${escapeHTML(item.timestamp)}</td>
            <td>${actionsHTML}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- DASHBOARD FINANCEIRO (GRÁFICOS DE LINHA & EVOLUÇÃO TEMPORAL) ---
const FINANCE_DATA = {
    '7d': {
        labels: ['Seg 14/08', 'Ter 15/08', 'Qua 16/08', 'Qui 17/08', 'Sex 18/08', 'Sáb 19/08', 'Dom 20/08'],
        faturamento: [980, 1450, 1220, 1840, 1630, 1800, 1500],
        custos: [160, 240, 190, 280, 210, 230, 140]
    },
    '15d': {
        labels: ['06/08', '07/08', '08/08', '09/08', '10/08', '11/08', '12/08', '13/08', '14/08', '15/08', '16/08', '17/08', '18/08', '19/08', '20/08'],
        faturamento: [820, 950, 1100, 1340, 1200, 1450, 980, 750, 980, 1450, 1220, 1840, 1630, 1800, 1500],
        custos: [130, 150, 180, 220, 200, 230, 160, 110, 160, 240, 190, 280, 210, 230, 140]
    },
    '30d': {
        labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
        faturamento: [6400, 7850, 8100, 8420],
        custos: [980, 1150, 1210, 1250]
    }
};

let currentFinancePeriod = '7d';

function getSmoothSvgPath(points) {
    if (!points || points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
    
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = i > 0 ? points[i - 1] : points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i !== points.length - 2 ? points[i + 2] : p2;
        
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        
        path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return path;
}

function getMiniSparklineSVG(values, color, id) {
    if (!values || values.length < 2) return '';
    const min = Math.min(...values) * 0.85;
    const max = Math.max(...values) * 1.05;
    const range = (max - min) || 1;
    const w = 120;
    const h = 44;
    const topPad = 4;
    const bottomPad = 4;
    const plotH = h - topPad - bottomPad;

    const points = values.map((val, idx) => ({
        x: (idx / (values.length - 1)) * w,
        y: topPad + plotH - ((val - min) / range) * plotH
    }));

    const linePath = getSmoothSvgPath(points);
    const areaPath = `${linePath} L ${w},${h} L 0,${h} Z`;
    const lastPoint = points[points.length - 1];

    return `
        <svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" style="overflow:visible;">
            <defs>
                <linearGradient id="grad-spark-${id}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="${color}" stop-opacity="0.0"/>
                </linearGradient>
            </defs>
            <path d="${areaPath}" fill="url(#grad-spark-${id})" />
            <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="3.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.5" />
        </svg>
    `;
}

function getFinanceMainLineChartSVG(period = '7d') {
    const data = FINANCE_DATA[period] || FINANCE_DATA['7d'];
    const totalPoints = data.labels.length;
    
    const svgW = 840;
    const svgH = 260;
    const padLeft = 65;
    const padRight = 30;
    const padTop = 25;
    const padBottom = 40;
    
    const plotW = svgW - padLeft - padRight;
    const plotH = svgH - padTop - padBottom;
    
    const allVals = [...data.faturamento, ...data.custos];
    const rawMax = Math.max(...allVals);
    const maxVal = Math.ceil((rawMax * 1.15) / 200) * 200;
    
    // Linhas de Grade e Eixo Y
    const gridSteps = 4;
    let gridHTML = '';
    for (let i = 0; i <= gridSteps; i++) {
        const val = (maxVal / gridSteps) * (gridSteps - i);
        const y = padTop + (plotH / gridSteps) * i;
        const valFormatted = 'R$ ' + (val >= 1000 ? (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'k' : val.toFixed(0));
        gridHTML += `
            <line x1="${padLeft}" y1="${y}" x2="${padLeft + plotW}" y2="${y}" stroke="var(--border)" stroke-width="1" stroke-dasharray="${i === gridSteps ? '0' : '4,4'}" opacity="0.8" />
            <text x="${padLeft - 10}" y="${y + 4}" font-size="11" font-weight="600" fill="var(--text-muted)" text-anchor="end">${valFormatted}</text>
        `;
    }
    
    // Eixo X Labels
    let labelsHTML = '';
    const xCoords = [];
    data.labels.forEach((label, idx) => {
        const x = padLeft + (idx / (totalPoints - 1)) * plotW;
        xCoords.push(x);
        labelsHTML += `
            <text x="${x}" y="${svgH - 12}" font-size="11" font-weight="600" fill="var(--text-muted)" text-anchor="middle">${escapeHTML(label)}</text>
        `;
    });
    
    // Coordenadas das Séries
    const pointsFat = data.faturamento.map((val, idx) => ({
        x: xCoords[idx],
        y: padTop + plotH - (val / maxVal) * plotH,
        val: val
    }));
    
    const pointsCusto = data.custos.map((val, idx) => ({
        x: xCoords[idx],
        y: padTop + plotH - (val / maxVal) * plotH,
        val: val
    }));

    const pathFat = getSmoothSvgPath(pointsFat);
    const areaFat = `${pathFat} L ${xCoords[xCoords.length - 1]},${padTop + plotH} L ${xCoords[0]},${padTop + plotH} Z`;
    
    const pathCusto = getSmoothSvgPath(pointsCusto);
    const areaCusto = `${pathCusto} L ${xCoords[xCoords.length - 1]},${padTop + plotH} L ${xCoords[0]},${padTop + plotH} Z`;

    // Nós interativos e colunas de foco
    let nodesHTML = '';
    const colWidth = plotW / (totalPoints > 1 ? totalPoints - 1 : 1);
    for (let i = 0; i < totalPoints; i++) {
        const x = xCoords[i];
        const yF = pointsFat[i].y;
        const yC = pointsCusto[i].y;
        const fatVal = data.faturamento[i];
        const custoVal = data.custos[i];
        const margemVal = fatVal - custoVal;
        const label = data.labels[i];

        nodesHTML += `
            <rect class="chart-hover-col" data-idx="${i}" data-label="${escapeHTML(label)}" data-fat="${fatVal}" data-custo="${custoVal}" data-margem="${margemVal}" x="${x - colWidth / 2}" y="${padTop}" width="${colWidth}" height="${plotH}" fill="transparent" style="cursor:pointer;" />
            <line id="hover-line-${i}" class="chart-hover-line" x1="${x}" y1="${padTop}" x2="${x}" y2="${padTop + plotH}" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="3,3" style="display:none;" />
            <circle id="node-fat-${i}" cx="${x}" cy="${yF}" r="4.5" fill="#10B981" stroke="#FFFFFF" stroke-width="2" style="transition:all 0.15s ease;" />
            <circle id="node-custo-${i}" cx="${x}" cy="${yC}" r="4" fill="#0A58CA" stroke="#FFFFFF" stroke-width="2" style="transition:all 0.15s ease;" />
        `;
    }

    return `
        <svg viewBox="0 0 ${svgW} ${svgH}" width="100%" height="100%" preserveAspectRatio="none" style="overflow:visible;" id="finance-svg-element">
            <defs>
                <linearGradient id="grad-fat-main" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#10B981" stop-opacity="0.32"/>
                    <stop offset="90%" stop-color="#10B981" stop-opacity="0.01"/>
                </linearGradient>
                <linearGradient id="grad-cost-main" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#0A58CA" stop-opacity="0.25"/>
                    <stop offset="90%" stop-color="#0A58CA" stop-opacity="0.01"/>
                </linearGradient>
                <filter id="glow-fat" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#10B981" flood-opacity="0.35"/>
                </filter>
                <filter id="glow-cost" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0A58CA" flood-opacity="0.3"/>
                </filter>
            </defs>

            <!-- Grade de Fundo -->
            ${gridHTML}

            <!-- Área Faturamento -->
            <path d="${areaFat}" fill="url(#grad-fat-main)" />

            <!-- Área Custos -->
            <path d="${areaCusto}" fill="url(#grad-cost-main)" />

            <!-- Linha Custos Operacionais -->
            <path d="${pathCusto}" fill="none" stroke="#0A58CA" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow-cost)" />

            <!-- Linha Faturamento Previsto -->
            <path d="${pathFat}" fill="none" stroke="#10B981" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow-fat)" />

            <!-- Labels X -->
            ${labelsHTML}

            <!-- Nós e Colunas Interativas -->
            ${nodesHTML}
        </svg>
    `;
}

function renderFinanceLineChart(period) {
    const container = document.getElementById('finance-line-chart-container');
    if (!container) return;

    container.innerHTML = getFinanceMainLineChartSVG(period);

    // Tooltip interativo
    const tooltip = document.getElementById('finance-chart-tooltip');
    const svgWrap = document.querySelector('.finance-chart-svg-wrap');
    if (!tooltip || !svgWrap) return;

    const hoverCols = container.querySelectorAll('.chart-hover-col');
    hoverCols.forEach(col => {
        col.addEventListener('mouseenter', () => {
            const idx = col.dataset.idx;
            const label = col.dataset.label;
            const fat = parseFloat(col.dataset.fat);
            const custo = parseFloat(col.dataset.custo);
            const margem = parseFloat(col.dataset.margem);

            const hoverLine = container.querySelector(`#hover-line-${idx}`);
            if (hoverLine) hoverLine.style.display = 'block';

            const nodeFat = container.querySelector(`#node-fat-${idx}`);
            if (nodeFat) {
                nodeFat.setAttribute('r', '7');
                nodeFat.setAttribute('stroke-width', '3');
            }
            const nodeCusto = container.querySelector(`#node-custo-${idx}`);
            if (nodeCusto) {
                nodeCusto.setAttribute('r', '6');
                nodeCusto.setAttribute('stroke-width', '3');
            }

            tooltip.innerHTML = `
                <div style="font-weight:700; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:4px; margin-bottom:6px; color:#F8FAFC;">
                    📅 ${escapeHTML(label)}
                </div>
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <div style="display:flex; justify-content:space-between; gap:16px;">
                        <span style="color:#A7F3D0;">● Faturamento:</span>
                        <strong style="color:#34D399;">R$ ${fat.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; gap:16px;">
                        <span style="color:#BFDBFE;">● Custos Operacionais:</span>
                        <strong style="color:#60A5FA;">R$ ${custo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; gap:16px; border-top:1px dashed rgba(255,255,255,0.2); padding-top:4px; margin-top:2px;">
                        <span style="color:#DDD6FE;">● Margem Líquida:</span>
                        <strong style="color:#A78BFA;">R$ ${margem.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>
                    </div>
                </div>
            `;
            tooltip.style.display = 'block';
        });

        col.addEventListener('mousemove', (e) => {
            const rect = svgWrap.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y}px`;
        });

        col.addEventListener('mouseleave', () => {
            const idx = col.dataset.idx;
            const hoverLine = container.querySelector(`#hover-line-${idx}`);
            if (hoverLine) hoverLine.style.display = 'none';

            const nodeFat = container.querySelector(`#node-fat-${idx}`);
            if (nodeFat) {
                nodeFat.setAttribute('r', '4.5');
                nodeFat.setAttribute('stroke-width', '2');
            }
            const nodeCusto = container.querySelector(`#node-custo-${idx}`);
            if (nodeCusto) {
                nodeCusto.setAttribute('r', '4');
                nodeCusto.setAttribute('stroke-width', '2');
            }

            tooltip.style.display = 'none';
        });
    });
}

function setupFinanceScreen() {
    renderFinanceLineChart(currentFinancePeriod);

    // Alternância de abas de período
    const periodButtons = document.querySelectorAll('.finance-period-btn');
    periodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            periodButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const period = btn.dataset.period;
            currentFinancePeriod = period;
            renderFinanceLineChart(period);
        });
    });
}

// Frota
function simulateAddVehicle() {
    const name = prompt('Nome/Modelo do Veículo:');
    if (!name) return;
    const plate = prompt('Placa (ex: ABC-1234):');
    if (!plate) return;

    vehiclesData.push({
        name: name,
        plate: plate.toUpperCase(),
        health: 100,
        info: 'Novo veículo adicionado à frota',
        color: '#198754'
    });

    saveState();
    render();
    showToast(`Veículo ${name} registrado na frota!`, 'success');
}

function renderFleetList() {
    const grid = document.getElementById('fleet-vehicles-grid');
    if (!grid) return;

    grid.innerHTML = '';
    vehiclesData.forEach(v => {
        const card = document.createElement('div');
        card.style.cssText = `background: var(--surface); padding: 25px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); display: flex; gap: 20px; border:1px solid var(--border);`;
        card.innerHTML = `
            <div style="font-size: 3rem;">🚛</div>
            <div style="flex: 1;">
                <h3 style="margin: 0; font-weight:700;">${v.name}</h3>
                <div style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 10px;">Placa: ${v.plate}</div>
                <div style="height: 6px; background: var(--border-light); border-radius: 3px; position: relative; overflow:hidden;">
                    <div style="width: ${v.health}%; height: 100%; background: ${v.color}; border-radius: 3px;"></div>
                </div>
                <small style="display: block; margin-top: 6px; color: ${v.color}; font-weight: 700;">${v.info}</small>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Chat Mensagens
function renderChat() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    container.innerHTML = '';
    chatMessages.forEach(msg => {
        const item = document.createElement('div');
        item.className = `chat-msg ${msg.type}`;
        item.innerHTML = `
            <div style="font-size:0.7rem; opacity:0.8; font-weight:700; margin-bottom:2px;">${escapeHTML(msg.sender)} • ${escapeHTML(msg.time)}</div>
            <div>${escapeHTML(msg.text)}</div>
        `;
        container.appendChild(item);
    });
    
    // Auto scroll bottom
    container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('chat-input-text');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    const newMsg = {
        sender: 'Central (Você)',
        text: text,
        type: 'sent',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    chatMessages.push(newMsg);
    saveState();
    input.value = '';
    renderChat();
    
    // Simular resposta rápida do motorista após 1.5s
    setTimeout(() => {
        const answers = [
            'Entendido central, estou à caminho.',
            'Certo, anotado.',
            'Concluído aqui. Saindo para a próxima rota.'
        ];
        const randomAnswer = answers[Math.floor(Math.random() * answers.length)];
        chatMessages.push({
            sender: 'João Silva',
            text: randomAnswer,
            type: 'received',
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });
        saveState();
        renderChat();
        showToast('Nova mensagem recebida de João Silva', 'info');
    }, 1500);
}

// Configurações - Abas e Criar
function simulateAddCustomTab() {
    const input = document.getElementById('new-tab-name-input');
    if (!input) return;

    const tabName = input.value.trim();
    if (!tabName) {
        showToast('Digite um nome válido para o módulo.', 'error');
        return;
    }

    customTabsData.push(tabName);
    saveState();
    input.value = '';
    render();
    showToast(`Módulo customizado "${tabName}" criado!`, 'success');
}

function removeCustomTab(index) {
    if (confirm(`Deseja remover o módulo "${customTabsData[index]}"?`)) {
        customTabsData.splice(index, 1);
        if (currentState.screen.startsWith('custom_')) {
            currentState.screen = 'home';
        }
        saveState();
        render();
        showToast('Módulo removido.', 'info');
    }
}

function renderSettingsTabs() {
    const list = document.getElementById('custom-tabs-settings-list');
    if (!list) return;

    list.innerHTML = '';
    if (customTabsData.length === 0) {
        list.innerHTML = `<span style="color:var(--text-muted); font-size:0.875rem;">Nenhum módulo customizado ativado.</span>`;
        return;
    }

    customTabsData.forEach((tab, index) => {
        const badge = document.createElement('div');
        badge.style.cssText = `background: var(--bg-light); border: 1px solid var(--border); padding: 8px 14px; border-radius: var(--radius-md); display:flex; align-items:center; gap:8px; font-weight:600; font-size:0.875rem;`;
        badge.innerHTML = `
            <span>📁 ${escapeHTML(tab)}</span>
            <span style="color:var(--status-failure); cursor:pointer; font-weight:700; margin-left:6px;" onclick="removeCustomTab(${index})">&times;</span>
        `;
        list.appendChild(badge);
    });
}

// --- APP MOTORISTA PWA (FULLSCREEN / MOBILE EMULATION) ---
function renderHeaderActionsToggle() {
    // Injeta os botões de controle de tela no Header de cada screen
    const placeholder = document.getElementById('admin-header-actions-placeholder');
    if (!placeholder) return;

    placeholder.innerHTML = `
        <div class="toggle-container">
            <button class="btn-toggle ${activeView === 'admin' ? 'active' : ''}" id="btn-view-admin-inner">
                <span>Painel Admin</span>
            </button>
            <button class="btn-toggle ${activeView === 'driver' ? 'active' : ''}" id="btn-view-driver-inner">
                <span>Ver PWA (Motorista)</span>
            </button>
        </div>
    `;

    // Atribuir os binds
    document.getElementById('btn-view-admin-inner').addEventListener('click', () => {
        activeView = 'admin';
        saveState();
        render();
    });

    document.getElementById('btn-view-driver-inner').addEventListener('click', () => {
        activeView = 'driver';
        saveState();
        render();
    });
}

// --- RENDER PRINCIPAL ---
function render() {
    saveState();

    const appEl = document.getElementById('app');
    
    // Se a aba selecionada for customizada (módulos vazios criados em configs)
    if (activeView === 'admin' && currentState.screen.startsWith('custom_')) {
        const tabIndex = parseInt(currentState.screen.replace('custom_', ''), 10);
        const tabName = customTabsData[tabIndex] || 'Módulo Extra';
        
        appEl.innerHTML = `
            <header class="main-header" style="display:none;"></header> <!-- Header placeholder -->
            <div class="app-layout">
                ${sidebarTemplate()}
                <div class="main-content">
                    <header class="content-header">
                        <div class="content-title">📂 ${tabName} <span>/ Módulo Customizado</span></div>
                        <div class="header-actions" id="admin-header-actions-placeholder"></div>
                    </header>
                    <div class="content-body" style="text-align: center; padding:60px;">
                        <span style="font-size: 5rem;">📂</span>
                        <h2 style="font-weight: 800; font-size:1.5rem; margin-top:14px;">Aba ${tabName}</h2>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top:8px;">Este módulo foi criado dinamicamente e está pronto para receber integrações.</p>
                    </div>
                </div>
            </div>
        `;
        renderHeaderActionsToggle();
        return;
    }

    // Se estiver na visão administrativa
    if (activeView === 'admin') {
        if (currentState.screen === 'login') {
            appEl.innerHTML = screens.login();
            
            // Login handler
            document.getElementById('btn-login-submit').addEventListener('click', handleLoginSubmit);
        } else {
            // Renderiza tela específica do admin
            appEl.innerHTML = screens[currentState.screen]();
            
            // Injeta botões de alternância e online badge no header
            renderHeaderActionsToggle();

            // Configuração específica por tela
            if (currentState.screen === 'control_tower') {
                // Injeta o gráfico de donut
                const chartContainer = document.getElementById('admin-chart-container');
                if (chartContainer) {
                    chartContainer.innerHTML = getChartSVG();
                }
                
                // Configurar Leaflet
                setTimeout(() => {
                    initMaps();
                    refreshUI();
                }, 100);
            } else if (currentState.screen === 'deliveries') {
                renderDeliveriesPageList();
                document.getElementById('deliveries-page-search')?.addEventListener('input', renderDeliveriesPageList);
            } else if (currentState.screen === 'collection') {
                setupCollectionScreen();
            } else if (currentState.screen === 'finance') {
                setupFinanceScreen();
            } else if (currentState.screen === 'fleet') {
                renderFleetList();
            } else if (currentState.screen === 'messages') {
                renderChat();
                document.getElementById('btn-chat-send').addEventListener('click', sendChatMessage);
                document.getElementById('chat-input-text').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') sendChatMessage();
                });
            } else if (currentState.screen === 'settings') {
                renderSettingsTabs();
            }
        }
    } else {
        // VISÃO DO MOTORISTA (PWA)
        // Sobrescreve HTML com o emulador móvel completo
        injectHTMLStructure();
        populateDriverSelect();
        setupEventListeners();

        // Inicializar mapas Leaflet específicos
        setTimeout(() => {
            initMaps();
            refreshUI();
        }, 100);
    }
}

// Login Submit
function handleLoginSubmit() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-login-submit');

    if (!email || !pass) {
        showToast('Preencha email e senha.', 'error');
        return;
    }

    btn.innerText = 'Autenticando...';
    btn.disabled = true;

    setTimeout(() => {
        if (email === 'felipe.dev@gmail.com' && pass === '123456') {
            currentState.userRole = 'admin';
            navigate('home');
            showToast('Bem-vindo, Felipe! Acesso Admin autorizado.', 'success');
        } else if (email === 'motorista123@gmail.com' && pass === '123456') {
            currentState.userRole = 'operador';
            navigate('home');
            showToast('Acesso de Operador autorizado.', 'success');
        } else {
            showToast('Credenciais incorretas!', 'error');
            btn.innerText = 'Entrar no Sistema';
            btn.disabled = false;
        }
    }, 600);
}

// --- MONTAGEM DA INTERFACE MOTORISTA ---
function injectHTMLStructure() {
    const appEl = document.getElementById('app');
    appEl.innerHTML = `
        <header class="main-header">
            <div class="brand">
                <img src="assets/logo_run.png" alt="RUN Logo" class="brand-logo" onerror="this.src='assets/icon-192.png'">
                <h1 class="brand-title">TMS RUN <span>| PWA Motorista</span></h1>
            </div>
            <div class="header-actions">
                <div class="status-badge online" id="connection-status">
                    <span class="status-dot"></span>
                    <span id="connection-text">Online</span>
                </div>
                <div class="toggle-container">
                    <button class="btn-toggle" id="btn-view-admin">
                        <span>Painel Admin</span>
                    </button>
                    <button class="btn-toggle active" id="btn-view-driver">
                        <span>PWA Motorista</span>
                    </button>
                </div>
            </div>
        </header>
        <div class="content-wrapper">
            <div class="view-panel active" id="panel-driver">
                <div class="view-driver">
                    <div class="mobile-frame">
                        <div class="driver-app">
                            <div class="driver-header">
                                <div class="driver-profile">
                                    <div class="driver-info-avatar">
                                        <img src="assets/driver.png" class="driver-avatar" alt="Motorista" onerror="this.src='https://api.dicebear.com/7.x/adventurer/svg?seed=driver'">
                                        <div class="driver-details-text">
                                            <span class="driver-name" id="driver-app-name">Nome Motorista</span>
                                            <span class="driver-plate" id="driver-app-plate">Placa</span>
                                        </div>
                                    </div>
                                    <div class="driver-status-pills">
                                        <span class="driver-battery">🔋 <span id="driver-app-battery">90%</span></span>
                                        <select id="driver-select" style="padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; border: none; font-weight: 600;">
                                            <!-- Options populated via JS -->
                                        </select>
                                    </div>
                                </div>
                                <div class="driver-tabs">
                                    <button class="driver-tab-btn ${activeDriverTab === 'list' ? 'active' : ''}" id="driver-tab-list">Lista</button>
                                    <button class="driver-tab-btn ${activeDriverTab === 'map' ? 'active' : ''}" id="driver-tab-map">Mapa da Rota</button>
                                    <button class="driver-tab-btn ${activeDriverTab === 'bip' ? 'active' : ''}" id="driver-tab-bip">📦 Bipar Carga</button>
                                </div>
                            </div>
                            <!-- Driver List Screen -->
                            <div class="driver-screen ${activeDriverTab === 'list' ? 'active' : ''}" id="driver-screen-list">
                                <div style="display: flex; flex-direction: column; gap: 12px;" id="driver-delivery-list">
                                    <!-- Cards do motorista -->
                                </div>
                            </div>
                            <!-- Driver Map Screen -->
                            <div class="driver-screen ${activeDriverTab === 'map' ? 'active' : ''}" id="driver-screen-map" style="padding:0; position:relative;">
                                <div class="driver-map-container">
                                    <div id="driver-map"></div>
                                </div>
                            </div>
                            <!-- Driver Bip Screen (Conferência de Embarque) -->
                            <div class="driver-screen ${activeDriverTab === 'bip' ? 'active' : ''}" id="driver-screen-bip">
                                <div class="driver-bip-container" id="driver-bip-content">
                                    <!-- Conteúdo gerado via renderDriverBipScreen() -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- MODAIS DO MOTORISTA -->
        
        <!-- Modal PoD (Baixa de Entrega) -->
        <div class="modal-overlay" id="modal-pod">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Comprovante de Entrega Digital</h3>
                    <button class="modal-close" id="modal-pod-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="signature-container">
                        <span class="form-label">Assinatura do Recebedor</span>
                        <div class="signature-canvas-wrapper">
                            <canvas id="signature-canvas"></canvas>
                            <button class="canvas-clear-btn" id="btn-clear-signature">Limpar</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <span class="form-label">Foto do Local / Comprovante</span>
                        <div class="photo-simulator-box" id="photo-simulator">
                            <span class="photo-icon">📷</span>
                            <span class="photo-label" id="photo-simulator-label">Simular Foto do Comprovante</span>
                            <img id="photo-preview-img" class="photo-preview" src="" alt="Comprovante">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nome de Quem Recebeu</label>
                        <input type="text" class="form-input" id="pod-receiver-name" placeholder="Nome completo do recebedor">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Documento (RG/CPF)</label>
                        <input type="text" class="form-input" id="pod-receiver-doc" placeholder="Número do documento">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="btn-pod-cancel">Cancelar</button>
                    <button class="btn-primary" id="btn-pod-confirm">Confirmar Entrega</button>
                </div>
            </div>
        </div>

        <!-- Modal Insucesso (Registrar Ocorrência) -->
        <div class="modal-overlay" id="modal-problem">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Registrar Ocorrência de Entrega</h3>
                    <button class="modal-close" id="modal-problem-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Motivo do Insucesso</label>
                        <select class="form-select" id="problem-reason">
                            <option value="Destinatário Ausente">Destinatário Ausente</option>
                            <option value="Endereço Inexistente / Incorreto">Endereço Inexistente / Incorreto</option>
                            <option value="Recusa de Recebimento pelo Cliente">Recusa de Recebimento pelo Cliente</option>
                            <option value="Estabelecimento Fechado">Estabelecimento Fechado</option>
                            <option value="Carga Danificada / Avariada">Carga Danificada / Avariada</option>
                            <option value="Outros (Especificar nas observações)">Outros (Especificar)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Observações / Detalhes</label>
                        <textarea class="form-textarea" id="problem-notes" placeholder="Descreva os detalhes da ocorrência..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="btn-problem-cancel">Cancelar</button>
                    <button class="btn-primary" id="btn-problem-confirm" style="background-color: var(--status-failure);">Registrar Ocorrência</button>
                </div>
            </div>
        </div>

        <!-- Toast Notifications -->
        <div class="toast-container" id="toast-container"></div>
    `;
}

// --- UTILS ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || document.body;
    
    // Cria container se não existir
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Gerador dinâmico de imagem fictícia de caixa/pacote para PoD
function generateMockPackageImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 300, 200);
    grad.addColorStop(0, '#E2E8F0');
    grad.addColorStop(1, '#CBD5E1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 300, 200);
    
    // Box
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 40, 200, 120);
    
    // Tape
    ctx.fillStyle = '#C2410C'; 
    ctx.fillRect(140, 40, 20, 120);
    
    // Checkmark inside green circle
    ctx.beginPath();
    ctx.arc(150, 100, 26, 0, Math.PI * 2);
    ctx.fillStyle = '#198754';
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(140, 100);
    ctx.lineTo(147, 107);
    ctx.lineTo(162, 92);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    
    return canvas.toDataURL();
}

// --- MAPA LEAFLET ---
function initMaps() {
    // 1. Mapa Admin (apenas se a div #map existir na tela)
    const mapDiv = document.getElementById('map');
    if (mapDiv) {
        if (adminMap) {
            try {
                adminMap.remove();
            } catch (e) {
                console.warn('Erro ao remover adminMap antigo:', e);
            }
            adminMap = null;
        }

        adminMap = L.map('map', {
            zoomControl: true,
            attributionControl: false
        }).setView([-23.5505, -46.6333], 13);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(adminMap);
        
        adminMapGroup = L.layerGroup().addTo(adminMap);
    }

    // 2. Mapa Motorista (apenas se a div #driver-map existir na tela)
    const driverMapDiv = document.getElementById('driver-map');
    if (driverMapDiv) {
        if (driverMap) {
            try {
                driverMap.remove();
            } catch (e) {
                console.warn('Erro ao remover driverMap antigo:', e);
            }
            driverMap = null;
        }

        driverMap = L.map('driver-map', {
            zoomControl: false,
            attributionControl: false
        }).setView([-23.5505, -46.6333], 13);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(driverMap);
        
        driverMapGroup = L.layerGroup().addTo(driverMap);
    }
}

function updateMapsMarkers() {
    // Marcadores do Mapa Administrativo
    if (adminMap && adminMapGroup) {
        adminMapGroup.clearLayers();

        const filtered = getFilteredDeliveries();

        // Pins de entrega
        filtered.forEach(del => {
            const markerIcon = L.divIcon({
                className: 'custom-leaflet-marker',
                html: `<div class="map-pin-icon ${del.status.replace(' ', '-')}" title="NF: ${del.nf}"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const driver = driversData.find(d => d.id === del.driverId);
            const driverName = driver ? driver.name : 'Não Atribuído';
            const statusTexts = { 'pendente': 'Pendente', 'em rota': 'Em Rota', 'entregue': 'Entregue', 'insucesso': 'Ocorrência' };

            let popupContent = `
                <div class="popup-details">
                    <div class="popup-title">
                        <span>NF: ${del.nf}</span>
                        <span class="status-label-badge ${del.status.replace(' ', '-')}">${statusTexts[del.status]}</span>
                    </div>
                    <div class="popup-address"><strong>Destinatário:</strong> ${del.recipient}<br><strong>Endereço:</strong> ${del.address}</div>
                    <div class="popup-meta">
                        <span>⏱️ <strong>SLA:</strong> Limite até ${del.sla}</span>
                        <span>🚚 <strong>Motorista:</strong> ${driverName}</span>
                    </div>
            `;

            if (del.status === 'entregue' || del.status === 'insucesso') {
                popupContent += `<button class="popup-btn" onclick="openPodViewer('${del.id}')">Visualizar Comprovante</button>`;
            } else {
                popupContent += `<button class="popup-btn" onclick="simulateAdminForceDeliver('${del.id}')">Forçar Baixa Manual</button>`;
            }
            popupContent += `</div>`;

            L.marker([del.lat, del.lng], { icon: markerIcon })
                .bindPopup(popupContent)
                .addTo(adminMapGroup);
        });

        // Veículos em Rota
        driversData.forEach(drv => {
            if (drv.status === 'Em Rota') {
                const vehicleIcon = L.divIcon({
                    className: 'custom-leaflet-marker',
                    html: `
                        <div class="driver-marker-container" title="Motorista: ${drv.name} | ${drv.vehicle}">
                            <div class="driver-marker-pulse"></div>
                            <div class="driver-marker-icon">🚚</div>
                        </div>
                    `,
                    iconSize: [44, 44],
                    iconAnchor: [22, 22]
                });

                const drvDeliveries = deliveriesData.filter(d => d.driverId === drv.id);
                const pendentes = drvDeliveries.filter(d => d.status === 'pendente' || d.status === 'em rota').length;
                const concluidas = drvDeliveries.filter(d => d.status === 'entregue').length;

                const popupContent = `
                    <div class="popup-details">
                        <div class="popup-title">🚚 ${drv.name}</div>
                        <div class="popup-address">
                            <strong>Veículo:</strong> ${drv.vehicle}<br>
                            <strong>Placa:</strong> ${drv.plate}<br>
                            <strong>Bateria:</strong> ${drv.battery}%
                        </div>
                        <div class="popup-meta" style="background-color: var(--primary-light); color: var(--primary-dark);">
                            <span>📦 <strong>Pendentes:</strong> ${pendentes}</span>
                            <span>✅ <strong>Finalizadas:</strong> ${concluidas}</span>
                        </div>
                    </div>
                `;

                L.marker([drv.lat, drv.lng], { icon: vehicleIcon })
                    .bindPopup(popupContent)
                    .addTo(adminMapGroup);
            }
        });
    }

    // Marcadores do Mapa do Motorista (PWA)
    if (driverMap && driverMapGroup) {
        driverMapGroup.clearLayers();

        const activeDriver = driversData.find(d => d.id === selectedDriverId);
        if (activeDriver) {
            driverMap.setView([activeDriver.lat, activeDriver.lng], 13);

            // Marcador do Motorista
            const driverIcon = L.divIcon({
                className: 'custom-leaflet-marker',
                html: `
                    <div class="driver-marker-container">
                        <div class="driver-marker-pulse"></div>
                        <div class="driver-marker-icon">🚚</div>
                    </div>
                `,
                iconSize: [44, 44],
                iconAnchor: [22, 22]
            });

            L.marker([activeDriver.lat, activeDriver.lng], { icon: driverIcon }).addTo(driverMapGroup);

            // Marcadores de Entregas do Motorista
            const drvDeliveries = deliveriesData.filter(d => d.driverId === selectedDriverId);
            
            drvDeliveries.forEach((del, idx) => {
                const markerIcon = L.divIcon({
                    className: 'custom-leaflet-marker',
                    html: `<div class="map-pin-icon ${del.status.replace(' ', '-')}" style="transform: scale(0.9) rotate(-45deg);">${idx + 1}</div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                L.marker([del.lat, del.lng], { icon: markerIcon })
                    .bindPopup(`
                        <strong>Parada ${idx + 1} - NF: ${del.nf}</strong><br>
                        Destinatário: ${del.recipient}<br>
                        SLA: ${del.sla}<br>
                        Status: ${del.status.toUpperCase()}
                    `)
                    .addTo(driverMapGroup);
            });

            // Linha da Rota
            if (drvDeliveries.length > 0) {
                const routePoints = [
                    [activeDriver.lat, activeDriver.lng],
                    ...drvDeliveries.map(d => [d.lat, d.lng])
                ];

                L.polyline(routePoints, {
                    color: '#0A58CA',
                    weight: 4,
                    dashArray: '5, 10'
                }).addTo(driverMapGroup);
            }
        }
    }
}

// --- RENDERIZAÇÃO KPIs E LISTA ---
function renderKPIs() {
    const total = deliveriesData.length;
    const emRota = deliveriesData.filter(d => d.status === 'em rota').length;
    const entregues = deliveriesData.filter(d => d.status === 'entregue').length;
    const ocorrencias = deliveriesData.filter(d => d.status === 'insucesso').length;
    
    let slaPercent = 100;
    if (entregues + ocorrencias > 0) {
        slaPercent = Math.round((entregues / (entregues + ocorrencias)) * 100);
    }

    const totalEl = document.getElementById('kpi-total-val');
    if (!totalEl) return; // Se não estiver na tela Torre de Controle

    totalEl.innerText = total;
    document.getElementById('kpi-route-val').innerText = emRota;
    document.getElementById('kpi-success-val').innerText = entregues;
    document.getElementById('kpi-success-sub').innerText = total > 0 ? `${Math.round((entregues/total)*100)}% concluídos` : '0% concluídos';
    document.getElementById('kpi-failure-val').innerText = ocorrencias;
    
    const slaValEl = document.getElementById('kpi-sla-val');
    slaValEl.innerText = `${slaPercent}%`;
    if (slaPercent < 90) {
        slaValEl.parentElement.parentElement.classList.add('delayed');
    } else {
        slaValEl.parentElement.parentElement.classList.remove('delayed');
    }
}

function getFilteredDeliveries() {
    return deliveriesData.filter(del => {
        const matchesFilter = currentFilter === 'all' || del.status === currentFilter;
        const matchesSearch = del.nf.includes(currentSearch) || 
                              del.recipient.toLowerCase().includes(currentSearch.toLowerCase()) ||
                              del.address.toLowerCase().includes(currentSearch.toLowerCase());
        return matchesFilter && matchesSearch;
    });
}

function renderAdminList() {
    const listEl = document.getElementById('admin-delivery-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    const filtered = getFilteredDeliveries();

    if (filtered.length === 0) {
        listEl.innerHTML = `<div style="padding:30px; text-align:center; color:var(--text-muted); font-size:0.875rem;">Nenhuma entrega encontrada.</div>`;
        return;
    }

    const statusTexts = { 'pendente': 'Pendente', 'em rota': 'Em Rota', 'entregue': 'Entregue', 'insucesso': 'Ocorrência' };

    filtered.forEach(del => {
        const driver = driversData.find(d => d.id === del.driverId);
        const driverName = driver ? driver.name : 'Não atribuído';
        
        const card = document.createElement('div');
        card.className = 'delivery-card';
        card.innerHTML = `
            <div class="delivery-card-header">
                <span class="nf-badge">Nota Fiscal #${del.nf}</span>
                <span class="status-label-badge ${del.status.replace(' ', '-')}">${statusTexts[del.status]}</span>
            </div>
            <div class="delivery-card-body">
                <span class="client-name">${del.recipient}</span>
                <span class="delivery-address">${del.address}</span>
            </div>
            <div class="delivery-card-footer">
                <span class="sla-info">⏱️ Limite: ${del.sla}</span>
                <span class="driver-info">🚚 ${driverName}</span>
            </div>
        `;

        card.addEventListener('click', () => {
            adminMap.setView([del.lat, del.lng], 16);
            document.querySelectorAll('.delivery-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            adminMapGroup.eachLayer(layer => {
                if (layer instanceof L.Marker && layer.getLatLng().lat === del.lat) {
                    layer.openPopup();
                }
            });
        });

        listEl.appendChild(card);
    });
}

// Lista do Motorista (PWA)
function renderDriverList() {
    const listEl = document.getElementById('driver-delivery-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    const activeDriver = driversData.find(d => d.id === selectedDriverId);
    
    if (activeDriver) {
        document.getElementById('driver-app-name').innerText = activeDriver.name;
        document.getElementById('driver-app-plate').innerText = `${activeDriver.vehicle} • Placa: ${activeDriver.plate}`;
        document.getElementById('driver-app-battery').innerText = `${activeDriver.battery}%`;
    }

    const drvDeliveries = deliveriesData.filter(d => d.driverId === selectedDriverId);

    if (drvDeliveries.length === 0) {
        listEl.innerHTML = `<div style="padding:40px; text-align:center; color:var(--text-muted); font-size:0.875rem; background:white; border-radius:12px; border:1px solid var(--border);">Nenhuma carga associada hoje.</div>`;
        return;
    }

    drvDeliveries.forEach((del, index) => {
        const card = document.createElement('div');
        card.className = 'driver-del-card';
        
        let actionButtons = '';
        if (del.status === 'pendente' || del.status === 'em rota') {
            actionButtons = `
                <div class="driver-del-actions">
                    <button class="driver-btn-pod" onclick="openPodModal('${del.id}')">📥 Baixar Entrega</button>
                    <button class="driver-btn-problem" onclick="openProblemModal('${del.id}')">Ocorrência</button>
                </div>
            `;
        } else if (del.status === 'entregue') {
            actionButtons = `
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-light); padding-top:10px; font-size:0.75rem; color:var(--status-success); font-weight:600;">
                    <span>✅ Concluído</span>
                    <span>${new Date(del.pod.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            `;
        } else if (del.status === 'insucesso') {
            actionButtons = `
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-light); padding-top:10px; font-size:0.75rem; color:var(--status-failure); font-weight:600;">
                    <span>⚠️ Ocorrência: ${del.occurrence.reason}</span>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="driver-del-header">
                <span class="driver-del-seq">${index + 1}</span>
                <span class="status-label-badge ${del.status.replace(' ', '-')}">${del.status.toUpperCase()}</span>
            </div>
            <div class="driver-del-body">
                <span class="driver-del-dest">${del.recipient}</span>
                <span class="driver-del-addr">${del.address}</span>
            </div>
            <div class="driver-del-meta">
                <span>⏱️ SLA: <strong>${del.sla}</strong></span>
                <span>NF: <strong>#${del.nf}</strong></span>
            </div>
            ${actionButtons}
        `;
        listEl.appendChild(card);
    });

    if (activeDriverTab === 'bip') {
        renderDriverBipScreen();
    }
}

// --- CONFERÊNCIA DE EMBARQUE / BIPAGEM NO VEÍCULO (PWA MOTORISTA) ---
function renderDriverBipScreen() {
    const container = document.getElementById('driver-bip-content');
    if (!container) return;

    const drvDeliveries = deliveriesData.filter(d => d.driverId === selectedDriverId);
    const total = drvDeliveries.length;
    const checkedCount = drvDeliveries.filter(d => d.checkedInVehicle).length;
    const pct = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

    container.innerHTML = `
        <div class="driver-bip-progress-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:700; font-size:0.9rem; color:var(--text-main);">Conferência no Veículo</span>
                <span style="font-weight:800; font-size:0.85rem; color:${checkedCount === total && total > 0 ? '#059669' : 'var(--primary)'};">${checkedCount}/${total} volumes</span>
            </div>
            <div class="driver-bip-progress-bar">
                <div class="driver-bip-progress-fill" style="width: ${pct}%;"></div>
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:6px; display:flex; justify-content:space-between;">
                <span>${pct}% conferido</span>
                <span>${total - checkedCount} pendentes</span>
            </div>
        </div>

        <div class="driver-bip-scan-box">
            <div style="font-size:0.82rem; font-weight:700; color:var(--text-main);">Bipar Pacote para Embarque:</div>
            <div style="display:flex; gap:8px;">
                <input type="text" id="driver-bip-input" class="form-input" placeholder="Aponte o leitor USB ou digite a NF..." style="margin:0; font-family:monospace; font-weight:700;" autocomplete="off" autofocus>
                <button class="btn-primary" id="btn-driver-bip-confirm" style="padding:8px 14px; font-size:0.85rem;">⚡ Bipar</button>
            </div>
            <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">
                ⚡ Suporta leitura direta por pistola USB, DANFE (44 dígitos) e código da NF.
            </div>
            <div style="display:flex; gap:8px; margin-top:6px;">
                <button class="btn-secondary" id="btn-driver-quick-next" style="flex:1; font-size:0.75rem; padding:6px 8px;">⚡ Bipar Próximo</button>
                <button class="btn-secondary" id="btn-driver-check-all" style="flex:1; font-size:0.75rem; padding:6px 8px;">✓ Bipar Todos</button>
            </div>
        </div>

        <div style="font-size:0.8rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-top:4px;">
            Volumes da Rota (${total}):
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;" id="driver-bip-items-list">
            ${drvDeliveries.length === 0 ? '<div style="text-align:center; padding:25px; color:var(--text-muted); background:white; border-radius:8px;">Nenhum pacote atribuído à sua rota hoje.</div>' : ''}
            ${drvDeliveries.map((del) => `
                <div class="driver-bip-item-card ${del.checkedInVehicle ? 'is-checked' : 'is-pending'}">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-family:monospace; font-weight:800; font-size:0.85rem; color:var(--text-main);">#NF-${escapeHTML(del.nf)}</span>
                        <span class="driver-bip-badge-status ${del.checkedInVehicle ? 'checked' : 'pending'}">
                            ${del.checkedInVehicle ? '✅ No Veículo' : '⏳ Pendente'}
                        </span>
                    </div>
                    <div style="font-size:0.82rem; font-weight:700; color:#334155;">${escapeHTML(del.recipient)}</div>
                    <div style="font-size:0.72rem; color:#64748B;">${escapeHTML(del.address)}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                        <span style="font-size:0.7rem; color:var(--text-muted);">SLA: ${escapeHTML(del.sla)}</span>
                        ${del.checkedInVehicle ? 
                            '<span style="font-size:0.72rem; color:#059669; font-weight:700;">✓ Conferido</span>' : 
                            `<button class="btn-primary" style="padding:3px 8px; font-size:0.72rem; border-radius:4px;" onclick="driverBipItem('${escapeHTML(del.nf)}')">⚡ Bipar Este</button>`
                        }
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Bindings internos do Bip Screen do Motorista
    const bipInput = document.getElementById('driver-bip-input');
    const btnConfirm = document.getElementById('btn-driver-bip-confirm');
    const btnNext = document.getElementById('btn-driver-quick-next');
    const btnAll = document.getElementById('btn-driver-check-all');

    if (btnConfirm && bipInput) {
        btnConfirm.addEventListener('click', () => {
            driverBipItem(bipInput.value);
            bipInput.value = '';
            bipInput.focus();
        });
        bipInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                driverBipItem(bipInput.value);
                bipInput.value = '';
                bipInput.focus();
            }
        });
        setTimeout(() => bipInput.focus(), 150);
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            const nextPending = drvDeliveries.find(d => !d.checkedInVehicle);
            if (nextPending) {
                driverBipItem(nextPending.nf);
            } else {
                showToast('Todos os volumes da rota já foram conferidos!', 'success');
            }
        });
    }

    if (btnAll) {
        btnAll.addEventListener('click', () => {
            driverBipAll();
        });
    }
}

function driverBipItem(rawCode) {
    const parsed = parseBarcodeOrDanfe(rawCode);
    const code = parsed.displayCode;
    if (!code) {
        playScannerBeep('error');
        showToast('Digite ou bipe o código da nota fiscal.', 'error');
        return;
    }

    const drvDeliveries = deliveriesData.filter(d => d.driverId === selectedDriverId);
    const target = drvDeliveries.find(d => {
        const dNf = (d.nf || '').toLowerCase();
        const dId = (d.id || '').toLowerCase();
        const codeLower = code.toLowerCase();
        const origLower = parsed.original.toLowerCase();

        if (dNf === codeLower || dNf === origLower || dId === codeLower || dId === origLower) return true;
        if (dId === ('nf-' + codeLower) || dId === ('nf-' + origLower)) return true;

        if (parsed.isDanfe) {
            const nfNum = parsed.nf.toLowerCase();
            const nfPadded = parsed.nfPadded.toLowerCase();
            return dNf === nfNum || dNf === nfPadded || dId === ('nf-' + nfNum) || dId === ('nf-' + nfPadded);
        }
        return false;
    });

    if (target) {
        if (target.checkedInVehicle) {
            playScannerBeep('error');
            showToast(`Volume #${target.nf} já estava conferido no veículo!`, 'info');
        } else {
            target.checkedInVehicle = true;
            playScannerBeep('success');
            const danfeMsg = parsed.isDanfe ? ' (reconhecido via DANFE 44 dígitos)' : '';
            showToast(`✓ Volume #${target.nf} conferido no veículo${danfeMsg}!`, 'success');
            saveState();
            renderDriverBipScreen();
        }
    } else {
        // Código não pertence a esta rota
        playScannerBeep('error');
        showToast(`⚠️ Alerta: Volume #${code} NÃO pertence à rota deste motorista!`, 'error');
    }
}

function driverBipAll() {
    const drvDeliveries = deliveriesData.filter(d => d.driverId === selectedDriverId);
    if (drvDeliveries.length === 0) return;

    let idx = 0;
    const interval = setInterval(() => {
        if (idx >= drvDeliveries.length) {
            clearInterval(interval);
            playScannerBeep('batch');
            showToast('Todos os volumes da rota foram conferidos e embarcados!', 'success');
            saveState();
            renderDriverBipScreen();
            return;
        }
        drvDeliveries[idx].checkedInVehicle = true;
        playScannerBeep('success');
        idx++;
    }, 150);
}

function refreshUI() {
    if (activeView === 'admin' && currentState.screen === 'control_tower') {
        renderKPIs();
        renderAdminList();
        
        // Atualiza gráfico de rosca
        const chartContainer = document.getElementById('admin-chart-container');
        if (chartContainer) {
            chartContainer.innerHTML = getChartSVG();
        }
    } else if (activeView === 'driver') {
        renderDriverList();
    }
    
    updateMapsMarkers();
    saveState();
}

// --- CARGA DE LOTES ---
function simulateBatchImport(loteSize) {
    const progressBox = document.getElementById('import-progress-box');
    const progressFill = document.getElementById('import-progress-fill');
    
    document.getElementById('btn-import-confirm').disabled = true;
    progressBox.style.display = 'block';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        progressFill.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            
            const nomes = ['Marcos Silva', 'Claudio Lima', 'Julia Santos', 'Gabriela Costa', 'Rodrigo Oliveira', 'Patricia Souza'];
            const ruas = [
                { r: 'Rua Bela Cintra, 1500 - Consolação', lat: -23.5574, lng: -46.6622 },
                { r: 'Av. Rebouças, 1200 - Pinheiros', lat: -23.5678, lng: -46.6802 },
                { r: 'Av. Brigadeiro Faria Lima, 2000 - Itaim Bibi', lat: -23.5789, lng: -46.6905 },
                { r: 'Av. 9 de Julho, 3500 - Jardim Paulista', lat: -23.5682, lng: -46.6589 }
            ];

            for (let i = 0; i < loteSize; i++) {
                const randomNf = Math.floor(10000 + Math.random() * 90000).toString();
                const randomName = nomes[Math.floor(Math.random() * nomes.length)];
                const randomRua = ruas[Math.floor(Math.random() * ruas.length)];
                const randomDriver = driversData[Math.floor(Math.random() * driversData.length)];
                
                const jitterLat = (Math.random() - 0.5) * 0.005;
                const jitterLng = (Math.random() - 0.5) * 0.005;
                
                const futureTime = new Date();
                futureTime.setHours(futureTime.getHours() + 2 + Math.floor(Math.random() * 4));
                const slaTime = futureTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                deliveriesData.push({
                    id: `NF-10${randomNf}`,
                    nf: randomNf,
                    recipient: randomName,
                    address: `${randomRua.r}, São Paulo - SP`,
                    lat: randomRua.lat + jitterLat,
                    lng: randomRua.lng + jitterLng,
                    status: 'pendente',
                    sla: slaTime,
                    driverId: randomDriver.id,
                    pod: null,
                    occurrence: null
                });
            }

            document.getElementById('btn-import-confirm').disabled = false;
            progressBox.style.display = 'none';
            progressFill.style.width = '0%';
            
            document.getElementById('modal-import').classList.remove('active');
            showToast(`${loteSize} novas NFs importadas com sucesso!`, 'success');
            refreshUI();
        }
    }, 120);
}

// --- CANVAS DE ASSINATURA ---
let isDrawing = false;
let hasSigned = false;
let signatureCanvas = null;
let signatureCtx = null;

function setupSignatureCanvas() {
    signatureCanvas = document.getElementById('signature-canvas');
    if (!signatureCanvas) return;

    signatureCtx = signatureCanvas.getContext('2d');
    const rect = signatureCanvas.getBoundingClientRect();
    signatureCanvas.width = rect.width;
    signatureCanvas.height = 180;

    signatureCtx.strokeStyle = '#0F172A';
    signatureCtx.lineWidth = 3.5;
    signatureCtx.lineCap = 'round';
    signatureCtx.lineJoin = 'round';

    hasSigned = false;

    signatureCanvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const pos = getCanvasPos(e);
        signatureCtx.beginPath();
        signatureCtx.moveTo(pos.x, pos.y);
    });

    signatureCanvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const pos = getCanvasPos(e);
        signatureCtx.lineTo(pos.x, pos.y);
        signatureCtx.stroke();
        hasSigned = true;
    });

    signatureCanvas.addEventListener('mouseup', () => isDrawing = false);

    // Touch
    signatureCanvas.addEventListener('touchstart', (e) => {
        isDrawing = true;
        const pos = getCanvasPos(e.touches[0]);
        signatureCtx.beginPath();
        signatureCtx.moveTo(pos.x, pos.y);
        e.preventDefault();
    }, { passive: false });

    signatureCanvas.addEventListener('touchmove', (e) => {
        if (!isDrawing) return;
        const pos = getCanvasPos(e.touches[0]);
        signatureCtx.lineTo(pos.x, pos.y);
        signatureCtx.stroke();
        hasSigned = true;
        e.preventDefault();
    }, { passive: false });

    signatureCanvas.addEventListener('touchend', () => isDrawing = false);
}

function getCanvasPos(evt) {
    const rect = signatureCanvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

// --- GLOBAL ATTACHMENTS ---
window.openPodModal = function(deliveryId) {
    activeDeliveryIdForAction = deliveryId;
    capturedPhotoUrl = '';
    
    document.getElementById('pod-receiver-name').value = '';
    document.getElementById('pod-receiver-doc').value = '';
    
    const photoPreview = document.getElementById('photo-preview-img');
    const photoLabel = document.getElementById('photo-simulator-label');
    photoPreview.style.display = 'none';
    photoLabel.style.display = 'block';

    document.getElementById('modal-pod').classList.add('active');
    setTimeout(setupSignatureCanvas, 100);
};

window.openProblemModal = function(deliveryId) {
    activeDeliveryIdForAction = deliveryId;
    document.getElementById('problem-notes').value = '';
    document.getElementById('problem-reason').selectedIndex = 0;
    document.getElementById('modal-problem').classList.add('active');
};

window.simulateAdminForceDeliver = function(deliveryId) {
    const del = deliveriesData.find(d => d.id === deliveryId);
    if (!del) return;

    del.status = 'entregue';
    del.pod = {
        signature: '',
        photo: generateMockPackageImage(),
        receiverName: 'Baixa Central (Admin)',
        receiverDoc: 'ADMIN-CORE',
        timestamp: new Date().toISOString(),
        gps: { lat: del.lat, lng: del.lng }
    };
    
    showToast(`Entrega NF #${del.nf} baixada pela central.`, 'success');
    refreshUI();
};

window.openPodViewer = function(deliveryId) {
    const del = deliveriesData.find(d => d.id === deliveryId);
    if (!del) return;

    const contentEl = document.getElementById('view-pod-content');
    
    if (del.status === 'entregue') {
        const signatureHTML = del.pod.signature ? 
            `<img src="${del.pod.signature}" style="border:1px solid var(--border); border-radius:8px; max-height:90px; background-color:#FCFDFE; width:100%; object-fit:contain;">` : 
            `<div style="font-size:0.8rem; color:var(--text-muted); font-style:italic; padding:6px; border:1px dashed var(--border); border-radius:8px; text-align:center;">Assinatura não coletada (Baixa Admin)</div>`;

        contentEl.innerHTML = `
            <div><strong>Destinatário:</strong> ${escapeHTML(del.recipient)}</div>
            <div><strong>Endereço:</strong> ${escapeHTML(del.address)}</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div><strong>Recebedor:</strong> ${escapeHTML(del.pod.receiverName || 'Não informado')}</div>
                <div><strong>Documento:</strong> ${escapeHTML(del.pod.receiverDoc || 'Não informado')}</div>
            </div>
            <div><strong>Data/Hora Baixa:</strong> ${new Date(del.pod.timestamp).toLocaleString('pt-BR')}</div>
            <div><strong>GPS:</strong> Lat ${del.pod.gps.lat.toFixed(6)}, Lng ${del.pod.gps.lng.toFixed(6)}</div>
            <div class="form-group" style="margin-top: 4px;">
                <span class="form-label">Assinatura</span>
                ${signatureHTML}
            </div>
            <div class="form-group">
                <span class="form-label">Comprovante de Foto</span>
                <img src="${del.pod.photo || generateMockPackageImage()}" style="border:1px solid var(--border); border-radius:8px; width:100%; max-height:160px; object-fit:cover;">
            </div>
        `;
        document.getElementById('view-pod-title').innerText = `Comprovante - NF #${del.nf}`;
    } else if (del.status === 'insucesso') {
        contentEl.innerHTML = `
            <div style="border-left:4px solid var(--status-failure); padding-left:12px; margin-bottom:10px;">
                <h4 style="color:var(--status-failure); margin-bottom:4px;">${escapeHTML(del.occurrence.reason)}</h4>
                <p style="font-size:0.875rem; color:var(--text-muted);">${escapeHTML(del.occurrence.notes || 'Sem detalhes fornecidos.')}</p>
            </div>
            <div><strong>Destinatário:</strong> ${escapeHTML(del.recipient)}</div>
            <div><strong>Endereço:</strong> ${escapeHTML(del.address)}</div>
            <div><strong>Registrado em:</strong> ${new Date(del.occurrence.timestamp).toLocaleString('pt-BR')}</div>
        `;
        document.getElementById('view-pod-title').innerText = `Ocorrência - NF #${del.nf}`;
    }
    
    document.getElementById('modal-view-pod').classList.add('active');
};

// --- SIMULADOR DAS OUTRAS ABAS ---
window.simulateAddCustomTab = simulateAddCustomTab;
window.removeCustomTab = removeCustomTab;
window.setRole = setRole;
window.navigate = navigate;
window.handleLogout = handleLogout;
window.setDeliveriesTab = setDeliveriesTab;

// --- BINDING DOS EVENTOS DO DOM ---
function setupEventListeners() {
    // 1. Toggles de visualização no PWA
    const btnAdmin = document.getElementById('btn-view-admin');
    if (btnAdmin) {
        btnAdmin.addEventListener('click', () => {
            activeView = 'admin';
            currentState.screen = 'control_tower';
            saveState();
            render();
        });
    }

    const btnDriver = document.getElementById('btn-view-driver');
    if (btnDriver) {
        btnDriver.addEventListener('click', () => {
            activeView = 'driver';
            saveState();
            render();
        });
    }

    // 2. Select do motorista no PWA
    const selectDrv = document.getElementById('driver-select');
    if (selectDrv) {
        selectDrv.addEventListener('change', (e) => {
            selectedDriverId = e.target.value;
            renderDriverList();
            updateMapsMarkers();
            saveState();
        });
    }

    // 3. Abas do Motorista
    const tabList = document.getElementById('driver-tab-list');
    if (tabList) {
        tabList.addEventListener('click', () => {
            activeDriverTab = 'list';
            document.getElementById('driver-tab-list')?.classList.add('active');
            document.getElementById('driver-tab-map')?.classList.remove('active');
            document.getElementById('driver-tab-bip')?.classList.remove('active');
            document.getElementById('driver-screen-list')?.classList.add('active');
            document.getElementById('driver-screen-map')?.classList.remove('active');
            document.getElementById('driver-screen-bip')?.classList.remove('active');
        });
    }

    const tabMap = document.getElementById('driver-tab-map');
    if (tabMap) {
        tabMap.addEventListener('click', () => {
            activeDriverTab = 'map';
            document.getElementById('driver-tab-list')?.classList.remove('active');
            document.getElementById('driver-tab-map')?.classList.add('active');
            document.getElementById('driver-tab-bip')?.classList.remove('active');
            document.getElementById('driver-screen-list')?.classList.remove('active');
            document.getElementById('driver-screen-map')?.classList.add('active');
            document.getElementById('driver-screen-bip')?.classList.remove('active');
            
            setTimeout(() => {
                driverMap?.invalidateSize();
                updateMapsMarkers();
            }, 100);
        });
    }

    const tabBip = document.getElementById('driver-tab-bip');
    if (tabBip) {
        tabBip.addEventListener('click', () => {
            activeDriverTab = 'bip';
            document.getElementById('driver-tab-list')?.classList.remove('active');
            document.getElementById('driver-tab-map')?.classList.remove('active');
            document.getElementById('driver-tab-bip')?.classList.add('active');
            document.getElementById('driver-screen-list')?.classList.remove('active');
            document.getElementById('driver-screen-map')?.classList.remove('active');
            document.getElementById('driver-screen-bip')?.classList.add('active');
            renderDriverBipScreen();
        });
    }

    // 4. Filtros e Pesquisa de Entregas (Admin Torre)
    const searchDel = document.getElementById('search-delivery');
    if (searchDel) {
        searchDel.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            renderAdminList();
        });
    }

    const filterBtns = document.querySelectorAll('.btn-filter');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-status');
            
            renderAdminList();
            updateMapsMarkers();
        });
    });

    // 5. Modais Importador
    const btnImport = document.getElementById('btn-import-cargas');
    if (btnImport) {
        btnImport.addEventListener('click', () => {
            document.getElementById('modal-import').classList.add('active');
        });
    }

    document.getElementById('modal-import-close')?.addEventListener('click', () => {
        document.getElementById('modal-import').classList.remove('active');
    });
    document.getElementById('btn-import-cancel')?.addEventListener('click', () => {
        document.getElementById('modal-import').classList.remove('active');
    });
    document.getElementById('btn-import-confirm')?.addEventListener('click', () => {
        const size = parseInt(document.getElementById('import-lote-size').value, 10);
        simulateBatchImport(size);
    });

    // 6. Confirmação do PoD Modal (Canvas + Foto)
    document.getElementById('modal-pod-close')?.addEventListener('click', () => {
        document.getElementById('modal-pod').classList.remove('active');
    });
    document.getElementById('btn-pod-cancel')?.addEventListener('click', () => {
        document.getElementById('modal-pod').classList.remove('active');
    });
    document.getElementById('btn-clear-signature')?.addEventListener('click', () => {
        if (signatureCtx && signatureCanvas) {
            signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
            hasSigned = false;
        }
    });

    const photoSim = document.getElementById('photo-simulator');
    if (photoSim) {
        photoSim.addEventListener('click', () => {
            capturedPhotoUrl = generateMockPackageImage();
            const photoPreview = document.getElementById('photo-preview-img');
            const photoLabel = document.getElementById('photo-simulator-label');
            photoPreview.src = capturedPhotoUrl;
            photoPreview.style.display = 'block';
            photoLabel.style.display = 'none';
            showToast('Foto do comprovante simulada.', 'info');
        });
    }

    document.getElementById('btn-pod-confirm')?.addEventListener('click', () => {
        const receiverName = document.getElementById('pod-receiver-name').value.trim();
        const receiverDoc = document.getElementById('pod-receiver-doc').value.trim();

        if (!receiverName) {
            showToast('Nome do recebedor é obrigatório!', 'error');
            return;
        }
        if (!hasSigned) {
            showToast('Assinatura é obrigatória!', 'error');
            return;
        }

        const del = deliveriesData.find(d => d.id === activeDeliveryIdForAction);
        const activeDriver = driversData.find(d => d.id === selectedDriverId);

        if (del) {
            del.status = 'entregue';
            del.pod = {
                signature: signatureCanvas.toDataURL(),
                photo: capturedPhotoUrl || generateMockPackageImage(),
                receiverName: receiverName,
                receiverDoc: receiverDoc || 'N/I',
                timestamp: new Date().toISOString(),
                gps: {
                    lat: activeDriver ? activeDriver.lat + (Math.random() - 0.5)*0.0005 : del.lat,
                    lng: activeDriver ? activeDriver.lng + (Math.random() - 0.5)*0.0005 : del.lng
                }
            };

            document.getElementById('modal-pod').classList.remove('active');
            showToast(`Entrega NF #${del.nf} confirmada!`, 'success');
            refreshUI();
        }
    });

    // 7. Modal de Ocorrência (Insucesso)
    document.getElementById('modal-problem-close')?.addEventListener('click', () => {
        document.getElementById('modal-problem').classList.remove('active');
    });
    document.getElementById('btn-problem-cancel')?.addEventListener('click', () => {
        document.getElementById('modal-problem').classList.remove('active');
    });
    document.getElementById('btn-problem-confirm')?.addEventListener('click', () => {
        const reason = document.getElementById('problem-reason').value;
        const notes = document.getElementById('problem-notes').value.trim();

        const del = deliveriesData.find(d => d.id === activeDeliveryIdForAction);
        if (del) {
            del.status = 'insucesso';
            del.occurrence = {
                reason: reason,
                notes: notes,
                timestamp: new Date().toISOString()
            };

            document.getElementById('modal-problem').classList.remove('active');
            showToast(`Ocorrência vinculada à NF #${del.nf}.`, 'error');
            refreshUI();
        }
    });

    // 8. Visualizador de Comprovante (Fechar)
    document.getElementById('modal-view-pod-close')?.addEventListener('click', () => {
        document.getElementById('modal-view-pod').classList.remove('active');
    });
    document.getElementById('btn-view-pod-close-footer')?.addEventListener('click', () => {
        document.getElementById('modal-view-pod').classList.remove('active');
    });
}

// Populate select driver
function populateDriverSelect() {
    const selectEl = document.getElementById('driver-select');
    if (!selectEl) return;
    
    selectEl.innerHTML = '';
    driversData.forEach(drv => {
        const opt = document.createElement('option');
        opt.value = drv.id;
        opt.innerText = drv.name;
        if (drv.id === selectedDriverId) opt.selected = true;
        selectEl.appendChild(opt);
    });
}

// --- CONEXÃO STATUS NETWORK ---
window.addEventListener('online', () => {
    const badge = document.getElementById('connection-status');
    const text = document.getElementById('connection-text');
    if (badge) badge.className = 'status-badge online';
    if (text) text.innerText = 'Online';
    showToast('Conectado à internet. Central ativa.', 'success');
});

window.addEventListener('offline', () => {
    const badge = document.getElementById('connection-status');
    const text = document.getElementById('connection-text');
    if (badge) badge.className = 'status-badge offline';
    if (text) text.innerText = 'Offline';
    showToast('Sem conexão de rede. Salva localmente.', 'error');
});

// --- INTERCEPTADOR GLOBAL DE LEITOR LASER USB (ANTI-PERDA DE FOCO) ---
let globalScanBuffer = '';
let globalScanLastTime = 0;
let globalScanTimeout = null;

function setupGlobalBarcodeScanner() {
    window.addEventListener('keydown', (e) => {
        const isCollectionScreen = (currentState && currentState.screen === 'collection');
        const isDriverBipScreen = (activeView === 'driver' && activeDriverTab === 'bip');

        if (!isCollectionScreen && !isDriverBipScreen) {
            globalScanBuffer = '';
            return;
        }

        const activeEl = document.activeElement;
        const activeTag = activeEl ? activeEl.tagName.toUpperCase() : '';
        const activeId = activeEl ? activeEl.id : '';

        // Se o operador estiver interagindo com um campo de formulário ou select específico que não é o scanner, não interferir
        const isOtherEditable = (activeTag === 'TEXTAREA' || activeTag === 'SELECT' || 
            (activeTag === 'INPUT' && activeId !== 'barcode-scanner-input' && activeId !== 'driver-bip-input'));

        if (isOtherEditable) {
            return;
        }

        const targetInput = isCollectionScreen ? 
            document.getElementById('barcode-scanner-input') : 
            document.getElementById('driver-bip-input');

        // Se o foco já está dentro do próprio input do scanner, o evento keydown do input já trata
        if (activeEl === targetInput) {
            globalScanBuffer = '';
            return;
        }

        const now = Date.now();
        const diff = now - globalScanLastTime;
        globalScanLastTime = now;

        // Quando o leitor laser envia Enter (fim da transmissão do código)
        if (e.key === 'Enter') {
            const codeToProcess = (globalScanBuffer || (targetInput ? targetInput.value : '')).trim();
            if (codeToProcess.length >= 2) {
                e.preventDefault();
                globalScanBuffer = '';
                if (targetInput) targetInput.value = '';

                if (isCollectionScreen) {
                    processBip(codeToProcess);
                } else if (isDriverBipScreen) {
                    driverBipItem(codeToProcess);
                }

                if (targetInput) targetInput.focus();
            }
            globalScanBuffer = '';
            return;
        }

        // Ignora teclas de controle (Ctrl, Alt, Shift, etc)
        if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) {
            return;
        }

        // Se passar mais de 250ms entre caracteres, reinicia o buffer (nova leitura iniciada)
        if (diff > 250) {
            globalScanBuffer = '';
        }

        globalScanBuffer += e.key;

        // Redireciona o foco imediatamente para o campo de bipagem
        if (targetInput && document.activeElement !== targetInput) {
            targetInput.focus();
            targetInput.value = globalScanBuffer;
        }

        // Limpa buffer por inatividade após 600ms
        clearTimeout(globalScanTimeout);
        globalScanTimeout = setTimeout(() => {
            globalScanBuffer = '';
        }, 600);
    });
}

// --- INICIALIZAÇÃO ---
window.addEventListener('DOMContentLoaded', () => {
    loadState();
    setupGlobalBarcodeScanner();
    render();
});
