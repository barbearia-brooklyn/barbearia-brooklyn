// Centralized initialization for admin dashboard
// Loads header, initializes page based on current URL

class AdminDashboard {
  constructor() {
    this.api = window.api;
    this.currentPage = this.detectCurrentPage();
    this.init();
  }

  detectCurrentPage() {
    const pathname = window.location.pathname;
    if (pathname.includes('dashboard')) return 'dashboard';
    if (pathname.includes('calendar')) return 'calendar';
    if (pathname.includes('reservations')) return 'reservations';
    if (pathname.includes('unavailable')) return 'unavailable';
    if (pathname.includes('new-booking')) return 'new-booking';
    return 'dashboard';
  }

  async init() {
    try {
      // Load header component
      await this.loadHeader();
      
      // Initialize page-specific functionality
      await this.initPage();
    } catch (error) {
      console.error('Initialization error:', error);
      this.showError('Failed to load page');
    }
  }

  async loadHeader() {
    const headerContainer = document.getElementById('header-container');
    if (!headerContainer) return;

    // Fetch header HTML
    const response = await fetch('/admin/header.html');
    const headerHTML = await response.text();
    headerContainer.innerHTML = headerHTML;

    // Set active nav item
    this.updateNavigation();

    // Setup header event listeners
    this.setupHeaderListeners();
  }

