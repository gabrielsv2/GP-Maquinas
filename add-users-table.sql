-- Adicionar tabela de usuários para o sistema GP Máquinas
-- Este arquivo deve ser executado após a criação do banco principal

USE gp_maquinas_db;

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'store') NOT NULL,
    store_id VARCHAR(20),
    full_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE RESTRICT,
    INDEX idx_username (username),
    INDEX idx_store_id (store_id),
    INDEX idx_role (role)
);

-- Inserir usuário administrador
INSERT INTO users (username, password_hash, role, full_name) VALUES 
('admGP', '$2a$12$pQcZcm5V91j6QF70uEqE.OJPKng4p4W4GNJe5/UciN8N4ioQqWoE6', 'admin', 'Administrador do Sistema');

-- Inserir usuários das lojas (senhas criptografadas)
INSERT INTO users (username, password_hash, role, store_id, full_name) VALUES 
-- GP AnhaiaMello
('gpanhaia', '$2a$12$.KgBC/xUUTpqExZg3Es/euMW1qzIUC9yVGb5Ycw3TdHa9TqUm9hoC', 'store', 'GPAnhaiaMello', 'GP Anhaia Mello'),

-- GP Aricanduva
('gparicanduva', '$2a$12$49.SMGZ3boc5aQQ.70Yd1.XBFsKlQkyd8cuP0drfyxeTBvt4oWNeK', 'store', 'GPAricanduva', 'GP Aricanduva'),

-- GP Campo Limpo
('gpcampo', '$2a$12$v.YzxPsWtY0xkaMoBhKiP.U4tj4UJUFVjO8vNGpAU7k2oBb/uut3q', 'store', 'GPCampoLimpo', 'GP Campo Limpo'),

-- GP Carrão
('gpcarrao', '$2a$12$RkBdYeVaqtumrD56x94BW.ZMUf65RTRsFCc4.Qu42fZngvLE0z8Si', 'store', 'GPCarrão', 'GP Carrão'),

-- GP Cidade Dutra
('gpdutra', '$2a$12$kRmcse0WTOYVNYT4BQjbGebnghYiEYs/Ln2LMN/T4NRk0QN2QDGPK', 'store', 'GPCidadeDutra', 'GP Cidade Dutra'),

-- GP Cotia
('gpcotia', '$2a$12$VG8cIPoFEBA8anBwYZYQiuYffiCyjAPu4Au1exm.v6eTTO5VxFZ6G', 'store', 'GPCotia', 'GP Cotia'),

-- GP Cruzeiro do Sul
('gpcruzeiro', '$2a$12$wYHqFcNNd9Df6OvIIPhlLuxEOaOHrBVjymoibzQ4Vav4qfjbWe2vK', 'store', 'GPCruzeirodoSul', 'GP Cruzeiro do Sul'),

-- GP Demarchi
('gpdemarchi', '$2a$12$MmhBmy2r4.dpR2RPnYW8yO.WPDnRbrQq.2b/oOEMATJrrTHlE9NU.', 'store', 'GPDemarchi', 'GP Demarchi'),

-- GP Edgar Facó
('gpedgar', '$2a$12$sf1G5JKIXbYXZb.6D6GD/ur94RP/DnKSLz6IdeOJfmoRFYJXizxCC', 'store', 'GPEdgarFacó', 'GP Edgar Facó'),

-- GP Guarulhos
('gpguarulhos', '$2a$12$qYFfSnUTQPdCusCx1T/ZBOc15OXbzwzV9KeHPCnxuNqIYAlDhL8Ui', 'store', 'GPGuarulhos', 'GP Guarulhos'),

-- GP Interlagos
('gpinterlagos', '$2a$12$ZV1ZXSouqYAdGNLF35v1SO31ozB.OqZSqcWt9dnX4gyJt/VjFy3Ye', 'store', 'GPInterlagos', 'GP Interlagos'),

