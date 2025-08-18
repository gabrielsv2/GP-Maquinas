-- GP Máquinas e Serviços - Database Schema
-- Sistema de Gerenciamento de Serviços - Versão Unificada
-- Foco em serviços com código de máquina integrado

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

-- Services table (Unificada com registro de máquina)
CREATE TABLE services (
    service_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    machine_code VARCHAR(100) NOT NULL,
    machine_type VARCHAR(100) NOT NULL,
    store_id VARCHAR(20) NOT NULL,
    location VARCHAR(200) NOT NULL,
    service_type_id VARCHAR(30) NOT NULL,
    technician_id INT NOT NULL,
    service_date DATE NOT NULL,
    record_date DATE NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    status ENUM('completed', 'pending', 'cancelled', 'in_progress') DEFAULT 'completed',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    estimated_duration_hours INT,
    actual_duration_hours INT,
    parts_used TEXT,
    warranty_until DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE RESTRICT,
    FOREIGN KEY (service_type_id) REFERENCES service_types(service_type_id) ON DELETE RESTRICT,
    FOREIGN KEY (technician_id) REFERENCES technicians(technician_id) ON DELETE RESTRICT,
    
    INDEX idx_machine_code (machine_code),
    INDEX idx_store (store_id),
    INDEX idx_technician (technician_id),
    INDEX idx_service_type (service_type_id),
    INDEX idx_service_date (service_date),
    INDEX idx_record_date (record_date),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_machine_type (machine_type)
);

-- Reports table (for storing generated reports)
CREATE TABLE reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    report_type ENUM('store_summary', 'technician_summary', 'service_summary', 'financial_summary', 'performance_analysis', 'machine_summary') NOT NULL,
    store_id VARCHAR(20),
    technician_id INT,
    report_date DATE NOT NULL,
    report_period_start DATE,
    report_period_end DATE,
    report_data JSON,
    report_format ENUM('json', 'pdf', 'excel', 'html') DEFAULT 'json',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE SET NULL,
    FOREIGN KEY (technician_id) REFERENCES technicians(technician_id) ON DELETE SET NULL,
    
    INDEX idx_report_type (report_type),
    INDEX idx_store (store_id),
    INDEX idx_report_date (report_date)
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
('balanceadora-1', 'Balanceadora 1', 'Serviços em balanceadora 1', 150.00, 2, 'Manutenção Preventiva'),
('balanceadora-2', 'Balanceadora 2', 'Serviços em balanceadora 2', 150.00, 2, 'Manutenção Preventiva'),
('montadora-1', 'Montadora 1', 'Serviços em montadora 1', 200.00, 3, 'Manutenção Preventiva'),
('montadora-2', 'Montadora 2', 'Serviços em montadora 2', 200.00, 3, 'Manutenção Preventiva'),
('alinhamento-1', 'Alinhamento 1', 'Serviços de alinhamento 1', 180.00, 2, 'Manutenção Preventiva'),
('alinhamento-2', 'Alinhamento 2', 'Serviços de alinhamento 2', 180.00, 2, 'Manutenção Preventiva'),
('other', 'Outros', 'Outros tipos de serviços', 200.00, 2, 'Diversos');

-- Insert sample technicians
INSERT INTO technicians (technician_name, phone, email, specialization) VALUES
('Martins', '(11) 99999-1111', 'martins@tecnico.com', 'Mecânica Geral'),
('Diego', '(11) 99999-2222', 'diego@tecnico.com', 'Mecânica Especializada'),
('Tadeo', '(11) 99999-3333', 'tadeo@tecnico.com', 'Manutenção Preventiva'),
('Leal-Ferramentas', '(11) 99999-4444', 'leal@ferramentas.com', 'Ferramentas e Equipamentos'),
('Outros', '(11) 99999-5555', 'outros@tecnico.com', 'Serviços Gerais');

-- Create views for common reports

-- View for store summary reports
CREATE VIEW store_summary_view AS
SELECT 
    s.store_id,
    s.store_name,
    s.region,
    COUNT(sv.service_id) as total_services,
    SUM(sv.cost) as total_service_cost,
    COUNT(DISTINCT sv.technician_id) as total_technicians,
    COUNT(DISTINCT sv.machine_code) as total_machines,
    MAX(sv.service_date) as last_service_date,
    COUNT(CASE WHEN sv.status = 'completed' THEN 1 END) as completed_services,
    COUNT(CASE WHEN sv.status = 'pending' THEN 1 END) as pending_services,
    COUNT(CASE WHEN sv.status = 'in_progress' THEN 1 END) as in_progress_services
FROM stores s
LEFT JOIN services sv ON s.store_id = sv.store_id
WHERE s.is_active = TRUE
GROUP BY s.store_id, s.store_name, s.region;

-- View for technician summary reports
CREATE VIEW technician_summary_view AS
SELECT 
    t.technician_id,
    t.technician_name,
    t.specialization,
    t.hourly_rate,
    COUNT(sv.service_id) as total_services,
    SUM(sv.cost) as total_service_cost,
    COUNT(DISTINCT sv.store_id) as stores_served,
    COUNT(DISTINCT sv.machine_code) as machines_serviced,
    MAX(sv.service_date) as last_service_date,
    AVG(sv.actual_duration_hours) as average_duration,
    COUNT(CASE WHEN sv.status = 'completed' THEN 1 END) as completed_services,
    COUNT(CASE WHEN sv.priority = 'urgent' THEN 1 END) as urgent_services
FROM technicians t
LEFT JOIN services sv ON t.technician_id = sv.technician_id
WHERE t.is_active = TRUE
GROUP BY t.technician_id, t.technician_name, t.specialization, t.hourly_rate;

