# 🔐 Sistema de Autenticação OAuth2 - Brooklyn Barbearia

## 🎯 Visão Geral

Implementação completa de login social (Google, Facebook, Instagram) com gestão de contas vinculadas e suporte para clientes importados.

---

## ✨ Funcionalidades

### 🔑 Autenticação
- **Login Social**: Google, Facebook, Instagram
- **Login Tradicional**: Email OU Telefone + Password
- **Registo**: Criação de conta com validação
- **Recuperação**: Reset de password por email

### 👥 Clientes Importados
- Detecção automática: `password_hash = 'cliente_nunca_iniciou_sessão'`
- Redirecionamento para conclusão de perfil
- Pré-preenchimento de dados conhecidos
- Edição de dados pré-preenchidos
- Atualização na BD ao completar perfil

### 🔗 Gestão de Contas
- Visualização de contas vinculadas
- Associação de múltiplas contas sociais
- Desassociação com validação de segurança
- Obrigação de password para desassociar último método
- Modal de definição de password

### 🔒 Segurança
- State CSRF protection
- JWT com expiração (7 dias)
- Tokens OAuth temporários (10 min)
- HttpOnly cookies
- Validação de métodos de autenticação

---

## 🛠️ Instalação

### 1️⃣ Executar Migração SQL

```bash
npx wrangler d1 execute barbearia_brooklyn_db --file=./migrations/002_oauth_schema.sql
```

Isto cria:
- Colunas: `google_id`, `facebook_id`, `instagram_id`, `auth_methods`
- Índices para melhor performance

### 2️⃣ Criar KV Namespace

```bash
# Criar namespace para states OAuth
npx wrangler kv:namespace create "KV_OAUTH"

# Copiar o ID retornado e adicionar ao wrangler.toml
```

Adicionar ao `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "KV_OAUTH"
id = "seu-namespace-id-aqui"
```

### 3️⃣ Configurar Apps OAuth

