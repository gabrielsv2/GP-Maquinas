-- GP Máquinas e Serviços - Database Schema
-- Sistema de Gerenciamento de Máquinas de Oficina
-- Enhanced for Multi-Device Administrator Access

-- Create database
CREATE DATABASE IF NOT EXISTS gp_maquinas_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE gp_maquinas_db;

-- Stores table (Lojas)
CREATE TABLE stores (
    store_id VARCHAR(20) PRIMARY KEY,
    store_name VARCHAR(100) NOT NULL,
    store_code VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    manager VARCHAR(100),
    region VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Machine types table
CREATE TABLE machine_types (
    type_id VARCHAR(30) PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    description TEXT,
    maintenance_interval_days INT DEFAULT 365,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Providers table (Fornecedores)
CREATE TABLE providers (
    provider_id INT AUTO_INCREMENT PRIMARY KEY,
    provider_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    cnpj VARCHAR(18),
    service_areas TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Technicians table (Técnicos)
CREATE TABLE technicians (
    technician_id INT AUTO_INCREMENT PRIMARY KEY,
    technician_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    specialization VARCHAR(100),
    certification VARCHAR(100),
    hourly_rate DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Machines table
CREATE TABLE machines (
    machine_id BIGINT PRIMARY KEY,
    type_id VARCHAR(30) NOT NULL,
    provider_id INT NOT NULL,
    store_id VARCHAR(20) NOT NULL,
    location VARCHAR(200) NOT NULL,
    service_date DATE NOT NULL,
    registration_date DATE NOT NULL,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    status ENUM('active', 'inactive', 'maintenance', 'retired', 'broken') DEFAULT 'active',
    notes TEXT,
    serial_number VARCHAR(100),
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (type_id) REFERENCES machine_types(type_id) ON DELETE RESTRICT,
    FOREIGN KEY (provider_id) REFERENCES providers(provider_id) ON DELETE RESTRICT,
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE RESTRICT,
    
    INDEX idx_store (store_id),
    INDEX idx_provider (provider_id),
    INDEX idx_type (type_id),
    INDEX idx_service_date (service_date),
    INDEX idx_registration_date (registration_date),
    INDEX idx_status (status),
    INDEX idx_next_maintenance (next_maintenance_date)
);

-- Service types table
CREATE TABLE service_types (
    service_type_id VARCHAR(30) PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    description TEXT,
    estimated_cost DECIMAL(10,2),
    estimated_duration_hours INT,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE services (
    service_id BIGINT PRIMARY KEY,
    machine_id BIGINT NOT NULL,
    service_type_id VARCHAR(30) NOT NULL,
    technician_id INT NOT NULL,
    service_date DATE NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    record_date DATE NOT NULL,
    status ENUM('completed', 'pending', 'cancelled', 'in_progress') DEFAULT 'completed',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    estimated_duration_hours INT,
    actual_duration_hours INT,
    parts_used TEXT,
    warranty_until DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (machine_id) REFERENCES machines(machine_id) ON DELETE CASCADE,
    FOREIGN KEY (service_type_id) REFERENCES service_types(service_type_id) ON DELETE RESTRICT,
    FOREIGN KEY (technician_id) REFERENCES technicians(technician_id) ON DELETE RESTRICT,
    
    INDEX idx_machine (machine_id),
    INDEX idx_technician (technician_id),
    INDEX idx_service_type (service_type_id),
    INDEX idx_service_date (service_date),
    INDEX idx_record_date (record_date),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
);

-- Users table (for authentication)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_role ENUM('admin', 'store_manager', 'technician', 'viewer') NOT NULL,
    store_id VARCHAR(20),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    login_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE SET NULL,
    
    INDEX idx_username (username),
    INDEX idx_role (user_role),
    INDEX idx_store (store_id),
    INDEX idx_email (email)
);

-- User sessions table (for multi-device access)
CREATE TABLE user_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL,
    device_info TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at)
);

-- Reports table (for storing generated reports)
CREATE TABLE reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    report_type ENUM('store_summary', 'provider_summary', 'technician_summary', 'machine_summary', 'service_summary', 'financial_summary', 'maintenance_schedule', 'performance_analysis') NOT NULL,
    store_id VARCHAR(20),
    provider_id INT,
    technician_id INT,
    report_date DATE NOT NULL,
    report_period_start DATE,
    report_period_end DATE,
    report_data JSON,
    generated_by INT,
    report_format ENUM('json', 'pdf', 'excel', 'html') DEFAULT 'json',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE SET NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(provider_id) ON DELETE SET NULL,
    FOREIGN KEY (technician_id) REFERENCES technicians(technician_id) ON DELETE SET NULL,
    FOREIGN KEY (generated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    
    INDEX idx_report_type (report_type),
    INDEX idx_store (store_id),
    INDEX idx_report_date (report_date),
    INDEX idx_generated_by (generated_by)
);

-- Audit log table (for tracking changes)
CREATE TABLE audit_log (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(100),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_table_name (table_name),
    INDEX idx_created_at (created_at)
);

-- Notifications table (for system notifications)
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    related_table VARCHAR(50),
    related_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
);

-- Dashboard widgets table (for customizable dashboards)
CREATE TABLE dashboard_widgets (
    widget_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    widget_type VARCHAR(50) NOT NULL,
    widget_config JSON,
    position_x INT DEFAULT 0,
    position_y INT DEFAULT 0,
    width INT DEFAULT 300,
    height INT DEFAULT 200,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_widget_type (widget_type)
);

-- Insert default data

-- Insert stores
INSERT INTO stores (store_id, store_name, store_code, region) VALUES
('GPAnhaiaMello', 'GP Anhaia Mello', 'GPAnhaiaMello', 'São Paulo'),
('GPAricanduva', 'GP Aricanduva', 'GPAricanduva', 'São Paulo'),
('GPCampoLimpo', 'GP Campo Limpo', 'GPCampoLimpo', 'São Paulo'),
('GPCarrão', 'GP Carrão', 'GPCarrão', 'São Paulo'),
('GPCidadeDutra', 'GP Cidade Dutra', 'GPCidadeDutra', 'São Paulo'),
('GPCotia', 'GP Cotia', 'GPCotia', 'São Paulo'),
('GPCruzeirodoSul', 'GP Cruzeiro do Sul', 'GPCruzeirodoSul', 'São Paulo'),
('GPDemarchi', 'GP Demarchi', 'GPDemarchi', 'São Paulo'),
('GPEdgarFacó', 'GP Edgar Facó', 'GPEdgarFacó', 'São Paulo'),
('GPGuarulhos', 'GP Guarulhos', 'GPGuarulhos', 'São Paulo'),
('GPInterlagos', 'GP Interlagos', 'GPInterlagos', 'São Paulo'),
('GPJabaquara', 'GP Jabaquara', 'GPJabaquara', 'São Paulo'),
('GPJundiai', 'GP Jundiaí', 'GPJundiai', 'São Paulo'),
('GPLapa', 'GP Lapa', 'GPLapa', 'São Paulo'),
('GPLimão', 'GP Limão', 'GPLimão', 'São Paulo'),
('GPMboiMirim', 'GP M\'Boi Mirim', 'GPMboiMirim', 'São Paulo'),
('GPMogi', 'GP Mogi', 'GPMogi', 'São Paulo'),
('GPMorumbi', 'GP Morumbi', 'GPMorumbi', 'São Paulo'),
('GPOsasco', 'GP Osasco', 'GPOsasco', 'São Paulo'),
('GPRaguebChohfi', 'GP Ragueb Chohfi', 'GPRaguebChohfi', 'São Paulo'),
('GPRibeirãoPreto', 'GP Ribeirão Preto', 'GPRibeirãoPreto', 'São Paulo'),
('GPRicardoJafet', 'GP Ricardo Jafet', 'GPRicardoJafet', 'São Paulo'),
('GPSantoAndré', 'GP Santo André', 'GPSantoAndré', 'São Paulo'),
('GPTaboão', 'GP Taboão', 'GPTaboão', 'São Paulo');

-- Insert machine types
INSERT INTO machine_types (type_id, type_name, category, maintenance_interval_days) VALUES
('elevator-1', 'Elevador 1', 'Elevadores', 180),
('elevator-2', 'Elevador 2', 'Elevadores', 180),
('elevator-3', 'Elevador 3', 'Elevadores', 180),
('elevator-4', 'Elevador 4', 'Elevadores', 180),
('elevator-5', 'Elevador 5', 'Elevadores', 180),
('assembler-1', 'Montador 1', 'Montadores', 365),
('assembler-2', 'Montador 2', 'Montadores', 365),
('compressor', 'Compressor', 'Equipamentos', 90),
('aligner', 'Alinhador', 'Equipamentos', 120),
('air-tube', 'Tubo de Ar', 'Equipamentos', 60),
('torno', 'Torno', 'Ferramentas', 365),
('fresadora', 'Fresadora', 'Ferramentas', 365),
('furadeira', 'Furadeira', 'Ferramentas', 365),
('retifica', 'Retífica', 'Ferramentas', 365),
('serra', 'Serra', 'Ferramentas', 365),
('outros', 'Outros', 'Diversos', 365);

-- Insert service types
INSERT INTO service_types (service_type_id, service_name, description, estimated_cost, estimated_duration_hours, category) VALUES
('belt-replacement', 'Substituição de Correia', 'Substituição de correias em máquinas', 150.00, 2, 'Manutenção Preventiva'),
('engine-replacement', 'Substituição de Motor', 'Substituição de motores em equipamentos', 800.00, 8, 'Manutenção Corretiva'),
('flat-replacement', 'Substituição de Pneu', 'Substituição de pneus em elevadores', 200.00, 1, 'Manutenção Preventiva'),
('tube-air-replacement', 'Substituição de Tubo/Ar', 'Substituição de tubos de ar', 100.00, 1, 'Manutenção Preventiva'),
('repair', 'Reparo', 'Reparo geral de equipamentos', 300.00, 4, 'Manutenção Corretiva'),
('preventive-maintenance', 'Manutenção Preventiva', 'Manutenção preventiva programada', 250.00, 3, 'Manutenção Preventiva'),
('calibration', 'Calibração', 'Calibração de equipamentos', 180.00, 2, 'Manutenção Preventiva'),
('inspection', 'Inspeção', 'Inspeção técnica de equipamentos', 120.00, 1, 'Inspeção'),
('other', 'Outros', 'Outros tipos de serviços', 200.00, 2, 'Diversos');

-- Insert default admin user
INSERT INTO users (username, password_hash, user_role, full_name, email, permissions) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Administrador do Sistema', 'admin@gpmaquinas.com', '{"all_stores": true, "all_reports": true, "user_management": true, "system_config": true}');

-- Create views for common reports

-- View for store summary reports
CREATE VIEW store_summary_view AS
SELECT 
    s.store_id,
    s.store_name,
    s.region,
    COUNT(DISTINCT m.machine_id) as total_machines,
    COUNT(DISTINCT sv.service_id) as total_services,
    SUM(sv.cost) as total_service_cost,
    COUNT(DISTINCT m.provider_id) as total_providers,
    COUNT(DISTINCT sv.technician_id) as total_technicians,
    MAX(sv.service_date) as last_service_date,
    COUNT(CASE WHEN m.status = 'active' THEN 1 END) as active_machines,
    COUNT(CASE WHEN m.status = 'maintenance' THEN 1 END) as machines_in_maintenance,
    COUNT(CASE WHEN m.status = 'broken' THEN 1 END) as broken_machines
FROM stores s
LEFT JOIN machines m ON s.store_id = m.store_id
LEFT JOIN services sv ON m.machine_id = sv.machine_id
WHERE s.is_active = TRUE
GROUP BY s.store_id, s.store_name, s.region;

-- View for provider summary reports
CREATE VIEW provider_summary_view AS
SELECT 
    p.provider_id,
    p.provider_name,
    p.service_areas,
    COUNT(DISTINCT m.machine_id) as total_machines,
    COUNT(DISTINCT sv.service_id) as total_services,
    SUM(sv.cost) as total_service_cost,
    COUNT(DISTINCT m.store_id) as stores_served,
    MAX(sv.service_date) as last_service_date,
    AVG(sv.cost) as average_service_cost,
    COUNT(CASE WHEN sv.status = 'completed' THEN 1 END) as completed_services,
    COUNT(CASE WHEN sv.status = 'pending' THEN 1 END) as pending_services
FROM providers p
LEFT JOIN machines m ON p.provider_id = m.provider_id
LEFT JOIN services sv ON m.machine_id = sv.machine_id
WHERE p.is_active = TRUE
GROUP BY p.provider_id, p.provider_name, p.service_areas;

-- View for technician summary reports
CREATE VIEW technician_summary_view AS
SELECT 
    t.technician_id,
    t.technician_name,
    t.specialization,
    t.hourly_rate,
    COUNT(sv.service_id) as total_services,
    SUM(sv.cost) as total_service_cost,
    COUNT(DISTINCT sv.machine_id) as machines_serviced,
    COUNT(DISTINCT m.store_id) as stores_served,
    MAX(sv.service_date) as last_service_date,
    AVG(sv.actual_duration_hours) as average_duration,
    COUNT(CASE WHEN sv.status = 'completed' THEN 1 END) as completed_services,
    COUNT(CASE WHEN sv.priority = 'urgent' THEN 1 END) as urgent_services
FROM technicians t
LEFT JOIN services sv ON t.technician_id = sv.technician_id
LEFT JOIN machines m ON sv.machine_id = m.machine_id
WHERE t.is_active = TRUE
GROUP BY t.technician_id, t.technician_name, t.specialization, t.hourly_rate;

-- View for machine details with latest service
CREATE VIEW machine_details_view AS
SELECT 
    m.machine_id,
    mt.type_name as machine_type,
    mt.category,
    p.provider_name,
    s.store_name,
    s.region,
    m.location,
    m.service_date,
    m.registration_date,
    m.last_maintenance_date,
    m.next_maintenance_date,
    m.status,
    m.serial_number,
    m.model,
    m.manufacturer,
    sv.service_id as last_service_id,
    sv.service_date as last_service_date,
    sv.cost as last_service_cost,
    sv.status as last_service_status,
    t.technician_name as last_technician,
    DATEDIFF(m.next_maintenance_date, CURDATE()) as days_until_maintenance
FROM machines m
JOIN machine_types mt ON m.type_id = mt.type_id
JOIN providers p ON m.provider_id = p.provider_id
JOIN stores s ON m.store_id = s.store_id
LEFT JOIN (
    SELECT 
        machine_id,
        service_id,
        service_date,
        cost,
        status,
        technician_id,
        ROW_NUMBER() OVER (PARTITION BY machine_id ORDER BY service_date DESC) as rn
    FROM services
) sv ON m.machine_id = sv.machine_id AND sv.rn = 1
LEFT JOIN technicians t ON sv.technician_id = t.technician_id;

-- View for maintenance schedule
CREATE VIEW maintenance_schedule_view AS
SELECT 
    m.machine_id,
    mt.type_name as machine_type,
    s.store_name,
    m.location,
    m.next_maintenance_date,
    DATEDIFF(m.next_maintenance_date, CURDATE()) as days_until_maintenance,
    CASE 
        WHEN DATEDIFF(m.next_maintenance_date, CURDATE()) <= 7 THEN 'Urgente'
        WHEN DATEDIFF(m.next_maintenance_date, CURDATE()) <= 30 THEN 'Próximo'
        ELSE 'Programado'
    END as priority,
    p.provider_name
FROM machines m
JOIN machine_types mt ON m.type_id = mt.type_id
JOIN stores s ON m.store_id = s.store_id
JOIN providers p ON m.provider_id = p.provider_id
WHERE m.status IN ('active', 'maintenance')
AND m.next_maintenance_date IS NOT NULL
ORDER BY m.next_maintenance_date ASC;

-- View for financial summary
CREATE VIEW financial_summary_view AS
SELECT 
    YEAR(sv.service_date) as year,
    MONTH(sv.service_date) as month,
    s.store_name,
    s.region,
    COUNT(sv.service_id) as total_services,
    SUM(sv.cost) as total_cost,
    AVG(sv.cost) as average_cost,
    MIN(sv.cost) as min_cost,
    MAX(sv.cost) as max_cost,
    COUNT(DISTINCT sv.technician_id) as technicians_used,
    COUNT(DISTINCT sv.service_type_id) as service_types_used
FROM stores s
LEFT JOIN machines m ON s.store_id = m.store_id
LEFT JOIN services sv ON m.machine_id = sv.machine_id
WHERE sv.service_date IS NOT NULL
GROUP BY YEAR(sv.service_date), MONTH(sv.service_date), s.store_id, s.store_name, s.region
ORDER BY year DESC, month DESC;

-- Stored procedures for common operations

-- Procedure to generate store report
DELIMITER //
CREATE PROCEDURE GenerateStoreReport(
    IN p_store_id VARCHAR(20),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_user_id INT
)
BEGIN
    DECLARE report_data JSON;
    DECLARE report_id INT;
    
    -- Get store summary data
    SELECT JSON_OBJECT(
        'store_info', JSON_OBJECT(
            'store_id', s.store_id,
            'store_name', s.store_name,
            'region', s.region
        ),
        'machines', JSON_ARRAYAGG(
            JSON_OBJECT(
                'machine_id', m.machine_id,
                'type_name', mt.type_name,
                'category', mt.category,
                'provider_name', p.provider_name,
                'location', m.location,
                'service_date', m.service_date,
                'status', m.status,
                'next_maintenance_date', m.next_maintenance_date
            )
        ),
        'services', JSON_ARRAYAGG(
            JSON_OBJECT(
                'service_id', sv.service_id,
                'service_type', st.service_name,
                'technician_name', t.technician_name,
                'service_date', sv.service_date,
                'cost', sv.cost,
                'description', sv.description,
                'status', sv.status,
                'priority', sv.priority
            )
        ),
        'summary', JSON_OBJECT(
            'total_machines', COUNT(DISTINCT m.machine_id),
            'total_services', COUNT(DISTINCT sv.service_id),
            'total_cost', COALESCE(SUM(sv.cost), 0),
            'total_providers', COUNT(DISTINCT m.provider_id),
            'total_technicians', COUNT(DISTINCT sv.technician_id),
            'active_machines', COUNT(CASE WHEN m.status = 'active' THEN 1 END),
            'machines_in_maintenance', COUNT(CASE WHEN m.status = 'maintenance' THEN 1 END)
        )
    ) INTO report_data
    FROM stores s
    LEFT JOIN machines m ON s.store_id = m.store_id
    LEFT JOIN machine_types mt ON m.type_id = mt.type_id
    LEFT JOIN providers p ON m.provider_id = p.provider_id
    LEFT JOIN services sv ON m.machine_id = sv.machine_id
    LEFT JOIN service_types st ON sv.service_type_id = st.service_type_id
    LEFT JOIN technicians t ON sv.technician_id = t.technician_id
    WHERE s.store_id = p_store_id
    AND (sv.service_date IS NULL OR (sv.service_date BETWEEN p_start_date AND p_end_date));
    
    -- Insert report record
    INSERT INTO reports (report_type, store_id, report_date, report_period_start, report_period_end, report_data, generated_by)
    VALUES ('store_summary', p_store_id, CURDATE(), p_start_date, p_end_date, report_data, p_user_id);
    
    SET report_id = LAST_INSERT_ID();
    
    SELECT report_id, report_data as report_result;
END //
DELIMITER ;

-- Procedure to get financial summary
DELIMITER //
CREATE PROCEDURE GetFinancialSummary(
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_store_id VARCHAR(20)
)
BEGIN
    IF p_store_id IS NULL THEN
        -- All stores
        SELECT 
            s.store_name,
            s.region,
            COUNT(DISTINCT sv.service_id) as total_services,
            SUM(sv.cost) as total_cost,
            AVG(sv.cost) as average_cost,
            MIN(sv.cost) as min_cost,
            MAX(sv.cost) as max_cost,
            COUNT(DISTINCT sv.technician_id) as technicians_used
        FROM stores s
        LEFT JOIN machines m ON s.store_id = m.store_id
        LEFT JOIN services sv ON m.machine_id = sv.machine_id
        WHERE sv.service_date BETWEEN p_start_date AND p_end_date
        GROUP BY s.store_id, s.store_name, s.region
        ORDER BY total_cost DESC;
    ELSE
        -- Specific store
        SELECT 
            s.store_name,
            s.region,
            COUNT(DISTINCT sv.service_id) as total_services,
            SUM(sv.cost) as total_cost,
            AVG(sv.cost) as average_cost,
            MIN(sv.cost) as min_cost,
            MAX(sv.cost) as max_cost,
            COUNT(DISTINCT sv.technician_id) as technicians_used
        FROM stores s
        LEFT JOIN machines m ON s.store_id = m.store_id
        LEFT JOIN services sv ON m.machine_id = sv.machine_id
        WHERE s.store_id = p_store_id
        AND sv.service_date BETWEEN p_start_date AND p_end_date
        GROUP BY s.store_id, s.store_name, s.region;
    END IF;
END //
DELIMITER ;

-- Procedure to get maintenance schedule
DELIMITER //
CREATE PROCEDURE GetMaintenanceSchedule(
    IN p_days_ahead INT DEFAULT 30,
    IN p_store_id VARCHAR(20)
)
BEGIN
    IF p_store_id IS NULL THEN
        -- All stores
        SELECT 
            m.machine_id,
            mt.type_name as machine_type,
            s.store_name,
            s.region,
            m.location,
            m.next_maintenance_date,
            DATEDIFF(m.next_maintenance_date, CURDATE()) as days_until_maintenance,
            CASE 
                WHEN DATEDIFF(m.next_maintenance_date, CURDATE()) <= 7 THEN 'Urgente'
                WHEN DATEDIFF(m.next_maintenance_date, CURDATE()) <= 30 THEN 'Próximo'
                ELSE 'Programado'
            END as priority,
            p.provider_name
        FROM machines m
        JOIN machine_types mt ON m.type_id = mt.type_id
        JOIN stores s ON m.store_id = s.store_id
        JOIN providers p ON m.provider_id = p.provider_id
        WHERE m.status IN ('active', 'maintenance')
        AND m.next_maintenance_date IS NOT NULL
        AND m.next_maintenance_date <= DATE_ADD(CURDATE(), INTERVAL p_days_ahead DAY)
        ORDER BY m.next_maintenance_date ASC;
    ELSE
        -- Specific store
        SELECT 
            m.machine_id,
            mt.type_name as machine_type,
            s.store_name,
            s.region,
            m.location,
            m.next_maintenance_date,
            DATEDIFF(m.next_maintenance_date, CURDATE()) as days_until_maintenance,
            CASE 
                WHEN DATEDIFF(m.next_maintenance_date, CURDATE()) <= 7 THEN 'Urgente'
                WHEN DATEDIFF(m.next_maintenance_date, CURDATE()) <= 30 THEN 'Próximo'
                ELSE 'Programado'
            END as priority,
            p.provider_name
        FROM machines m
        JOIN machine_types mt ON m.type_id = mt.type_id
        JOIN stores s ON m.store_id = s.store_id
        JOIN providers p ON m.provider_id = p.provider_id
        WHERE m.store_id = p_store_id
        AND m.status IN ('active', 'maintenance')
        AND m.next_maintenance_date IS NOT NULL
        AND m.next_maintenance_date <= DATE_ADD(CURDATE(), INTERVAL p_days_ahead DAY)
        ORDER BY m.next_maintenance_date ASC;
    END IF;
END //
DELIMITER ;

-- Procedure to authenticate user
DELIMITER //
CREATE PROCEDURE AuthenticateUser(
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255)
)
BEGIN
    DECLARE user_found BOOLEAN DEFAULT FALSE;
    DECLARE user_id_val INT;
    DECLARE user_role_val VARCHAR(20);
    DECLARE store_id_val VARCHAR(20);
    
    -- Check if user exists and password matches
    SELECT 
        u.user_id, u.user_role, u.store_id, u.full_name, u.email, u.permissions
    INTO 
        user_id_val, user_role_val, store_id_val, @full_name, @email, @permissions
    FROM users u
    WHERE u.username = p_username 
    AND u.password_hash = p_password_hash
    AND u.is_active = TRUE;
    
    IF user_id_val IS NOT NULL THEN
        SET user_found = TRUE;
        
        -- Update last login
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP, 
            login_count = login_count + 1
        WHERE user_id = user_id_val;
    END IF;
    
    SELECT 
        user_found as authenticated,
        user_id_val as user_id,
        user_role_val as user_role,
        store_id_val as store_id,
        @full_name as full_name,
        @email as email,
        @permissions as permissions;
