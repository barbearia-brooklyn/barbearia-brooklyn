# Setup do Sistema de Roles - Brooklyn Barbearia

## 📚 Índice
1. [Visão Geral](#visão-geral)
2. [Criar Tabela na Base de Dados](#1-criar-tabela-na-base-de-dados)
3. [Instalar Dependências](#2-instalar-dependências)
4. [Gerar Hashes de Passwords](#3-gerar-hashes-de-passwords)
5. [Criar Contas de Utilizadores](#4-criar-contas-de-utilizadores)
6. [Configurar Environment Variables](#5-configurar-environment-variables)
7. [Testar o Sistema](#6-testar-o-sistema)
8. [Troubleshooting](#troubleshooting)

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

## 2. Instalar Dependências

```bash
npm install @tsndr/cloudflare-worker-jwt bcryptjs
```

---

## 3. Gerar Hashes de Passwords

### **Método 1: Node.js Script**

Criar um ficheiro `generate-hash.js`:

```javascript
const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
    console.log('Uso: node generate-hash.js <password>');
    process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('Password:', password);
console.log('Hash:', hash);
```

Executar:

```bash
node generate-hash.js "minhapassword123"
```

### **Método 2: Online (NÃO RECOMENDADO para produção)**

Usar: https://bcrypt-generator.com/

**ATENÇÃO:** Para produção, usar sempre o método 1 para segurança.

---

## 4. Criar Contas de Utilizadores

### **4.1. Conta Admin Geral**

```sql
INSERT INTO admin_users (username, password_hash, nome, role, ativo) 
VALUES (
    'admin', 
    '$2a$10$SEU_HASH_AQUI', 
    'Administrador', 
    'admin', 
    1
);
```

### **4.2. Contas dos Barbeiros**

**Importante:** O `barbeiro_id` deve corresponder ao ID na tabela `barbeiros`.

```sql
-- Gui Pereira (ID=1)
INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo) 
VALUES (
    'gui', 
    '$2a$10$SEU_HASH_AQUI', 
    'Gui Pereira', 
    'barbeiro', 
    1, 
    1
);

-- Johtta Barros (ID=2)
INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo) 
VALUES (
    'johtta', 
    '$2a$10$SEU_HASH_AQUI', 
    'Johtta Barros', 
    'barbeiro', 
    2, 
    1
);

-- Weslley Santos (ID=3)
INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo) 
VALUES (
    'weslley', 
    '$2a$10$SEU_HASH_AQUI', 
    'Weslley Santos', 
    'barbeiro', 
    3, 
    1
);

-- Marco Bonucci (ID=4)
INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo) 
VALUES (
    'marco', 
    '$2a$10$SEU_HASH_AQUI', 
    'Marco Bonucci', 
    'barbeiro', 
    4, 
    1
);

-- Ricardo Graça (ID=5)
INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo) 
VALUES (
    'ricardo', 
    '$2a$10$SEU_HASH_AQUI', 
    'Ricardo Graça', 
    'barbeiro', 
    5, 
    1
);
```

### **4.3. Executar via Wrangler**

```bash
wrangler d1 execute DB --command "INSERT INTO admin_users ..."
```

---

## 5. Configurar Environment Variables

### **5.1. Cloudflare Pages**

1. Ir para **Pages** > Projeto > **Settings** > **Environment variables**
2. Adicionar:

```
JWT_SECRET=brooklyn-secret-2025-MUDAR_PARA_ALGO_SEGURO
```

**IMPORTANTE:** Gerar um secret seguro:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **5.2. Local Development (wrangler.toml)**

```toml
[vars]
JWT_SECRET = "brooklyn-secret-development"
```

---

## 6. Testar o Sistema

### **6.1. Testar Login Admin**

1. Ir para `/admin/login.html`
2. Login: `admin`
3. Password: (a que definiste)
4. Verificar acesso total

### **6.2. Testar Login Barbeiro**

1. Logout do admin
2. Login: `gui` (ou outro barbeiro)
3. Password: (a que definiste)
4. Verificar:
   - ❌ Página "Clientes" NÃO aparece no menu
   - ❌ Página "Nova Reserva" NÃO aparece no menu
   - ✅ Reservas mostram apenas as do barbeiro
   - ✅ Indisponibilidades mostram apenas as do barbeiro
   - ✅ Header mostra nome do barbeiro

### **6.3. Testar Redirecionamento**

Como barbeiro, tentar aceder:
- `/admin/clients.html` → Deve redirecionar para dashboard
- `/admin/client-detail.html?id=1` → Deve redirecionar para dashboard

---

## Troubleshooting

### **Erro: "Credenciais inválidas"**

**Causa:** Password hash incorreto ou username errado.

**Solução:**
1. Verificar se o username existe na BD:
```sql
SELECT username, nome, role FROM admin_users;
```

2. Regenerar hash da password e atualizar:
```sql
UPDATE admin_users SET password_hash = '$2a$10$NOVO_HASH' WHERE username = 'admin';
```

### **Erro: "Token inválido ou expirado"**

**Causa:** JWT_SECRET diferente entre geração e validação.

**Solução:**
1. Verificar env variable `JWT_SECRET` em Cloudflare
2. Fazer logout e login novamente

### **Barbeiro vê todas as reservas**

**Causa:** Filtro por role não está a funcionar.

**Solução:**
1. Verificar logs no Cloudflare:
   - `console.log('User autenticado:', user.username, 'Role:', user.role)`
   - `console.log('Filtro barbeiro aplicado:', user.barbeiro_id)`

2. Verificar se `barbeiro_id` está correto na BD:
```sql
SELECT username, role, barbeiro_id FROM admin_users WHERE username = 'gui';
```

### **Header não mostra nome do utilizador**

**Causa:** `admin_user` não está no localStorage.

**Solução:**
1. Verificar no DevTools > Application > Local Storage
2. Deve existir chave `admin_user` com JSON:
```json
{
  "id": 1,
  "username": "gui",
  "nome": "Gui Pereira",
  "role": "barbeiro",
  "barbeiro_id": 1
}
```

3. Se não existir, fazer logout e login novamente

### **Dependências não instalam**

**Erro:** `Module not found: @tsndr/cloudflare-worker-jwt`

**Solução:**
```bash
rm -rf node_modules package-lock.json
npm install
npm install @tsndr/cloudflare-worker-jwt bcryptjs
```

---

## 📦 Comandos Rápidos

### **Setup Completo (Local)**

```bash
# 1. Instalar dependências
npm install

# 2. Criar tabela
wrangler d1 execute DB --file=schema_roles.sql

# 3. Gerar hash (exemplo)
node generate-hash.js "admin123"

# 4. Criar conta admin
wrangler d1 execute DB --command "INSERT INTO admin_users (username, password_hash, nome, role, ativo) VALUES ('admin', 'HASH_AQUI', 'Administrador', 'admin', 1)"

# 5. Deploy
npm run deploy
```

### **Verificar Contas Criadas**

```bash
wrangler d1 execute DB --command "SELECT username, nome, role, barbeiro_id, ativo FROM admin_users"
```

### **Reset Password**

```bash
# Gerar novo hash
node generate-hash.js "nova_password"

# Atualizar na BD
wrangler d1 execute DB --command "UPDATE admin_users SET password_hash = 'NOVO_HASH' WHERE username = 'admin'"
```

---

## 🔒 Segurança

### **Boas Práticas:**

1. **Passwords fortes:** Mínimo 12 caracteres, com letras, números e símbolos
2. **JWT_SECRET seguro:** Usar `crypto.randomBytes(32).toString('hex')`
3. **HTTPS:** Sempre em produção
4. **Tokens expiram:** 24 horas (configurado no login)
5. **Logs:** Monitorizar acessos suspeitos

### **Rotação de JWT_SECRET:**

1. Gerar novo secret
2. Atualizar env variable
3. Todos os users precisam fazer login novamente

---

## 👥 Gestão de Contas

### **Desativar Conta**

```sql
UPDATE admin_users SET ativo = 0 WHERE username = 'gui';
```

### **Reativar Conta**

```sql
UPDATE admin_users SET ativo = 1 WHERE username = 'gui';
```

### **Mudar Role**

```sql
-- Promover barbeiro a admin
UPDATE admin_users SET role = 'admin', barbeiro_id = NULL WHERE username = 'gui';

-- Despromover admin a barbeiro
UPDATE admin_users SET role = 'barbeiro', barbeiro_id = 1 WHERE username = 'gui';
```

---

## ✅ Checklist Final

- [ ] Tabela `admin_users` criada
- [ ] Dependências instaladas (`@tsndr/cloudflare-worker-jwt`, `bcryptjs`)
- [ ] JWT_SECRET configurado em production
- [ ] Conta admin criada e testada
- [ ] Contas de barbeiros criadas e testadas
- [ ] Admin vê todas as reservas
- [ ] Barbeiro vê apenas as suas reservas
- [ ] Barbeiro NÃO acede a página de clientes
- [ ] Header mostra nome do utilizador
- [ ] Logout funciona corretamente
- [ ] Redirecionamentos funcionam

---

🎉 **Setup completo! Sistema de roles operacional.**
