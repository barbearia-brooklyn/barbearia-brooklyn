# 🚀 Fase 2 - Integração com Backend (API)

**Status**: ✅ Pronto para Implementação
**Data**: 24 de Dezembro de 2025
**Backend**: Cloudflare Workers + SQLite (D1)

---

## 📊 Resumo da Fase 1

Fase 1 entregou:
- ✅ 5 páginas HTML completamente funcionais
- ✅ Sistema de autenticação (login)
- ✅ UI/UX moderno e responsivo
- ✅ Inicialização automática com `init.js`
- ✅ Cliente HTTP centralizado (`api.js`)
- ✅ Todos os erros corrigidos

---

## 🏗️ Arquitetura Fase 2

### Frontend → Backend
```
Public (HTML/JS/CSS)
         ↓
    api.js (client)
         ↓
    init.js (manager)
         ↓
Cloudflare Workers (Endpoints)
         ↓
   SQLite / D1
```

### Endpoints Necessários

| Método | Endpoint | Status | Descrição |
|--------|----------|--------|----------|
| **AUTENTICAÇÃO** |
| POST | `/api/admin/api_admin_login` | ✅ Existe | Login (username + password) |
| **DASHBOARD** |
| GET | `/api/admin/dashboard/stats` | ⚠️ Criar | Estatísticas (mês, hoje, dia anterior) |
| **BARBEIROS** |
| GET | `/api/admin/barbeiros` | ✅ Existe | Listar todos os barbeiros |
| GET | `/api/admin/barbeiros/:id` | ✅ Existe | Detalhe de um barbeiro |
| **SERVIÇOS** |
| GET | `/api/admin/servicos` | ✅ Existe | Listar todos os serviços |
| **RESERVAS** |
| GET | `/api/admin/reservations` | ✅ Existe | Listar reservas (com filtros) |
| POST | `/api/admin/reservations` | ✅ Existe | Criar nova reserva |
| GET | `/api/admin/reservations/:id` | ⚠️ Criar | Detalhe de uma reserva |
| PUT | `/api/admin/reservations/:id` | ⚠️ Criar | Editar reserva |
| DELETE | `/api/admin/reservations/:id` | ⚠️ Criar | Cancelar reserva |
| **INDISPONIBILIDADES** |
| GET | `/api/admin/unavailable-times` | ✅ Existe | Listar indisponibilidades |
| POST | `/api/admin/unavailable-times` | ✅ Existe | Criar indisponibilidade |
| GET | `/api/admin/unavailable-times/:id` | ⚠️ Criar | Detalhe |
| PUT | `/api/admin/unavailable-times/:id` | ⚠️ Criar | Editar |
| DELETE | `/api/admin/unavailable-times/:id` | ⚠️ Criar | Apagar |
| **CLIENTES** |
| GET | `/api/admin/clientes` | ✅ Existe | Listar/buscar clientes |
| POST | `/api/admin/clientes` | ⚠️ Criar | Criar novo cliente |
| GET | `/api/admin/clientes/:id` | ⚠️ Criar | Detalhe de cliente |

---

## 📋 Endpoints Detalhados

### 1. **Dashboard Stats** (NOVO)

```javascript
// GET /api/admin/dashboard/stats

Response:
{
  "mês_reservas": 45,
  "hoje_reservas": 3,
  "dia_anterior_concluidas": 5,
  "barbeiros": [
    {
      "id": 1,
      "nome": "Gui Pereira",
      "concluidas_ontem": 5,
      "agendadas_hoje": 3
    }
  ]
}
```

---

### 2. **Reservations CRUD Completo**

#### GET /api/admin/reservations
```javascript
Query Params:
- status: "confirmada", "pendente", "cancelada"
- barbeiro_id: numero
- data_inicio: YYYY-MM-DD
- data_fim: YYYY-MM-DD
- limit: numero (default 50)
- offset: numero (default 0)

Response:
{
  "data": [
    {
      "id": 1,
      "cliente_nome": "João Silva",
      "cliente_email": "joao@example.com",
      "cliente_telefone": "912345678",
      "barbeiro_id": 1,
      "barbeiro_nome": "Gui Pereira",
      "servico_id": 1,
      "servico_nome": "Corte de Cabelo",
      "data_hora": "2025-01-15 14:00:00",
      "duracao_minutos": 30,
      "preco": 15.00,
      "status": "confirmada",
      "notas": "Cliente preferido",
      "notificacao_email": true,
      "notificacao_whatsapp": false,
      "criado_em": "2025-01-10 10:00:00"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 50
}
```