END //
DELIMITER ;

-- Procedure to create user session
DELIMITER //
CREATE PROCEDURE CreateUserSession(
    IN p_user_id INT,
    IN p_session_id VARCHAR(255),
    IN p_device_info TEXT,
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT,
    IN p_expires_in_hours INT DEFAULT 24
)
BEGIN
    -- Invalidate existing sessions for this user
    UPDATE user_sessions 
    SET is_active = FALSE 
    WHERE user_id = p_user_id AND is_active = TRUE;
    
    -- Create new session
    INSERT INTO user_sessions (
        session_id, user_id, device_info, ip_address, user_agent, expires_at
    ) VALUES (
        p_session_id, p_user_id, p_device_info, p_ip_address, p_user_agent,
        DATE_ADD(CURRENT_TIMESTAMP, INTERVAL p_expires_in_hours HOUR)
    );
    
    SELECT p_session_id as session_id;
END //
DELIMITER ;

-- Procedure to validate session
DELIMITER //
CREATE PROCEDURE ValidateSession(
    IN p_session_id VARCHAR(255)
)
BEGIN
    DECLARE session_valid BOOLEAN DEFAULT FALSE;
    DECLARE user_id_val INT;
    DECLARE user_role_val VARCHAR(20);
    
    -- Check if session is valid
    SELECT 
        us.user_id, u.user_role, u.full_name, u.email, u.permissions
    INTO 
        user_id_val, user_role_val, @full_name, @email, @permissions
    FROM user_sessions us
    JOIN users u ON us.user_id = u.user_id
    WHERE us.session_id = p_session_id 
    AND us.is_active = TRUE
    AND us.expires_at > CURRENT_TIMESTAMP
    AND u.is_active = TRUE;
    
    IF user_id_val IS NOT NULL THEN
        SET session_valid = TRUE;
        
        -- Update last activity
        UPDATE user_sessions 
        SET last_activity = CURRENT_TIMESTAMP
        WHERE session_id = p_session_id;
    END IF;
    
    SELECT 
        session_valid as valid,
        user_id_val as user_id,
        user_role_val as user_role,
        @full_name as full_name,
        @email as email,
        @permissions as permissions;
