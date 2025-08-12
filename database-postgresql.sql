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

-- Technicians table (Técnicos)
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

-- Services table (Unificada com registro de máquina)
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
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
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
CREATE INDEX idx_priority ON services(priority);
CREATE INDEX idx_machine_type ON services(machine_type);

-- Insert sample data
INSERT INTO stores (store_id, store_name, store_code, address, phone, email, manager, region) VALUES
('ST001', 'Loja Centro', 'CENTRO', 'Rua das Flores, 123 - Centro', '(11) 9999-9999', 'centro@gpmaquinas.com', 'João Silva', 'São Paulo'),
('ST002', 'Loja Norte', 'NORTE', 'Av. Paulista, 456 - Norte', '(11) 8888-8888', 'norte@gpmaquinas.com', 'Maria Santos', 'São Paulo'),
('ST003', 'Loja Sul', 'SUL', 'Rua Augusta, 789 - Sul', '(11) 7777-7777', 'sul@gpmaquinas.com', 'Pedro Costa', 'São Paulo');

INSERT INTO service_types (service_type_id, service_name, description, estimated_cost, estimated_duration_hours, category) VALUES
('PREV_MAINT', 'Manutenção Preventiva', 'Manutenção regular para prevenir falhas', 150.00, 2, 'Manutenção'),
('CORR_MAINT', 'Manutenção Corretiva', 'Reparo de equipamentos com falha', 300.00, 4, 'Reparo'),
('CALIBRATION', 'Calibração', 'Ajuste de precisão do equipamento', 200.00, 3, 'Calibração'),
('INSPECTION', 'Inspeção', 'Verificação de segurança e funcionamento', 100.00, 1, 'Inspeção'),
('INSTALLATION', 'Instalação', 'Montagem e configuração de equipamentos', 500.00, 6, 'Instalação');

INSERT INTO technicians (technician_name, phone, email, specialization, certification, hourly_rate) VALUES
('Carlos Oliveira', '(11) 9999-1111', 'carlos@gpmaquinas.com', 'Máquinas Industriais', 'Técnico Industrial', 50.00),
('Ana Rodrigues', '(11) 9999-2222', 'ana@gpmaquinas.com', 'Equipamentos Eletrônicos', 'Técnico Eletrônico', 45.00),
('Roberto Lima', '(11) 9999-3333', 'roberto@gpmaquinas.com', 'Máquinas Pesadas', 'Técnico Mecânico', 55.00),
('Fernanda Costa', '(11) 9999-4444', 'fernanda@gpmaquinas.com', 'Sistemas Automatizados', 'Técnico Automação', 60.00);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
