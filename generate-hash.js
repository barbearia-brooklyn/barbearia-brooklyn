/**
 * Brooklyn Barbearia - Password Hash Generator
 * Gera hashes bcrypt para passwords de admin users
 * 
 * Uso: node generate-hash.js <password>
 * Exemplo: node generate-hash.js "admin123"
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
    console.log('❌ Erro: Password não fornecida\n');
    console.log('Uso: node generate-hash.js <password>');
    console.log('Exemplo: node generate-hash.js "admin123"\n');
    process.exit(1);
}

console.log('\n🔐 Brooklyn Barbearia - Password Hash Generator\n');
console.log('✅ A gerar hash...');

const hash = bcrypt.hashSync(password, 10);

console.log('\n📝 Resultado:');
console.log('-'.repeat(80));
console.log(`Password: ${password}`);
console.log(`Hash:     ${hash}`);
console.log('-'.repeat(80));

console.log('\n📋 SQL para inserir na base de dados:\n');

console.log('-- Admin Geral:');
console.log(`INSERT INTO admin_users (username, password_hash, nome, role, ativo)`);
console.log(`VALUES ('admin', '${hash}', 'Administrador', 'admin', 1);\n`);

console.log('-- Barbeiro (ajustar barbeiro_id):');
console.log(`INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo)`);
console.log(`VALUES ('gui', '${hash}', 'Gui Pereira', 'barbeiro', 1, 1);\n`);

console.log('⚠️  ATENÇÃO: Use passwords diferentes para cada conta!\n');