END //
DELIMITER ;

-- Triggers for data integrity

-- Trigger to update machine status based on service date
DELIMITER //
CREATE TRIGGER update_machine_status_after_service
AFTER INSERT ON services
FOR EACH ROW
BEGIN
    UPDATE machines 
    SET status = 'active', 
        last_maintenance_date = NEW.service_date,
        next_maintenance_date = DATE_ADD(NEW.service_date, INTERVAL 
            (SELECT maintenance_interval_days FROM machine_types WHERE type_id = 
                (SELECT type_id FROM machines WHERE machine_id = NEW.machine_id)
            ) DAY),
        updated_at = CURRENT_TIMESTAMP
    WHERE machine_id = NEW.machine_id;
END //
DELIMITER ;

-- Trigger to log report generation
DELIMITER //
CREATE TRIGGER log_report_generation
AFTER INSERT ON reports
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action, table_name, record_id, new_values)
    VALUES (NEW.generated_by, 'GENERATE_REPORT', 'reports', NEW.report_id, 
            JSON_OBJECT('report_type', NEW.report_type, 'store_id', NEW.store_id));
END //
DELIMITER ;

-- Trigger to log user actions
DELIMITER //
CREATE TRIGGER log_user_actions
AFTER INSERT ON machines
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (action, table_name, record_id, new_values)
    VALUES ('INSERT', 'machines', NEW.machine_id, 
            JSON_OBJECT('store_id', NEW.store_id, 'type_id', NEW.type_id));
