# Troubleshooting Login

## 🐛 Problema: Login falha com "Credenciais inválidas"

### **Causa Mais Provável**

A password hash na base de dados foi gerada com o **algoritmo antigo (bcrypt)** em vez do **novo algoritmo (SHA-256 + salt)**.

---

## ✅ Solução Rápida

### **1. Testar Hash Localmente**

```bash
# Testar se o algoritmo funciona
node test-hash.js

# Testar com a tua password e hash da BD
node test-hash.js "admin123" "hash_da_bd_aqui"
```

**Output esperado:**
```
🧪 Teste de Hash/Verify

Password: admin123
Hash gerado: a1b2c3d4e5f6...abc:123456789...

✅ Teste 1 - Password correta: PASSOU
❌ Teste 2 - Password errada: PASSOU
📝 Hash de teste para "test123": ...
✅ Teste 3 - Verify com hash conhecido: PASSOU
```

### **2. Gerar Novo Hash**

```bash
node generate-hash.js "sua_password_aqui"
```

**Copiar o hash do output** (formato: `salt:hash`, ~97 caracteres)

### **3. Atualizar na Base de Dados**

```bash
wrangler d1 execute DB --command "UPDATE admin_users SET password_hash = 'NOVO_HASH_AQUI' WHERE username = 'admin'"
```

**Ou via Cloudflare Dashboard:**
1. Workers & Pages > D1
2. Selecionar base de dados
3. Console
4. Executar:
```sql
UPDATE admin_users 
SET password_hash = 'NOVO_HASH_AQUI' 
WHERE username = 'admin';
```

---

## 🔍 Diagnóstico Detalhado

### **Verificar Logs no Cloudflare**

1. Ir para **Cloudflare Dashboard**
2. **Workers & Pages** > Projeto
3. **Logs** (tab no topo)
4. Fazer login no site
5. Ver logs em tempo real

**Logs esperados (sucesso):**
```
=== LOGIN API CHAMADA ===
Request method: POST
👤 Username recebido: admin
🔑 Password recebida: ***123
📊 A procurar user na BD...
✅ User encontrado: admin
🔑 Password hash da BD: a1b2c3d4e5f6...
🔍 A verificar password...
🔑 Password válida? true
✅ Password válida!
✅ Login bem-sucedido: admin Role: admin
=== FIM LOGIN API ===
```

**Logs com erro (password inválida):**
```
🔑 Password válida? false
❌ Password inválida para user: admin
  - Password fornecida: admin123
  - Hash na BD: $2a$10$abc... <-- BCRYPT (ANTIGO!)
```

---

## 🧰 Identificar Tipo de Hash

### **Hash SHA-256 + Salt (NOVO - CORRETO)**
Formato: `salt:hash`
- Tamanho: ~97 caracteres
- Exemplo: `a1b2c3d4e5f6789012345678901234567890abcd:123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`
- Começa com: Letras/números hexadecimais
- Contém: Um `:` no meio

### **Hash Bcrypt (ANTIGO - ERRADO)**
Formato: `$2a$10$...`
- Tamanho: ~60 caracteres
- Exemplo: `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`
- Começa com: `$2a$` ou `$2b$`

**Se o hash na BD começa com `$2a$` ou `$2b$`, é bcrypt e precisa ser regenerado!**

---

## 🔧 Resolver Passo-a-Passo

### **Cenrio 1: Hash Bcrypt na BD**

```bash
# 1. Verificar hash atual
wrangler d1 execute DB --command "SELECT username, password_hash FROM admin_users WHERE username = 'admin'"

# Output:
# username | password_hash
# admin    | $2a$10$abc...xyz  <-- BCRYPT!

# 2. Gerar novo hash SHA-256
node generate-hash.js "admin123"

# 3. Copiar hash do output
# Hash: a1b2c3d4e5f6...abc:123456789...

# 4. Atualizar na BD
wrangler d1 execute DB --command "UPDATE admin_users SET password_hash = 'a1b2c3d4e5f6...abc:123456789...' WHERE username = 'admin'"

# 5. Verificar atualização
wrangler d1 execute DB --command "SELECT username, password_hash FROM admin_users WHERE username = 'admin'"

# 6. Testar login no site
```

### **Cenrio 2: Hash SHA-256 mas password errada**

```bash
# 1. Obter hash da BD
wrangler d1 execute DB --command "SELECT password_hash FROM admin_users WHERE username = 'admin'"

# 2. Testar localmente com várias passwords
node test-hash.js "admin123" "hash_da_bd_aqui"
node test-hash.js "admin" "hash_da_bd_aqui"
node test-hash.js "password" "hash_da_bd_aqui"

# Se nenhuma funcionar, gerar novo hash e atualizar na BD
```

### **Cenrio 3: API não responde (retorna HTML)**

Se ao aceder `https://site.com/api/admin/api_admin_login` retorna HTML em vez de JSON:

**Causa:** Cloudflare Pages Functions não ativadas corretamente.

**Solução:**
1. Verificar estrutura:
```
functions/
  api/
    admin/
      api_admin_login.js  <-- Deve estar aqui
      auth.js
```

2. Redeploy forçado:
```bash
git commit --allow-empty -m "Force redeploy"
git push
```

3. Verificar logs de build no Cloudflare:
   - Pages > Projeto > Deployments
   - Ver último deployment
   - Verificar se "Functions" foram detectadas

---

## 👉 Comandos Úteis

### **Ver todos os users e hashes**
```bash
wrangler d1 execute DB --command "SELECT id, username, LEFT(password_hash, 20) as hash_preview, role FROM admin_users"
```

### **Resetar password de todos os users**
```bash
# Gerar hashes
node generate-hash.js "password_admin"
node generate-hash.js "password_barbeiro"

# Atualizar
wrangler d1 execute DB --command "UPDATE admin_users SET password_hash = 'HASH_ADMIN' WHERE role = 'admin'"
wrangler d1 execute DB --command "UPDATE admin_users SET password_hash = 'HASH_BARBEIRO' WHERE role = 'barbeiro'"
```

### **Verificar se JWT_SECRET está configurado**
Cloudflare Pages > Settings > Environment variables > JWT_SECRET

---

## ❓ FAQ

### **P: Porque é que mudou de bcrypt para SHA-256?**
R: Bcrypt não funciona nativamente no Cloudflare Workers. SHA-256 é nativo (Web Crypto API) e mais rápido.

### **P: SHA-256 é seguro?**
R: Sim! Com salt aleatório (16 bytes) por password, é resistente a:
- Rainbow tables
- Dictionary attacks
- Brute force (com passwords fortes)

### **P: Preciso atualizar todos os hashes?**
R: Sim, se foram gerados com o script antigo (bcrypt). Use `generate-hash.js`.

### **P: Como sei se o hash está correto?**
R: Execute:
```bash
node test-hash.js "sua_password" "hash_da_bd"
```
Deve mostrar `✅ MATCH`.

---

## 🎆 Checklist Final

- [ ] Hash na BD é SHA-256 (não bcrypt)
- [ ] Hash tem ~97 caracteres
- [ ] Hash contém `:` no meio
- [ ] `test-hash.js` retorna MATCH
- [ ] Logs do Cloudflare mostram "Password válida? true"
- [ ] Login funciona no site

---

🎉 **Se todos os checks passarem, o login deve funcionar!**
