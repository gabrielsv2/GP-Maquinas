// GP Máquinas e Serviços - Frontend
// Sistema de Gerenciamento de Serviços

// Configuração da API
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

// Estado da aplicação
let currentUser = null;
let userRole = null;
let userToken = null;
let inactivityTimer = null;
let lastActivity = Date.now();
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hora

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

// Funções de API
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(userToken && { 'Authorization': `Bearer ${userToken}` })
        }
    };

    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Funções de autenticação
async function login(username, password) {
    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (response.success) {
            userToken = response.token;
            currentUser = response.user;
            userRole = response.user.role;
            
            // Salvar token no localStorage
            localStorage.setItem('userToken', userToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            return true;
        }
        return false;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function logout() {
    try {
        if (userToken) {
            await apiRequest('/auth/logout', {
                method: 'POST'
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Limpar estado local
        userToken = null;
        currentUser = null;
        userRole = null;
        localStorage.removeItem('userToken');
        localStorage.removeItem('currentUser');
        
        // Limpar timer de inatividade
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
            inactivityTimer = null;
        }
        
        // Remover listeners de atividade
        removeActivityListeners();
        
        showLoginScreen();
    }
}

async function verifyToken() {
    try {
        const response = await apiRequest('/auth/verify');
        return response.valid;
    } catch (error) {
        return false;
    }
}

// Funções de serviços
async function getServices() {
    try {
        const response = await apiRequest('/services');
        return response.services || [];
    } catch (error) {
        console.error('Error fetching services:', error);
        return [];
    }
}

async function createService(serviceData) {
    try {
        const response = await apiRequest('/services', {
            method: 'POST',
            body: JSON.stringify(serviceData)
        });
        return response.service;
    } catch (error) {
        console.error('Error creating service:', error);
        throw error;
    }
}

async function updateService(id, serviceData) {
    try {
        const response = await apiRequest(`/services/${id}`, {
            method: 'PUT',
            body: JSON.stringify(serviceData)
        });
        return response.service;
    } catch (error) {
        console.error('Error updating service:', error);
        throw error;
    }
}

async function deleteService(id) {
    try {
        await apiRequest(`/services/${id}`, {
            method: 'DELETE'
        });
        return true;
    } catch (error) {
        console.error('Error deleting service:', error);
        throw error;
    }
}

// Funções de relatórios
async function generateStoreReport(storeId, startDate, endDate) {
    try {
        const response = await apiRequest('/reports/store', {
            method: 'POST',
            body: JSON.stringify({ storeId, startDate, endDate })
        });
        return response.report;
    } catch (error) {
        console.error('Error generating store report:', error);
        throw error;
    }
}

async function generateFinancialReport(startDate, endDate, storeId = null) {
    try {
        const response = await apiRequest('/reports/financial', {
            method: 'POST',
            body: JSON.stringify({ startDate, endDate, storeId })
        });
        return response.report;
    } catch (error) {
        console.error('Error generating financial report:', error);
        throw error;
    }
}

// Timer de inatividade
function startInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    
    inactivityTimer = setTimeout(() => {
        showMessage('Sessão expirada por inatividade. Faça login novamente.', 'error');
        logout();
    }, INACTIVITY_TIMEOUT);
}

function resetInactivityTimer() {
    lastActivity = Date.now();
    startInactivityTimer();
}

function isUserActive() {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivity;
    return timeSinceLastActivity < INACTIVITY_TIMEOUT;
}

function addActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, true);
    });
    
    document.addEventListener('submit', resetInactivityTimer, true);
    document.addEventListener('change', resetInactivityTimer, true);
}

function removeActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
    });
    
    document.removeEventListener('submit', resetInactivityTimer, true);
    document.removeEventListener('change', resetInactivityTimer, true);
}

// Funções de interface
function showLoginScreen() {
    loginScreen.style.display = 'flex';
    mainApp.style.display = 'none';
    loginForm.reset();
}