-- View for machine summary
CREATE VIEW machine_summary_view AS
SELECT 
    sv.machine_code,
    sv.machine_type,
    s.store_name,
    s.region,
    sv.location,
    COUNT(sv.service_id) as total_services,
    SUM(sv.cost) as total_cost,
    MAX(sv.service_date) as last_service_date,
    MIN(sv.service_date) as first_service_date,
    COUNT(DISTINCT sv.technician_id) as technicians_used,
    COUNT(CASE WHEN sv.status = 'completed' THEN 1 END) as completed_services
FROM services sv
JOIN stores s ON sv.store_id = s.store_id
GROUP BY sv.machine_code, sv.machine_type, s.store_name, s.region, sv.location;

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
    COUNT(DISTINCT sv.service_type_id) as service_types_used,
    COUNT(DISTINCT sv.machine_code) as machines_serviced
FROM stores s
LEFT JOIN services sv ON s.store_id = sv.store_id
WHERE sv.service_date IS NOT NULL
GROUP BY YEAR(sv.service_date), MONTH(sv.service_date), s.store_id, s.store_name, s.region
ORDER BY year DESC, month DESC;

-- Stored procedures for common operations

-- Procedure to generate store report
DELIMITER //
CREATE PROCEDURE GenerateStoreReport(
    IN p_store_id VARCHAR(20),
    IN p_start_date DATE,
    IN p_end_date DATE
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
                'machine_code', sv.machine_code,
                'machine_type', sv.machine_type,
                'location', sv.location,
                'total_services', COUNT(sv.service_id),
                'total_cost', SUM(sv.cost)
            )
        ),
        'services', JSON_ARRAYAGG(
            JSON_OBJECT(
                'service_id', sv.service_id,
                'machine_code', sv.machine_code,
                'machine_type', sv.machine_type,
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
            'total_machines', COUNT(DISTINCT sv.machine_code),
            'total_services', COUNT(DISTINCT sv.service_id),
            'total_cost', COALESCE(SUM(sv.cost), 0),
            'total_technicians', COUNT(DISTINCT sv.technician_id),
            'completed_services', COUNT(CASE WHEN sv.status = 'completed' THEN 1 END),
            'pending_services', COUNT(CASE WHEN sv.status = 'pending' THEN 1 END),
            'in_progress_services', COUNT(CASE WHEN sv.status = 'in_progress' THEN 1 END)
        )
    ) INTO report_data
    FROM stores s
    LEFT JOIN services sv ON s.store_id = sv.store_id
    LEFT JOIN service_types st ON sv.service_type_id = st.service_type_id
    LEFT JOIN technicians t ON sv.technician_id = t.technician_id
    WHERE s.store_id = p_store_id
    AND (sv.service_date IS NULL OR (sv.service_date BETWEEN p_start_date AND p_end_date))
    GROUP BY s.store_id, s.store_name, s.region;
    
    -- Insert report record
    INSERT INTO reports (report_type, store_id, report_date, report_period_start, report_period_end, report_data)
    VALUES ('store_summary', p_store_id, CURDATE(), p_start_date, p_end_date, report_data);
    
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
            COUNT(DISTINCT sv.technician_id) as technicians_used,
            COUNT(DISTINCT sv.machine_code) as machines_serviced
        FROM stores s
        LEFT JOIN services sv ON s.store_id = sv.store_id
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
            COUNT(DISTINCT sv.technician_id) as technicians_used,
            COUNT(DISTINCT sv.machine_code) as machines_serviced
        FROM stores s
        LEFT JOIN services sv ON s.store_id = sv.store_id
        WHERE s.store_id = p_store_id
        AND sv.service_date BETWEEN p_start_date AND p_end_date
        GROUP BY s.store_id, s.store_name, s.region;
    END IF;
END //
DELIMITER ;

-- Procedure to get machine services
DELIMITER //
CREATE PROCEDURE GetMachineServices(
    IN p_machine_code VARCHAR(100),
    IN p_store_id VARCHAR(20)
)
BEGIN
    SELECT 
        sv.service_id,
        sv.machine_code,
        sv.machine_type,
        sv.location,
        st.service_name,
        t.technician_name,
        sv.service_date,
        sv.cost,
        sv.description,
        sv.status,
        sv.priority,
        sv.parts_used,
        sv.notes
    FROM services sv
    JOIN service_types st ON sv.service_type_id = st.service_type_id
    JOIN technicians t ON sv.technician_id = t.technician_id
    JOIN stores s ON sv.store_id = s.store_id
    WHERE sv.machine_code = p_machine_code
    AND (p_store_id IS NULL OR sv.store_id = p_store_id)
    ORDER BY sv.service_date DESC;
END //
DELIMITER ;

-- Indexes for better performance
CREATE INDEX idx_services_machine_code_store ON services(machine_code, store_id);
CREATE INDEX idx_services_store_date ON services(store_id, service_date);
CREATE INDEX idx_services_technician_date ON services(technician_id, service_date);
CREATE INDEX idx_reports_type_date ON reports(report_type, report_date);

-- Comments for documentation
COMMENT ON TABLE stores IS 'Stores/locations where services are performed';
COMMENT ON TABLE services IS 'Services performed with machine registration integrated';
COMMENT ON TABLE reports IS 'Generated reports stored for historical reference';
COMMENT ON TABLE technicians IS 'Technicians who perform services';
COMMENT ON TABLE service_types IS 'Types of services available';

-- Grant permissions (adjust as needed for your environment)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON gp_maquinas_db.* TO 'gp_user'@'localhost';
-- GRANT EXECUTE ON PROCEDURE gp_maquinas_db.* TO 'gp_user'@'localhost';
-- GRANT SELECT ON gp_maquinas_db.*_view TO 'gp_user'@'localhost'; 