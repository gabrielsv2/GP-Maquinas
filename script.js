// API Configuration
const API_BASE_URL = 'https://gp-maquinas-backend.onrender.com/api';

// User session
let currentUser = null;
let userRole = null;
let userToken = null;
let inactivityTimer = null;
let lastActivity = Date.now();
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hora em milissegundos

// DOM elements
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const currentUserSpan = document.getElementById('currentUser');
const serviceForm = document.getElementById('serviceForm');
const storeReportSelect = document.getElementById('storeReportSelect');
const servicesList = document.getElementById('servicesList');
const storeReport = document.getElementById('storeReport');

// Debug: Verificar se os elementos foram encontrados
console.log('🔍 Elementos DOM encontrados:');
console.log('loginScreen:', loginScreen);
console.log('mainApp:', mainApp);
console.log('loginForm:', loginForm);
console.log('logoutBtn:', logoutBtn);
console.log('currentUserSpan:', currentUserSpan);
console.log('serviceForm:', serviceForm);

// Navigation elements
const navButtons = document.querySelectorAll('.nav-btn');
const contentSections = document.querySelectorAll('.content-section');

// Store names for validation
const storeNames = {
    'GPAnhaiaMello': 'GP Anhaia Mello',
    'GPAricanduva': 'GP Aricanduva',
    'GPCampoLimpo': 'GP Campo Limpo',
    'GPCarrão': 'GP Carrão',
    'GPCidadeDutra': 'GP Cidade Dutra',
    'GPCotia': 'GP Cotia',
    'GPCruzeirodoSul': 'GP Cruzeiro do Sul',
    'GPDemarchi': 'GP Demarchi',
    'GPEdgarFacó': 'GP Edgar Facó',
    'GPGuarulhos': 'GP Guarulhos',
    'GPInterlagos': 'GP Interlagos',
    'GPJabaquara': 'GP Jabaquara',
    'GPJundiai': 'GP Jundiaí',
    'GPLapa': 'GP Lapa',
    'GPLimão': 'GP Limão',
    'GPMboiMirim': 'GP M\'Boi Mirim',
    'GPMogi': 'GP Mogi',
    'GPMorumbi': 'GP Morumbi',
    'GPOsasco': 'GP Osasco',
    'GPRaguebChohfi': 'GP Ragueb Chohfi',
    'GPRibeirãoPreto': 'GP Ribeirão Preto',
    'GPRicardoJafet': 'GP Ricardo Jafet',
    'GPSantoAndré': 'GP Santo André',
    'GPTaboão': 'GP Taboão'
};

// Service numbering system per store
const serviceNumbers = {};

// Generate service number for a store
function generateServiceNumber(storeCode) {
    if (!serviceNumbers[storeCode]) {
        serviceNumbers[storeCode] = 0;
    }
    serviceNumbers[storeCode]++;
    
    // Format: 00001, 00002, etc. (5 digits)
    return serviceNumbers[storeCode].toString().padStart(5, '0');
}