END //
DELIMITER ;

-- Trigger to log service actions
DELIMITER //
CREATE TRIGGER log_service_actions
AFTER INSERT ON services
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (action, table_name, record_id, new_values)
    VALUES ('INSERT', 'services', NEW.service_id, 
            JSON_OBJECT('machine_id', NEW.machine_id, 'cost', NEW.cost));
END //
DELIMITER ;

-- Indexes for better performance
CREATE INDEX idx_machines_store_type ON machines(store_id, type_id);
CREATE INDEX idx_services_machine_date ON services(machine_id, service_date);
CREATE INDEX idx_services_technician_date ON services(technician_id, service_date);
CREATE INDEX idx_reports_type_date ON reports(report_type, report_date);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id, is_active);
CREATE INDEX idx_audit_log_user_date ON audit_log(user_id, created_at);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- Comments for documentation
COMMENT ON TABLE stores IS 'Stores/locations where machines are installed';
COMMENT ON TABLE machines IS 'Machines registered in the system';
COMMENT ON TABLE services IS 'Services performed on machines';
COMMENT ON TABLE reports IS 'Generated reports stored for historical reference';
COMMENT ON TABLE providers IS 'Machine providers/suppliers';
COMMENT ON TABLE technicians IS 'Technicians who perform services';
COMMENT ON TABLE users IS 'System users with authentication';
COMMENT ON TABLE user_sessions IS 'User sessions for multi-device access';
COMMENT ON TABLE audit_log IS 'Audit trail for system changes';
COMMENT ON TABLE notifications IS 'System notifications for users';
COMMENT ON TABLE dashboard_widgets IS 'Customizable dashboard widgets';

-- Grant permissions (adjust as needed for your environment)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON gp_maquinas_db.* TO 'gp_user'@'localhost';
-- GRANT EXECUTE ON PROCEDURE gp_maquinas_db.* TO 'gp_user'@'localhost';
-- GRANT SELECT ON gp_maquinas_db.*_view TO 'gp_user'@'localhost'; 