function showMainApp() {
    loginScreen.style.display = 'none';
    mainApp.style.display = 'block';
    
    // Update user display
    if (currentUser) {
        currentUserSpan.textContent = `Usuário: ${currentUser.fullName || currentUser.username}`;
    }
    
    // Show/hide admin features
    const adminButtons = document.querySelectorAll('.admin-only');
    adminButtons.forEach(btn => {
        if (userRole === 'admin') {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    });
    
    // Start inactivity timer
    startInactivityTimer();
    
    // Add activity listeners
    addActivityListeners();
    
    // Load initial data
    loadInitialData();
}

async function loadInitialData() {
    try {
        await displayServices();
    } catch (error) {
        console.error('Error loading initial data:', error);
        showMessage('Erro ao carregar dados iniciais', 'error');
    }
}

// Event handlers
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const success = await login(username, password);
        
        if (success) {
            showMainApp();
            showMessage('Login realizado com sucesso!', 'success');
        } else {
            showMessage('Usuário ou senha incorretos!', 'error');
        }
    } catch (error) {
        showMessage(`Erro no login: ${error.message}`, 'error');
    }
}

async function handleLogout(e) {
    if (e) e.preventDefault();
    await logout();
}

// Service form handler
async function handleServiceSubmit(e) {
    e.preventDefault();
    
    // Check if user is still active
    if (!isUserActive()) {
        showMessage('Sessão expirada. Faça login novamente.', 'error');
        await logout();
        return;
    }
    
    const formData = new FormData(serviceForm);
    
    const serviceData = {
        machineCode: formData.get('machineCode'),
        machineType: formData.get('machineType'),
        storeId: formData.get('storeLocation'),
        location: formData.get('location'),
        serviceTypeId: formData.get('serviceType'),
        technicianId: formData.get('technician'),
        serviceDate: formData.get('serviceDate'),
        description: formData.get('description'),
        cost: parseFloat(formData.get('cost')),
        priority: formData.get('priority'),
        status: formData.get('status'),
        notes: formData.get('notes'),
        estimatedDurationHours: formData.get('estimatedDurationHours') ? 
            parseInt(formData.get('estimatedDurationHours')) : null,
        actualDurationHours: formData.get('actualDurationHours') ? 
            parseInt(formData.get('actualDurationHours')) : null,
        partsUsed: formData.get('partsUsed') || null,
        warrantyUntil: formData.get('warrantyUntil') || null
    };
    
    try {
        await createService(serviceData);
        serviceForm.reset();
        await displayServices();
        showMessage('Serviço registrado com sucesso!', 'success');
    } catch (error) {
        showMessage(`Erro ao salvar serviço: ${error.message}`, 'error');
    }
}

// Display functions
async function displayServices() {
    try {
        const services = await getServices();
        
        if (services.length === 0) {
            servicesList.innerHTML = '<p class="no-records">Nenhum serviço registrado ainda.</p>';
            return;
        }
        
        servicesList.innerHTML = '';
        
        services.forEach(service => {
            const serviceDiv = document.createElement('div');
            serviceDiv.className = 'record-item service-record';
            serviceDiv.innerHTML = `
                <div class="record-header">
                    <span class="record-title">${service.machine_code} - ${service.machine_type}</span>
                    <span class="record-date">Data do Serviço: ${service.service_date}</span>
                </div>
                <div class="record-details">
                    <strong>Código da Máquina:</strong> ${service.machine_code}<br>
                    <strong>Tipo de Máquina:</strong> ${service.machine_type}<br>
                    <strong>Loja:</strong> ${getStoreDisplayName(service.store_id)}<br>
                    <strong>Localização:</strong> ${service.location}<br>
                    <strong>Tipo de Serviço:</strong> ${getServiceTypeDisplayName(service.service_type_id)}<br>
                    <strong>Técnico:</strong> ${getTechnicianName(service.technician_id)}<br>
                    <strong>Descrição:</strong> ${service.description}<br>
                    <strong>Custo:</strong> R$ ${parseFloat(service.cost).toFixed(2)}<br>
                    <strong>Status:</strong> ${getStatusDisplayName(service.status)}<br>
                    <strong>Prioridade:</strong> ${getPriorityDisplayName(service.priority)}<br>
                    <strong>Registrado em:</strong> ${service.record_date}
                    ${service.notes ? `<br><strong>Observações:</strong> ${service.notes}` : ''}
                </div>
            `;
            servicesList.appendChild(serviceDiv);
        });
    } catch (error) {
        console.error('Error displaying services:', error);
        servicesList.innerHTML = '<p class="error">Erro ao carregar serviços</p>';
    }
}

