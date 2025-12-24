# Admin Dashboard Phase 1 - Integration Checklist

## ✍️ Ficheiros para Atualizar no Backend

### Express Routes (server.js ou routes/admin.js)

```javascript
// Adicionar estas rotas:
app.get('/admin', (req, res) => res.redirect('/admin/dashboard'));
app.get('/admin/dashboard', (req, res) => res.sendFile('public/admin/dashboard.html'));
app.get('/admin/calendar', (req, res) => res.sendFile('public/admin/calendar.html'));
app.get('/admin/reservations', (req, res) => res.sendFile('public/admin/reservations.html'));
app.get('/admin/unavailable', (req, res) => res.sendFile('public/admin/unavailable.html'));
app.get('/admin/new-booking', (req, res) => res.sendFile('public/admin/new-booking.html'));
app.get('/admin/header.html', (req, res) => res.sendFile('public/admin/header.html'));

// Servir arquivos CSS/JS estáticos
app.use('/css', express.static('public/css'));
app.use('/js', express.static('public/js'));
```

---

## 📄 HTML - Verificação de Links no Header

### Links de Navegação (public/admin/header.html)

```html
<!-- Verifique se estão corretos: -->
<a href="/admin/dashboard" class="nav-item" data-view="dashboard">
<a href="/admin/calendar" class="nav-item" data-view="calendar">
<a href="/admin/reservations" class="nav-item" data-view="list">
<a href="/admin/unavailable" class="nav-item" data-view="unavailable">
<a href="/admin/new-booking" class="nav-item" data-view="new-booking">
```

---

## 🔍 Teste de Carregamento do Header

### Cada página deve carregar o header dinamicamente:

```html
<!-- No <body> da página: -->
<div id="headerContainer"></div>

<!-- E no <script> correspondente: -->
<script src="/js/admin/main-[page].js"></script>
```

### Dados Que o Header Precisa:

```javascript
// ProfileManager.js deve estar disponível com:
const barbeiros = [
    { id: 1, nome: 'Barbeiro 1' },
    { id: 2, nome: 'Barbeiro 2' },
    { id: 3, nome: 'Barbeiro 3' }
];
```

---

## 📊 CSS - Verificação de Imports

### Cada página HTML deve incluir:

```html
<!-- Estilos base -->
<link rel="stylesheet" href="/css/admin.css">

<!-- Estilos específicos da página -->
<link rel="stylesheet" href="/css/admin/[page]-style.css">
<link rel="stylesheet" href="/css/admin/forms.css"> <!-- se usar formulários -->

<!-- FontAwesome para ícones -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

---

## 🜈 Páginas e Seus Ficheiros

### 1. Dashboard
- **HTML**: `public/admin/dashboard.html` ✅
- **CSS**: `public/css/admin/dashboard.css` ✅
- **JS Manager**: `public/js/admin/dashboard.js` ✅
- **JS Init**: `public/js/admin/main-dashboard.js` ✅

### 2. Calendar
- **HTML**: `public/admin/calendar.html` ✅
- **CSS**: `public/css/admin/calendar-modern.css` ✅
- **JS Manager**: `public/js/admin/calendar-manager.js` ✅
- **JS Init**: `public/js/admin/main-calendar.js` ✅

### 3. Reservations
- **HTML**: `public/admin/reservations.html` ✅
- **CSS**: `public/css/admin/reservations-list.css` ✅
- **JS Manager**: `public/js/admin/reservations-manager.js` ✅
- **JS Init**: `public/js/admin/main-reservations.js` ✅

### 4. Unavailable
- **HTML**: `public/admin/unavailable.html` ✅
- **CSS**: `public/css/admin/forms.css` ✅
- **JS Manager**: `public/js/admin/unavailable-manager.js` ✅
- **JS Init**: `public/js/admin/main-unavailable.js` ✅

### 5. New Booking
- **HTML**: `public/admin/new-booking.html` ✅
- **CSS**: `public/css/admin/forms.css` ✅
- **JS Manager**: `public/js/admin/new-booking-manager.js` ✅
- **JS Init**: `public/js/admin/main-new-booking.js` ✅

### Shared Components
- **Header HTML**: `public/admin/header.html` ✅
- **Auth**: `public/js/admin/auth.js` ✅
- **Profiles**: `public/js/admin/profiles.js` ✅
- **UI Utils**: `public/js/admin/ui.js` ✅
- **Modal**: `public/js/admin/modal.js` ✅

---

## 🧊 Dados Mock Fornecidos

Cada gerenciador inclui dados mock para teste:

### DashboardManager
```javascript
stats = {
    reservasDoMes: 24,
    reservasDeHoje: 5,
    reservasConcluidas: 18
}
```

### CalendarManager
```javascript
reservations = [
    { id: 1, barberId: 1, date, time, duration, clientName, status }
    // ... mais 5 reservas
]
```

### ReservationsManager
```javascript
reservations = [
    { id, date, time, barber, client, service, status }
    // ... 6 reservas completas
]
```

### UnavailableManager
```javascript
unavailableTimes = [
    { id, barberId, date, startTime, endTime, reason }
    // ... 3 horários
]
```

### NewBookingManager
```javascript
services = [
    { id: 'corte', name: 'Corte de Cabelo', duration: 30, price: 15 }
    // ... 4 serviços
]
```

---

## 🔗 Ordem de Carregamento dos Scripts (Importante!)

Cada página deve carregar os scripts nesta ordem:

```html
<!-- 1. Utilitários globais -->
<script src="/js/admin/ui.js"></script>
<script src="/js/admin/modal.js"></script>

