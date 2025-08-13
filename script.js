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

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const url = `https://gp-maquinas-backend.onrender.com/api${endpoint}`;
    
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
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expirado ou inválido
                handleLogout();
                throw new Error('Sessão expirada. Faça login novamente.');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
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
        
        const response = await fetch('https://gp-maquinas-backend.onrender.com/api/auth/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });
        
        console.log('📊 Status da verificação:', response.status);
        
        if (!response.ok) {
            console.log('❌ Resposta não OK:', response.status);
            return false;
        }
        
        const data = await response.json();
        console.log('📨 Dados da verificação:', data);
        return data.valid;
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
        // Filter machines for this store
        const storeMachines = await apiRequest(`/machines?store=${storeName}`);
        // The original code had 'machines' and 'services' arrays, which are no longer used.
        // This function needs to be refactored to fetch data directly or update the global state.
        // For now, we'll just display the fetched data.
        // The original code had 'machines' and 'services' arrays, which are no longer used.
        // This function needs to be refactored to fetch data directly or update the global state.
        // For now, we'll just display the fetched data.
        
        // Filter services for this store
        const storeServices = await apiRequest(`/services?store=${storeName}`);
        // The original code had 'machines' and 'services' arrays, which are no longer used.
        // This function needs to be refactored to fetch data directly or update the global state.
        // For now, we'll just display the fetched data.
        
        // Update displays
        displayServices();
    } catch (error) {
        console.error('Error filtering data for store:', error);
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
    
    // Check if user is still active
    if (!isUserActive()) {
        showMessage('Sessão expirada. Faça login novamente.', 'error');
        handleLogout();
        return;
    }
    
    const formData = new FormData(serviceForm);
    
    const service = {
        machineCode: formData.get('machineCode'),
        machineType: formData.get('machineType'),
        storeId: formData.get('storeLocation'),
        location: formData.get('location'),
        serviceTypeId: formData.get('serviceType'),
        serviceDate: formData.get('serviceDate'),
        technicianId: formData.get('technician'),
        description: formData.get('description'),
        cost: parseFloat(formData.get('cost')),
        status: formData.get('status'),
        notes: formData.get('notes')
    };
    
    try {
        await apiRequest('/services', {
            method: 'POST',
            body: JSON.stringify(service)
        });
        
        // The original code had 'services' array, which is no longer used.
        // This function needs to be refactored to fetch data directly or update the global state.
        // For now, we'll just display the fetched data.
        
        displayServices();
        serviceForm.reset();
        
        showMessage('Serviço registrado com sucesso!', 'success');
    } catch (error) {
        console.error('Error saving service:', error);
        showMessage('Erro ao salvar serviço. Tente novamente.', 'error');
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
        return;
    }
    
    try {
        const storeMachines = await apiRequest(`/machines?store=${storeCode}`);
        const storeServices = await apiRequest(`/services?store=${storeCode}`);
        
        // Group machines by provider
        const machinesByProvider = {};
        storeMachines.forEach(machine => {
            const providerName = machine.provider || machine.mechanicName;
            if (!machinesByProvider[providerName]) {
                machinesByProvider[providerName] = [];
            }
            machinesByProvider[providerName].push(machine);
        });
        
        // Group services by technician
        const servicesByTechnician = {};
        storeServices.forEach(service => {
            if (!servicesByTechnician[service.technician]) {
                servicesByTechnician[service.technician] = [];
            }
            servicesByTechnician[service.technician].push(service);
        });
        
        let reportHTML = `
            <div class="store-report-header">
                <h3>Relatório da Loja: ${getStoreDisplayName(storeCode)}</h3>
                <div class="report-summary">
                    <div class="summary-item">
                        <strong>Total de Máquinas:</strong> ${storeMachines.length}
                    </div>
                    <div class="summary-item">
                        <strong>Total de Serviços:</strong> ${storeServices.length}
                    </div>
                    <div class="summary-item">
                        <strong>Custo Total dos Serviços:</strong> R$ ${storeServices.reduce((sum, service) => sum + service.cost, 0).toFixed(2)}
                    </div>
                    <div class="summary-item">
                        <strong>Fornecedores Ativos:</strong> ${Object.keys(machinesByProvider).length}
                    </div>
                </div>
            </div>
        `;
        
        // Display supplier boxes with values
        if (Object.keys(machinesByProvider).length > 0) {
            reportHTML += '<h4>Fornecedores e Suas Estatísticas:</h4>';
            reportHTML += '<div class="supplier-boxes">';
            
            Object.keys(machinesByProvider).forEach(providerName => {
                const providerMachines = machinesByProvider[providerName];
                const totalMachines = providerMachines.length;
                
                // Calculate services for this provider's machines
                const providerMachineIds = providerMachines.map(m => m.id);
                const providerServices = storeServices.filter(service => 
                    providerMachineIds.includes(parseInt(service.machineId))
                );
                const totalServices = providerServices.length;
                const totalCost = providerServices.reduce((sum, service) => sum + service.cost, 0);
                
                // Count machines by type for this provider
                const machineTypes = {};
                providerMachines.forEach(machine => {
                    const type = getMachineTypeDisplayName(machine.type);
                    machineTypes[type] = (machineTypes[type] || 0) + 1;
                });
                
                reportHTML += `
                    <div class="supplier-box">
                        <div class="supplier-header">
                            <h5>Fornecedor: ${providerName}</h5>
                        </div>
                        <div class="supplier-stats">
                            <div class="stat-item">
                                <span class="stat-label">Total de Máquinas:</span>
                                <span class="stat-value">${totalMachines}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Total de Serviços:</span>
                                <span class="stat-value">${totalServices}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Custo Total:</span>
                                <span class="stat-value">R$ ${totalCost.toFixed(2)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Tipos de Máquinas:</span>
                                <span class="stat-value">${Object.keys(machineTypes).length}</span>
                            </div>
                        </div>
                        <div class="supplier-machines">
                            <h6>Máquinas por Tipo:</h6>
                            <div class="machine-type-list">
                `;
                
                Object.keys(machineTypes).forEach(type => {
                    reportHTML += `
                        <div class="machine-type-item">
                            <span class="type-name">${type}</span>
                            <span class="type-count">${machineTypes[type]}</span>
                        </div>
                    `;
                });
                
                reportHTML += `
                            </div>
                        </div>
                        <div class="supplier-services">
                            <h6>Últimos Serviços:</h6>
                            <div class="service-list">
                `;
                
                // Show last 3 services for this provider
                const recentServices = providerServices.slice(-3);
                if (recentServices.length > 0) {
                    recentServices.forEach(service => {
                        reportHTML += `
                            <div class="service-item">
                                <span class="service-type">${getServiceTypeDisplayName(service.serviceType)}</span>
                                <span class="service-cost">R$ ${service.cost.toFixed(2)}</span>
                                <span class="service-date">${service.serviceDate}</span>
                            </div>
                        `;
                    });
                } else {
                    reportHTML += '<p class="no-services">Nenhum serviço registrado</p>';
                }
                
                reportHTML += `
                            </div>
                        </div>
                    </div>
                `;
            });
            
            reportHTML += '</div>';
        }
        
        // Display detailed machines grouped by provider
        if (Object.keys(machinesByProvider).length > 0) {
            reportHTML += '<h4>Detalhamento por Fornecedor:</h4>';
            
            Object.keys(machinesByProvider).forEach(providerName => {
                const providerMachines = machinesByProvider[providerName];
                const totalMachines = providerMachines.length;
                
                reportHTML += `
                    <div class="mechanic-section">
                        <div class="mechanic-header">
                            <h5>Fornecedor: ${providerName}</h5>
                            <span class="mechanic-count">Total de Máquinas: ${totalMachines}</span>
                        </div>
                        <div class="mechanic-machines">
                `;
                
                providerMachines.forEach(machine => {
                    reportHTML += `
                        <div class="report-item machine-report">
                            <div class="report-item-header">
                                <span class="report-item-title">${getMachineTypeDisplayName(machine.type)}</span>
                                <span class="report-item-date">Registrado: ${machine.registrationDate}</span>
                            </div>
                            <div class="report-item-details">
                                <strong>Tipo:</strong> ${getMachineTypeDisplayName(machine.type)}<br>
                                <strong>Fornecedor:</strong> ${machine.provider || machine.mechanicName}<br>
                                <strong>Localização:</strong> ${machine.location}<br>
                                <strong>Data do Serviço:</strong> ${machine.serviceDate}
                            </div>
                        </div>
                    `;
                });
                
                reportHTML += '</div></div>';
            });
        }
        
        // Display services grouped by technician
        if (Object.keys(servicesByTechnician).length > 0) {
            reportHTML += '<h4>Serviços por Técnico:</h4>';
            
            Object.keys(servicesByTechnician).forEach(technicianName => {
                const technicianServices = servicesByTechnician[technicianName];
                const totalServices = technicianServices.length;
                const totalCost = technicianServices.reduce((sum, service) => sum + service.cost, 0);
                
                reportHTML += `
                    <div class="mechanic-section">
                        <div class="mechanic-header">
                            <h5>Técnico: ${technicianName}</h5>
                            <span class="mechanic-count">Total de Serviços: ${totalServices} | Custo Total: R$ ${totalCost.toFixed(2)}</span>
                        </div>
                        <div class="mechanic-services">
                `;
                
                technicianServices.forEach(service => {
                    reportHTML += `
                        <div class="report-item service-report">
                            <div class="report-item-header">
                                <span class="report-item-title">${service.machineName}</span>
                                <span class="report-item-date">Serviço: ${service.serviceDate}</span>
                            </div>
                            <div class="report-item-details">
                                <strong>Tipo de Serviço:</strong> ${getServiceTypeDisplayName(service.serviceType)}<br>
                                <strong>Técnico:</strong> ${service.technician}<br>
                                <strong>Descrição:</strong> ${service.description}<br>
                                <strong>Custo:</strong> R$ ${service.cost.toFixed(2)}<br>
                                <strong>Registrado em:</strong> ${service.recordDate}
                            </div>
                        </div>
                    `;
                });
                
                reportHTML += '</div></div>';
            });
        }
        
        if (storeMachines.length === 0 && storeServices.length === 0) {
            reportHTML += '<p class="no-records">Nenhuma máquina ou serviço registrado para esta loja.</p>';
        }
        
        storeReport.innerHTML = reportHTML;
    } catch (error) {
        console.error('Error loading store report:', error);
        storeReport.innerHTML = '<p class="no-records">Erro ao carregar relatório. Tente novamente.</p>';
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
function displayServices() {
    // Check if user is still active
    if (!isUserActive()) {
        showMessage('Sessão expirada. Faça login novamente.', 'error');
        handleLogout();
        return;
    }
    
    if (!servicesList) return; // Ensure servicesList exists

    servicesList.innerHTML = '';
    
    // Fetch services from the backend
    apiRequest('/services')
        .then(data => {
            if (data && data.length > 0) {
                data.forEach(service => {
                    const serviceDiv = document.createElement('div');
                    serviceDiv.className = 'record-item service-record';
                    serviceDiv.innerHTML = `
                        <div class="record-header">
                            <span class="record-title">${service.machineCode} - ${service.machineType}</span>
                            <span class="record-date">Data do Serviço: ${service.serviceDate}</span>
                        </div>
                        <div class="record-details">
                            <strong>Código da Máquina:</strong> ${service.machineCode}<br>
                            <strong>Tipo de Máquina:</strong> ${service.machineType}<br>
                            <strong>Loja:</strong> ${getStoreDisplayName(service.store)}<br>
                            <strong>Localização:</strong> ${service.location}<br>
                            <strong>Tipo de Serviço:</strong> ${getServiceTypeDisplayName(service.serviceType)}<br>
                            <strong>Técnico:</strong> ${getTechnicianName(service.technician)}<br>
                            <strong>Descrição:</strong> ${service.description}<br>
                            <strong>Custo:</strong> R$ ${service.cost.toFixed(2)}<br>
                            <strong>Status:</strong> ${getStatusDisplayName(service.status)}<br>

                            <strong>Registrado em:</strong> ${service.recordDate}
                            ${service.notes ? `<br><strong>Observações:</strong> ${service.notes}` : ''}
                        </div>
                    `;
                    servicesList.appendChild(serviceDiv);
                });
            } else {
                servicesList.innerHTML = '<p class="no-records">Nenhum registro de serviço ainda.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching services:', error);
            servicesList.innerHTML = '<p class="no-records">Erro ao carregar serviços. Tente novamente.</p>';
        });
}

// Show success/error messages
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
        
        const response = await fetch('https://gp-maquinas-backend.onrender.com/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        console.log('Status da resposta:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
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
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userToken');
    
    showLoginScreen();
    loginForm.reset();
}

 