-- GP Jabaquara
('gpjabaquara', '$2a$12$3/o0cWGX8FKklU99F4AXreh5ZCKNvoM1zlBjTsFLRE0PasIm/02K2', 'store', 'GPJabaquara', 'GP Jabaquara'),

-- GP Jundiaí
('gpjundiai', '$2a$12$fvXZ3e0PNnzb1zTCuHgIAeA3gew9wxBM/wOxR.eYA7FqbhO/N2LyK', 'store', 'GPJundiai', 'GP Jundiaí'),

-- GP Lapa
('gplapa', '$2a$12$hM0dH16tA4DCYp9pWp24qO135pLIqigL/vzERa7je5B9NV/eawcW6', 'store', 'GPLapa', 'GP Lapa'),

-- GP Limão
('gplimao', '$2a$12$eegtwLVR.X/MhPCK7XxWVeNRYF1FaDQA/hN3WaT5rGFhuZnOUstF.', 'store', 'GPLimão', 'GP Limão'),

-- GP M'Boi Mirim
('gpmboi', '$2a$12$TjHJuGEOndeb5bynficJsuSahXpy2FFxoDQ5Eo06pDpa7a6v.hsFO', 'store', 'GPMboiMirim', 'GP M\'Boi Mirim'),

-- GP Mogi
('gpmogi', '$2a$12$tE.OrCVl8aSH8650S.e3E.MRMQgA9H4xagPIrZV3.EHpUxQShRm1a', 'store', 'GPMogi', 'GP Mogi'),

-- GP Morumbi
('gpmorumbi', '$2a$12$rcwPxQ9DoBQ1jc8//hLp1eAIf2sYaMz5YQqnmuD/yCsHZfEy6bwZe', 'store', 'GPMorumbi', 'GP Morumbi'),

-- GP Osasco
('gposasco', '$2a$12$eRaOA1.Bi4Cf2PDb7fZy7.YeaH7h49Ic3wcUUyXa2Q4TpnLtB3hWa', 'store', 'GPOsasco', 'GP Osasco'),

-- GP Ragueb Chohfi
('gpragueb', '$2a$12$E.5r/1nZVLNSCbauSkjlS.V0WoQGeEbV6gAvyeuamN7.6aciApDPW', 'store', 'GPRaguebChohfi', 'GP Ragueb Chohfi'),

-- GP Ribeirão Preto
('gpribeirao', '$2a$12$bfqLma3roF026tpqxKquSeYQHT29v1aDzVLLrJ16RAU9dkGWLSjOq', 'store', 'GPRibeirãoPreto', 'GP Ribeirão Preto'),

-- GP Ricardo Jafet
('gpjafet', '$2a$12$tJ5y7.xpmmXjgfDLV.SS0ucx55ygH23zEGy04uTqEkqZZJ6owyyjG', 'store', 'GPRicardoJafet', 'GP Ricardo Jafet'),

-- GP Santo André
('gpsanto', '$2a$12$5BqMHIyd3L5JjYi5g4EYse7as33hRrvnnMD4r2g4Jg0VSyE/sY2CS', 'store', 'GPSantoAndré', 'GP Santo André'),

-- GP Taboão
('gptaboao', '$2a$12$X26vKOUkeZifMZ2TOGVrR.fNYQm/1h8J5JArH7dtDkmIanc7caHky', 'store', 'GPTaboão', 'GP Taboão');

-- Comentários para documentação
COMMENT ON TABLE users IS 'Usuários do sistema com autenticação';
COMMENT ON COLUMN users.username IS 'Nome de usuário único para login';
COMMENT ON COLUMN users.password_hash IS 'Hash da senha criptografada';
COMMENT ON COLUMN users.role IS 'Papel do usuário: admin ou store';
COMMENT ON COLUMN users.store_id IS 'ID da loja (apenas para usuários store)';
COMMENT ON COLUMN users.full_name IS 'Nome completo do usuário';
COMMENT ON COLUMN users.is_active IS 'Se o usuário está ativo no sistema';