#### POST /api/admin/reservations
```javascript
Request Body:
{
  "cliente_nome": "Maria Silva",
  "cliente_email": "maria@example.com",
  "cliente_telefone": "923456789",
  "barbeiro_id": 2,
  "servico_id": 1,
  "data_hora": "2025-01-20 15:00:00",
  "notas": "Opcional",
  "notificacao_email": true,
  "notificacao_whatsapp": false
}

Response (201):
{
  "id": 46,
  "sucesso": true,
  "mensagem": "Reserva criada com sucesso",
  "reserva_id": 46
}
```

#### PUT /api/admin/reservations/:id
```javascript
Request Body:
{
  "barbeiro_id": 1,
  "data_hora": "2025-01-20 16:00:00",
  "servico_id": 2,
  "status": "confirmada",
  "notas": "Novo horário agendado"
}

Response:
{
  "id": 1,
  "sucesso": true,
  "mensagem": "Reserva atualizada com sucesso"
}
```

#### DELETE /api/admin/reservations/:id
```javascript
Response:
{
  "sucesso": true,
  "mensagem": "Reserva cancelada com sucesso"
}
```

---

### 3. **Unavailable Times CRUD**

#### POST /api/admin/unavailable-times
```javascript
Request Body:
{
  "barbeiro_id": 1,
  "data_hora_inicio": "2025-01-20 12:00:00",
  "data_hora_fim": "2025-01-20 13:00:00",
  "tipo": "almoco",  // folga, almoco, ferias, ausencia, outro
  "motivo": "Almoço diário",
  "dia_inteiro": false
}

Response (201):
{
  "id": 5,
  "sucesso": true,
  "mensagem": "Indisponibilidade registada"
}
```

#### PUT /api/admin/unavailable-times/:id
```javascript
Request Body:
{
  "motivo": "Reunião importante",
  "tipo": "ausencia"
}

Response:
{
  "sucesso": true,
  "mensagem": "Indisponibilidade atualizada"
}
```

#### DELETE /api/admin/unavailable-times/:id
```javascript
Response:
{
  "sucesso": true,
  "mensagem": "Indisponibilidade removida"
}
```

---

### 4. **Clientes**

#### POST /api/admin/clientes (NOVO)
```javascript
Request Body:
{
  "nome": "Pedro Costa",
  "email": "pedro@example.com",
  "telefone": "934567890",
  "notas": "Cliente VIP"
}

Response (201):
{
  "id": 15,
  "sucesso": true,
  "mensagem": "Cliente criado com sucesso"
}
```

---

## 🔌 Integração no Frontend

### Ficheiro: `public/js/admin/api.js`

Já tem estrutura correta:

```javascript
class AdminAPIClient {
  constructor() {
    this.baseURL = '/api/admin';
    this.token = this.getAuthToken();
  }

  // Exemplo de uso:
  // const barbeiros = await api.barbeiros.getAll();
  // const reservas = await api.reservations.getAll({ status: 'confirmada' });
}
```

### Ficheiro: `public/js/admin/init.js`

Já chama endpoints corretamente:

```javascript
async initDashboard() {
  // FALTA: Chamar /api/admin/dashboard/stats
  // TODO: Substituir mock por dados reais
}

async initCalendar() {
  // FALTA: Chamar /api/admin/barbeiros
  // FALTA: Chamar /api/admin/reservations
}
```

---

## ✅ Checklist de Implementação

### Backend (Endpoints)

#### Dashboard
- [ ] Criar `functions/api/admin/dashboard.js`
  - [ ] GET /api/admin/dashboard/stats → retorna stats

#### Reservations (Melhorias)
- [ ] Adicionar GET /api/admin/reservations/:id
- [ ] Adicionar PUT /api/admin/reservations/:id
- [ ] Adicionar DELETE /api/admin/reservations/:id
- [ ] Validar autenticação em todos
- [ ] Validar dados de entrada

#### Unavailable Times (Melhorias)
- [ ] Adicionar PUT /api/admin/unavailable-times/:id
- [ ] Adicionar DELETE /api/admin/unavailable-times/:id
- [ ] Validar autenticação

