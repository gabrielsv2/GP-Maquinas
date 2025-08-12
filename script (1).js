// Database configuration
const DB_NAME = 'GPMachinesDB';
const DB_VERSION = 1;
let db = null;

// Store data in localStorage (fallback)
let machines = JSON.parse(localStorage.getItem('machines')) || [];
let services = JSON.parse(localStorage.getItem('services')) || [];

// User session
let currentUser = null;
let userRole = null;

// DOM elements
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const currentUserSpan = document.getElementById('currentUser');
const machineForm = document.getElementById('machineForm');
const serviceForm = document.getElementById('serviceForm');
const machineSelect = document.getElementById('machineSelect');
const storeReportSelect = document.getElementById('storeReportSelect');
const machinesList = document.getElementById('machinesList');
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

// Database functions
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('Database error:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            console.log('Database opened successfully');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create machines store
            if (!db.objectStoreNames.contains('machines')) {
                const machinesStore = db.createObjectStore('machines', { keyPath: 'id' });
                machinesStore.createIndex('store', 'store', { unique: false });
                machinesStore.createIndex('provider', 'provider', { unique: false });
                machinesStore.createIndex('type', 'type', { unique: false });
            }
            
            // Create services store
            if (!db.objectStoreNames.contains('services')) {
                const servicesStore = db.createObjectStore('services', { keyPath: 'id' });
                servicesStore.createIndex('machineId', 'machineId', { unique: false });
                servicesStore.createIndex('machineStore', 'machineStore', { unique: false });
                servicesStore.createIndex('technician', 'technician', { unique: false });
                servicesStore.createIndex('serviceType', 'serviceType', { unique: false });
            }
            
            console.log('Database structure created');
        };
    });
}

// Database operations
async function saveMachine(machine) {
    if (!db) {
        // Fallback to localStorage
        machines.push(machine);
        localStorage.setItem('machines', JSON.stringify(machines));
        return;
    }
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['machines'], 'readwrite');
        const store = transaction.objectStore('machines');
        const request = store.add(machine);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveService(service) {
    if (!db) {
        // Fallback to localStorage
        services.push(service);
        localStorage.setItem('services', JSON.stringify(services));
        return;
    }
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['services'], 'readwrite');
        const store = transaction.objectStore('services');
        const request = store.add(service);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllMachines() {
    if (!db) {
        // Fallback to localStorage
        return machines;
    }
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['machines'], 'readonly');
        const store = transaction.objectStore('machines');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllServices() {
    if (!db) {
        // Fallback to localStorage
        return services;
    }
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['services'], 'readonly');
        const store = transaction.objectStore('services');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getMachinesByStore(storeCode) {
    if (!db) {
        // Fallback to localStorage
        return machines.filter(machine => machine.store === storeCode);
    }
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['machines'], 'readonly');
        const store = transaction.objectStore('machines');
        const index = store.index('store');
        const request = index.getAll(storeCode);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getServicesByStore(storeCode) {
    if (!db) {
        // Fallback to localStorage
        return services.filter(service => service.machineStore === storeCode);
    }
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['services'], 'readonly');
        const store = transaction.objectStore('services');
        const index = store.index('machineStore');
        const request = index.getAll(storeCode);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize database
        await initDatabase();
        console.log('Database initialized successfully');
        
        // Load data from database
        machines = await getAllMachines();
        services = await getAllServices();
        
        // Check if user is already logged in
        const savedUser = localStorage.getItem('currentUser');
        const savedRole = localStorage.getItem('userRole');
        
        if (savedUser && savedRole) {
            currentUser = savedUser;
            userRole = savedRole;
            showMainApp();
        } else {
            showLoginScreen();
        }
        
        // Add event listeners
        loginForm.addEventListener('submit', handleLogin);
        logoutBtn.addEventListener('submit', handleLogout);
        logoutBtn.addEventListener('click', handleLogout);
        
        initializeNavigation();
        updateMachineSelect();
        displayMachines();
        displayServices();
        
        // Add event listener for store report selection
        storeReportSelect.addEventListener('change', function() {
            displayStoreReport(this.value);
        });
        
        console.log('Application initialized with database');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        // Continue with localStorage fallback
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
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    // Check admin login
    if (username === 'admin' && password === 'admin') {
        currentUser = 'Administrador';
        userRole = 'admin';
        localStorage.setItem('currentUser', currentUser);
        localStorage.setItem('userRole', userRole);
        showMainApp();
        showMessage('Login realizado com sucesso!', 'success');
        return;
    }
    
    // Check store login
    if (password === '123456' && storeNames[username]) {
        currentUser = storeNames[username];
        userRole = 'store';
        localStorage.setItem('currentUser', currentUser);
        localStorage.setItem('userRole', userRole);
        showMainApp();
        showMessage('Login realizado com sucesso!', 'success');
        return;
    }
    
    // Invalid login
    showMessage('Usuário ou senha incorretos!', 'error');
}

