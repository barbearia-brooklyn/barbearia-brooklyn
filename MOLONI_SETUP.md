# 📝 Configuração da Integração Moloni

## ✅ O Que Já Foi Feito

1. **Frontend completo** - Modal de faturação com validação de NIF
2. **Cliente Moloni API** - Autenticação e métodos prontos
3. **Endpoint de faturação** - `/api/moloni/create-invoice`
4. **Endpoint de cliente** - Agora retorna campo `nif`
5. **URL de Callback configurado** - `https://brooklynbarbearia.pt/api/moloni/callback`

---

## 🔑 Credenciais Necessárias

Precisas configurar **5 variáveis de ambiente** no Cloudflare:

### 1. MOLONI_CLIENT_ID

**O que é:** Identificador público da tua aplicação no Moloni

**Como obter:**
1. Ir para [moloni.pt](https://www.moloni.pt) e fazer login
2. **Definições** → **API** → **Developers**
3. Clicar em **"Nova Aplicação"**
4. Preencher:
   - **Nome**: Brooklyn Barbearia
   - **Redirect URI**: `https://brooklynbarbearia.pt/api/moloni/callback`
   - **Tipo**: Web Application
5. Copiar o **Client ID** gerado

**Exemplo:** `brooklyn123456`

---

### 2. MOLONI_CLIENT_SECRET

**O que é:** Chave secreta da aplicação (como uma password)

**Como obter:**
- Aparece no mesmo ecrã quando crias a aplicação
- **⚠️ ATENÇÃO:** Só é mostrado uma vez! Guarda bem!

**Exemplo:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

---

### 3. MOLONI_USERNAME

**O que é:** O **email** que usas para fazer login no Moloni

**Como obter:**
- É o teu email/username da conta Moloni
- O mesmo que usas para aceder a [moloni.pt](https://www.moloni.pt)

**Exemplo:** `geral@brooklynbarbearia.pt`

---

### 4. MOLONI_PASSWORD

**O que é:** A **password** da tua conta Moloni

**Como obter:**
- É a password que usas para fazer login
- **⚠️ SEGURANÇA:** Certifica-te que está encriptada no Cloudflare

**Exemplo:** `MinhaPasswordSegura123!`

---

### 5. MOLONI_COMPANY_ID

**O que é:** ID da empresa no Moloni (se tiveres várias empresas)

**Como obter:**
1. Fazer login no Moloni
2. Ir para **Definições** → **Empresa**
3. O ID aparece no URL: `moloni.pt/company/{COMPANY_ID}/...`
4. **OU** fazer uma chamada à API depois de autenticar:
   ```bash
   POST https://api.moloni.pt/v1/companies/getAll/
   {
     "access_token": "seu_token"
   }
   ```
   Retorna lista de empresas com IDs

**Exemplo:** `12345`

---

## ⚙️ Configuração no Cloudflare

### Passo 1: Adicionar Variáveis de Ambiente

1. Aceder ao [dashboard Cloudflare](https://dash.cloudflare.com)
2. Ir para **Workers & Pages**
3. Selecionar o projeto **barbearia-brooklyn**
4. Ir para **Settings** → **Environment Variables**
5. Adicionar as variáveis:

```
MOLONI_CLIENT_ID = brooklyn123456
MOLONI_CLIENT_SECRET = a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
MOLONI_USERNAME = geral@brooklynbarbearia.pt
MOLONI_PASSWORD = MinhaPasswordSegura123!
MOLONI_COMPANY_ID = 12345
```

⚠️ **Importante:** Marca `MOLONI_CLIENT_SECRET` e `MOLONI_PASSWORD` como **Encrypted**!

### Passo 2: Criar KV Namespace (Opcional mas Recomendado)

Para cache de tokens e melhor performance:

1. No Cloudflare Dashboard: **Workers & Pages** → **KV**
2. Criar novo namespace: **moloni-tokens**
3. Ir para o projeto → **Settings** → **Bindings**
4. Adicionar KV binding:
   - **Variable name**: `MOLONI_TOKENS`
   - **KV namespace**: `moloni-tokens`

### Passo 3: Deploy

```bash
npm run deploy
# ou
wrangler pages deploy
```

---

## 📦 Schema da Base de Dados

Verificar se a coluna `moloni_document_id` e `moloni_document_number` existem na tabela `reservas`:

```sql
ALTER TABLE reservas ADD COLUMN moloni_document_id INTEGER;
ALTER TABLE reservas ADD COLUMN moloni_document_number TEXT;
```

---

## ✅ Testar a Integração

### 1. Testar Autenticação

Fazer uma chamada de teste (via browser console ou Postman):

```javascript
fetch('/api/moloni/create-invoice', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('adminToken'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reserva_id: 1,
    cliente_id: 1,
    servico_id: 1,
    nif: '123456789',
    save_nif_to_profile: true
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### 2. Testar via Interface

1. Fazer login no admin
2. Ir para uma reserva
3. Clicar em "Faturar"
4. Preencher NIF se necessário
5. Confirmar
6. Verificar se aparece mensagem de sucesso
7. Confirmar no painel Moloni se a fatura foi criada

---

## 🐛 Troubleshooting

### Erro: "Moloni auth failed"

**Causas possíveis:**
- Username ou password incorretos
- Client ID ou Secret incorretos
- Credenciais não configuradas no Cloudflare

**Solução:**
1. Verificar se todas as variáveis estão configuradas
2. Fazer logout e login novamente no Moloni
3. Recriar aplicação no painel Moloni se necessário

### Erro: "Cliente não encontrado"

**Causa:** Cliente não existe na base de dados local

**Solução:** Verificar se o `cliente_id` está correto

### Erro: "Company ID not found"

**Causa:** `MOLONI_COMPANY_ID` incorreto ou não configurado

**Solução:**
1. Fazer login no Moloni
2. Verificar URL para obter Company ID
3. Atualizar variável no Cloudflare

### Fatura criada mas não aparece no Moloni

**Causas possíveis:**
- Estás a ver empresa errada no Moloni
- Fatura foi criada como rascunho

**Solução:**
1. Verificar `MOLONI_COMPANY_ID`
2. Verificar filtros no painel Moloni (mostrar todas as faturas)
3. Procurar pelo número da fatura retornado

---

## 📚 Recursos Úteis

- [Documentação Moloni API](https://www.moloni.pt/dev/)
- [Autenticação OAuth](https://www.moloni.pt/dev/authentication/)
- [Endpoints Moloni](https://www.moloni.pt/dev/endpoints/)
- [Fórum Suporte Moloni](https://forum.moloni.pt/)

---

## 📞 Suporte

Se encontrares problemas:

1. **Verificar logs do Cloudflare:**
   - Dashboard → Workers & Pages → Projeto → Logs

2. **Verificar browser console:**
   - F12 → Console (para ver erros frontend)

3. **Contactar suporte Moloni:**
   - Email: suporte@moloni.pt
   - Fórum: [forum.moloni.pt](https://forum.moloni.pt/)

---

**✅ Depois de configurar todas as credenciais, a integração deve funcionar automaticamente!**