  updateNavigation() {
    const navItems = document.querySelectorAll('[data-nav]');
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-nav') === this.currentPage) {
        item.classList.add('active');
      }
    });
  }

  setupHeaderListeners() {
    // Barber selector
    const bberSelector = document.getElementById('barber-selector');
    if (bberSelector) {
      bberSelector.addEventListener('change', (e) => {
        localStorage.setItem('selected_barber_id', e.target.value);
        location.reload();
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
      });
    }
  }

  async initPage() {
    switch (this.currentPage) {
      case 'dashboard':
        await this.initDashboard();
        break;
      case 'calendar':
        await this.initCalendar();
        break;
      case 'reservations':
        await this.initReservations();
        break;
      case 'unavailable':
        await this.initUnavailable();
        break;
      case 'new-booking':
        await this.initNewBooking();
        break;
    }
  }

  async initDashboard() {
    try {
      const stats = {
        mesReservas: 12,
        hojeReservas: 3,
        concluidasDiaAnterior: 5
      };

      document.getElementById('mes-reservas').textContent = stats.mesReservas;
      document.getElementById('hoje-reservas').textContent = stats.hojeReservas;
      document.getElementById('dia-anterior-reservas').textContent = stats.concluidasDiaAnterior;

      this.renderDashboardChart();
    } catch (error) {
      console.error('Dashboard init error:', error);
    }
  }

  renderDashboardChart() {
    const chartContainer = document.getElementById('chart-container');
    if (!chartContainer) return;

    const data = [
      { barbeiro: 'Gui Pereira', concluidas: 5, agendadas: 3 },
      { barbeiro: 'Johtta Barros', concluidas: 4, agendadas: 2 },
      { barbeiro: 'Weslley Santos', concluidas: 6, agendadas: 4 }
    ];

    chartContainer.innerHTML = `
      <div class="chart-container">
        ${data.map(item => `
          <div class="chart-barber-group">
            <div class="chart-barber-name">${item.barbeiro}</div>
            <div class="chart-bars">
              <div class="chart-bar-group">
                <div class="chart-bar" style="height: ${item.concluidas * 10}px" title="Concluídas: ${item.concluidas}"></div>
                <span>Concluídas</span>
              </div>
              <div class="chart-bar-group">
                <div class="chart-bar" style="height: ${item.agendadas * 10}px; opacity: 0.6;" title="Agendadas: ${item.agendadas}"></div>
                <span>Agendadas</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  async initCalendar() {
    try {
      // Load barbers for selector
      const barbers = await this.api.barbeiros.getAll();
      const selector = document.getElementById('barber-filter');
      
      if (selector) {
        selector.innerHTML = `
          <option value="">Todos os barbeiros</option>
          ${barbers.map(b => `<option value="${b.id}">${b.nome}</option>`).join('')}
        `;

        selector.addEventListener('change', () => this.renderCalendarView());
      }

      this.renderCalendarView();
    } catch (error) {
      console.error('Calendar init error:', error);
    }
  }

  async renderCalendarView() {
    const viewType = document.getElementById('view-toggle')?.value || 'general';
    const container = document.getElementById('calendar-content');
    if (!container) return;

    try {
      const barbers = await this.api.barbeiros.getAll();
      
      if (viewType === 'general') {
        this.renderGeneralView(barbers, container);
      } else {
        this.renderIndividualView(barbers, container);
      }
    } catch (error) {
      console.error('Calendar render error:', error);
    }
  }

  renderGeneralView(barbers, container) {
    const hours = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
                   '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];
    
    container.innerHTML = `
      <div class="calendar-grid">
        <div class="calendar-header">
          <div class="hour-column">Hora</div>
          ${barbers.map(b => `<div class="barber-column">${b.nome}</div>`).join('')}
        </div>
        ${hours.map(hour => `
          <div class="calendar-row">
            <div class="hour-cell">${hour}</div>
            ${barbers.map(b => `
              <div class="time-slot" data-barber="${b.id}" data-time="${hour}">
                <span class="slot-content">Disponível</span>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    `;

    // Add click handlers to time slots
    container.querySelectorAll('.time-slot').forEach(slot => {
      slot.addEventListener('click', () => this.openBookingModal(slot));
    });
  }

  renderIndividualView(barbers, container) {
    const selectedBarbeirid = document.getElementById('barber-filter')?.value;
    const selectedBarber = barbers.find(b => b.id == selectedBarbeirid);

    if (!selectedBarber && selectedBarbeiroid) {
      container.innerHTML = '<p>Seleccione um barbeiro</p>';
      return;
    }

    const week = this.getWeekDates();
    container.innerHTML = `
      <div class="individual-calendar">
        <div class="week-navigation">
          <button id="prev-week" class="btn btn--sm">← Semana Anterior</button>
          <span class="week-range">${week[0].toLocaleDateString()} - ${week[6].toLocaleDateString()}</span>
          <button id="next-week" class="btn btn--sm">Próxima Semana →</button>
        </div>
        <div class="week-grid">
          ${week.map(date => `
            <div class="day-card">
              <h4>${date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'short' })}</h4>
              <div class="reservations-list">
                <p class="empty-state">Nenhuma reserva</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  getWeekDates() {
    const today = new Date();
    const first = today.getDate() - today.getDay();
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(today.setDate(first + i)));
    }
    return week;
  }

  async initReservations() {
    try {
      const reservations = await this.api.reservations.getAll({ limit: 50 });
      this.renderReservationsList(reservations.data);
    } catch (error) {
      console.error('Reservations init error:', error);
    }
  }

  renderReservationsList(reservations) {
    const container = document.getElementById('reservations-list');
    if (!container) return;

    if (!reservations || reservations.length === 0) {
      container.innerHTML = '<p class="empty-state">Nenhuma reserva encontrada</p>';
      return;
    }

    container.innerHTML = reservations.map(r => `
      <div class="reservation-card">
        <div class="reservation-header">
          <h4>${r.cliente_nome}</h4>
          <span class="status-badge status-${r.status}">${r.status}</span>
        </div>
        <div class="reservation-details">
          <p><strong>Barbeiro:</strong> ${r.barbeiro_nome}</p>
          <p><strong>Serviço:</strong> ${r.servico_nome}</p>
          <p><strong>Data/Hora:</strong> ${new Date(r.data_hora).toLocaleString('pt-PT')}</p>
        </div>
      </div>
    `).join('');
  }

  async initUnavailable() {
    try {
      const times = await this.api.unavailableTimes.getAll({ limit: 50 });
      this.renderUnavailableList(times.data);
    } catch (error) {
      console.error('Unavailable init error:', error);
    }
  }

  renderUnavailableList(times) {
    const container = document.getElementById('unavailable-list');
    if (!container) return;

    if (!times || times.length === 0) {
      container.innerHTML = '<p class="empty-state">Nenhum horário indisponível</p>';
      return;
    }

    container.innerHTML = times.map(t => `
      <div class="unavailable-card">
        <div class="unavailable-header">
          <h4>${t.barbeiro_nome}</h4>
          <span class="type-badge type-${t.tipo}">${t.tipo}</span>
        </div>
        <div class="unavailable-details">
          <p><strong>Início:</strong> ${new Date(t.data_hora_inicio).toLocaleString('pt-PT')}</p>
          <p><strong>Fim:</strong> ${new Date(t.data_hora_fim).toLocaleString('pt-PT')}</p>
          ${t.motivo ? `<p><strong>Motivo:</strong> ${t.motivo}</p>` : ''}
        </div>
      </div>
    `).join('');
  }

  async initNewBooking() {
    try {
      // Load initial data
      const [barbers, services, clients] = await Promise.all([
        this.api.barbeiros.getAll(),
        this.api.servicos.getAll(),
        this.api.clientes.getAll({ limit: 20 })
      ]);

      this.populateSelects(barbers, services);
      this.setupClientSearch(clients);
    } catch (error) {
      console.error('New booking init error:', error);
    }
  }

  populateSelects(barbers, services) {
    const bberSelect = document.getElementById('barber-select');
    const serviceSelect = document.getElementById('service-select');

    if (bberSelect) {
      bberSelect.innerHTML = `
        <option value="">Seleccione um barbeiro</option>
        ${barbers.map(b => `<option value="${b.id}">${b.nome}</option>`).join('')}
      `;
    }

    if (serviceSelect) {
      serviceSelect.innerHTML = `
        <option value="">Seleccione um serviço</option>
        ${services.map(s => `<option value="${s.id}" data-duracao="${s.duracao}" data-preco="${s.preco}">${s.nome} - €${s.preco}</option>`).join('')}
      `;
    }
  }

  setupClientSearch(clients) {
    const clientInput = document.getElementById('client-name');
    if (!clientInput) return;

    clientInput.addEventListener('input', async (e) => {
      if (e.target.value.length < 2) return;
      
      try {
        const results = await this.api.clientes.search(e.target.value);
        this.showClientSuggestions(results.data);
      } catch (error) {
        console.error('Client search error:', error);
      }
    });
  }

  showClientSuggestions(clients) {
    const suggestionsContainer = document.getElementById('client-suggestions');
    if (!suggestionsContainer) return;

    if (!clients || clients.length === 0) {
      suggestionsContainer.style.display = 'none';
      return;
    }

    suggestionsContainer.innerHTML = `
      <div class="suggestions-list">
        ${clients.map(c => `
          <div class="suggestion-item" data-id="${c.id}">
            <strong>${c.nome}</strong><br>
            <small>${c.email} | ${c.telefone}</small>
          </div>
        `).join('')}
      </div>
    `;
    suggestionsContainer.style.display = 'block';

    suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => this.selectClient(item));
    });
  }

  selectClient(element) {
    const id = element.getAttribute('data-id');
    const nome = element.querySelector('strong').textContent;
    const email = element.querySelector('small').textContent.split(' | ')[0];
    const telefone = element.querySelector('small').textContent.split(' | ')[1];

    document.getElementById('client-name').value = nome;
    document.getElementById('client-email').value = email;
    document.getElementById('client-phone').value = telefone;
    document.getElementById('client-id').value = id;
    document.getElementById('client-suggestions').style.display = 'none';
  }

  openBookingModal(slot) {
    // Implementation depends on modal structure
    const bberid = slot.getAttribute('data-barber');
    const time = slot.getAttribute('data-time');
    // Open modal or navigate to booking page
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
  });
} else {
  new AdminDashboard();
}