// Handle logout
function handleLogout(e) {
    e.preventDefault();
    
    currentUser = null;
    userRole = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    
    showLoginScreen();
    loginForm.reset();
}

// Filter data for store users
async function filterDataForStore(storeName) {
    try {
        // Filter machines for this store
        const storeMachines = await getMachinesByStore(storeName);
        machines = storeMachines;
        
        // Filter services for this store
        const storeServices = await getServicesByStore(storeName);
        services = storeServices;
        
        // Update displays
        updateMachineSelect();
        displayMachines();
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

// Handle machine registration form submission
machineForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(machineForm);
    const machine = {
        id: Date.now(),
        type: formData.get('machineType'),
        provider: formData.get('mechanicName'),
        serviceDate: formData.get('serviceDate'),
        store: formData.get('storeLocation'),
        location: formData.get('location'),
        registrationDate: new Date().toISOString().split('T')[0]
    };
    
    try {
        await saveMachine(machine);
        machines.push(machine);
        
        updateMachineSelect();
        displayMachines();
        machineForm.reset();
        
        showMessage('Máquina registrada com sucesso!', 'success');
    } catch (error) {
        console.error('Error saving machine:', error);
        showMessage('Erro ao salvar máquina. Tente novamente.', 'error');
    }
});

// Handle service record form submission
serviceForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(serviceForm);
    const selectedMachine = machines.find(m => m.id == formData.get('machineSelect'));
    
    const service = {
        id: Date.now(),
        machineId: formData.get('machineSelect'),
        machineName: getMachineName(formData.get('machineSelect')),
        machineStore: selectedMachine ? selectedMachine.store : 'Loja Desconhecida',
        serviceType: formData.get('serviceType'),
        serviceDate: formData.get('serviceDate'),
        technician: formData.get('technician'),
        description: formData.get('description'),
        cost: parseFloat(formData.get('cost')),
        recordDate: new Date().toISOString().split('T')[0]
    };
    
    try {
        await saveService(service);
        services.push(service);
        
        displayServices();
        serviceForm.reset();
        
        showMessage('Registro de serviço adicionado com sucesso!', 'success');
    } catch (error) {
        console.error('Error saving service:', error);
        showMessage('Erro ao salvar serviço. Tente novamente.', 'error');
    }
});

// Update machine select dropdown
function updateMachineSelect() {
    machineSelect.innerHTML = '<option value="">Selecionar uma máquina registrada</option>';
    
    machines.forEach(machine => {
        const option = document.createElement('option');
        option.value = machine.id;
        option.textContent = `${getMachineTypeDisplayName(machine.type)} - ${machine.provider || machine.mechanicName} (${machine.store})`;
        machineSelect.appendChild(option);
    });
}

