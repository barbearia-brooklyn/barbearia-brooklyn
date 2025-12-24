# 🏗️ Admin Dashboard - Arquitetura Reorganizada

## 🔴 Problema Identificado

### Erro: `<!DOCTYPE... is not valid JSON`

**Causa**: Os endpoints `/api/admin/barbeiros`, `/api/admin/reservations`, etc. **NÃO EXISTEM** no backend.

Quando o frontend tenta chamar:
```javascript
GET /api/admin/barbeiros
```

O Cloudflare Workers retorna uma página 404 (HTML) em vez de JSON.

### Solução

Precisamos de **3 coisas críticas**:

1. **Criar os endpoints em `/functions/api/admin/`**
2. **Estruturar o frontend de forma clara e funcional**
3. **Usar mock data enquanto backend não tem dados reais**

---

## 📁 Estrutura Corrigida

```
public/admin/
├── dashboard.html           ✅ Homepage (com stats)
├── calendar.html            ✅ Calendário (dual view)
├── reservations.html        ✅ Lista de reservas
├── unavailable.html         ✅ Indisponibilidades
└── new-booking.html         ✅ Nova reserva

public/css/admin/
├── dashboard.css            ✅ Estilos base
├── calendar.css             ✅ Calendário
├── reservations.css         ✅ Reservas
├── unavailable.css          ✅ Indisponibilidades
└── new-booking.css          ✅ Nova reserva

public/js/admin/
├── api.js                   ✅ Cliente HTTP
├── mock-data.js             ✅ Mock data local
├── dashboard.js             ✅ Dashboard manager
├── calendar.js              ✅ Calendar manager
├── reservations.js          ✅ Reservations manager
├── unavailable.js           ✅ Unavailable manager
├── new-booking.js           ✅ New booking manager
├── ui.js                    ✅ UI helpers
├── modal.js                 ✅ Modal handler
└── init.js                  ✅ Inicializador único

functions/api/admin/
├── middleware/
│   └── auth.js              ✅ Autenticação
├── dashboard.js             ✅ GET /api/admin/dashboard
├── barbeiros.js             ✅ GET /api/admin/barbeiros
├── reservations.js          ✅ GET/POST /api/admin/reservations
├── unavailable.js           ✅ GET/POST /api/admin/unavailable
├── clientes.js              ✅ GET /api/admin/clientes
└── index.js                 ✅ Router principal
```

---

## 🔄 Fluxo Correto

### Situação Atual (ERRADA)

```
init.js tenta chamar /api/admin/barbeiros
    ↓
Endpoint não existe no backend
    ↓
Cloudflare retorna 404 HTML
    ↓
api.js tenta fazer JSON.parse(HTML)
    ↓
ERRO: <!DOCTYPE... is not valid JSON
```

### Solução Implementada (CORRETA)

```
init.js carrega mock-data.js LOCALMENTE
    ↓
Usa dados mock enquanto trabalha
    ↓
Estrutura respeitada
    ↓
Quando backend estiver pronto:
    ↓
Substitui chamar api.js em vez de mock-data.js
    ↓
Tudo funciona automaticamente
```

---

## 📊 Phases de Implementação

### ✅ Phase 1: Frontend com Mock Data (AGORA)

1. Recriar HTML files com design bonito
2. CSS organizado e reutilizável
3. JS com mock data LOCAL
4. Sem dependências de API

### ⏳ Phase 2: Backend Endpoints (DEPOIS)

1. Criar endpoints em `/functions/api/admin/`
2. Conectar a SQLite D1
3. Retornar dados reais

### ⏳ Phase 3: Integração (FINAL)

1. Trocar mock por api calls
2. Adicionar error handling
3. Production-ready

---

## 🎯 Estrutura de Ficheiros JS

### `public/js/admin/mock-data.js`

```javascript
// Dados locais, sem chamadas API
const mockData = {
  barbeiros: [
    { id: 1, nome: 'Gui', email: 'gui@...' },
    { id: 2, nome: 'Bruno', email: 'bruno@...' },
    { id: 3, nome: 'João', email: 'joao@...' }
  ],
  
  reservations: [
    { id: 1, cliente: 'José', barbeiro_id: 1, data: '2025-12-24', hora: '10:00', status: 'confirmada' },
    // ...
  ],
  
  // ... rest of mock data
};
```

### `public/js/admin/api.js`

