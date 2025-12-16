# Novas Funcionalidades: Segurança e Edição de Reservas

## 🔒 1. Turnstile - Proteção contra Bots

### O que foi implementado?
Adicionado Cloudflare Turnstile aos formulários de login (admin e cliente) para prevenir ataques automatizados.

### Ficheiros alterados:
- `public/admin-login.html` - Widget Turnstile adicionado
- `public/login.html` - Já tinha Turnstile implementado
- `public/js/admin/auth.js` - Validação no frontend
- `functions/api/admin/api_admin_login.js` - Validação no backend

### Como configurar:

1. **Adicionar variável de ambiente:**
   ```bash
   # No ficheiro .dev.vars (local)
   TURNSTILE_SECRET_KEY=sua_chave_secreta_aqui
   ```

2. **No Cloudflare Dashboard:**
   - Aceder a Workers & Pages > barbearia-brooklyn > Settings > Variables
   - Adicionar: `TURNSTILE_SECRET_KEY` com a chave secreta

3. **Obter chaves:**
   - Site Key (já configurada): `0x4AAAAAACHDJQSgIjOdWo9j`
   - Secret Key: Disponível no Cloudflare Dashboard > Turnstile

### Como funciona:
1. Utilizador preenche formulário de login
2. Widget Turnstile valida que é humano
3. Token gerado é enviado para o backend
4. Backend verifica token com Cloudflare
5. Apenas com validação bem-sucedida o login é permitido

---

## ✏️ 2. Sistema de Edição de Reservas

### O que foi implementado?
Clientes podem agora editar suas reservas confirmadas com restrições de segurança.

### Ficheiros criados:
- `functions/api/api_editar_reserva.js` - API para edição
- `migrations/add_edit_history.sql` - Script de migração da BD

### Campos adicionados à base de dados:

**Tabela `clientes`:**
- `reservas_concluidas` (INTEGER) - Contador para programa de fidelização

**Tabela `reservas`:**
- `historico_edicoes` (TEXT/JSON) - Histórico de alterações
- `atualizado_em` (DATETIME) - Timestamp da última atualização

### Como aplicar a migração:

```bash
# Opção 1: Via Wrangler
wrangler d1 execute barbearia-brooklyn-db --file=migrations/add_edit_history.sql

# Opção 2: Via Dashboard
# Cloudflare Dashboard > D1 > barbearia-brooklyn-db > Console
# Copiar e colar o conteúdo de migrations/add_edit_history.sql
```

### Restrições de edição:
- ✅ Apenas reservas **confirmadas**
- ✅ Apenas o **proprietário** da reserva
- ✅ Com pelo menos **24 horas de antecedência**
- ✅ Nova data/hora deve ser **futura**
- ✅ Novo horário deve estar **disponível**

### Endpoint da API:

**URL:** `POST /api/api_editar_reserva`

**Autenticação:** Cookie `auth_token` (JWT)

**Body:**
```json
{
  "reserva_id": 123,
  "nova_data": "2025-12-20",
  "nova_hora": "15:00",
  "novo_barbeiro_id": 2,
  "comentario": "Comentário opcional"
}
```

**Resposta (sucesso):**
```json
{
  "success": true,
  "message": "Reserva atualizada com sucesso"
}
```

**Respostas (erro):**
```json
// Sem autenticação
{ "error": "Autenticação necessária", "needsAuth": true }

// Menos de 24h de antecedência
{ "error": "Só é possível editar reservas com pelo menos 24 horas de antecedência" }

// Horário ocupado
{ "error": "Horário já reservado para este barbeiro" }
```

### Estrutura do Histórico:

O campo `historico_edicoes` é um array JSON:

```json
[
  {
    "tipo": "alteracao",
    "campos_alterados": {
      "data_hora": {
        "anterior": "2025-12-18T17:00:00",
        "novo": "2025-12-20T15:00:00"
      },
      "barbeiro": {
        "anterior": "Marco (ID: 1)",
        "novo": "Ricardo (ID: 2)"
      }
    },
    "data": "2025-12-16T20:30:00.000Z",
    "usuario_tipo": "cliente"
  }
]
```