// Get machine name by ID
function getMachineName(machineId) {
    const machine = machines.find(m => m.id == machineId);
    return machine ? `${getMachineTypeDisplayName(machine.type)} - ${machine.provider || machine.mechanicName}` : 'Máquina Desconhecida';
}

// Display store-specific report
async function displayStoreReport(storeCode) {
    if (!storeCode) {
        storeReport.innerHTML = '<p class="no-records">Selecione uma loja para visualizar o relatório.</p>';
        return;
    }
    
    try {
        const storeMachines = await getMachinesByStore(storeCode);
        const storeServices = await getServicesByStore(storeCode);
        
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

// Display registered machines
function displayMachines() {
    if (machines.length === 0) {
        machinesList.innerHTML = '<p class="no-records">Nenhuma máquina registrada ainda.</p>';
        return;
    }
    
    machinesList.innerHTML = '';
    
    machines.forEach(machine => {
        const machineDiv = document.createElement('div');
        machineDiv.className = 'record-item machine-record';
        machineDiv.innerHTML = `
            <div class="record-header">
                <span class="record-title">${getMachineTypeDisplayName(machine.type)}</span>
                <span class="record-date">Registrado em: ${machine.registrationDate}</span>
            </div>
            <div class="record-details">
                <strong>Loja:</strong> ${getStoreDisplayName(machine.store)}<br>
                <strong>Tipo:</strong> ${getMachineTypeDisplayName(machine.type)}<br>
                <strong>Fornecedor:</strong> ${machine.provider || machine.mechanicName}<br>
                <strong>Data do Serviço:</strong> ${machine.serviceDate}<br>
                <strong>Localização:</strong> ${machine.location}
            </div>
        `;
        machinesList.appendChild(machineDiv);
    });
}

// Display service records
function displayServices() {
    if (services.length === 0) {
        servicesList.innerHTML = '<p class="no-records">Nenhum registro de serviço ainda.</p>';
        return;
    }
    
    servicesList.innerHTML = '';
    
    services.forEach(service => {
        const serviceDiv = document.createElement('div');
        serviceDiv.className = 'record-item service-record';
        serviceDiv.innerHTML = `
            <div class="record-header">
                <span class="record-title">${service.machineName}</span>
                <span class="record-date">Data do Serviço: ${service.serviceDate}</span>
            </div>
            <div class="record-details">
                <strong>Loja:</strong> ${getStoreDisplayName(service.machineStore)}<br>
                <strong>Tipo de Serviço:</strong> ${getServiceTypeDisplayName(service.serviceType)}<br>
                <strong>Técnico:</strong> ${service.technician}<br>
                <strong>Descrição:</strong> ${service.description}<br>
                <strong>Custo:</strong> R$ ${service.cost.toFixed(2)}<br>
                <strong>Registrado em:</strong> ${service.recordDate}
            </div>
        `;
        servicesList.appendChild(serviceDiv);
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

// Add some sample data for demonstration (optional)
async function addSampleData() {
    try {
        const existingMachines = await getAllMachines();
        if (existingMachines.length === 0) {
            const sampleMachines = [
                {
                    id: Date.now(),
                    type: "elevator-1",
                    provider: "João Silva",
                    serviceDate: "2024-01-15",
                    store: "GPInterlagos",
                    location: "Setor A, Área 3",
                    registrationDate: "2024-01-15"
                },
                {
                    id: Date.now() + 1,
                    type: "compressor",
                    provider: "Maria Santos",
                    serviceDate: "2024-02-20",
                    store: "GPMorumbi",
                    location: "Setor B, Área 1",
                    registrationDate: "2024-02-20"
                }
            ];
            
            for (const machine of sampleMachines) {
                await saveMachine(machine);
            }
            
            machines = await getAllMachines();
            updateMachineSelect();
            displayMachines();
        }
    } catch (error) {
        console.error('Error adding sample data:', error);
    }
}

// Uncomment the line below to add sample data for demonstration
// addSampleData(); 