// Get service number for display
function getServiceNumber(storeCode, serviceId) {
    // For existing services, generate a consistent number based on serviceId
    if (!serviceNumbers[storeCode]) {
        serviceNumbers[storeCode] = 0;
    }
    
    // Check if serviceId is valid
    if (!serviceId || serviceId === null || serviceId === undefined) {
        // Generate a fallback number
        serviceNumbers[storeCode]++;
        return serviceNumbers[storeCode].toString().padStart(5, '0');
    }
    
    // Use serviceId to generate a consistent number (simple hash)
    try {
        const hash = serviceId.toString().split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        
        const serviceNum = Math.abs(hash) % 100000;
        return serviceNum.toString().padStart(5, '0');
    } catch (error) {
        console.warn('Error generating service number, using fallback:', error);
        // Fallback to sequential number
        serviceNumbers[storeCode]++;
        return serviceNumbers[storeCode].toString().padStart(5, '0');
    }
}

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    // Use local proxy in development, direct API in production
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocal ? window.location.origin : 'https://gp-maquinas-backend.onrender.com';
    const url = `${baseUrl}/api${endpoint}`;
    
    const config = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    if (userToken) {
        config.headers.Authorization = `Bearer ${userToken}`;
    }

    try {
        const response = await fetch(url, config);
        
        // Log response details for debugging
        console.log(`🔍 API Request: ${url}`);
        console.log(`📊 Response Status: ${response.status}`);
        console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expirado ou inválido
                handleAuthError(new Error('Sessão expirada. Faça login novamente.'));
                throw new Error('Sessão expirada. Faça login novamente.');
            }
            
            // Try to get response text to see what's being returned
            const responseText = await response.text();
            console.error('❌ Response text:', responseText);
            
            throw new Error(`HTTP error! status: ${response.status}, response: ${responseText.substring(0, 200)}`);
        }
        
        // Check content type before parsing JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const responseText = await response.text();
            console.error('❌ Invalid content type:', contentType);
            console.error('❌ Response text:', responseText);
            throw new Error(`Invalid content type: ${contentType}. Expected JSON but got: ${responseText.substring(0, 200)}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Authentication Functions
async function login(username, password) {
    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (response.token) {
            userToken = response.token;
            currentUser = response.user;
            userRole = response.user.role;
            
            // Save to localStorage
            localStorage.setItem('userToken', userToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            return true;
        }
        return false;
    } catch (error) {
        console.error('Login failed:', error);
        return false;
    }
}

async function verifyToken() {
    try {
        if (!userToken) {
            console.log('❌ Nenhum token para verificar');
            return false;
        }
        
        console.log('🔐 Verificando token:', userToken.substring(0, 20) + '...');
        const data = await apiRequest('/auth/verify', { method: 'GET' });
        console.log('📨 Dados da verificação:', data);
        return data && data.valid === true;
    } catch (error) {
        console.error('❌ Falha na verificação do token:', error);
        return false;
    }
}

function handleLogout() {
    userToken = null;
    currentUser = null;
    userRole = null;
    
    // Clear localStorage
    localStorage.removeItem('userToken');
    localStorage.removeItem('currentUser');
    
    // Clear inactivity timer
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
    
    // Remove activity listeners
    removeActivityListeners();
    
    // Show login screen
    showLoginScreen();
}

// Start inactivity timer
function startInactivityTimer() {
    // Clear existing timer
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    
    // Set new timer
    inactivityTimer = setTimeout(() => {
        showMessage('Sessão expirada por inatividade. Faça login novamente.', 'error');
        handleLogout();
    }, INACTIVITY_TIMEOUT);
    
    // Start session timer update (every minute)
    setInterval(updateSessionTimer, 60 * 1000);
    
    // Initial update
    updateSessionTimer();
}

// Reset inactivity timer
function resetInactivityTimer() {
    lastActivity = Date.now();
    startInactivityTimer();
}

// Check if user is still active
function isUserActive() {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivity;
    
    if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        return false;
    }
    
    return true;
}

// Check authentication status
async function checkAuthStatus() {
    if (!userToken) {
        console.log('❌ Nenhum token encontrado');
        return false;
    }
    
    try {
        const data = await apiRequest('/auth/verify', { method: 'GET' });
        console.log('🔐 Auth check data:', data);
        return data && data.valid === true;
    } catch (error) {
        console.error('❌ Auth check error:', error);
        return false;
    }
}

// Add activity listeners to detect user interaction
function addActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, true);
    });
    
    // Also listen for form submissions and navigation
    document.addEventListener('submit', resetInactivityTimer, true);
    document.addEventListener('change', resetInactivityTimer, true);
}

// Remove activity listeners
function removeActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
    });
    
    document.removeEventListener('submit', resetInactivityTimer, true);
    document.removeEventListener('change', resetInactivityTimer, true);
}

// Update session timer display
function updateSessionTimer() {
    if (!currentUser || !inactivityTimer) return;
    
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivity;
    const timeRemaining = INACTIVITY_TIMEOUT - timeSinceLastActivity;
    
    if (timeRemaining <= 0) {
        showMessage('Sessão expirada por inatividade. Faça login novamente.', 'error');
        handleLogout();
        return;
    }
    
    // Update timer display every minute
    const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));
    
    // Update user info display with timer
    if (currentUserSpan) {
        const timerText = minutesRemaining > 1 ? `${minutesRemaining} min` : '1 min';
        currentUserSpan.innerHTML = `Usuário: ${currentUser} <span style="font-size: 0.8em; color: #dc2626;">(${timerText} restante)</span>`;
    }
}

// Filter data for store users
async function filterDataForStore(storeName) {
    // Check if user is still active
    if (!isUserActive()) {
        showMessage('Sessão expirada. Faça login novamente.', 'error');
        handleLogout();
        return;
    }
    
    try {
        // Note: /api/machines endpoint doesn't exist in the backend
        // We'll use only services for now
        const storeServices = await apiRequest(`/services?store=${storeName}`);
        
        // Update displays
        displayServices();
    } catch (error) {
        console.error('Error filtering data for store:', error);
    }
}

// Filter store options for non-admin users
function filterStoreOptions(username) {
    const storeLocationSelect = document.getElementById('storeLocation');
    const storeReportSelect = document.getElementById('storeReportSelect');
    
    if (!storeLocationSelect || !storeReportSelect) return;
    
    // Find the store code based on username
    let userStoreCode = null;
    for (const [code, name] of Object.entries(storeNames)) {
        if (name.toLowerCase().includes(username.toLowerCase()) || 
            username.toLowerCase().includes(name.toLowerCase())) {
            userStoreCode = code;
            break;
        }
    }
    
    if (userStoreCode) {
        // For non-admin users, show only their store
        console.log(`🔒 Usuário da loja ${userStoreCode}, filtrando opções...`);
        
        // Filter storeLocation select
        Array.from(storeLocationSelect.options).forEach(option => {
            if (option.value === userStoreCode) {
                option.selected = true;
                option.disabled = false;
            } else {
                option.disabled = true;
            }
        });
        
        // Filter storeReportSelect
        Array.from(storeReportSelect.options).forEach(option => {
            if (option.value === userStoreCode) {
                option.selected = true;
                option.disabled = false;
            } else {
                option.disabled = true;
            }
        });
        
        // Add a note that the store is locked
        const storeLocationGroup = storeLocationSelect.parentElement;
        if (!document.getElementById('storeLockNote')) {
            const lockNote = document.createElement('p');
            lockNote.id = 'storeLockNote';
            lockNote.className = 'store-lock-note';
            lockNote.innerHTML = '🔒 <strong>Loja bloqueada para este usuário</strong>';
            lockNote.style.cssText = 'color: #dc2626; font-size: 0.9rem; margin-top: 5px; font-style: italic;';
            storeLocationGroup.appendChild(lockNote);
        }
    } else {
        console.log(`⚠️ Usuário ${username} não corresponde a nenhuma loja específica`);
    }
}

// Initialize navigation functionality
function initializeNavigation() {
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            switchSection(targetSection);
        });
    });
}

// Switch between sections
function switchSection(sectionName) {
    // Check if user is still active
    if (!isUserActive()) {
        showMessage('Sessão expirada. Faça login novamente.', 'error');
        handleLogout();
        return;
    }
    
    // Remove active class from all buttons and sections
    navButtons.forEach(btn => btn.classList.remove('active'));
    contentSections.forEach(section => section.classList.remove('active'));
    
    // Add active class to clicked button
    const activeButton = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Show target section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Handle service registration form submission (unified with machine registration)
serviceForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    console.log('🧪 Tentativa de salvar serviço iniciada');
    
    // Check if user is still active
    if (!isUserActive()) {
        console.log('❌ Usuário não está ativo');
        showMessage('Sessão expirada. Faça login novamente.', 'error');
        handleLogout();
        return;
    }
    
    console.log('✅ Usuário ativo, coletando dados do formulário');
    
    const formData = new FormData(serviceForm);
    
    const service = {
        machineCode: formData.get('machineCode'),
        machineType: formData.get('machineType'),
        storeId: formData.get('storeLocation'),
        location: formData.get('location'),
        serviceTypeId: getServiceTypeId(formData.get('serviceType')),
        serviceDate: formData.get('serviceDate'),
        technicianId: getTechnicianId(formData.get('technician')),
        description: formData.get('description'),
        cost: parseFloat(formData.get('cost')),
        status: getStatusValue(formData.get('status')),
        notes: formData.get('notes')
    };
    
    console.log('📋 Dados do serviço coletados:', JSON.stringify(service, null, 2));
    console.log('🔑 Token do usuário:', userToken ? userToken.substring(0, 20) + '...' : 'NÃO');
    
    try {
        console.log('🚀 Fazendo requisição para /api/services...');
        
        const response = await apiRequest('/services', {
            method: 'POST',
            body: JSON.stringify(service)
        });
        
        console.log('✅ Serviço salvo com sucesso:', response);
        
        // The original code had 'services' array, which is no longer used.
        // This function needs to be refactored to fetch data directly or update the global state.
        // For now, we'll just display the fetched data.
        
        displayServices();
        serviceForm.reset();
        
        showMessage('Serviço registrado com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao salvar serviço:', error);
        console.error('❌ Detalhes do erro:', error.message);
        showMessage(`Erro ao salvar serviço: ${error.message}`, 'error');
    }
});



// Get machine type display name
function getMachineTypeDisplayName(machineType) {
    const typeMap = {
        'Elevador 1': 'Elevador 1',
        'Elevador 2': 'Elevador 2',
        'Elevador 3': 'Elevador 3',
        'Elevador 4': 'Elevador 4',
        'Elevador 5': 'Elevador 5',
        'Montador 1': 'Montador 1',
        'Montador 2': 'Montador 2',
        'Compressor': 'Compressor',
        'Alinhador': 'Alinhador',
        'Tubo de Ar': 'Tubo de Ar',
        'Torno': 'Torno',
        'Fresadora': 'Fresadora',
        'Furadeira': 'Furadeira',
        'Retífica': 'Retífica',
        'Serra': 'Serra',
        'Outros': 'Outros'
    };
    return typeMap[machineType] || machineType;
}

// Get service type ID from frontend value
function getServiceTypeId(frontendValue) {
    console.log('🔍 getServiceTypeId chamada com:', frontendValue);
    
    // O banco usa STRINGS, não números!
    const serviceTypeMap = {
        'belt-replacement': 'belt-replacement',
        'engine-replacement': 'engine-replacement',
        'flat-replacement': 'flat-replacement',
        'tube-air-replacement': 'tube-air-replacement',
        'repair': 'repair',
        'preventive-maintenance': 'preventive-maintenance',
        'calibration': 'calibration',
        'inspection': 'inspection',
        'other': 'other'
    };
    
    const result = serviceTypeMap[frontendValue] || 'repair';
    console.log('✅ getServiceTypeId retornando:', result);
    return result;
}

// Get technician ID from frontend value
function getTechnicianId(frontendValue) {
    console.log('🔍 getTechnicianId chamada com:', frontendValue);
    
    // O banco usa NÚMEROS para technicians
    const technicianMap = {
        '1': 1,        // Martins
        '2': 2         // Outros
    };
    
    const result = parseInt(frontendValue) || 1;
    console.log('✅ getTechnicianId retornando:', result);
    return result;
}

// Get status value for backend
function getStatusValue(frontendValue) {
    console.log('🔍 getStatusValue chamada com:', frontendValue);
    
    // O banco usa STRINGS específicos
    const statusMap = {
        'completed': 'completed',
        'pending': 'pending',
        'in_progress': 'in_progress',
        'cancelled': 'cancelled'
    };
    
    const result = statusMap[frontendValue] || 'completed';
    console.log('✅ getStatusValue retornando:', result);
    return result;
}

// Get technician name by ID
function getTechnicianName(technicianId) {
    const technicianMap = {
        '1': 'Martins',
        '2': 'Outros'
    };
    return technicianMap[technicianId] || technicianId;
}

// Get status display name
function getStatusDisplayName(status) {
    const statusMap = {
        'completed': 'Concluído',
        'pending': 'Pendente',
        'in_progress': 'Em Andamento',
        'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
}



// Display store-specific report
async function displayStoreReport(storeCode) {
    if (!storeCode) {
        storeReport.innerHTML = '<p class="no-records">Selecione uma loja para visualizar o relatório.</p>';
        
        // Hide print button when no store is selected
        const printReportBtn = document.getElementById('printReportBtn');
        if (printReportBtn) {
            printReportBtn.style.display = 'none';
        }
        return;
    }
    
    // Check if user is still active
    if (!isUserActive()) {
        showMessage('Sessão expirada. Faça login novamente.', 'error');
        handleLogout();
        return;
    }
    
    // Verify token before making requests
    const isTokenValid = await checkAuthStatus();
    if (!isTokenValid) {
        showMessage('Token inválido. Faça login novamente.', 'error');
        handleLogout();
        return;
    }
    
    try {
        // Definir período padrão (últimos 12 meses)
        const today = new Date();
        const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        const toISO = (d) => d.toISOString().split('T')[0];
        
        const response = await apiRequest('/reports/store', {
            method: 'POST',
            body: JSON.stringify({
                storeId: storeCode,
                startDate: toISO(oneYearAgo),
                endDate: toISO(today)
            })
        });
        
        const reportId = response.reportId;
        const report = response.report;
        
        // Montar HTML do relatório a partir do objeto salvo
        let reportHTML = `
            <div class="store-report-header">
                <h3>Relatório da Loja: ${report.storeInfo.storeName}</h3>
                <div class="report-summary">
                    <div class="summary-item"><strong>Período:</strong> ${report.period.startDate} a ${report.period.endDate}</div>
                    <div class="summary-item"><strong>Total de Serviços:</strong> ${report.summary.totalServices}</div>
                    <div class="summary-item"><strong>Custo Total:</strong> R$ ${Number(report.summary.totalCost).toFixed(2)}</div>
                    <div class="summary-item"><strong>Média por Serviço:</strong> R$ ${Number(report.summary.averageCost).toFixed(2)}</div>
                    <div class="summary-item"><strong>Máquinas Únicas:</strong> ${report.summary.uniqueMachines}</div>
                    <div class="summary-item"><strong>Técnicos Únicos:</strong> ${report.summary.uniqueTechnicians}</div>
                </div>
                <div class="summary-item" style="margin-top:8px;">
                    <strong>Relatório salvo:</strong> #${reportId}
                </div>
            </div>
        `;
        
        // Quebra por status
        const statusEntries = Object.entries(report.statusBreakdown || {});
        if (statusEntries.length > 0) {
            reportHTML += '<h4>Serviços por Status</h4><div class="supplier-boxes">';
            statusEntries.forEach(([status, count]) => {
                reportHTML += `
                    <div class="supplier-box">
                        <div class="supplier-header"><h5>${getStatusDisplayName(status)}</h5></div>
                        <div class="supplier-stats">
                            <div class="stat-item"><span class="stat-label">Quantidade:</span><span class="stat-value">${count}</span></div>
                        </div>
                    </div>
                `;
            });
            reportHTML += '</div>';
        }
        
        // Quebra por tipo de serviço
        const typeEntries = Object.entries(report.serviceTypeBreakdown || {});
        if (typeEntries.length > 0) {
            reportHTML += '<h4>Serviços por Tipo</h4><div class="supplier-boxes">';
            typeEntries.forEach(([type, count]) => {
                reportHTML += `
                    <div class="supplier-box">
                        <div class="supplier-header"><h5>${getServiceTypeDisplayName(type)}</h5></div>
                        <div class="supplier-stats">
                            <div class="stat-item"><span class="stat-label">Quantidade:</span><span class="stat-value">${count}</span></div>
                        </div>
                    </div>
                `;
            });
            reportHTML += '</div>';
        }
        
        // Últimos serviços
        if (Array.isArray(report.services) && report.services.length > 0) {
            reportHTML += '<h4>Últimos Serviços</h4><div class="mechanic-services">';
            report.services.slice(0, 10).forEach(svc => {
                const cost = parseFloat(svc.cost || 0);
                reportHTML += `
                    <div class="report-item service-report">
                        <div class="report-item-header">
                            <span class="report-item-title">${svc.machineCode} - ${svc.machineType}</span>
                            <span class="report-item-date">Serviço: ${getServiceNumber(storeCode, svc.id || svc._id || '')}</span>
                        </div>
                        <div class="report-item-details">
                            <strong>Tipo de Serviço:</strong> ${svc.serviceType}<br>
                            <strong>Técnico:</strong> ${svc.technician}<br>
                            <strong>Descrição:</strong> ${svc.description || ''}<br>
                            <strong>Custo:</strong> R$ ${cost.toFixed(2)}<br>
                            <strong>Status:</strong> ${getStatusDisplayName(svc.status || 'completed')}
                        </div>
                    </div>
                `;
            });
            reportHTML += '</div>';
        } else {
            reportHTML += '<p class="no-records">Nenhum serviço encontrado no período selecionado.</p>';
        }
        
        storeReport.innerHTML = reportHTML;
        
        // Show print button when report is loaded successfully
        const printReportBtn = document.getElementById('printReportBtn');
        if (printReportBtn) {
            printReportBtn.style.display = 'inline-flex';
        }
        
        // Hide retry button on success
        const retryReportBtn = document.getElementById('retryReportBtn');
        if (retryReportBtn) {
            retryReportBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading store report:', error);
        
        let errorMessage = 'Erro ao carregar relatório. Tente novamente.';
        
        if (error.message.includes('Sessão expirada')) {
            errorMessage = 'Sessão expirada. Faça login novamente.';
        } else if (error.message.includes('Invalid content type')) {
            errorMessage = 'Erro de comunicação com o servidor. Verifique sua conexão.';
        } else if (error.message.includes('HTTP error')) {
            errorMessage = 'Erro no servidor. Tente novamente em alguns instantes.';
        }
        
        storeReport.innerHTML = `<p class="no-records">${errorMessage}</p>`;
        
        // Hide print button on error
        const printReportBtn = document.getElementById('printReportBtn');
        if (printReportBtn) {
            printReportBtn.style.display = 'none';
        }
        
        // Show retry button
        const retryReportBtn = document.getElementById('retryReportBtn');
        if (retryReportBtn) {
            retryReportBtn.style.display = 'inline-block';
        }
    }
}

// Get store display name
function getStoreDisplayName(storeCode) {
    return storeNames[storeCode] || storeCode;
}

// Get service type display name
function getServiceTypeDisplayName(serviceType) {
    const serviceTypeNames = {
        'belt-replacement': 'Substituição de Correia',
        'engine-replacement': 'Substituição de Motor',
        'flat-replacement': 'Substituição de Pneu',
        'tube-air-replacement': 'Substituição de Tubo/Ar',
        'repair': 'Reparo',
        'preventive-maintenance': 'Manutenção Preventiva',
        'calibration': 'Calibração',
        'inspection': 'Inspeção',
        'other': 'Outros'
    };
    return serviceTypeNames[serviceType] || serviceType;
}

// Get machine type display name
function getMachineTypeDisplayName(machineType) {
    const machineTypeNames = {
        'elevator-1': 'Elevador 1',
        'elevator-2': 'Elevador 2',
        'elevator-3': 'Elevador 3',
        'elevator-4': 'Elevador 4',
        'elevator-5': 'Elevador 5',
        'assembler-1': 'Montador 1',
        'assembler-2': 'Montador 2',
        'compressor': 'Compressor',
        'aligner': 'Alinhador',
        'air-tube': 'Tubo de Ar',
        'torno': 'Torno',
        'fresadora': 'Fresadora',
        'furadeira': 'Furadeira',
        'retifica': 'Retífica',
        'serra': 'Serra',
        'outros': 'Outros'
    };
    return machineTypeNames[machineType] || machineType;
}



// Display service records
async function displayServices() {
    // Check if user is still active
    if (!isUserActive()) {
        showMessage('Sessão expirada. Faça login novamente.', 'error');
        handleLogout();
        return;
    }
    
    if (!servicesList) return; // Ensure servicesList exists

    servicesList.innerHTML = '<p class="no-records">Carregando serviços...</p>';
    
    try {
        // Verify token before making requests
        const isTokenValid = await checkAuthStatus();
        if (!isTokenValid) {
            showMessage('Token inválido. Faça login novamente.', 'error');
            handleLogout();
            return;
        }
        
        // Fetch services from the backend
        const data = await apiRequest('/services');
        const services = Array.isArray(data) ? data : (data && data.services) ? data.services : [];
        
        if (services.length > 0) {
            servicesList.innerHTML = '';
            services.forEach(service => {
                const machineCode = service.machineCode || service.machine_code || '';
                const machineType = service.machineType || service.machine_type || '';
                const storeName = service.store_name || getStoreDisplayName(service.store_id || service.store || '');
                const serviceDate = service.serviceDate || service.service_date || '';
                const serviceType = getServiceTypeDisplayName(service.serviceType || service.service_name || service.service_type_id || 'repair');
                const technician = service.technician || service.technician_name || getTechnicianName(service.technician_id || '1');
                const description = service.description || '';
                const cost = parseFloat(service.cost || 0);
                const status = getStatusDisplayName(service.status || 'completed');
                const recordDate = service.recordDate || service.record_date || '';

                const serviceDiv = document.createElement('div');
                serviceDiv.className = 'record-item service-record';
                serviceDiv.innerHTML = `
                    <div class="record-header">
                        <span class="record-title">${machineCode} - ${machineType}</span>
                        <span class="record-date">Serviço: ${getServiceNumber(service.store_id || service.store || '', service.id || service._id || '')}</span>
                    </div>
                    <div class="record-details">
                        <strong>Código da Máquina:</strong> ${machineCode}<br>
                        <strong>Tipo de Máquina:</strong> ${machineType}<br>
                        <strong>Loja:</strong> ${storeName}<br>
                        <strong>Localização:</strong> ${service.location || ''}<br>
                        <strong>Tipo de Serviço:</strong> ${serviceType}<br>
                        <strong>Técnico:</strong> ${technician}<br>
                        <strong>Descrição:</strong> ${description}<br>
                        <strong>Custo:</strong> R$ ${cost.toFixed(2)}<br>
                        <strong>Status:</strong> ${status}<br>

                        <strong>Registrado em:</strong> ${recordDate}
                        ${service.notes ? `<br><strong>Observações:</strong> ${service.notes}` : ''}
                    </div>
                `;
                servicesList.appendChild(serviceDiv);
            });
        } else {
            servicesList.innerHTML = '<p class="no-records">Nenhum registro de serviço ainda.</p>';
        }
    } catch (error) {
        console.error('Error loading services:', error);
        
        let errorMessage = 'Erro ao carregar serviços. Tente novamente.';
        
        if (error.message.includes('Sessão expirada')) {
            errorMessage = 'Sessão expirada. Faça login novamente.';
        } else if (error.message.includes('Invalid content type')) {
            errorMessage = 'Erro de comunicação com o servidor. Verifique sua conexão.';
        } else if (error.message.includes('HTTP error')) {
            errorMessage = 'Erro no servidor. Tente novamente em alguns instantes.';
        }
        
        servicesList.innerHTML = `<p class="no-records">${errorMessage}</p>`;
    }
}

// Show success/error/warning/info messages
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    
    // Set appropriate CSS class based on message type
    switch(type) {
        case 'success':
            messageDiv.className = 'success-message';
            break;
        case 'error':
            messageDiv.className = 'error-message';
            break;
        case 'warning':
            messageDiv.className = 'warning-message';
            break;
        case 'info':
            messageDiv.className = 'info-message';
            break;
        default:
            messageDiv.className = 'info-message';
    }
    
    messageDiv.textContent = message;
    
    // Insert message at the top of the main container
    const main = document.querySelector('main');
    if (main) {
        main.insertBefore(messageDiv, main.firstChild);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Reload page with cache refresh
function reloadPage() {
    console.log('🔄 Recarregando página...');
    window.location.reload(true);
}

// Handle authentication errors
function handleAuthError(error) {
    console.error('🔐 Auth error:', error);
    
    if (error.message.includes('Sessão expirada') || 
        error.message.includes('Token inválido') ||
        error.message.includes('401')) {
        showMessage('Sessão expirada. Redirecionando para login...', 'error');
        setTimeout(() => {
            handleLogout();
        }, 2000);
    } else {
        showMessage('Erro de comunicação. Tente novamente.', 'error');
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 DOM carregado, inicializando aplicação...');
    
    try {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('currentUser');
        const savedRole = localStorage.getItem('userRole');
        const savedToken = localStorage.getItem('userToken');

        console.log('📋 Dados salvos:', { savedUser, savedRole, savedToken: savedToken ? 'SIM' : 'NÃO' });

        if (savedUser && savedRole && savedToken) {
            try {
                // Attempt to verify token
                userToken = savedToken;
                console.log('🔐 Verificando token salvo...');
                const isValid = await verifyToken();
                if (isValid) {
                    currentUser = JSON.parse(savedUser);
                    userRole = savedRole;
                    console.log('✅ Token válido, mostrando aplicação principal');
                    showMainApp();
                } else {
                    console.log('❌ Token inválido, fazendo logout');
                    handleLogout(); // Token invalid, force logout
                }
            } catch (error) {
                console.error('❌ Falha na verificação do token:', error);
                handleLogout(); // Token verification failed, force logout
            }
        } else {
            console.log('👤 Nenhum usuário logado, mostrando tela de login');
            showLoginScreen();
        }
        
        // Add event listeners
        console.log('🔗 Adicionando event listeners...');
        console.log('📝 Adicionando listener para loginForm:', loginForm);
        loginForm.addEventListener('submit', handleLogin);
        console.log('📝 Adicionando listener para logoutBtn:', logoutBtn);
        logoutBtn.addEventListener('submit', handleLogout);
        logoutBtn.addEventListener('click', handleLogout);
        
        console.log('🧭 Inicializando navegação...');
        initializeNavigation();
        console.log('📊 Inicializando serviços...');
        displayServices();
        
        // Add event listener for store report selection
        storeReportSelect.addEventListener('change', function() {
            // Check if user is still active
            if (!isUserActive()) {
                showMessage('Sessão expirada. Faça login novamente.', 'error');
                handleLogout();
                return;
            }
            
            displayStoreReport(this.value);
        });
        
        // Add event listener for retry button
        const retryReportBtn = document.getElementById('retryReportBtn');
        if (retryReportBtn) {
            retryReportBtn.addEventListener('click', function() {
                const selectedStore = storeReportSelect.value;
                if (selectedStore) {
                    displayStoreReport(selectedStore);
                }
            });
        }
        
        console.log('✅ Aplicação inicializada com autenticação via API');
    } catch (error) {
        console.error('💥 Falha na inicialização da aplicação:', error);
        // Continue with login screen
        showLoginScreen();
    }
});

// Show login screen
function showLoginScreen() {
    loginScreen.style.display = 'flex';
    mainApp.style.display = 'none';
}

// Show main application
function showMainApp() {
    loginScreen.style.display = 'none';
    mainApp.style.display = 'block';
    
    // Update user display
    currentUserSpan.textContent = `Usuário: ${currentUser}`;
    
    // Show/hide admin features
    const adminButtons = document.querySelectorAll('.admin-only');
    adminButtons.forEach(btn => {
        if (userRole === 'admin') {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    });
    
    // Filter data based on user role
    if (userRole !== 'admin') {
        filterDataForStore(currentUser);
        // Filter store options for non-admin users
        filterStoreOptions(currentUser);
    }
    
    // Start inactivity timer
    startInactivityTimer();
    
    // Add activity listeners
    addActivityListeners();
}

// Handle login
async function handleLogin(e) {
    console.log('🚀 handleLogin chamada!');
    console.log('📋 Evento:', e);
    console.log('📋 Tipo do evento:', e.type);
    
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    console.log('Tentando login com:', username, password);
    
    try {
        console.log('Fazendo requisição para /api/auth/login...');
        
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        console.log('Status do login: sucesso');
        console.log('Resposta recebida:', data);
        
        if (data.success) {
            // Salvar token e informações do usuário
            userToken = data.token;
            currentUser = data.user.fullName || data.user.username;
            userRole = data.user.role;
            
            // Salvar no localStorage
            localStorage.setItem('userToken', userToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('userRole', userRole);
            
            // Mostrar aplicação principal
            showMainApp();
            showMessage('Login realizado com sucesso!', 'success');
        } else {
            showMessage(data.error || 'Usuário ou senha incorretos!', 'error');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showMessage(`Erro ao fazer login: ${error.message}`, 'error');
    }
}

// Handle logout
function handleLogout(e) {
    if (e) e.preventDefault();
    
    // Clear inactivity timer
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
    
    // Remove activity listeners
    removeActivityListeners();
    
    currentUser = null;
    userRole = null;
    userToken = null;
    localStorage.removeItem('userToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    
    showLoginScreen();
    loginForm.reset();
}

// Print report function
function printReport() {
    const storeCode = storeReportSelect.value;
    if (!storeCode) {
        showMessage('Selecione uma loja para imprimir o relatório.', 'warning');
        return;
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const storeName = getStoreDisplayName(storeCode);
    
    // Get the current report content and remove specific sections for printing
    let reportContent = storeReport.innerHTML;
    
    // Remove specific sections that should not appear in print
    const sectionsToRemove = [
        'Média por Serviço',
        'Serviços por Status',
        'Relatório salvo',
        'Serviços por Tipo',
        'Últimos Serviços'
    ];
    
    sectionsToRemove.forEach(section => {
        // Remove the section header and its content
        const regex = new RegExp(`<h4>${section}</h4>.*?<\/div>\s*<\/div>`, 'gs');
        reportContent = reportContent.replace(regex, '');
        
        // Also try to remove just the header if the regex didn't work
        reportContent = reportContent.replace(`<h4>${section}</h4>`, '');
    });
    
    // Clean up any empty divs that might be left
    reportContent = reportContent.replace(/<div class="supplier-boxes">\s*<\/div>/g, '');
    reportContent = reportContent.replace(/<div class="mechanic-services">\s*<\/div>/g, '');
    
    // Create print-friendly HTML
    const printHTML = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>GPSERVIÇOSAUTOMOTIVOS - ${storeName}</title>
            <style>
                @media print {
                    body { margin: 0; padding: 20px; }
                    .no-print { display: none !important; }
                }
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 20px;
                }
                .print-header {
                    text-align: center;
                    border-bottom: 3px solid #dc2626;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .print-header h1 {
                    color: #dc2626;
                    margin: 0 0 10px 0;
                    font-size: 2rem;
                }
                .print-header p {
                    margin: 0;
                    color: #666;
                    font-size: 1.1rem;
                }
                .print-date {
                    text-align: right;
                    color: #666;
                    margin-bottom: 20px;
                    font-size: 0.9rem;
                }
                .supplier-box, .mechanic-section {
                    page-break-inside: avoid;
                    margin-bottom: 30px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 20px;
                }
                .supplier-header, .mechanic-header {
                    background: #f8f9fa;
                    padding: 15px;
                    margin: -20px -20px 20px -20px;
                    border-radius: 8px 8px 0 0;
                    border-bottom: 1px solid #ddd;
                }
                .supplier-header h5, .mechanic-header h5 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 1.2rem;
                }
                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    padding: 5px 0;
                }
                .stat-label {
                    font-weight: bold;
                    color: #2c3e50;
                }
                .stat-value {
                    color: #dc2626;
                    font-weight: bold;
                }
                .machine-type-item, .service-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #eee;
                }
                .machine-type-item:last-child, .service-item:last-child {
                    border-bottom: none;
                }
                .report-item {
                    margin-bottom: 15px;
                    padding: 15px;
                    border: 1px solid #eee;
                    border-radius: 5px;
                }
                .report-item-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    font-weight: bold;
                }
                .report-item-details {
                    line-height: 1.5;
                }
                h4 {
                    color: #2c3e50;
                    border-bottom: 2px solid #dc2626;
                    padding-bottom: 8px;
                    margin: 25px 0 15px 0;
                }
                h6 {
                    color: #2c3e50;
                    margin: 15px 0 10px 0;
                }
                @media print {
                    .btn-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>GPSERVIÇOSAUTOMOTIVOS</h1>
                <p>Relatório de Serviços - ${storeName}</p>
            </div>
            <div class="print-date">
                Data de impressão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
            </div>
            ${reportContent}
        </body>
        </html>
    `;
    
    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
        printWindow.print();
        printWindow.close();
    };
}

// Add event listener for print button
document.addEventListener('DOMContentLoaded', function() {
    const printReportBtn = document.getElementById('printReportBtn');
    if (printReportBtn) {
        printReportBtn.addEventListener('click', printReport);
    }
});

 