---

## ⏰ 3. Proteção contra Reservas em Horas Passadas

### O que foi corrigido?
Sistema agora impede reservas para horários que já passaram no dia atual.

### Ficheiro alterado:
- `public/js/reservar.js` - Função `renderAvailableTimes()`

### Como funciona:
1. Ao selecionar o dia atual no calendário
2. Sistema compara cada horário com a hora atual
3. Filtra automaticamente horas que já passaram
4. Apenas horários futuros são mostrados

### Exemplo:
- Hora atual: 15:30
- Horários disponíveis: 14:00, 15:00, 16:00, 17:00
- **Mostrados:** 16:00, 17:00
- **Ocultos:** 14:00, 15:00 (já passaram)

---

## 🚀 Deploy e Teste

### 1. Testar localmente:
```bash
# Aplicar migração local
wrangler d1 execute barbearia-brooklyn-db --local --file=migrations/add_edit_history.sql

# Iniciar servidor de desenvolvimento
wrangler dev
```

### 2. Testar Turnstile:
- Aceder a `http://localhost:8787/admin-login.html`
- Preencher credenciais
- Verificar que widget Turnstile aparece
- Botão só ativa após validação

### 3. Testar validação de horas:
- Aceder a `http://localhost:8787/reservar.html`
- Selecionar o dia atual
- Verificar que apenas horários futuros aparecem

### 4. Deploy para produção:
```bash
# 1. Aplicar migração
wrangler d1 execute barbearia-brooklyn-db --remote --file=migrations/add_edit_history.sql

# 2. Configurar TURNSTILE_SECRET_KEY no Dashboard

# 3. Deploy
wrangler deploy
```

---

## 📝 Próximos Passos (Implementação Frontend)

### Interface de Edição no `consultar.html`:

1. **Adicionar botão "Editar" nas reservas confirmadas**
2. **Criar modal de edição** similar ao fluxo de reserva
3. **Reutilizar componentes** de seleção de data/hora/barbeiro
4. **Mostrar histórico** de edições (opcional)

Exemplo de estrutura:
```html
<!-- Botão Editar -->
<button class="btn-edit" onclick="abrirModalEdicao(reservaId)">
  <i class="fas fa-edit"></i> Editar
</button>

<!-- Modal de Edição -->
<div class="modal" id="editBookingModal">
  <!-- Formulário similar ao de reserva -->
</div>
```

### Admin Dashboard:
O endpoint admin já existe em `functions/api/admin/api_admin_reservas/[id].js`
- Admins podem editar sem restrição de 24h
- Podem ver histórico completo de edições

---

## 🔑 Variáveis de Ambiente Necessárias

```bash
# .dev.vars (desenvolvimento local)
TURNSTILE_SECRET_KEY=sua_chave_secreta
JWT_SECRET=sua_chave_jwt
ADMIN_USERNAME=admin
ADMIN_PASSWORD=sua_senha_segura
```

**Cloudflare Dashboard:**
- TURNSTILE_SECRET_KEY
- JWT_SECRET
- ADMIN_USERNAME
- ADMIN_PASSWORD
- DB (binding para D1)

---

## ⚠️ Notas Importantes

1. **Backup antes da migração:**
   ```bash
   wrangler d1 export barbearia-brooklyn-db --output=backup.sql
   ```

2. **Testar em ambiente local primeiro**

3. **O campo `historico_edicoes` começa vazio** (array `[]`) e só popula quando há edição (economia de recursos)

4. **Turnstile secret key** nunca deve ser exposta no frontend

5. **A API de edição verifica proprietário** - ninguém pode editar reserva de outra pessoa

---

## 🐛 Issues Conhecidos

Nenhum no momento. Por favor reporte via GitHub Issues se encontrar problemas.

---

**Autor:** Tiago Oliveira  
**Data:** 16 de Dezembro de 2025  
**Branch:** `fix/security-and-editing`