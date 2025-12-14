# Configuração OAuth2

Guia completo para configurar o login social com Google, Facebook e Instagram.

## 1. Configurar Google OAuth

### Passo 1: Criar Projeto no Google Cloud Console
1. Aceda a [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá para **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure o específico:
   - Application type: **Web application**
   - Name: Brooklyn Barbearia
   - Authorized JavaScript origins: `https://seu-dominio.com`
   - Authorized redirect URIs: `https://seu-dominio.com/api/api_auth/oauth/google/callback`

### Passo 2: Obter Credenciais
- Copie o **Client ID** e **Client Secret**

### Passo 3: Configurar Consent Screen
1. Vá para **OAuth consent screen**
2. Escolha **External** (para utilizadores fora da organização)
3. Preencha:
   - App name: Brooklyn Barbearia
   - User support email: seu-email@exemplo.com
   - Developer contact: seu-email@exemplo.com
4. Adicione scopes: `email`, `profile`, `openid`

---

## 2. Configurar Facebook OAuth

### Passo 1: Criar App no Meta for Developers
1. Aceda a [Meta for Developers](https://developers.facebook.com/)
2. Clique em **My Apps** > **Create App**
3. Escolha **Consumer** como tipo de app
4. Preencha:
   - App name: Brooklyn Barbearia
   - Contact email: seu-email@exemplo.com

### Passo 2: Configurar Facebook Login
1. No dashboard da app, adicione o produto **Facebook Login**
2. Vá para **Settings** > **Basic**:
   - Copie **App ID** e **App Secret**
3. Vá para **Facebook Login** > **Settings**:
   - Valid OAuth Redirect URIs: `https://seu-dominio.com/api/api_auth/oauth/facebook/callback`

### Passo 3: Configurar Permissões
- Na secção **App Review**, solicite as permissões:
  - `email`
  - `public_profile`

### Passo 4: Tornar App Pública
- Quando estiver pronto, mude o modo da app de **Development** para **Live**

---

## 3. Configurar Instagram OAuth

### Passo 1: Usar Facebook App
O Instagram usa a mesma infraestrutura do Facebook:
1. Na mesma app criada no Meta for Developers
2. Adicione o produto **Instagram Basic Display**

### Passo 2: Criar Instagram App
1. Vá para **Instagram Basic Display** > **Basic Display**
2. Clique em **Create New App**
3. Preencha:
   - Display Name: Brooklyn Barbearia
   - Valid OAuth Redirect URIs: `https://seu-dominio.com/api/api_auth/oauth/instagram/callback`
   - Deauthorize Callback URL: `https://seu-dominio.com/api/api_auth/oauth/instagram/deauthorize`
   - Data Deletion Request URL: `https://seu-dominio.com/api/api_auth/oauth/instagram/delete`

### Passo 3: Obter Credenciais
- Copie **Instagram App ID** e **Instagram App Secret**

---

## 4. Configurar Variáveis de Ambiente no Cloudflare

### Via Dashboard Cloudflare:
1. Aceda ao seu Worker no dashboard
2. Vá para **Settings** > **Variables**
3. Adicione as seguintes variáveis (como **Encrypted**):

```
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret

FACEBOOK_CLIENT_ID=seu-facebook-app-id
FACEBOOK_CLIENT_SECRET=seu-facebook-app-secret

INSTAGRAM_CLIENT_ID=seu-instagram-app-id
INSTAGRAM_CLIENT_SECRET=seu-instagram-app-secret

BASE_URL=https://seu-dominio.com
JWT_SECRET=seu-jwt-secret-seguro
```

### Via Wrangler CLI:
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

---

## 5. Configurar Cloudflare KV

Para armazenar estados OAuth temporariamente:

```bash
# Criar namespace KV
npx wrangler kv:namespace create "KV_OAUTH"

# Adicionar ao wrangler.toml
```

Adicione ao `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "KV_OAUTH"
id = "seu-kv-namespace-id"
```

---

## 6. Executar Migração da Base de Dados

```bash
# Executar migração SQL
npx wrangler d1 execute barbearia_brooklyn_db --file=./migrations/002_oauth_schema.sql
```

---

## 7. Testar a Implementação

### Testar Login Social:
1. Aceda a `/login.html`
2. Clique num dos botões de login social
3. Autorize a aplicação
4. Deve ser redirecionado para `/perfil.html` com sessão iniciada

### Testar Linking de Contas:
1. Faça login normalmente
2. Vá para `/perfil.html`
3. Na secção "Contas Vinculadas", clique em "Associar"
4. Autorize a conta
5. A conta deve aparecer como vinculada

### Testar Unlinking:
1. Em `/perfil.html`, clique em "Desassociar"
2. Se for a única conta e não tiver password, deve aparecer erro
3. Se tiver outros métodos, a desassociação deve funcionar

---

## 8. Segurança

### Recomendações:
- Use sempre HTTPS em produção
- Mantenha os secrets seguros e nunca os partilhe
- Configure CORS adequadamente
- Valide sempre o state parameter no callback
- Use tokens com expiração curta (10 minutos) para estados OAuth
- Implemente rate limiting nas rotas de OAuth

---

## 9. Troubleshooting

### Erro: "invalid_request"
- Verifique se as URLs de redirect estão corretamente configuradas
- Confirme que o BASE_URL está correto

### Erro: "access_denied"
- Utilizador cancelou a autorização
- Verifique as permissões solicitadas

### Erro: "invalid_state"
- O state expirou (>10 minutos)
- Problema com KV namespace
- Tente novamente o processo de login

### Erro: "Email já registado"
- Email já existe com outro método de autenticação
- Utilizador deve fazer login e linkar a conta no perfil

---

## 10. Recursos Adicionais

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Cloudflare Workers KV](https://developers.cloudflare.com/workers/runtime-apis/kv/)