#### Google:
1. [Google Cloud Console](https://console.cloud.google.com/)
2. Criar projeto → APIs & Services → Credentials
3. OAuth 2.0 Client ID → Web application
4. Authorized redirect URI: `https://seu-dominio.com/api/api_auth/oauth/google/callback`
5. Copiar Client ID e Client Secret

#### Facebook:
1. [Meta for Developers](https://developers.facebook.com/)
2. Create App → Consumer
3. Adicionar Facebook Login
4. Valid OAuth Redirect URI: `https://seu-dominio.com/api/api_auth/oauth/facebook/callback`
5. Copiar App ID e App Secret

#### Instagram:
1. Mesma app do Facebook
2. Adicionar Instagram Basic Display
3. Valid OAuth Redirect URI: `https://seu-dominio.com/api/api_auth/oauth/instagram/callback`
4. Copiar Instagram App ID e Secret

📚 **Detalhes completos**: Ver `docs/OAUTH_SETUP.md`

### 4️⃣ Configurar Secrets

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put FACEBOOK_CLIENT_ID
npx wrangler secret put FACEBOOK_CLIENT_SECRET
npx wrangler secret put INSTAGRAM_CLIENT_ID
npx wrangler secret put INSTAGRAM_CLIENT_SECRET
npx wrangler secret put BASE_URL
npx wrangler secret put JWT_SECRET
```

**Valores**:
- `GOOGLE_CLIENT_ID`: Do Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: Do Google Cloud Console
- `FACEBOOK_CLIENT_ID`: App ID do Facebook
- `FACEBOOK_CLIENT_SECRET`: App Secret do Facebook
- `INSTAGRAM_CLIENT_ID`: Instagram App ID
- `INSTAGRAM_CLIENT_SECRET`: Instagram App Secret
- `BASE_URL`: `https://seu-dominio.com` (sem trailing slash)
- `JWT_SECRET`: String aleatória segura (32+ caracteres)

### 5️⃣ Incluir CSS no HTML

Adicionar aos ficheiros HTML:

**login.html**:
```html
<link rel="stylesheet" href="css/oauth-styles.css">
<link rel="stylesheet" href="css/auth-improvements.css">
```

**perfil.html**:
```html
<link rel="stylesheet" href="css/oauth-styles.css">
<script src="js/profile-oauth.js"></script>
```

### 6️⃣ Deploy

```bash
npx wrangler deploy
```

---

## 📚 Estrutura de Ficheiros

```
barbearia-brooklyn/
├── functions/
│   ├── api/
│   │   ├── api_auth/
│   │       ├── complete-profile.js       # Completar perfil importado
│   │       ├── linked-accounts.js        # GET contas vinculadas
│   │       ├── login.js                  # Login (email/telefone)
│   │       ├── register.js               # Registo
│   │       ├── oauth/
│   │           └── [provider]/
│   │               ├── authorize.js          # Inicia OAuth
│   │               ├── callback.js           # Callback OAuth
│   │               └── unlink.js             # Desassociar
│   ├── utils/
│       ├── oauth-config.js           # Configs providers
│       └── jwt.js                    # JWT helpers
├── public/
│   ├── login.html                    # Página login/registo
│   ├── perfil.html                   # Página perfil
│   ├── css/
│   │   ├── oauth-styles.css          # Estilos OAuth
│   │   └── auth-improvements.css     # Melhorias UI auth
│   ├── js/
│       ├── auth.js                   # Lógica login/registo
│       └── profile-oauth.js          # Gestão contas vinculadas
├── migrations/
│   └── 002_oauth_schema.sql          # Migração BD
├── docs/
    └── OAUTH_SETUP.md                # Guia detalhado
```

---

## 🔄 Fluxos de Utilização

### Login Social (Novo Utilizador)
```
1. Clica "Login com Google"
2. Autoriza app no Google
3. Callback cria conta automaticamente
4. Login automático → /perfil.html
```

### Login com Email/Telefone
```
1. Insere email OU telefone + password
2. Backend valida credenciais
3. Se password_hash = 'cliente_nunca_iniciou_sessão':
   - Redireciona para registo
   - Mostra alerta "Bem-vindo de volta"
   - Pré-preenche dados
   - Cliente completa perfil
4. Caso contrário: login normal
```

### Associar Conta Social
```
1. Utilizador autenticado vai a /perfil.html
2. Secção "Contas Vinculadas"
3. Clica "Associar" em Facebook
4. Autoriza no Facebook
5. Callback adiciona facebook_id
6. auth_methods atualizado: "password,facebook"
```

### Desassociar Conta
```
1. Clica "Desassociar" Google
2. Verifica se tem outros métodos:
   - Se é único e sem password: modal "Defina password"
   - Se tem outros: confirmação e desassocia
3. google_id = NULL
4. auth_methods atualizado
```

---

## 🧪 Testes

### Checklist Básico

- [ ] Login com Google funciona
- [ ] Login com Facebook funciona
- [ ] Login com Instagram funciona
- [ ] Login com email funciona
- [ ] Login com telefone funciona
- [ ] Cliente importado detectado e redirecionado
- [ ] Dados pré-preenchidos no registo
- [ ] Edição de dados pré-preenchidos atualiza BD
- [ ] Lista de contas vinculadas carrega
- [ ] Associar nova conta funciona
- [ ] Desassociar conta funciona
- [ ] Modal de password aparece quando necessário
- [ ] Validação de último método funciona

### Testes Avançados

```bash
# Testar state CSRF
curl -X GET 'https://seu-dominio.com/api/api_auth/oauth/google/callback?code=fake&state=invalid'
# Esperado: redirect com erro invalid_state

# Testar desassociação sem password
curl -X DELETE 'https://seu-dominio.com/api/api_auth/oauth/google/unlink' \
  -H 'Cookie: auth_token=...'
# Esperado: {"error": "...", "needsPassword": true}
```

---

## 🐛 Troubleshooting

### Erro: "Configuration OAuth incomplete"
**Causa**: Secrets não configurados  
**Solução**: Executar `wrangler secret put` para todos os secrets

### Erro: "invalid_state" no callback
**Causa**: State expirou (>10 min) ou KV não configurado  
**Solução**: Verificar KV namespace no wrangler.toml

### Erro: "Email já registado"
**Causa**: Email existe com outro método  
**Solução**: Utilizador deve fazer login e associar no perfil

### Botões sociais não aparecem
**Causa**: Font Awesome não carregado  
**Solução**: Adicionar `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">`

### Contas vinculadas não carregam
**Causa**: Script profile-oauth.js não incluído  
**Solução**: Adicionar `<script src="js/profile-oauth.js"></script>` em perfil.html

---

## 🔒 Segurança

### Boas Práticas Implementadas

✅ HTTPS obrigatório em produção  
✅ State CSRF protection  
✅ HttpOnly cookies  
✅ JWT com expiração  
✅ Validação de redirect URIs  
✅ Secrets encriptados  
✅ Expiração de tokens OAuth (10 min)  
✅ Validação de métodos de auth  

### Recomendações Adicionais

- Implementar rate limiting
- Logs de autenticação
- Alertas de login suspeito
- 2FA (futuro)

---

## 📊 Schema BD

```sql
CREATE TABLE clientes (
    id INTEGER PRIMARY KEY,
    nome TEXT,
    email TEXT UNIQUE,
    telefone TEXT,
    password_hash TEXT,
    google_id TEXT,           -- NOVO
    facebook_id TEXT,         -- NOVO
    instagram_id TEXT,        -- NOVO
    auth_methods TEXT,        -- NOVO: 'password,google,facebook'
    email_verificado BOOLEAN,
    token_verificacao TEXT,
    data_criacao DATETIME
);
```

---

## 🚀 Próximos Passos (Opcional)

- [ ] Login com Apple
- [ ] Login com Twitter/X
- [ ] Autenticação 2FA
- [ ] Passkeys/WebAuthn
- [ ] Biometria mobile
- [ ] SSO empresarial

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consultar `docs/OAUTH_SETUP.md`
2. Verificar logs: `npx wrangler tail`
3. Testar endpoints individualmente

---

## 📝 Licença

Proprietary - Brooklyn Barbearia

---

**✨ Implementação completa de OAuth2 pronta para produção!**