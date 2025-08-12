// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.apiBaseUrl = window.location.origin + '/api.php';
        this.sessionToken = localStorage.getItem('adminSessionToken');
        this.currentUser = null;
        this.charts = {};
        
        this.initializeEventListeners();
        this.checkAuthentication();
    }
    
    // Initialize event listeners
    initializeEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });
        
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.getAttribute('data-section'));
            });
        });
        
        // Refresh buttons
        document.getElementById('refreshStores').addEventListener('click', () => this.loadStores());
        document.getElementById('refreshMachines').addEventListener('click', () => this.loadMachines());
        document.getElementById('refreshServices').addEventListener('click', () => this.loadServices());
        document.getElementById('refreshMaintenance').addEventListener('click', () => this.loadMaintenance());
        document.getElementById('refreshFinancial').addEventListener('click', () => this.loadFinancial());
        
        // Report form
        document.getElementById('reportForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateReport();
        });
        
        // Filter change events
        this.setupFilterEvents();
    }
    
    // Setup filter event listeners
    setupFilterEvents() {
        // Store filters
        document.getElementById('storeRegionFilter').addEventListener('change', () => this.loadStores());
        document.getElementById('storeStatusFilter').addEventListener('change', () => this.loadStores());
        
        // Machine filters
        document.getElementById('machineStoreFilter').addEventListener('change', () => this.loadMachines());
        document.getElementById('machineTypeFilter').addEventListener('change', () => this.loadMachines());
        document.getElementById('machineStatusFilter').addEventListener('change', () => this.loadMachines());
        
        // Service filters
        document.getElementById('serviceStoreFilter').addEventListener('change', () => this.loadServices());
        document.getElementById('serviceDateStart').addEventListener('change', () => this.loadServices());
        document.getElementById('serviceDateEnd').addEventListener('change', () => this.loadServices());
        document.getElementById('serviceTechnicianFilter').addEventListener('change', () => this.loadServices());
        
        // Maintenance filters
        document.getElementById('maintenanceStoreFilter').addEventListener('change', () => this.loadMaintenance());
        document.getElementById('maintenanceDaysAhead').addEventListener('change', () => this.loadMaintenance());
        
        // Financial filters
        document.getElementById('financialStoreFilter').addEventListener('change', () => this.loadFinancial());
        document.getElementById('financialDateStart').addEventListener('change', () => this.loadFinancial());
        document.getElementById('financialDateEnd').addEventListener('change', () => this.loadFinancial());
    }
    
    // Check authentication status
    async checkAuthentication() {
        if (this.sessionToken) {
            try {
                const response = await this.apiCall('GET', 'dashboard');
                if (response.success) {
                    this.currentUser = response.data;
                    this.showDashboard();
                    this.loadDashboardData();
                } else {
                    this.showLogin();
                }
            } catch (error) {
                console.error('Authentication check failed:', error);
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
    }
    
    // Handle login
    async handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!username || !password) {
            this.showNotification('Por favor, preencha todos os campos', 'error');
            return;
        }
        
        this.showLoading();
        
        try {
            const response = await this.apiCall('POST', 'login', {
                username: username,
                password: password
            });
            
            if (response.success) {
                this.sessionToken = response.data.session_id;
                this.currentUser = response.data.user;
                localStorage.setItem('adminSessionToken', this.sessionToken);
                
                this.showDashboard();
                this.loadDashboardData();
                this.showNotification('Login realizado com sucesso!', 'success');
            } else {
                this.showNotification('Credenciais inválidas', 'error');
            }
        } catch (error) {
            console.error('Login failed:', error);
            this.showNotification('Erro ao fazer login', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    // Handle logout
    async handleLogout() {
        try {
            await this.apiCall('POST', 'logout');
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        this.sessionToken = null;
        this.currentUser = null;
        localStorage.removeItem('adminSessionToken');
        this.showLogin();
        this.showNotification('Logout realizado com sucesso', 'success');
    }
    
    // Show login screen
    showLogin() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainDashboard').style.display = 'none';
    }
    
    // Show dashboard
    showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainDashboard').style.display = 'block';
        
        if (this.currentUser) {
            document.getElementById('currentUser').textContent = `Usuário: ${this.currentUser.full_name}`;
        }
    }
    
    // Switch between sections
    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        
        // Update content
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`).classList.add('active');
        
        // Load section data
        switch (sectionName) {
            case 'overview':
                this.loadDashboardData();
                break;
            case 'stores':
                this.loadStores();
                break;
            case 'machines':
                this.loadMachines();
                break;
            case 'services':
                this.loadServices();
                break;
            case 'maintenance':
                this.loadMaintenance();
                break;
            case 'financial':
                this.loadFinancial();
                break;
            case 'reports':
                this.loadReports();
                break;
        }
    }
    
    // Load dashboard overview data
    async loadDashboardData() {
        try {
            const response = await this.apiCall('GET', 'dashboard');
            if (response.success) {
                this.updateDashboardStats(response.data);
                this.updateCharts(response.data);
                this.updateActivities(response.data.recent_activities);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showNotification('Erro ao carregar dados do dashboard', 'error');
        }
    }
    
    // Update dashboard statistics
    updateDashboardStats(data) {
        document.getElementById('totalStores').textContent = data.total_stores || 0;
        document.getElementById('totalMachines').textContent = data.total_machines || 0;
        document.getElementById('servicesThisMonth').textContent = data.services_this_month || 0;
        document.getElementById('costThisMonth').textContent = `R$ ${(data.cost_this_month || 0).toFixed(2)}`;
        document.getElementById('urgentMaintenance').textContent = data.urgent_maintenance || 0;
        document.getElementById('machinesInMaintenance').textContent = data.machines_in_maintenance || 0;
    }
    
    // Update charts
    updateCharts(data) {
        this.updateStoresChart(data);
        this.updateServicesChart(data);
    }
    
    // Update stores chart
    updateStoresChart(data) {
        const ctx = document.getElementById('storesChart');
        if (!ctx) return;
        
        if (this.charts.stores) {
            this.charts.stores.destroy();
        }
        
        // Sample data - replace with actual data from API
        this.charts.stores = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['GP Interlagos', 'GP Morumbi', 'GP Osasco', 'Outras'],
                datasets: [{
                    data: [30, 25, 20, 25],
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#f5576c'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Update services chart
    updateServicesChart(data) {
        const ctx = document.getElementById('servicesChart');
        if (!ctx) return;
        
        if (this.charts.services) {
            this.charts.services.destroy();
        }
        
        // Sample data - replace with actual data from API
        this.charts.services = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Serviços Realizados',
                    data: [65, 59, 80, 81, 56, 55],
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Update recent activities
    updateActivities(activities) {
        const container = document.getElementById('activitiesList');
        if (!activities || activities.length === 0) {
            container.innerHTML = '<p class="loading">Nenhuma atividade recente</p>';
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-info">
                    <div class="activity-title">${activity.description}</div>
                    <div class="activity-meta">${activity.location}</div>
                </div>
                <div class="activity-date">${this.formatDate(activity.date)}</div>
            </div>
        `).join('');
    }
    
    // Load stores
    async loadStores() {
        try {
            const response = await this.apiCall('GET', 'store-summary');
            if (response.success) {
                this.displayStores(response.data);
            }
        } catch (error) {
            console.error('Failed to load stores:', error);
            this.showNotification('Erro ao carregar lojas', 'error');
        }
    }
    
    // Display stores
    displayStores(stores) {
        const container = document.getElementById('storesList');
        
        if (!stores || stores.length === 0) {
            container.innerHTML = '<p class="loading">Nenhuma loja encontrada</p>';
            return;
        }
        
        container.innerHTML = stores.map(store => `
            <div class="store-card">
                <div class="store-header">
                    <div class="store-name">${store.store_name}</div>
                    <div class="store-region">${store.region}</div>
                </div>
                <div class="store-stats">
                    <div class="stat-item">
                        <div class="stat-value">${store.total_machines}</div>
                        <div class="stat-label">Máquinas</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${store.total_services}</div>
                        <div class="stat-label">Serviços</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">R$ ${(store.total_service_cost || 0).toFixed(2)}</div>
                        <div class="stat-label">Custo Total</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${store.active_machines}</div>
                        <div class="stat-label">Ativas</div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Load machines
    async loadMachines() {
        try {
            const storeFilter = document.getElementById('machineStoreFilter').value;
            const typeFilter = document.getElementById('machineTypeFilter').value;
            const statusFilter = document.getElementById('machineStatusFilter').value;
            
            let url = 'machines';
            const params = new URLSearchParams();
            
            if (storeFilter) params.append('store_id', storeFilter);
            if (statusFilter) params.append('status', statusFilter);
            
            if (params.toString()) {
                url += '?' + params.toString();
            }
            
            const response = await this.apiCall('GET', url);
            if (response.success) {
                this.displayMachines(response.data);
            }
        } catch (error) {
            console.error('Failed to load machines:', error);
            this.showNotification('Erro ao carregar máquinas', 'error');
        }
    }
    
    // Display machines
    displayMachines(machines) {
        const container = document.getElementById('machinesList');
        
        if (!machines || machines.length === 0) {
            container.innerHTML = '<p class="loading">Nenhuma máquina encontrada</p>';
            return;
        }
        
        container.innerHTML = machines.map(machine => `
            <div class="machine-card">
                <div class="machine-header">
                    <div class="machine-type">${machine.machine_type}</div>
                    <div class="machine-status ${machine.status}">${this.getStatusText(machine.status)}</div>
                </div>
                <div class="machine-details">
                    <div class="machine-detail">
                        <strong>Loja:</strong> ${machine.store_name}
                    </div>
                    <div class="machine-detail">
                        <strong>Fornecedor:</strong> ${machine.provider_name}
                    </div>
                    <div class="machine-detail">
                        <strong>Localização:</strong> ${machine.location}
                    </div>
                    <div class="machine-detail">
                        <strong>Próxima Manutenção:</strong> ${machine.next_maintenance_date ? this.formatDate(machine.next_maintenance_date) : 'Não agendada'}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Load services
    async loadServices() {
        try {
            const storeFilter = document.getElementById('serviceStoreFilter').value;
            const dateStart = document.getElementById('serviceDateStart').value;
            const dateEnd = document.getElementById('serviceDateEnd').value;
            const technicianFilter = document.getElementById('serviceTechnicianFilter').value;
            
            let url = 'services';
            const params = new URLSearchParams();
            
            if (storeFilter) params.append('store_id', storeFilter);
            if (dateStart) params.append('start_date', dateStart);
            if (dateEnd) params.append('end_date', dateEnd);
            if (technicianFilter) params.append('technician_id', technicianFilter);
            
            if (params.toString()) {
                url += '?' + params.toString();
            }
            
            const response = await this.apiCall('GET', url);
            if (response.success) {
                this.displayServices(response.data);
            }
        } catch (error) {
            console.error('Failed to load services:', error);
            this.showNotification('Erro ao carregar serviços', 'error');
        }
    }
    
    // Display services
    displayServices(services) {
        const container = document.getElementById('servicesList');
        
        if (!services || services.length === 0) {
            container.innerHTML = '<p class="loading">Nenhum serviço encontrado</p>';
            return;
        }
        
        container.innerHTML = services.map(service => `
            <div class="service-item">
                <div class="service-info">
                    <div class="service-title">${service.machine_type}</div>
                    <div class="service-meta">${service.store_name} - ${service.technician_name}</div>
                </div>
                <div class="service-cost">R$ ${service.cost.toFixed(2)}</div>
                <div class="service-date">${this.formatDate(service.service_date)}</div>
                <div class="service-status ${service.status}">${this.getServiceStatusText(service.status)}</div>
            </div>
        `).join('');
    }
    
    // Load maintenance schedule
    async loadMaintenance() {
        try {
            const storeFilter = document.getElementById('maintenanceStoreFilter').value;
            const daysAhead = document.getElementById('maintenanceDaysAhead').value;
            
            let url = 'maintenance-schedule';
            const params = new URLSearchParams();
            
            if (storeFilter) params.append('store_id', storeFilter);
            params.append('days_ahead', daysAhead);
            
            if (params.toString()) {
                url += '?' + params.toString();
            }
            
            const response = await this.apiCall('GET', url);
            if (response.success) {
                this.displayMaintenance(response.data);
            }
        } catch (error) {
            console.error('Failed to load maintenance:', error);
            this.showNotification('Erro ao carregar manutenções', 'error');
        }
    }
    
    // Display maintenance schedule
    displayMaintenance(maintenance) {
        const urgent = maintenance.filter(m => m.days_until_maintenance <= 7);
        const upcoming = maintenance.filter(m => m.days_until_maintenance > 7 && m.days_until_maintenance <= 30);
        const scheduled = maintenance.filter(m => m.days_until_maintenance > 30);
        
        this.displayMaintenanceList('urgentMaintenanceList', urgent, 'urgent');
        this.displayMaintenanceList('upcomingMaintenanceList', upcoming, 'upcoming');
        this.displayMaintenanceList('scheduledMaintenanceList', scheduled, 'scheduled');
    }
    
    // Display maintenance list
    displayMaintenanceList(containerId, items, priority) {
        const container = document.getElementById(containerId);
        
        if (!items || items.length === 0) {
            container.innerHTML = '<p class="loading">Nenhuma manutenção encontrada</p>';
            return;
        }
        
        container.innerHTML = items.map(item => `
            <div class="maintenance-item">
                <div class="maintenance-title">${item.machine_type}</div>
                <div class="maintenance-meta">${item.store_name} - ${item.location}</div>
                <div class="maintenance-date">
                    ${item.next_maintenance_date} (${item.days_until_maintenance} dias)
                </div>
            </div>
        `).join('');
    }
    
    // Load financial data
    async loadFinancial() {
        try {
            const storeFilter = document.getElementById('financialStoreFilter').value;
            const dateStart = document.getElementById('financialDateStart').value;
            const dateEnd = document.getElementById('financialDateEnd').value;
            
            let url = 'financial-summary';
            const params = new URLSearchParams();
            
            if (storeFilter) params.append('store_id', storeFilter);
            if (dateStart) params.append('start_date', dateStart);
            if (dateEnd) params.append('end_date', dateEnd);
            
            if (params.toString()) {
                url += '?' + params.toString();
            }
            
            const response = await this.apiCall('GET', url);
            if (response.success) {
                this.displayFinancial(response.data);
            }
        } catch (error) {
            console.error('Failed to load financial data:', error);
            this.showNotification('Erro ao carregar dados financeiros', 'error');
        }
    }
    
    // Display financial data
    displayFinancial(data) {
        this.displayFinancialSummary(data);
        this.updateFinancialChart(data);
    }
    
    // Display financial summary
    displayFinancialSummary(data) {
        const container = document.getElementById('financialSummary');
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="loading">Nenhum dado financeiro encontrado</p>';
            return;
        }
        
        const totalCost = data.reduce((sum, item) => sum + (item.total_cost || 0), 0);
        const totalServices = data.reduce((sum, item) => sum + (item.total_services || 0), 0);
        const avgCost = totalServices > 0 ? totalCost / totalServices : 0;
        
        container.innerHTML = `
            <div class="financial-item">
                <span class="financial-label">Custo Total:</span>
                <span class="financial-value">R$ ${totalCost.toFixed(2)}</span>
            </div>
            <div class="financial-item">
                <span class="financial-label">Total de Serviços:</span>
                <span class="financial-value">${totalServices}</span>
            </div>
            <div class="financial-item">
                <span class="financial-label">Custo Médio:</span>
                <span class="financial-value">R$ ${avgCost.toFixed(2)}</span>
            </div>
            <div class="financial-item">
                <span class="financial-label">Lojas Ativas:</span>
                <span class="financial-value">${data.length}</span>
            </div>
        `;
    }
    
    // Update financial chart
    updateFinancialChart(data) {
        const ctx = document.getElementById('financialChart');
        if (!ctx) return;
        
        if (this.charts.financial) {
            this.charts.financial.destroy();
        }
        
        const labels = data.map(item => item.store_name);
        const costs = data.map(item => item.total_cost || 0);
        
        this.charts.financial = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Custo por Loja',
                    data: costs,
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Load reports
    async loadReports() {
        try {
            const response = await this.apiCall('GET', 'reports');
            if (response.success) {
                this.displayReports(response.data);
            }
        } catch (error) {
            console.error('Failed to load reports:', error);
            this.showNotification('Erro ao carregar relatórios', 'error');
        }
    }
    
    // Display reports
    displayReports(reports) {
        const container = document.getElementById('reportsHistory');
        
        if (!reports || reports.length === 0) {
            container.innerHTML = '<p class="loading">Nenhum relatório encontrado</p>';
            return;
        }
        
        container.innerHTML = reports.map(report => `
            <div class="report-item">
                <div class="report-title">${this.getReportTypeText(report.report_type)}</div>
                <div class="report-meta">
                    ${report.store_id ? `Loja: ${report.store_id}` : 'Todas as Lojas'} | 
                    ${this.formatDate(report.report_date)}
                </div>
            </div>
        `).join('');
    }
    
    // Generate report
    async generateReport() {
        const formData = new FormData(document.getElementById('reportForm'));
        const reportData = {
            report_type: formData.get('reportType'),
            store_id: formData.get('reportStore') || null,
            start_date: formData.get('reportStartDate'),
            end_date: formData.get('reportEndDate')
        };
        
        if (!reportData.report_type || !reportData.start_date || !reportData.end_date) {
            this.showNotification('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }
        
        this.showLoading();
        
        try {
            const response = await this.apiCall('POST', 'reports', reportData);
            if (response.success) {
                this.showNotification('Relatório gerado com sucesso!', 'success');
                this.loadReports();
                document.getElementById('reportForm').reset();
            }
        } catch (error) {
            console.error('Failed to generate report:', error);
            this.showNotification('Erro ao gerar relatório', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    // API call helper
    async apiCall(method, endpoint, data = null) {
        const url = `${this.apiBaseUrl}/${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (this.sessionToken) {
            options.headers['Authorization'] = `Bearer ${this.sessionToken}`;
        }
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'API request failed');
        }
        
        return result;
    }
    
    // Utility functions
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }
    
    getStatusText(status) {
        const statusMap = {
            'active': 'Ativa',
            'maintenance': 'Em Manutenção',
            'broken': 'Quebrada',
            'inactive': 'Inativa'
        };
        return statusMap[status] || status;
    }
    
    getServiceStatusText(status) {
        const statusMap = {
            'completed': 'Concluído',
            'pending': 'Pendente',
            'in_progress': 'Em Andamento',
            'cancelled': 'Cancelado'
        };
        return statusMap[status] || status;
    }
    
    getReportTypeText(type) {
        const typeMap = {
            'store_summary': 'Resumo por Loja',
            'financial_summary': 'Resumo Financeiro',
            'maintenance_schedule': 'Cronograma de Manutenção',
            'service_summary': 'Resumo de Serviços'
        };
        return typeMap[type] || type;
    }
    
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});