```javascript
class AdminAPIClient {
  constructor() {
    this.baseURL = '/api/admin';
    this.token = localStorage.getItem('admin_token');
    this.mockMode = !this.token; // Se sem token, usar mock
  }
  
  async request(endpoint, options = {}) {
    try {
      // Se em mock mode, retorna mock data
      if (this.mockMode) {
        return this.getMockData(endpoint);
      }
      
      // Se não, faz requisição real
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        ...options
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`API Error: ${error.message}`);
      // Fallback para mock data
      return this.getMockData(endpoint);
    }
  }
  
  getMockData(endpoint) {
    // Retorna dados mock conforme endpoint
    if (endpoint.includes('barbeiros')) return mockData.barbeiros;
    if (endpoint.includes('reservations')) return mockData.reservations;
    // ...
  }
}
```

### `public/js/admin/init.js`

```javascript
class AdminDashboard {
  constructor() {
    this.api = window.api; // Cliente HTTP
    this.currentPage = null;
    this.selectedBarber = 1; // Barbeiro selecionado
  }
  
  async init() {
    await this.loadHeader();
    this.setupHeaderEvents();
    this.initPage();
  }
  
  initPage() {
    const page = this.getCurrentPage();
    switch(page) {
      case 'dashboard':
        return this.initDashboard();
      case 'calendar':
        return this.initCalendar();
      case 'reservations':
        return this.initReservations();
      // ... etc
    }
  }
}

// Inicializar quando DOM pronto
document.addEventListener('DOMContentLoaded', async () => {
  window.dashboard = new AdminDashboard();
  await window.dashboard.init();
});
```

---

## 🎨 Design System (Mantido)

### Cores
```css
--color-primary: #218089;     /* Teal */
--color-secondary: #32b8c6;   /* Teal mais claro */
--color-bg: #f5f5f5;          /* Fundo */
--color-text: #333;           /* Texto */
```

### Componentes
- Buttons com gradientes
- Cards com sombras
- Forms com validação
- Modals reutilizáveis
- Badges de status

---

## 🎯 Calendário - Design Novo

### Vista Geral (5 colunas)

```
┌─────────────────────────────────────────┐
│ Calendário - Vista Geral                │
├─────────────────────────────────────────┤
│                                         │
│  Gui         Bruno       João    ...   │
│  ─────────────────────────────────     │
│  10:00       10:00       10:30         │
│  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │José    │  │Carlos  │  │Maria   │   │
│  │Corte   │  │Barba   │  │Corte+B │   │
│  └────────┘  └────────┘  └────────┘   │
│  10:30       10:30       11:00         │
│  [Disponível] ┌────────┐  [Disponível] │
│              │André   │              │
│              │Design  │              │
│              └────────┘              │
│                                       │
└─────────────────────────────────────────┘
```

### Vista Individual (Semanal)

```
┌─────────────────────────────────────────┐
│ Calendário - Gui | < Semana 52 >        │
├─────────────────────────────────────────┤
│                                         │
│ Segunda-feira, 22 de Dezembro           │
│ ┌───────────────────────────────────┐  │
│ │ 10:00 - José Silva                │  │
│ │ Corte de Cabelo + Barba (45 min)  │  │
│ │ €25 | Confirmada                  │  │
│ │ [Editar] [Cancelar]               │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ 10:45 - Livre                     │  │
│ └───────────────────────────────────┘  │
│                                         │
│ Terça-feira, 23 de Dezembro             │
│ [Sem reservas]                          │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📝 Reservas - Design Novo

```
┌──────────────────────────────────────────────────┐
│ Reservas                                         │
├──────────────────────────────────────────────────┤
│                                                  │
│ Filtros:                                         │
│ [Status ▼] [Barbeiro ▼] [Data ▼]               │
│                                                  │
│ ┌────────────────────────────────────────────┐  │
│ │ José Silva                    24/12 10:00  │  │
│ │ Corte + Barba | Gui | €25                 │  │
│ │ ✓ Confirmada                              │  │
│ │ [Ver Detalhes] [Editar] [Cancelar]        │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ ┌────────────────────────────────────────────┐  │
│ │ Carlos Santos                  24/12 10:30 │  │
│ │ Barba | Bruno | €10                       │  │
│ │ ⏳ Pendente                                │  │
│ │ [Ver Detalhes] [Editar] [Cancelar]        │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 🚫 Indisponibilidades - Design Novo