<!-- 2. Gestão de estado -->
<script src="/js/admin/auth.js"></script>
<script src="/js/admin/profiles.js"></script>

<!-- 3. Gerenciadores específicos da página -->
<script src="/js/admin/[page]-manager.js"></script>

<!-- 4. Inicialização da página (carrega header + setup) -->
<script src="/js/admin/main-[page].js"></script>
```

---

## 🏷️ Fluxo de Inicialização

```
1. Página HTML carrega
2. main-[page].js executa loadHeaderComponent()
3. Header é carregado dinamicamente via fetch
4. setupHeaderEventListeners() configura eventos do header
5. updateNavItems() marca o link ativo
6. initialize[Page]() prepara o gerenciador
7. Gerenciador carrega dados mock (ou de API)
8. Componentes são renderizados
9. Página fica interativa
```

---

## 🔠 Variáveis Globais Disponíveis

Todos os gerenciadores estarão disponíveis globalmente:

```javascript
window.AuthManager          // Geração de autenticação
window.ProfileManager       // Gerenciamento de barbeiros
window.DashboardManager     // Dashboard
window.CalendarManager      // Calendário
window.ReservationsManager  // Reservas
window.UnavailableManager   // Indisponibilidades
window.NewBookingManager    // Nova Reserva
```

---

## 🔈️ Verificação no Console

Apos carregar qualquer página, no console devem aparecer:

```javascript
// Logs de inicializaçào
"Inicializando CalendarManager..." // ou outro manager
"Carregamento do header: ..." // Status do fetch
"[Page name] page loaded" // Confirmação de carga
```

Sem erros de:
- `Cannot read property 'xxx' of undefined`
- `Uncaught SyntaxError`
- `404 not found` para recursos

---

## 👾 QA Checklist

### Navigation
- [ ] Clique em cada link do menu navega para página correta
- [ ] O link ativo fica destacado
- [ ] Header carrega em todas as páginas

### Profile Selector
- [ ] Dropdown abre/fecha
- [ ] Mudar barbeiro atualiza nome no header
- [ ] Mudar barbeiro regenera dados da página

### Forms
- [ ] Formulários validam antes de submit
- [ ] Mensagens de sucesso/erro aparecem
- [ ] Formulário reseta após submit bem-sucedido

### Responsivity
- [ ] Menu colabs em <768px
- [ ] Layouts adaptam a tamanhos pequenos
- [ ] Sem scroll horizontal em mobile

### Performance
- [ ] Páginas carregam em <1s
- [ ] Sem lag ao interagir
- [ ] Sem memory leaks (DevTools)

---

## 🌟 Próximas Etapas

Após verificação completa:

1. **Integração de APIs**
   - Substituir dados mock por chamadas reais
   - Implementar error handling
   - Adicionar loading states

2. **Melhorias de UX**
   - Toast notifications
   - Confirmação antes de deletar
   - Busca e filtros avançados

3. **Features Avançadas**
   - Drag-and-drop no calendário
   - Exportação de relatórios
   - Sincronização com Google Calendar

---

## 🐛 Known Issues & Notes

- [ ] Header fetch pode falhar se rota não existir
- [ ] Mock data é regenerada ao cada reload (sem persist)
- [ ] Datas mock são fixas em 2025
- [ ] Sem validação de backend ainda

---

**Status**: 🚨 FASE 1 COMPLETA - PRONTO PARA QA
