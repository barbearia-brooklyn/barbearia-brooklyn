# Admin Dashboard Redesign - Próximas Etapas (Fase 2)

## Overview

A Fase 1 da reestruturação do dashboard foi completada com sucesso. A branch `feat/admin-dashboard-redesign` contém:

✅ Novo layout com header responsivo
✅ Dashboard home com estatísticas
✅ Calendário com proporções reais
✅ Design cozy moderno e completo

Para proceder com a Fase 2, são necessárias as seguintes implementações:

---

## 1. Implementação de APIs

### 1.1 Endpoint para Obter Estatísticas do Dashboard

**Ficheiro**: `functions/api/admin/dashboard.js` (novo)

```javascript
// GET /api/admin/dashboard/stats?barberId={id}&month={YYYY-MM}
export async function onRequest(context) {
  const { request, env, data } = context;
  const url = new URL(request.url);
  const barberId = url.searchParams.get('barberId');
  const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);

  // 1. Contar reservas do mês
  // 2. Contar reservas de hoje
  // 3. Contar reservas concluídas do dia anterior
  // 4. Retornar dados em JSON
}
```

### 1.2 Endpoint para Registar Encerramento

**Ficheiro**: `functions/api/admin/closures.js` (novo)

```javascript
// POST /api/admin/closures
export async function onRequest(context) {
  const { request, env, data } = context;
  
  if (request.method === 'POST') {
    // 1. Obter dados da closure (startDate, endDate, message)
    // 2. Validar datas
    // 3. Guardar em Durable Objects ou KV
    // 4. Enviar email aos clientes
    // 5. Retornar sucesso
  }
  
  if (request.method === 'GET') {
    // 1. Listar encerramentos ativos
    // 2. Filtrar por datas
  }
}
```

### 1.3 Modificar Endpoint de Reservas

**Ficheiro**: `functions/api/admin/reservations.js`

Adicionar filtro de status:

```javascript
// GET /api/admin/reservations?barberId={id}&status=concluída&startDate={ISO}&endDate={ISO}
```

---

## 2. Atualizar JavaScript do Dashboard

### 2.1 DashboardManager - Conectar APIs

**Ficheiro**: `public/js/admin/dashboard.js`

Atualizações necessárias:

```javascript
// Atualizar URLs de API com endpoints reais
getMonthReservations(barberId) {
  // Usar endpoint: GET /api/admin/reservations?barberId={id}&month={YYYY-MM}
}

getTodayReservations(barberId) {
  // Usar endpoint: GET /api/admin/reservations?barberId={id}&date={YYYY-MM-DD}
}

getYesterdayCompletedReservations(barberId) {
  // Usar endpoint com status=concluída
}
```

### 2.2 Handlers para Modal de Encerramento

**Ficheiro**: `public/js/admin/unavailable.js` (adicionar)

```javascript
const ClosureManager = {
  saveClosureAsync(closureData) {
    // POST para /api/admin/closures
    // Mostrar notificação de sucesso
    // Fechar modal
    // Recarregar dados do dashboard
  },
  
  loadClosures() {
    // GET /api/admin/closures
    // Renderizar lista de encerramentos
  }
};
```

---

## 3. Melhorias do Calendário

### 3.1 Renderização Proporcional

**Ficheiro**: `public/js/admin/calendar.js`

Implementar cálculo de altura para reservas:

```javascript
function calculateReservationHeight(serviceDuration, hourHeight = 60) {
  // serviceDuration em minutos
  // Se hourHeight = 60px, então 30min = 30px
  const minutes = serviceDuration;
  const hours = minutes / 60;
  return hours * hourHeight;
}

function renderReservationCard(reservation, hourHeight) {
  const height = calculateReservationHeight(reservation.service.duration, hourHeight);
  // Aplicar altura à card
  // Posicionar corretamente no timeline
}
```

### 3.2 Suporte para Encerramentos

Mostrar visualmente encerramentos no calendário:

```javascript
// Quando há encerramento, mostrar banner/mensagem
if (isClosed(date)) {
  showClosureBanner(closureMessage);
  disableAllReservationSlots();
}
```

---

## 4. Integração com ProfileManager

### 4.1 Verificar Métodos Necessários

Garantir que existem:

```javascript
ProfileManager.getSelectedBarber() // Retorna ID do barbeiro selecionado
ProfileManager.getBarbeiros() // Retorna array de barbeiros
ProfileManager.selectBarber(id) // Define barbeiro selecionado
```

Se não existirem, implementar em `public/js/admin/profiles.js`

### 4.2 LocalStorage para Barbeiro Selecionado