// Store report handler
async function handleStoreReport() {
    const storeId = storeReportSelect.value;
    
    if (!storeId) {
        storeReport.innerHTML = '<p class="no-records">Selecione uma loja para visualizar o relatório.</p>';
        return;
    }
    
    try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const report = await generateStoreReport(storeId, startDate, endDate);
        displayStoreReport(report);
    } catch (error) {
        showMessage(`Erro ao gerar relatório: ${error.message}`, 'error');
    }
}

function displayStoreReport(report) {
    if (!report) {
        storeReport.innerHTML = '<p class="error">Erro ao carregar relatório</p>';
        return;
    }
    
    storeReport.innerHTML = `
        <div class="store-report-header">
            <h3>Relatório - ${report.storeInfo.storeName}</h3>
            <p>Período: ${report.period.startDate} a ${report.period.endDate}</p>
        </div>
        
        <div class="report-summary">
            <div class="summary-item">
                <strong>Total de Serviços</strong>
                <span>${report.summary.totalServices}</span>
            </div>
            <div class="summary-item">
                <strong>Custo Total</strong>
                <span>R$ ${report.summary.totalCost}</span>
            </div>
            <div class="summary-item">
                <strong>Máquinas Atendidas</strong>
                <span>${report.summary.uniqueMachines}</span>
            </div>
            <div class="summary-item">
                <strong>Técnicos Utilizados</strong>
                <span>${report.summary.uniqueTechnicians}</span>
            </div>
        </div>
        
        <h4>Serviços Realizados</h4>
        <div class="store-services">
            ${report.services.map(service => `
                <div class="report-item service-report">
                    <div class="report-item-header">
                        <span class="report-item-title">${service.machineCode} - ${service.machineType}</span>
                        <span class="report-item-date">${service.serviceDate}</span>
                    </div>
                    <div class="report-item-details">
                        <strong>Tipo:</strong> ${service.serviceType}<br>
                        <strong>Técnico:</strong> ${service.technician}<br>
                        <strong>Custo:</strong> R$ ${parseFloat(service.cost).toFixed(2)}<br>
                        <strong>Status:</strong> ${getStatusDisplayName(service.status)}<br>
                        <strong>Prioridade:</strong> ${getPriorityDisplayName(service.priority)}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Navigation
function initializeNavigation() {
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            switchSection(targetSection);
        });
    });
}

function switchSection(sectionName) {
    // Check if user is still active
    if (!isUserActive()) {
        showMessage('Sessão expirada. Faça login novamente.', 'error');
        logout();
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

// Utility functions
function getStoreDisplayName(storeCode) {
    return storeNames[storeCode] || storeCode;
}

function getServiceTypeDisplayName(serviceTypeId) {
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
    return serviceTypeNames[serviceTypeId] || serviceTypeId;
}

function getTechnicianName(technicianId) {
    const technicianMap = {
        '1': 'João Silva - Mecânica Geral',
        '2': 'Maria Santos - Eletrônica',
        '3': 'Pedro Costa - Manutenção Preventiva',
        '4': 'Ana Oliveira - Calibração'
    };
    return technicianMap[technicianId] || `Técnico ${technicianId}`;
}

function getStatusDisplayName(status) {
    const statusMap = {
        'completed': 'Concluído',
        'pending': 'Pendente',
        'in_progress': 'Em Andamento',
        'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
}

function getPriorityDisplayName(priority) {
    const priorityMap = {
        'low': 'Baixa',
        'medium': 'Média',
        'high': 'Alta',
        'urgent': 'Urgente'
    };
    return priorityMap[priority] || priority;
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
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

// Initialize application
async function initializeApp() {
    try {
        // Check if user is already logged in
        const savedToken = localStorage.getItem('userToken');
        const savedUser = localStorage.getItem('currentUser');
        
        if (savedToken && savedUser) {
            userToken = savedToken;
            currentUser = JSON.parse(savedUser);
            userRole = currentUser.role;
            
            // Verify token is still valid
            const isValid = await verifyToken();
            if (isValid) {
                showMainApp();
                return;
            } else {
                // Token expired, clear storage
                localStorage.removeItem('userToken');
                localStorage.removeItem('currentUser');
            }
        }
        
        // Show login screen
        showLoginScreen();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showLoginScreen();
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navigation
    initializeNavigation();
    
    // Add event listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    serviceForm.addEventListener('submit', handleServiceSubmit);
    storeReportSelect.addEventListener('change', handleStoreReport);
    
    // Initialize app
    initializeApp();
    
    console.log('Application initialized');
});
