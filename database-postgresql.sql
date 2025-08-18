-- GP Máquinas e Serviços - Database Schema PostgreSQL
-- Sistema de Gerenciamento de Serviços - Versão Unificada
-- Adaptado para PostgreSQL (Neon)

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service types table
CREATE TABLE service_types (
    service_type_id VARCHAR(30) PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    description TEXT,
    estimated_cost DECIMAL(10,2),
    estimated_duration_hours INTEGER,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Technicians table (Técnicos - Simplificado)
CREATE TABLE technicians (
    technician_id SERIAL PRIMARY KEY,
    technician_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    specialization VARCHAR(100),
    certification VARCHAR(100),
    hourly_rate DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table (Unificada com registro de máquina - Sem prioridade)
CREATE TABLE services (
    service_id BIGSERIAL PRIMARY KEY,
    machine_code VARCHAR(100) NOT NULL,
    machine_type VARCHAR(100) NOT NULL,
    store_id VARCHAR(20) NOT NULL,
    location VARCHAR(200) NOT NULL,
    service_type_id VARCHAR(30) NOT NULL,
    technician_id INTEGER NOT NULL,
    service_date DATE NOT NULL,
    record_date DATE NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled', 'in_progress')),
    estimated_duration_hours INTEGER,
    actual_duration_hours INTEGER,
    parts_used TEXT,
    warranty_until DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE RESTRICT,
    FOREIGN KEY (service_type_id) REFERENCES service_types(service_type_id) ON DELETE RESTRICT,
    FOREIGN KEY (technician_id) REFERENCES technicians(technician_id) ON DELETE RESTRICT
);

-- Reports table (for storing generated reports)
CREATE TABLE reports (
    report_id SERIAL PRIMARY KEY,
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('store_summary', 'technician_summary', 'service_summary', 'financial_summary', 'performance_analysis', 'machine_summary')),
    store_id VARCHAR(20),
    technician_id INTEGER,
    report_date DATE NOT NULL,
    report_period_start DATE,
    report_period_end DATE,
    report_data JSONB,
    report_format VARCHAR(10) DEFAULT 'json' CHECK (report_format IN ('json', 'pdf', 'excel', 'html')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE SET NULL,
    FOREIGN KEY (technician_id) REFERENCES technicians(technician_id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_machine_code ON services(machine_code);
CREATE INDEX idx_store ON services(store_id);
CREATE INDEX idx_technician ON services(technician_id);
CREATE INDEX idx_service_type ON services(service_type_id);
CREATE INDEX idx_service_date ON services(service_date);
CREATE INDEX idx_record_date ON services(record_date);
CREATE INDEX idx_status ON services(status);
CREATE INDEX idx_machine_type ON services(machine_type);

-- Insert initial data

-- Insert stores (Lojas)
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
('GPMboiMirim', 'GP M''Boi Mirim', 'GPMboiMirim', 'São Paulo'),
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
('belt-replacement', 'Substituição de Correia', 'Substituição de correias em máquinas', 100.00, 2, 'Manutenção'),
('engine-replacement', 'Substituição de Motor', 'Substituição de motores', 500.00, 4, 'Reparo'),
('flat-replacement', 'Substituição de Pneu', 'Substituição de pneus', 80.00, 1, 'Manutenção'),
('tube-air-replacement', 'Substituição de Tubo/Ar', 'Substituição de tubos de ar', 120.00, 2, 'Manutenção'),
('repair', 'Reparo', 'Reparo geral de máquinas', 200.00, 3, 'Reparo'),
('preventive-maintenance', 'Manutenção Preventiva', 'Manutenção preventiva mensal', 150.00, 2, 'Preventiva'),
('calibration', 'Calibração', 'Calibração de máquinas', 180.00, 2, 'Calibração'),
('inspection', 'Inspeção', 'Inspeção de segurança', 90.00, 1, 'Inspeção'),
('other', 'Outros', 'Outros tipos de serviço', 100.00, 2, 'Outros');

-- Insert technicians (Atualizado com todos os técnicos)
INSERT INTO technicians (technician_id, technician_name, specialization, is_active) VALUES
(1, 'Martins', 'Mecânica Geral', true),
(2, 'Diego', 'Mecânica Especializada', true),
(3, 'Tadeo', 'Manutenção Preventiva', true),
(4, 'Leal-Ferramentas', 'Ferramentas e Equipamentos', true),
(5, 'Outros', 'Serviços Gerais', true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