```javascript
ProfileManager.selectBarber(barberId) {
  this.selectedBarber = barberId;
  localStorage.setItem('selectedBarberId', barberId);
  
  // Recarregar dados do dashboard
  DashboardManager.loadDashboardData();
}

ProfileManager.getSelectedBarber() {
  return this.selectedBarber || localStorage.getItem('selectedBarberId');
}
```

---

## 5. Validações e Segurança

### 5.1 Validações no Cliente

```javascript
// Dashboard.js
validateDateRange(startDate, endDate) {
  if (endDate < startDate) {
    throw new Error('Data de fim não pode ser anterior à data de início');
  }
}

// Unavailable.js
validateClosureData(data) {
  if (!data.startDate || !data.endDate) {
    throw new Error('Datas obrigatórias');
  }
  if (!data.message || data.message.trim() === '') {
    throw new Error('Mensagem obrigatória');
  }
}
```

### 5.2 Validações no Servidor

```javascript
// functions/api/admin/closures.js
if (!isValidDate(startDate) || !isValidDate(endDate)) {
  return new Response('Datas inválidas', { status: 400 });
}

if (endDate < startDate) {
  return new Response('Data de fim não pode ser anterior', { status: 400 });
}
```

---

## 6. Notificações aos Utilizadores

### 6.1 Email de Encerramento

Quando é registado um encerramento, enviar email:

```javascript
// functions/api/admin/closures.js
await sendClosureNotification({
  to: '[ALL_USERS_EMAIL]', // Ou list de emails
  startDate: closure.startDate,
  endDate: closure.endDate,
  message: closure.message
});
```

### 6.2 Toast Notifications

Adicionar feedback visual:

```javascript
// public/js/admin/ui.js ou novo toast.js
UIHelper.showToast('Encerramento registado com sucesso', 'success');
UIHelper.showToast('Erro ao registar encerramento', 'error');
```

---

## 7. Testes Recomendados

### 7.1 Testes Unitários

```javascript
// test/dashboard.test.js
test('calculateReservationHeight', () => {
  const height = calculateReservationHeight(30, 60); // 30 min, 60px/hora
  expect(height).toBe(30);
});

test('validateDateRange', () => {
  expect(() => {
    validateDateRange(new Date('2025-12-25'), new Date('2025-12-24'));
  }).toThrow();
});
```

### 7.2 Testes de Integração

```javascript
// test/api.test.js
test('POST /api/admin/closures', async () => {
  const response = await fetch('/api/admin/closures', {
    method: 'POST',
    body: JSON.stringify({
      startDate: '2025-12-25',
      endDate: '2025-12-26',
      message: 'Encerrado para Natal'
    })
  });
  
  expect(response.status).toBe(201);
  const data = await response.json();
  expect(data.id).toBeDefined();
});
```

### 7.3 Testes de UI

- Verificar que o modal de encerramento abre e fecha
- Testar formulário de encerramento com datas várias
- Verificar que o dashboard recarrega após encerramento
- Testar responsividade em diferentes tamanhos de ecrã

---

## 8. Checklist de Implementação

- [ ] Criar arquivo `functions/api/admin/dashboard.js`
- [ ] Criar arquivo `functions/api/admin/closures.js`
- [ ] Atualizar `functions/api/admin/reservations.js` com filtro de status
- [ ] Atualizar `DashboardManager.loadDashboardData()`
- [ ] Implementar `ClosureManager`
- [ ] Adicionar cálculos de altura proporcional no calendário
- [ ] Integrar encerramento visual no calendário
- [ ] Adicionar LocalStorage para barbeiro selecionado
- [ ] Implementar validações
- [ ] Adicionar notificações por email
- [ ] Implementar toast notifications
- [ ] Escrever testes
- [ ] Fazer code review
- [ ] Mergear para `main`

---

## 9. Timeline Estimada

| Tarefa | Estimativa | Responsável |
|--------|-----------|-------------|
| APIs | 3-4 dias | Backend |
| DashboardManager | 2 dias | Frontend |
| ClosureManager | 2 dias | Frontend |
| Calendário Proporcional | 2 dias | Frontend |
| Validações | 1 dia | Full Stack |
| Testes | 3 dias | QA |
| Review | 1 dia | Lead |
| **Total** | **~14-15 dias** | |

---

## 10. Contatos e Suporte

Para dúvidas sobre a implementação:
- Revisar design reference na Captura-de-ecra-2025-12-24-092049.jpg
- Consultar REDESIGN_PROGRESS.md para status atual
- Fazer code review com equipa

---

**Data**: 24 de Dezembro de 2025
**Status Branch**: Pronto para Fase 2
**Próxima Atualização**: Após implementação de APIs
