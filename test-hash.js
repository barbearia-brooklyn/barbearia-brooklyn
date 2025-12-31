/**
 * Script de teste para verificar se o hash funciona corretamente
 * Uso: node test-hash.js
 */

const crypto = require('crypto');

// Função de hash (mesma do generate-hash.js)
function hashPassword(password, salt = null) {
    if (!salt) {
        salt = crypto.randomBytes(16).toString('hex');
    }
    
    const hash = crypto.createHash('sha256')
        .update(salt + password)
        .digest('hex');
    
    return `${salt}:${hash}`;
}

// Função de verificação (mesma do auth.js)
function verifyPassword(password, storedHash) {
    const [salt] = storedHash.split(':');
    const newHash = hashPassword(password, salt);
    return newHash === storedHash;
}

// TESTE
console.log('\n\ud83e\uddea Teste de Hash/Verify\n');

const testPassword = 'admin123';
const hash = hashPassword(testPassword);

console.log('Password:', testPassword);
console.log('Hash gerado:', hash);
console.log('');

// Teste 1: Verificar com password correta
const test1 = verifyPassword(testPassword, hash);
console.log('\u2705 Teste 1 - Password correta:', test1 ? 'PASSOU' : 'FALHOU');

// Teste 2: Verificar com password errada
const test2 = verifyPassword('wrong_password', hash);
console.log('\u274c Teste 2 - Password errada:', !test2 ? 'PASSOU' : 'FALHOU');

// Teste 3: Hash conhecido
const knownPassword = 'test123';
const knownHash = hashPassword(knownPassword);
console.log('\n\ud83d\udcdd Hash de teste para "test123":', knownHash);

const test3 = verifyPassword('test123', knownHash);
console.log('\u2705 Teste 3 - Verify com hash conhecido:', test3 ? 'PASSOU' : 'FALHOU');

// Teste 4: Usar hash da BD (se tiveres um)
if (process.argv[2] && process.argv[3]) {
    const dbPassword = process.argv[2];
    const dbHash = process.argv[3];
    
    console.log('\n\ud83d\udccb Teste com dados da BD:');
    console.log('Password:', dbPassword);
    console.log('Hash da BD:', dbHash);
    
    const test4 = verifyPassword(dbPassword, dbHash);
    console.log('Resultado:', test4 ? '\u2705 MATCH' : '\u274c NO MATCH');
}

console.log('\n\ud83d\udc49 Para testar com hash da BD:');
console.log('   node test-hash.js "sua_password" "hash_da_bd"\n');
