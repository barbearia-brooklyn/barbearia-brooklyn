# Sistema de Roles - Brooklyn Barbearia

## 🎉 Implementação Completa

Sistema de autenticação e autorização com roles implementado com sucesso!

---

## 📋 Resumo das Alterações

### **1. Base de Dados**
- ✅ Nova tabela `admin_users` criada
- ✅ Campos: `id`, `username`, `password_hash`, `nome`, `role`, `barbeiro_id`, `ativo`
- ✅ Roles suportados: `admin` e `barbeiro`
- ✅ Índices otimizados para performance

### **2. Backend (APIs)**
- ✅ `api_admin_login.js` - Autenticação com JWT e bcrypt
- ✅ `auth.js` - Middleware de autenticação e autorização
- ✅ `api_admin_reservas.js` - Filtro por role (barbeiro vê só as suas)
- ✅ `api_horarios_indisponiveis.js` - Filtro por role
- ✅ JWT com expiração de 24 horas
- ✅ Bcrypt para hashing de passwords

### **3. Frontend**
- ✅ `header.html` - Removido seletor de perfis, adicionado user info
- ✅ `header-loader.js` - Aplica permissões baseadas no role
- ✅ `auth.js` - Helper de autenticação client-side
- ✅ `login.js` - Guarda user info no localStorage
- ✅ Esconde páginas de clientes para barbeiros
- ✅ Redireciona barbeiros se tentarem aceder páginas restritas

### **4. Dependências**
- ✅ `@tsndr/cloudflare-worker-jwt` - JWT para Cloudflare Workers
- ✅ `bcryptjs` - Hashing de passwords

### **5. Documentação**
- ✅ `SETUP_ROLES.md` - Guia completo de setup
- ✅ `generate-hash.js` - Script para gerar hashes
- ✅ `schema_roles.sql` - Schema da tabela

---

## 👥 Permissões por Role

| Funcionalidade | Admin | Barbeiro |
|----------------|-------|----------|
| Dashboard | ✅ Todas as stats | ✅ Apenas suas stats |
| Calendário | ✅ Todos os barbeiros | ✅ Apenas próprio |
| Reservas | ✅ Ver todas | ✅ Ver apenas próprias |
| Nova Reserva | ✅ Sim | ❌ Não |
| Clientes | ✅ Ver listagem e detalhes | ❌ Não |
| Indisponibilidades | ✅ Ver todas | ✅ Ver apenas próprias |
| Gestão Users | ✅ Sim (futuro) | ❌ Não |

---

## 🚀 Como Usar

### **Setup Inicial (Uma vez)**

```bash
# 1. Instalar dependências
npm install

# 2. Criar tabela na BD (via Wrangler ou Dashboard)
wrangler d1 execute DB --file=schema_roles.sql

# 3. Gerar hash para admin
node generate-hash.js "password_segura_admin"

# 4. Criar conta admin na BD
wrangler d1 execute DB --command "INSERT INTO admin_users (username, password_hash, nome, role, ativo) VALUES ('admin', 'HASH_AQUI', 'Administrador', 'admin', 1)"

# 5. Gerar hashes para barbeiros
node generate-hash.js "password_gui"
node generate-hash.js "password_johtta"
# ... etc

# 6. Criar contas dos barbeiros
wrangler d1 execute DB --command "INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo) VALUES ('gui', 'HASH_GUI', 'Gui Pereira', 'barbeiro', 1, 1)"
# ... repetir para cada barbeiro

# 7. Configurar JWT_SECRET no Cloudflare
# Pages > Settings > Environment variables
# JWT_SECRET=<gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

# 8. Deploy
npm run deploy
```

### **Login**

#### **Como Admin:**
```
URL: /admin/login.html
Username: admin
Password: (a que definiste)

Acesso: TOTAL
```

#### **Como Barbeiro:**
```
URL: /admin/login.html
Username: gui (ou johtta, weslley, marco, ricardo)
Password: (a que definiste)

Acesso: Apenas próprios dados
```

---

## 🔒 Segurança

### **O que foi implementado:**

1. **Passwords hashadas com bcrypt** - Nunca guardadas em plain text
2. **JWT tokens** - Assinados e com expiração
3. **Validação server-side** - Todas as APIs verificam token
4. **Validação client-side** - Páginas verificam permissões
5. **Redirecionamentos automáticos** - Barbeiros não acedem páginas restritas
6. **Filtros SQL** - Barbeiros só veem os seus dados na query

