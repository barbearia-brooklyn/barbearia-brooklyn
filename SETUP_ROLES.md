# Setup do Sistema de Roles - Brooklyn Barbearia

## 📚 Índice
1. [Visão Geral](#visão-geral)
2. [Criar Tabela na Base de Dados](#1-criar-tabela-na-base-de-dados)
3. [Gerar Hashes de Passwords](#2-gerar-hashes-de-passwords)
4. [Criar Contas de Utilizadores](#3-criar-contas-de-utilizadores)
5. [Configurar Environment Variables](#4-configurar-environment-variables)
6. [Testar o Sistema](#5-testar-o-sistema)
7. [Troubleshooting](#troubleshooting)

---

## Visão Geral

### **Roles Disponíveis:**

#### **Admin (role='admin')**
- ✅ Acesso total ao sistema
- ✅ Vê TODAS as reservas
- ✅ Vê TODAS as indisponibilidades
- ✅ Acede à página de Clientes
- ✅ Pode criar reservas para qualquer barbeiro
- ✅ Vê dashboard com stats globais

#### **Barbeiro (role='barbeiro')**
- ✅ Vê APENAS as suas próprias reservas
- ✅ Vê APENAS as suas próprias indisponibilidades
- ❌ NÃO vê dados dos clientes
- ❌ NÃO acede à página de Clientes
- ❌ NÃO pode criar reservas (opcional)
- ✅ Vê dashboard com as suas stats

### **Tecnologias Usadas:**
- **Hashing**: SHA-256 com salt aleatório (Web Crypto API nativa)
- **JWT**: Assinatura HMAC-SHA256 (Web Crypto API nativa)
- **Zero dependências externas**: 100% compatível com Cloudflare Workers

---

## 1. Criar Tabela na Base de Dados

### **Opção A: Via Cloudflare Dashboard**

1. Aceder ao Cloudflare Dashboard
2. Ir para **Workers & Pages** > **D1**
3. Selecionar a base de dados do projeto
4. Ir para **Console**
5. Executar o seguinte SQL:

```sql
CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nome TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'barbeiro')),
    barbeiro_id INTEGER,
    ativo INTEGER DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_login DATETIME,
    FOREIGN KEY (barbeiro_id) REFERENCES barbeiros(id) ON DELETE CASCADE
);

CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_barbeiro_id ON admin_users(barbeiro_id);
```

### **Opção B: Via Wrangler CLI**

```bash
wrangler d1 execute DB --file=schema_roles.sql
```

---

## 2. Gerar Hashes de Passwords

### **Método: Node.js Script (RECOMENDADO)**

O script `generate-hash.js` usa SHA-256 com salt aleatório (mesmo algoritmo usado no backend).

```bash
node generate-hash.js "minhapassword123"
```

**Output esperado:**
```
🔐 Brooklyn Barbearia - Password Hash Generator

✅ A gerar hash com SHA-256 + salt...

📝 Resultado:
--------------------------------------------------------------------------------
Password: minhapassword123
Hash:     a1b2c3d4e5f6...abcdef:1234567890abcdef...
--------------------------------------------------------------------------------

📋 SQL para inserir na base de dados:

-- Admin Geral:
INSERT INTO admin_users (username, password_hash, nome, role, ativo)
VALUES ('admin', 'HASH_AQUI', 'Administrador', 'admin', 1);
```

**Importante:** O hash tem formato `salt:hash` onde:
- **salt**: 32 caracteres hexadecimais (16 bytes)
- **hash**: 64 caracteres hexadecimais (SHA-256)

---

## 3. Criar Contas de Utilizadores

### **3.1. Conta Admin Geral**

```bash
# 1. Gerar hash
node generate-hash.js "password_admin_super_segura"

# 2. Copiar o hash do output
# 3. Executar SQL
wrangler d1 execute DB --command "INSERT INTO admin_users (username, password_hash, nome, role, ativo) VALUES ('admin', 'HASH_COMPLETO_AQUI', 'Administrador', 'admin', 1)"
```

### **3.2. Contas dos Barbeiros**

**Importante:** O `barbeiro_id` deve corresponder ao ID na tabela `barbeiros`.

```bash
# Gui Pereira (ID=1)
node generate-hash.js "password_gui"
wrangler d1 execute DB --command "INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo) VALUES ('gui', 'HASH_GUI', 'Gui Pereira', 'barbeiro', 1, 1)"

# Johtta Barros (ID=2)
node generate-hash.js "password_johtta"
wrangler d1 execute DB --command "INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo) VALUES ('johtta', 'HASH_JOHTTA', 'Johtta Barros', 'barbeiro', 2, 1)"

# Weslley Santos (ID=3)
node generate-hash.js "password_weslley"
wrangler d1 execute DB --command "INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo) VALUES ('weslley', 'HASH_WESLLEY', 'Weslley Santos', 'barbeiro', 3, 1)"

# Marco Bonucci (ID=4)
node generate-hash.js "password_marco"
wrangler d1 execute DB --command "INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo) VALUES ('marco', 'HASH_MARCO', 'Marco Bonucci', 'barbeiro', 4, 1)"

# Ricardo Graça (ID=5)
node generate-hash.js "password_ricardo"
wrangler d1 execute DB --command "INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo) VALUES ('ricardo', 'HASH_RICARDO', 'Ricardo Graça', 'barbeiro', 5, 1)"
```

---

## 4. Configurar Environment Variables

### **4.1. Cloudflare Pages**

1. Ir para **Pages** > Projeto > **Settings** > **Environment variables**
2. Adicionar **JWT_SECRET** (production e preview):

```bash
# Gerar secret seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Exemplo de output:
# a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

**Adicionar no Cloudflare Pages:**
```
Variavel: JWT_SECRET
Valor: <secret_gerado_acima>
Environments: Production + Preview
```

### **4.2. Local Development (wrangler.toml)**

```toml
[vars]
JWT_SECRET = "brooklyn-secret-development-CHANGE-THIS"
```

**IMPORTANTE:** Usar secrets diferentes em desenvolvimento e produção!

---

## 5. Testar o Sistema

### **5.1. Testar Login Admin**

1. Ir para `/admin/login.html`
2. Login: `admin`
3. Password: (a que definiste)
4. Verificar:
   - ✅ Redireciona para `/admin/dashboard`
   - ✅ Header mostra "Administrador"
   - ✅ Menu mostra "Clientes" e "Nova Reserva"
   - ✅ Dashboard mostra todas as stats

### **5.2. Testar Login Barbeiro**

1. Logout do admin
2. Login: `gui` (ou outro barbeiro)
3. Password: (a que definiste)
4. Verificar:
   - ❌ Página "Clientes" NÃO aparece no menu
   - ❌ Página "Nova Reserva" NÃO aparece no menu
   - ✅ Reservas mostram apenas as do barbeiro
   - ✅ Indisponibilidades mostram apenas as do barbeiro
   - ✅ Header mostra nome do barbeiro

### **5.3. Testar Redirecionamento**

Como barbeiro, tentar aceder:
- `/admin/clients.html` → Deve redirecionar para dashboard
- `/admin/client-detail.html?id=1` → Deve redirecionar para dashboard

---

## Troubleshooting

### **Erro: "Credenciais inválidas"**

**Causa:** Password hash incorreto ou username errado.

**Solução:**
1. Verificar se o username existe na BD:
```bash
wrangler d1 execute DB --command "SELECT username, nome, role FROM admin_users"
```

2. Regenerar hash da password e atualizar:
```bash
node generate-hash.js "nova_password"
wrangler d1 execute DB --command "UPDATE admin_users SET password_hash = 'NOVO_HASH' WHERE username = 'admin'"
```

### **Erro: "Token inválido ou expirado"**

**Causa:** JWT_SECRET diferente entre geração e validação.

**Solução:**
1. Verificar env variable `JWT_SECRET` em Cloudflare Pages
2. Fazer logout e login novamente
3. Verificar logs no Cloudflare:
   - Ir para Workers & Pages > Projeto > Logs
   - Procurar por erros de JWT

### **Barbeiro vê todas as reservas**

**Causa:** Filtro por role não está a funcionar.

**Solução:**
1. Verificar logs no Cloudflare:
   ```
   👤 User autenticado: gui Role: barbeiro
   🔒 Filtro barbeiro aplicado: 1
   ```

2. Verificar se `barbeiro_id` está correto na BD:
```bash
wrangler d1 execute DB --command "SELECT username, role, barbeiro_id FROM admin_users WHERE username = 'gui'"
```

### **Erro: "Build failed - Could not resolve..."**

**Causa:** Tentativa de usar dependências externas incompatveis com Cloudflare Workers.

**Solução:** Já resolvido! O sistema agora usa **Web Crypto API nativa** (sem dependências).

---

## 📦 Comandos Rápidos

### **Setup Completo**

```bash
# 1. Criar tabela
wrangler d1 execute DB --file=schema_roles.sql

# 2. Gerar hash para admin
node generate-hash.js "admin_password_123"

# 3. Criar conta admin (substituir HASH)
wrangler d1 execute DB --command "INSERT INTO admin_users (username, password_hash, nome, role, ativo) VALUES ('admin', 'HASH_AQUI', 'Administrador', 'admin', 1)"

# 4. Criar contas barbeiros (repetir para cada um)
node generate-hash.js "gui_password_123"
wrangler d1 execute DB --command "INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo) VALUES ('gui', 'HASH_GUI', 'Gui Pereira', 'barbeiro', 1, 1)"

# 5. Configurar JWT_SECRET no Cloudflare Pages
# (via Dashboard: Settings > Environment variables)

# 6. Deploy
git push origin fix/admin-cleanup-and-fixes
# Cloudflare faz deploy automático
```

### **Verificar Contas Criadas**

```bash
wrangler d1 execute DB --command "SELECT id, username, nome, role, barbeiro_id, ativo FROM admin_users"
```

### **Reset Password**

```bash
# Gerar novo hash
node generate-hash.js "nova_password_123"

# Atualizar na BD
wrangler d1 execute DB --command "UPDATE admin_users SET password_hash = 'NOVO_HASH' WHERE username = 'admin'"
```

---

## 🔒 Segurança

### **Algoritmo de Hashing:**
- **SHA-256** com salt aleatório de 16 bytes
- Salt único por password (armazenado junto com o hash)
- Formato: `salt:hash` (32 + 1 + 64 = 97 caracteres)
- **Sem rainbow tables**: Salt aleatório previne ataques pre-computados

### **JWT:**
- Assinatura **HMAC-SHA256**
- Expiração de **24 horas**
- Secret mínimo de 32 bytes (256 bits)

### **Boas Práticas:**

1. **Passwords fortes:** Mínimo 12 caracteres, letras + números + símbolos
2. **JWT_SECRET seguro:** 64+ caracteres hexadecimais
3. **HTTPS:** Sempre em produção (Cloudflare fornece automático)
4. **Tokens expiram:** 24 horas (ajustável no código)
5. **Logs:** Monitorizar acessos via Cloudflare Dashboard

### **Rotação de JWT_SECRET:**

1. Gerar novo secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Atualizar env variable no Cloudflare
3. Redeploy (automático ao alterar env vars)
4. Todos os users precisam fazer login novamente

---

## 👥 Gestão de Contas

### **Desativar Conta**

```bash
wrangler d1 execute DB --command "UPDATE admin_users SET ativo = 0 WHERE username = 'gui'"
```

### **Reativar Conta**

```bash
wrangler d1 execute DB --command "UPDATE admin_users SET ativo = 1 WHERE username = 'gui'"
```

### **Mudar Role**

```bash
# Promover barbeiro a admin
wrangler d1 execute DB --command "UPDATE admin_users SET role = 'admin', barbeiro_id = NULL WHERE username = 'gui'"

# Despromover admin a barbeiro
wrangler d1 execute DB --command "UPDATE admin_users SET role = 'barbeiro', barbeiro_id = 1 WHERE username = 'admin'"
```

---

## ✅ Checklist Final

- [ ] Tabela `admin_users` criada
- [ ] JWT_SECRET configurado no Cloudflare Pages
- [ ] Conta admin criada e testada
- [ ] Contas de barbeiros criadas e testadas
- [ ] Admin vê todas as reservas
- [ ] Barbeiro vê apenas as suas reservas
- [ ] Barbeiro NÃO acede a página de clientes
- [ ] Header mostra nome do utilizador
- [ ] Logout funciona corretamente
- [ ] Redirecionamentos funcionam
- [ ] Build do Cloudflare Pages passa sem erros

---

## 🎆 Vantagens da Implementação Atual

✅ **Zero dependências externas** - 100% Web Crypto API nativa
✅ **Build instantâneo** - Sem npm install no Cloudflare
✅ **Edge-native** - Otimizado para Cloudflare Workers
✅ **Seguro** - SHA-256 com salt aleatório
✅ **Rápido** - Crypto nativo mais rápido que bibliotecas JS
✅ **Compatível** - Funciona em qualquer ambiente Web API

---

🎉 **Setup completo! Sistema de roles operacional.**
