# 🚀 Fase 2 - Guia de Implementação Passo a Passo

**Status**: 🚕 Pronto para Começar
**Data**: 24 de Dezembro de 2025

---

## 📴 O Que Foi Feito até Agora

### ✅ Fase 1 (Concluída)
- 5 páginas HTML funcionais com dados mock
- Design system completo
- Estrutura de diretórios e ficheiros
- Cliente HTTP centralizado (`api.js`)

### ✅ Início da Fase 2 (Agora)
- Ficheiro `dashboard.js` criado - novo endpoint de stats
- Ficheiro `init.js` **completamente atualizado** - integrado com APIs reais
- Documentação de todos os endpoints

---

## 🚀 Próximos Passos

### 1️⃣ Criar o API Client (`api.js`)

**Ficheiro**: `public/js/admin/api.js`

VERIFICAR se existe, se não criar:

```javascript
class AdminAPIClient {
  constructor() {
    this.baseURL = '/api/admin';
    this.token = this.getAuthToken();
  }

  getAuthToken() {
    return localStorage.getItem('admin_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };

    const response = await fetch(url, {
      ...options,
      headers: { ...options.headers, ...headers }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro na requisição');
    }

    return response.json();
  }

  // Barbeiros
  get barbeiros() {
    return {
      getAll: () => this.request('/barbeiros'),
      get: (id) => this.request(`/barbeiros/${id}`)
    };
  }

  // Serviços
  get servicos() {
    return {
      getAll: () => this.request('/servicos')
    };
  }

  // Reservas
  get reservations() {
    return {
      getAll: (params) => this.request(`/reservations${this.buildQuery(params)}`),
      get: (id) => this.request(`/reservations/${id}`),
      create: (data) => this.request('/reservations', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      update: (id, data) => this.request(`/reservations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      delete: (id) => this.request(`/reservations/${id}`, { method: 'DELETE' })
    };
  }

  // Indisponibilidades
  get unavailableTimes() {
    return {
      getAll: (params) => this.request(`/unavailable-times${this.buildQuery(params)}`),
      get: (id) => this.request(`/unavailable-times/${id}`),
      create: (data) => this.request('/unavailable-times', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      update: (id, data) => this.request(`/unavailable-times/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      delete: (id) => this.request(`/unavailable-times/${id}`, { method: 'DELETE' })
    };
  }

  // Clientes
  get clientes() {
    return {
      getAll: (params) => this.request(`/clientes${this.buildQuery(params)}`),
      get: (id) => this.request(`/clientes/${id}`),
      create: (data) => this.request('/clientes', {
        method: 'POST',
        body: JSON.stringify(data)
      })
    };
  }

  buildQuery(params) {
    if (!params) return '';
    const query = new URLSearchParams(params).toString();
    return query ? `?${query}` : '';
  }
}

// Expor globalmente
window.api = new AdminAPIClient();
```

**Local**: Colocar antes do `init.js` no HTML:
```html
<script src="/js/admin/api.js"></script>
<script src="/js/admin/init.js"></script>
```

---

### 2️⃣ Melhorar os Endpoints Existentes

#### `functions/api/admin/reservations.js`

JA EXISTE mas precisa de:

- [ ] Adicionar rota `GET /api/admin/reservations/:id`
- [ ] Adicionar rota `PUT /api/admin/reservations/:id`
- [ ] Adicionar rota `DELETE /api/admin/reservations/:id`
- [ ] Implementar páginação correta
- [ ] Validar filtros (status, barbeiro_id, data)

**Exemplo de melhoria**:
```javascript
// Adicionar ao handleGet():
if (method === 'PUT') {
  return handlePut(db, requestBody, reservationId);
}
if (method === 'DELETE') {
  return handleDelete(db, reservationId);
}

// Nova função:
function handlePut(db, data, reservationId) {
  const stmt = db.prepare(`
    UPDATE reservas SET
      barbeiro_id = ?,
      data_hora = ?,
      servico_id = ?,
      status = ?,
      notas = ?
    WHERE id = ?
  `);
  stmt.run(data.barbeiro_id, data.data_hora, data.servico_id, data.status, data.notas, reservationId);
  return new Response(JSON.stringify({ sucesso: true }), { status: 200 });
}
```

#### `functions/api/admin/unavailable-times.js`

JA EXISTE mas precisa de:

- [ ] Adicionar rota `GET /api/admin/unavailable-times/:id`
- [ ] Adicionar rota `PUT /api/admin/unavailable-times/:id`
- [ ] Adicionar rota `DELETE /api/admin/unavailable-times/:id`

#### `functions/api/admin/clientes.js`

JA EXISTE mas precisa de:

- [ ] Adicionar rota `POST /api/admin/clientes` (criar novo cliente)
- [ ] Adicionar rota `GET /api/admin/clientes/:id` (detalhe)
- [ ] Melhorar busca em GET (busca por nome, telefone)

---

### 3️⃣ Testar Localmente

#### Com Curl

```bash
# 1. Login (substituir password pela real)
curl -X POST http://localhost:8787/api/admin/api_admin_login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"senha","turnstileToken":"token_simulado"}'

# Copiar o token da resposta
TOKEN="eyJhbGc..."

# 2. Obter stats do dashboard
curl -X GET http://localhost:8787/api/admin/dashboard/stats \
  -H "Authorization: Bearer $TOKEN"

# 3. Obter barbeiros
curl -X GET http://localhost:8787/api/admin/barbeiros \
  -H "Authorization: Bearer $TOKEN"

# 4. Obter reservas
curl -X GET http://localhost:8787/api/admin/reservations \
  -H "Authorization: Bearer $TOKEN"

# 5. Criar reserva
curl -X POST http://localhost:8787/api/admin/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "cliente_nome":"João Silva",
    "cliente_email":"joao@example.com",
    "cliente_telefone":"912345678",
    "barbeiro_id":1,
    "servico_id":1,
    "data_hora":"2025-01-15 14:00:00",
    "notas":"Cliente preferido",
    "notificacao_email":true
  }'
```

#### Com Postman

1. **Importar endpoints**:
   - Colecção nova: `Brooklyn Admin API`
   - Criar pasta: `Dashboard`
   - Endpoints:
     - GET `{{base_url}}/api/admin/dashboard/stats`
     - GET `{{base_url}}/api/admin/barbeiros`
     - GET `{{base_url}}/api/admin/reservations`
     - POST `{{base_url}}/api/admin/reservations`
     - etc...

2. **Configurar variáveis**:
   ```
   base_url = http://localhost:8787
   token = [colar token do login]
   ```

3. **Testar fluxo completo**:
   - POST login → copiar token
   - GET dashboard/stats
   - GET barbeiros
   - POST reservations (criar)
   - GET reservations/:id (verificar)
   - etc...

---

## 📰 Ficheiros Criados/Atualizados nesta Fase

| Ficheiro | Status | O Que Faz |
|----------|--------|----------|
| `PHASE2_BACKEND_INTEGRATION.md` | 🎆 NOVO | Documentação completa de endpoints |
| `functions/api/admin/dashboard.js` | 🎆 NOVO | Endpoint de stats do dashboard |
| `public/js/admin/init.js` | 🔢 ATUALIZADO | Integrado com APIs reais |
| `public/js/admin/api.js` | 🔘 TODO | Cliente HTTP (criar se não existir) |
| `functions/api/admin/reservations.js` | 🔢 MELHORIA | Adicionar PUT/DELETE |
| `functions/api/admin/unavailable-times.js` | 🔢 MELHORIA | Adicionar PUT/DELETE |
| `functions/api/admin/clientes.js` | 🔢 MELHORIA | Adicionar POST e melhorar GET |

---

## ✅ Checklist de Conclusão

### Backend
- [ ] `dashboard.js` foi criado
- [ ] `reservations.js` tem PUT e DELETE
- [ ] `unavailable-times.js` tem PUT e DELETE
- [ ] `clientes.js` tem POST
- [ ] Todos os endpoints retornam formato correto
- [ ] Validação de autenticação em todos
- [ ] Testes com curl/Postman passaram

### Frontend
- [ ] `api.js` foi criado
- [ ] `init.js` está atualizado
- [ ] Dashboard carrega stats reais
- [ ] Calendário carrega barbeiros reais
- [ ] Reservas carregam dados reais
- [ ] Indisponibilidades carregam dados reais
- [ ] Criar reserva chama POST real
- [ ] Sem erros na consola

### Testes
- [ ] Login funciona
- [ ] GET /dashboard/stats retorna dados
- [ ] GET /barbeiros retorna lista
- [ ] POST /reservations cria reserva
- [ ] PUT /reservations/:id atualiza
- [ ] DELETE /reservations/:id remove
- [ ] Páginas carregam sem erros
- [ ] Dados mostram em tempo real

---

## 💡 Dicas Importantes

1. **Sempre usar Bearer token**
   ```javascript
   header: 'Authorization: Bearer TOKEN'
   ```

2. **Formatos de data**
   ```
   YYYY-MM-DD HH:MM:SS (SQLite)
   ISO 8601 em JSON (frontend)
   ```

3. **Validação no backend**
   - Sempre validar dados de entrada
   - Sempre validar token
   - Sempre retornar JSON estruturado

4. **Tratamento de erros**
   ```javascript
   if (!data.barbeiro_id) throw new Error('Barbeiro requerido');
   if (!data.data_hora) throw new Error('Data/hora requerida');
   ```

5. **Resposta padrão**
   ```json
   {
     "sucesso": true,
     "mensagem": "Operação completada",
     "data": { ... }
   }
   ```

---

## 📞 Próxima Fase (Fase 3)

Após terminar Fase 2:

- [ ] WebSockets para atualização em tempo real
- [ ] Toast notifications
- [ ] Loading states
- [ ] Confirmação de ações
- [ ] Exportação PDF
- [ ] Auto-refresh de dados

---

**Data de Início**: 24 de Dezembro de 2025
**Data de Término Estimada**: 27 de Dezembro de 2025

**Status**: 🚕 Pronto para começar!
