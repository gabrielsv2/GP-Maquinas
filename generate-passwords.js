const bcrypt = require('bcryptjs');

// Senhas das lojas conforme a tabela
const storePasswords = {
    'gpanhaia': 'ab12',
    'gparicanduva': 'zx34',
    'gpcampo': 'rt56',
    'gpcarrao': 'mn78',
    'gpdutra': 'pq90',
    'gpcotia': 'kl23',
    'gpcruzeiro': 'uv45',
    'gpdemarchi': 'cd67',
    'gpedgar': 'op89',
    'gpguarulhos': 'gh12',
    'gpinterlagos': 'ij34',
    'gpjabaquara': 'wx56',
    'gpjundiai': 'qr78',
    'gplapa': 'st90',
    'gplimao': 'lm23',
    'gpmboi': 'yz45',
    'gpmogi': 'de67',
    'gpmorumbi': 'fg89',
    'gposasco': 'bn12',
    'gpragueb': 'cv34',
    'gpribeirao': 'hk56',
    'gpjafet': 'jp78',
    'gpsanto': 'qt90',
    'gptaboao': 'rw23'
};

// Senha do admin
const adminPassword = '778*GP';

console.log('=== GERANDO HASHES DAS SENHAS ===\n');

// Gerar hash da senha do admin
const adminHash = bcrypt.hashSync(adminPassword, 12);
console.log('ADMIN:');
console.log(`Usuário: admGP`);
console.log(`Senha: ${adminPassword}`);
console.log(`Hash: ${adminHash}\n`);

// Gerar hashes das senhas das lojas
console.log('LOJAS:');
Object.entries(storePasswords).forEach(([username, password]) => {
    const hash = bcrypt.hashSync(password, 12);
    console.log(`${username}: ${password} -> ${hash}`);
});

console.log('\n=== SQL PARA INSERIR USUÁRIOS ===\n');

// Gerar SQL para inserir usuários
console.log('-- Inserir usuário administrador');
console.log(`INSERT INTO users (username, password_hash, role, full_name) VALUES `);
console.log(`('admGP', '${adminHash}', 'admin', 'Administrador do Sistema');\n`);

console.log('-- Inserir usuários das lojas');
console.log('INSERT INTO users (username, password_hash, role, store_id, full_name) VALUES ');

const storeUsers = [
    ['gpanhaia', 'GPAnhaiaMello', 'GP Anhaia Mello'],
    ['gparicanduva', 'GPAricanduva', 'GP Aricanduva'],
    ['gpcampo', 'GPCampoLimpo', 'GP Campo Limpo'],
    ['gpcarrao', 'GPCarrão', 'GP Carrão'],
    ['gpdutra', 'GPCidadeDutra', 'GP Cidade Dutra'],
    ['gpcotia', 'GPCotia', 'GP Cotia'],
    ['gpcruzeiro', 'GPCruzeirodoSul', 'GP Cruzeiro do Sul'],
    ['gpdemarchi', 'GPDemarchi', 'GP Demarchi'],
    ['gpedgar', 'GPEdgarFacó', 'GP Edgar Facó'],
    ['gpguarulhos', 'GPGuarulhos', 'GP Guarulhos'],
    ['gpinterlagos', 'GPInterlagos', 'GP Interlagos'],
    ['gpjabaquara', 'GPJabaquara', 'GP Jabaquara'],
    ['gpjundiai', 'GPJundiai', 'GP Jundiaí'],
    ['gplapa', 'GPLapa', 'GP Lapa'],
    ['gplimao', 'GPLimão', 'GP Limão'],
    ['gpmboi', 'GPMboiMirim', 'GP M\'Boi Mirim'],
    ['gpmogi', 'GPMogi', 'GP Mogi'],
    ['gpmorumbi', 'GPMorumbi', 'GP Morumbi'],
    ['gposasco', 'GPOsasco', 'GP Osasco'],
    ['gpragueb', 'GPRaguebChohfi', 'GP Ragueb Chohfi'],
    ['gpribeirao', 'GPRibeirãoPreto', 'GP Ribeirão Preto'],
    ['gpjafet', 'GPRicardoJafet', 'GP Ricardo Jafet'],
    ['gpsanto', 'GPSantoAndré', 'GP Santo André'],
    ['gptaboao', 'GPTaboão', 'GP Taboão']
];

storeUsers.forEach(([username, storeId, storeName], index) => {
    const password = storePasswords[username];
    const hash = bcrypt.hashSync(password, 12);
    
    if (index === 0) {
        console.log(`('${username}', '${hash}', 'store', '${storeId}', '${storeName}')`);
    } else if (index === storeUsers.length - 1) {
        console.log(`('${username}', '${hash}', 'store', '${storeId}', '${storeName}');`);
    } else {
        console.log(`('${username}', '${hash}', 'store', '${storeId}', '${storeName}'),`);
    }
});