#### Clientes
- [ ] Adicionar POST /api/admin/clientes
- [ ] Adicionar GET /api/admin/clientes/:id
- [ ] Melhorar busca em GET /api/admin/clientes

### Frontend (Integração)

#### Init.js
- [ ] Atualizar `initDashboard()` para chamar `/api/admin/dashboard/stats`
- [ ] Atualizar `initCalendar()` para chamar APIs reais
- [ ] Atualizar `initReservations()` para chamar APIs
- [ ] Atualizar `initUnavailable()` para chamar APIs
- [ ] Atualizar `initNewBooking()` para chamar APIs

#### HTML Pages
- [ ] Dashboard: Renderizar stats reais
- [ ] Calendar: Carregamento real de dados
- [ ] Reservations: Listar dados reais
- [ ] Unavailable: Listar dados reais
- [ ] New Booking: Selecionar cliente existente ou criar novo

### Testing
- [ ] Testar cada endpoint com Postman/Curl
- [ ] Verificar responses e status codes
- [ ] Testar com dados inválidos
- [ ] Testar autenticação
- [ ] Testar paginação
- [ ] Testar filtros

---

## 🔐 Autenticação

### Token JWT

```javascript
// Login retorna token
POST /api/admin/api_admin_login
Response: { "token": "eyJhbGc..." }

// Todos os endpoints /api/admin/* verificam token
Header: Authorization: Bearer eyJhbGc...
```

### Storage

```javascript
// localStorage keys
localStorage.getItem('admin_token')  // Bearer token
localStorage.getItem('admin_user')   // User data JSON
```

---

## 📝 Estrutura de Ficheiros Esperada

```
functions/api/admin/
├── dashboard.js                    ← NOVO
├── api_admin_login.js              ✅ Existe
├── reservations.js                 ✅ Existe (melhorias)
├── unavailable-times.js            ✅ Existe (melhorias)
├── barbeiros.js                    ✅ Existe
├── servicos.js                     ✅ Existe
├── clientes.js                     ✅ Existe (melhorias)
└── api_admin_reservas.js           (legado)

public/js/admin/
├── api.js                          ✅ Existe
├── init.js                         ✅ Existe (atualizar)
└── [outras páginas]
```

---

## 🚀 Próximas Etapas (Ordem de Prioridade)

### 1️⃣ CRÍTICO (Hoje)
```
[ ] Criar dashboard.js para /api/admin/dashboard/stats
[ ] Atualizar init.js para chamar APIs reais
[ ] Testar integração dashboard + backend
```

### 2️⃣ IMPORTANTE (Hoje/Amanhã)
```
[ ] Implementar CRUD completo para reservations
[ ] Implementar CRUD completo para unavailable-times
[ ] Testar todas as operações
[ ] Adicionar validações robustas
```

### 3️⃣ MELHORIAS (Próxima Semana)
```
[ ] Adicionar error handling robusto
[ ] Implementar loading states no frontend
[ ] Adicionar notificações toast
[ ] Implementar auto-refresh de dados
[ ] Cache inteligente no frontend
```

### 4️⃣ EXTRAS (Depois)
```
[ ] WebSocket para atualizações em tempo real
[ ] PDF export de relatórios
[ ] SMS/WhatsApp notifications
[ ] Google Calendar sync
[ ] Analytics dashboard
```

---

## 🧪 Testes Manual (Depois de Implementar)

### Com Curl
```bash
# Login
curl -X POST http://localhost:8787/api/admin/api_admin_login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"senha","turnstileToken":"token"}'

# Listar barbeiros
curl -X GET http://localhost:8787/api/admin/barbeiros \
  -H "Authorization: Bearer TOKEN"

# Criar reserva
curl -X POST http://localhost:8787/api/admin/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"cliente_nome":"João","barbeiro_id":1,...}'
```

### Com Postman
1. Importar endpoints em `ADMIN_API_INTEGRATION.md`
2. Configurar Bearer token após login
3. Testar cada operação CRUD
4. Verificar respostas

---

## 📞 Suporte

Se houver dúvidas sobre endpoints ou implementação:
1. Consultar ficheiros existentes em `functions/api/admin/`
2. Verificar `ADMIN_API_INTEGRATION.md` para documentação completa
3. Testar com Postman antes de integrar

---

**Status**: Pronto para começar! 🎯

**Próximo**: Comece com dashboard.js amanhã de manhã.