### **Boas Práticas:**

- ✅ Usar passwords fortes (min 12 caracteres)
- ✅ JWT_SECRET diferente em prod e dev
- ✅ Rodar JWT_SECRET periodicamente
- ✅ Monitorizar logs de acesso
- ✅ HTTPS sempre em produção

---

## 🔧 Gestão de Contas

### **Criar Nova Conta**

```bash
# 1. Gerar hash
node generate-hash.js "nova_password"

# 2. Inserir na BD
wrangler d1 execute DB --command "INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo) VALUES ('novo_user', 'HASH', 'Nome Completo', 'barbeiro', BARBEIRO_ID, 1)"
```

### **Desativar Conta**

```bash
wrangler d1 execute DB --command "UPDATE admin_users SET ativo = 0 WHERE username = 'gui'"
```

### **Reset Password**

```bash
# 1. Gerar novo hash
node generate-hash.js "nova_password"

# 2. Atualizar na BD
wrangler d1 execute DB --command "UPDATE admin_users SET password_hash = 'NOVO_HASH' WHERE username = 'gui'"
```

### **Listar Contas**

```bash
wrangler d1 execute DB --command "SELECT id, username, nome, role, barbeiro_id, ativo FROM admin_users"
```

---

## 📝 Fluxo de Autenticação

```
1. User abre /admin/login.html
   ↓
2. Insere username + password
   ↓
3. Frontend envia para /api/admin/api_admin_login
   ↓
4. Backend:
   - Valida Turnstile
   - Busca user na BD
   - Verifica password com bcrypt
   - Gera JWT token
   - Retorna token + user info
   ↓
5. Frontend:
   - Guarda token em localStorage (admin_token)
   - Guarda user info em localStorage (admin_user)
   - Redireciona para /admin/dashboard
   ↓
6. Nas próximas requisições:
   - Frontend envia token no header Authorization: Bearer <token>
   - Backend valida token com middleware authenticate()
   - Aplica filtros baseados no role
   - Retorna dados filtrados
```

---

## 🐛 Troubleshooting

Ver ficheiro `SETUP_ROLES.md` para troubleshooting detalhado.

### **Problemas Comuns:**

1. **"Credenciais inválidas"**
   - Verificar username e password
   - Regenerar hash se necessário

2. **"Token inválido"**
   - Verificar JWT_SECRET
   - Fazer logout e login novamente

3. **Barbeiro vê todos os dados**
   - Verificar barbeiro_id na BD
   - Verificar logs das APIs

4. **Páginas não escondem para barbeiro**
   - Verificar admin_user no localStorage
   - Limpar cache do browser

---

## 📊 Logs e Monitoring

### **Logs Importantes:**

```javascript
// No login:
✅ Login bem-sucedido: gui Role: barbeiro

// Nas APIs:
👤 User autenticado: gui Role: barbeiro
🔒 Filtro barbeiro aplicado: 1
✅ 5 reservas encontradas
```

### **Ver Logs no Cloudflare:**

1. Ir para **Workers & Pages**
2. Selecionar projeto
3. Ir para **Logs**
4. Filtrar por erros ou pesquisar por username

---

## ✅ Checklist de Verificação

Depois do deploy, verificar:

- [ ] Login admin funciona
- [ ] Login barbeiro funciona
- [ ] Admin vê todas as reservas
- [ ] Barbeiro vê apenas as suas reservas
- [ ] Barbeiro NÃO vê página de clientes no menu
- [ ] Barbeiro NÃO vê página de nova reserva no menu
- [ ] Header mostra nome do utilizador
- [ ] Logout funciona
- [ ] Barbeiro é redirecionado se tentar aceder /admin/clients.html
- [ ] Tokens expiram após 24 horas
- [ ] Logs aparecem corretamente no Cloudflare

---

## 🚀 Próximos Passos (Opcional)

1. **Página de gestão de users** (apenas admin)
2. **Logs de auditoria** (quem fez o quê)
3. **2FA** (two-factor authentication)
4. **Permissões mais granulares** (ex: barbeiro pode ver stats globais)
5. **Reset password via email**
6. **Sessões múltiplas** (login em vários dispositivos)

---

🎉 **Sistema de roles totalmente funcional!**

Para mais detalhes, consultar `SETUP_ROLES.md`.
