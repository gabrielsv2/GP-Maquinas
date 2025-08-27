-- Criar tabela de usuarios
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(10) CHECK (role IN ('admin', 'store')) NOT NULL,
    store_id VARCHAR(20),
    full_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE RESTRICT
);

-- Criar indices
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Inserir usuario administrador
INSERT INTO users (username, password_hash, role, full_name) VALUES 
('admGP', '$2a$12$pQcZcm5V91j6QF70uEqE.OJPKng4p4W4GNJe5/UciN8N4ioQqWoE6', 'admin', 'Administrador do Sistema');

-- Inserir usuarios das lojas - parte 1
INSERT INTO users (username, password_hash, role, store_id, full_name) VALUES 
('gpanhaia', '$2a$12$.KgBC/xUUTpqExZg3Es/euMW1qzIUC9yVGb5Ycw3TdHa9TqUm9hoC', 'store', 'GPAnhaiaMello', 'GP Anhaia Mello'),
('gparicanduva', '$2a$12$49.SMGZ3boc5aQQ.70Yd1.XBFsKlQkyd8cuP0drfyxeTBvt4oWNeK', 'store', 'GPAricanduva', 'GP Aricanduva'),
('gpcampo', '$2a$12$v.YzxPsWtY0xkaMoBhKiP.U4tj4UJUFVjO8vNGpAU7k2oBb/uut3q', 'store', 'GPCampoLimpo', 'GP Campo Limpo'),
('gpcarrao', '$2a$12$RkBdYeVaqtumrD56x94BW.ZMUf65RTRsFCc4.Qu42fZngvLE0z8Si', 'store', 'GPCarrão', 'GP Carrão'),
('gpdutra', '$2a$12$kRmcse0WTOYVNYT4BQjbGebnghYiEYs/Ln2LMN/T4NRk0QN2QDGPK', 'store', 'GPCidadeDutra', 'GP Cidade Dutra'),
('gpcotia', '$2a$12$VG8cIPoFEBA8anBwYZYQiuYffiCyjAPu4Au1exm.v6eTTO5VxFZ6G', 'store', 'GPCotia', 'GP Cotia'),
('gpcruzeiro', '$2a$12$wYHqFcNNd9Df6OvIIPhlLuxEOaOHrBVjymoibzQ4Vav4qfjbWe2vK', 'store', 'GPCruzeirodoSul', 'GP Cruzeiro do Sul'),
('gpdemarchi', '$2a$12$MmhBmy2r4.dpR2RPnYW8yO.WPDnRbrQq.2b/oOEMATJrrTHlE9NU.', 'store', 'GPDemarchi', 'GP Demarchi');

-- Inserir usuarios das lojas - parte 2
INSERT INTO users (username, password_hash, role, store_id, full_name) VALUES 
('gpedgar', '$2a$12$sf1G5JKIXbYXZb.6D6GD/ur94RP/DnKSLz6IdeOJfmoRFYJXizxCC', 'store', 'GPEdgarFacó', 'GP Edgar Facó'),
('gpguarulhos', '$2a$12$qYFfSnUTQPdCusCx1T/ZBOc15OXbzwzV9KeHPCnxuNqIYAlDhL8Ui', 'store', 'GPGuarulhos', 'GP Guarulhos'),
('gpinterlagos', '$2a$12$ZV1ZXSouqYAdGNLF35v1SO31ozB.OqZSqcWt9dnX4gyJt/VjFy3Ye', 'store', 'GPInterlagos', 'GP Interlagos'),
('gpjabaquara', '$2a$12$3/o0cWGX8FKklU99F4AXreh5ZCKNvoM1zlBjTsFLRE0PasIm/02K2', 'store', 'GPJabaquara', 'GP Jabaquara'),
('gpjundiai', '$2a$12$fvXZ3e0PNnzb1zTCuHgIAeA3gew9wxBM/wOxR.eYA7FqbhO/N2LyK', 'store', 'GPJundiai', 'GP Jundiaí'),
('gplapa', '$2a$12$hM0dH16tA4DCYp9pWp24qO135pLIqigL/vzERa7je5B9NV/eawcW6', 'store', 'GPLapa', 'GP Lapa'),
('gplimao', '$2a$12$eegtwLVR.X/MhPCK7XxWVeNRYF1FaDQA/hN3WaT5rGFhuZnOUstF.', 'store', 'GPLimão', 'GP Limão'),
('gpmboi', '$2a$12$TjHJuGEOndeb5bynficJsuSahXpy2FFxoDQ5Eo06pDpa7a6v.hsFO', 'store', 'GPMboiMirim', 'GP M''Boi Mirim');

-- Inserir usuarios das lojas - parte 3
INSERT INTO users (username, password_hash, role, store_id, full_name) VALUES 
('gpmogi', '$2a$12$tE.OrCVl8aSH8650S.e3E.MRMQgA9H4xagPIrZV3.EHpUxQShRm1a', 'store', 'GPMogi', 'GP Mogi'),
('gpmorumbi', '$2a$12$rcwPxQ9DoBQ1jc8//hLp1eAIf2sYaMz5YQqnmuD/yCsHZfEy6bwZe', 'store', 'GPMorumbi', 'GP Morumbi'),
('gposasco', '$2a$12$eRaOA1.Bi4Cf2PDb7fZy7.YeaH7h49Ic3wcUUyXa2Q4TpnLtB3hWa', 'store', 'GPOsasco', 'GP Osasco'),
('gpragueb', '$2a$12$E.5r/1nZVLNSCbauSkjlS.V0WoQGeEbV6gAvyeuamN7.6aciApDPW', 'store', 'GPRaguebChohfi', 'GP Ragueb Chohfi'),
('gpribeirao', '$2a$12$bfqLma3roF026tpqxKquSeYQHT29v1aDzVLLrJ16RAU9dkGWLSjOq', 'store', 'GPRibeirãoPreto', 'GP Ribeirão Preto'),
('gpjafet', '$2a$12$tJ5y7.xpmmXjgfDLV.SS0ucx55ygH23zEGy04uTqEkqZZJ6owyyjG', 'store', 'GPRicardoJafet', 'GP Ricardo Jafet'),
('gpsanto', '$2a$12$5BqMHIyd3L5JjYi5g4EYse7as33hRrvnnMD4r2g4Jg0VSyE/sY2CS', 'store', 'GPSantoAndré', 'GP Santo André'),
('gptaboao', '$2a$12$X26vKOUkeZifMZ2TOGVrR.fNYQm/1h8J5JArH7dtDkmIanc7caHky', 'store', 'GPTaboão', 'GP Taboão');