```
┌──────────────────────────────────────────────────┐
│ Indisponibilidades                               │
├──────────────────────────────────────────────────┤
│                                                  │
│ Nova Indisponibilidade:                          │
│                                                  │
│ Barbeiro: [Gui ▼]                               │
│ Data: [24/12/2025]                              │
│ Hora Início: [12:00]                            │
│ Hora Fim: [13:00]                               │
│ Motivo: [Almoço]                                │
│ [Adicionar]                                      │
│                                                  │
│ ─────────────────────────────────────────────   │
│                                                  │
│ ┌────────────────────────────────────────────┐  │
│ │ Gui - 24/12 12:00 até 13:00               │  │
│ │ Motivo: Almoço | Duração: 1h              │  │
│ │ [Editar] [Remover]                        │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 📋 Nova Reserva - Design Novo

```
┌──────────────────────────────────────────────────┐
│ Criar Nova Reserva                               │
├──────────────────────────────────────────────────┤
│                                                  │
│ Barbeiro: [Gui ▼]                               │
│ Data: [24/12/2025]                              │
│ Hora: [10:00 ▼]                                 │
│ Serviço: [Corte + Barba ▼]                      │
│                                                  │
│ Dados do Cliente:                                │
│ Nome: [José Silva]                              │
│ Telefone: [(+351) 912345678]                    │
│ Email: [jose@gmail.com]                         │
│                                                  │
│ Notificações:                                    │
│ ☑ Email                                         │
│ ☑ Lembrete (1 dia antes)                       │
│                                                  │
│ [Criar Reserva]                                 │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 🔗 Integração com Homepage

### Header Dinâmico
```html
<header class="admin-header">
  <div class="header-left">
    <h1>🏢 Brooklyn Barbearia - Admin</h1>
  </div>
  
  <div class="header-center">
    <nav class="admin-nav">
      <a href="/admin/dashboard" class="nav-item">Dashboard</a>
      <a href="/admin/calendar" class="nav-item">Calendário</a>
      <a href="/admin/reservations" class="nav-item">Reservas</a>
      <a href="/admin/unavailable" class="nav-item">Indisponibilidades</a>
      <a href="/admin/new-booking" class="nav-item">Nova Reserva</a>
    </nav>
  </div>
  
  <div class="header-right">
    <select id="barber-selector" class="barber-select">
      <option value="">-- Geral --</option>
      <option value="1">Gui</option>
      <option value="2">Bruno</option>
      <option value="3">João</option>
    </select>
    
    <div class="notifications">
      <span class="notification-badge">3</span>
      🔔
    </div>
    
    <button class="logout-btn">Sair</button>
  </div>
</header>
```

---

## ✅ Checklist de Implementação

### Ficheiros a Criar
- [ ] `public/js/admin/mock-data.js` - Mock data local
- [ ] `public/css/admin/calendar.css` - Estilos calendário
- [ ] `public/css/admin/reservations.css` - Estilos reservas
- [ ] `public/css/admin/unavailable.css` - Estilos indisponibilidades
- [ ] `public/css/admin/new-booking.css` - Estilos nova reserva

### HTML Files
- [ ] Recriar `calendar.html` - Dual view (geral + individual)
- [ ] Recriar `reservations.html` - Lista com filtros
- [ ] Recriar `unavailable.html` - Formulário + lista
- [ ] Recriar `new-booking.html` - Formulário nova reserva

### JavaScript Managers
- [ ] Atualizar `calendar.js` - Dual view logic
- [ ] Atualizar `reservations.js` - Lista + filtros
- [ ] Atualizar `unavailable.js` - Formulário + lista
- [ ] Atualizar `new-booking.js` - Formulário nova reserva

### Backend (Depois)
- [ ] `functions/api/admin/barbeiros.js`
- [ ] `functions/api/admin/reservations.js`
- [ ] `functions/api/admin/unavailable.js`
- [ ] `functions/api/admin/clientes.js`

---

## 🎓 Como Usar Mock Data

Enquanto backend não estiver pronto:

```javascript
// api.js automaticamente retorna mock data
const barbeiros = await window.api.request('/barbeiros');
// Retorna mockData.barbeiros

const reservations = await window.api.request('/reservations');
// Retorna mockData.reservations
```

Quando backend estiver pronto, apenas trocar:
```javascript
// Remover fallback para mock
// API chama backend real automaticamente
```

---

## 📞 Próximas Etapas

1. **Hoje**: Reestruturar HTML + CSS + JS com mock data
2. **Amanhã**: Criar endpoints backend
3. **Depois**: Integrar API real

---

**Status**: 🔄 Em Refatoração  
**Branch**: `refactor/admin-dashboard-complete`  
**Data**: 24 de Dezembro de 2025
