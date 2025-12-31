/**
 * Brooklyn Barbearia - Password Hash Generator
 * Gera hashes SHA-256 com salt para passwords de admin users
 * USO COM WEB CRYPTO API (compatvel com Cloudflare Workers)
 * 
 * Uso: node generate-hash.js <password>
 * Exemplo: node generate-hash.js "admin123"
 */

const crypto = require('crypto');

const password = process.argv[2];

if (!password) {
    console.log('\u274c Erro: Password não fornecida\n');
    console.log('Uso: node generate-hash.js <password>');
    console.log('Exemplo: node generate-hash.js "admin123"\n');
    process.exit(1);
}

/**
 * Gera hash SHA-256 com salt (compatível com auth.js)
 */
function hashPassword(password) {
    // Gerar salt aleatório (16 bytes = 32 caracteres hex)
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Criar hash SHA-256 de salt + password
    const hash = crypto.createHash('sha256')
        .update(salt + password)
        .digest('hex');
    
    return `${salt}:${hash}`;
}

console.log('\n\ud83d\udd10 Brooklyn Barbearia - Password Hash Generator\n');
console.log('\u2705 A gerar hash com SHA-256 + salt...\n');

const hash = hashPassword(password);

console.log('\ud83d\udcdd Resultado:');
console.log('-'.repeat(80));
console.log(`Password: ${password}`);
console.log(`Hash:     ${hash}`);
console.log('-'.repeat(80));

console.log('\n\ud83d\udccb SQL para inserir na base de dados:\n');

console.log('-- Admin Geral:');
console.log(`INSERT INTO admin_users (username, password_hash, nome, role, ativo)`);
console.log(`VALUES ('admin', '${hash}', 'Administrador', 'admin', 1);\n`);

console.log('-- Barbeiro (ajustar barbeiro_id conforme necessário):');
console.log(`INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo)`);
console.log(`VALUES ('gui', '${hash}', 'Gui Pereira', 'barbeiro', 1, 1);\n`);

console.log('\u26a0\ufe0f  ATEN\u00c7\u00c3O: Use passwords diferentes para cada conta!\n');
console.log('\ud83d\udcdd NOTA: Este hash usa SHA-256 com salt (compatível com Cloudflare Workers)\n');
