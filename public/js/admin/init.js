// Centralized initialization for admin dashboard
// Loads header, initializes page based on current URL
// NOW INTEGRATED WITH REAL APIs!

class AdminDashboard {
  constructor() {
    // Wait for API to be available
    if (!window.api) {
      console.error('API client not loaded!');
      this.showError('Erro ao carregar cliente API');
      return;
    }
    
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
      this.showError('Falha ao carregar página');
    }
  }

  async loadHeader() {
    const headerContainer = document.getElementById('header-container');
    if (!headerContainer) return;

    try {
      // Fetch header HTML
      const response = await fetch('/admin/header.html');
      const headerHTML = await response.text();
      headerContainer.innerHTML = headerHTML;

      // Set active nav item
      this.updateNavigation();

      // Setup header event listeners
      this.setupHeaderListeners();
    } catch (error) {
      console.error('Error loading header:', error);
    }
  }

  updateNavigation() {
    const navItems = document.querySelectorAll('[data-view]');
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-view') === this.currentPage) {
        item.classList.add('active');
      }
    });
  }

  setupHeaderListeners() {
    // Barber selector
    const profileToggle = document.getElementById('profileToggle');
    if (profileToggle) {
      profileToggle.addEventListener('click', () => {
        const menu = document.getElementById('profileMenu');
        if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin-login.html';
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
      // 🏗️ NOVO: Chamar API real!
      const stats = await this.api.request('/dashboard/stats');
      
      // Renderizar stats
      const elMes = document.getElementById('mes-reservas');
      const elHoje = document.getElementById('hoje-reservas');
      const elAnteriores = document.getElementById('dia-anterior-reservas');

      if (elMes) elMes.textContent = stats.mes_reservas || 0;
      if (elHoje) elHoje.textContent = stats.hoje_reservas || 0;
      if (elAnteriores) elAnteriores.textContent = stats.dia_anterior_concluidas || 0;

      // Renderizar gráfico com dados reais
      this.renderDashboardChart(stats.barbeiros || []);
    } catch (error) {
      console.error('Dashboard init error:', error);
      // Usar fallback com dados mock
      this.renderDashboardChart([]);
    }
  }

  renderDashboardChart(barbeiros) {
    const chartContainer = document.getElementById('chart-container');
    if (!chartContainer) return;

    if (!barbeiros || barbeiros.length === 0) {
      chartContainer.innerHTML = '<p style="color: #888; text-align: center; padding: 40px;">Sem dados de barbeiros</p>';
      return;
    }

    chartContainer.innerHTML = `
      <div class="chart-container">
        ${barbeiros.map(item => `
          <div class="chart-barber-group">
            <div class="chart-barber-name">${item.nome}</div>
            <div class="chart-bars">
              <div class="chart-bar-group">
                <div class="chart-bar" style="height: ${(item.concluidas_ontem || 0) * 10}px" title="Concluídas: ${item.concluidas_ontem || 0}"></div>
                <span>Concluídas</span>
              </div>
              <div class="chart-bar-group">
                <div class="chart-bar" style="height: ${(item.agendadas_hoje || 0) * 10}px; opacity: 0.6;" title="Agendadas: ${item.agendadas_hoje || 0}"></div>
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
      // 🏗️ NOVO: Chamar API real!
      const barbers = await this.api.barbeiros.getAll();
      const selector = document.getElementById('barber-filter');
      
      if (selector) {
        selector.innerHTML = `
          <option value="">Todos os barbeiros</option>
          ${barbers.map(b => `<option value="${b.id}">${b.nome}</option>`).join('')}
        `;

        selector.addEventListener('change', () => this.renderCalendarView());
      }

      // Renderizar vista inicial
      await this.renderCalendarView();
    } catch (error) {
      console.error('Calendar init error:', error);
      this.showError('Erro ao carregar calendário: ' + error.message);
    }
  }

  async renderCalendarView() {
    const viewToggle = document.getElementById('view-toggle');
    const viewType = viewToggle ? viewToggle.value : 'general';
    const container = document.getElementById('calendar-content');
    if (!container) return;

    try {
      const barbers = await this.api.barbeiros.getAll();
      const reservations = await this.api.reservations.getAll({ limit: 100 });
      
      if (viewType === 'general') {
        this.renderGeneralView(barbers, reservations.data || [], container);
      } else {
        this.renderIndividualView(barbers, reservations.data || [], container);
      }
    } catch (error) {
      console.error('Calendar render error:', error);
      container.innerHTML = '<p style="color: #888;">Erro ao carregar calendário</p>';
    }
  }

  renderGeneralView(barbers, reservations, container) {
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
  }

  renderIndividualView(barbers, reservations, container) {
    const selectedBarberId = document.getElementById('barber-filter')?.value;
    const selectedBarber = barbers.find(b => b.id == selectedBarberId);

    if (!selectedBarber && selectedBarberId) {
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
      const date = new Date(today);
      date.setDate(first + i);
      week.push(date);
    }
    return week;
  }

  async initReservations() {
    try {
      // 🏗️ NOVO: Chamar API real!
      const result = await this.api.reservations.getAll({ limit: 50 });
      const reservations = result.data || [];
      this.renderReservationsList(reservations);

      // Setup filters
      const filterStatus = document.getElementById('status-filter');
      if (filterStatus) {
        filterStatus.addEventListener('change', () => this.filterReservations());
      }
    } catch (error) {
      console.error('Reservations init error:', error);
      this.showError('Erro ao carregar reservas: ' + error.message);
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
      // 🏗️ NOVO: Chamar API real!
      const result = await this.api.unavailableTimes.getAll({ limit: 50 });
      const times = result.data || [];
      this.renderUnavailableList(times);

      // Setup form
      this.setupUnavailableForm();
    } catch (error) {
      console.error('Unavailable init error:', error);
      this.showError('Erro ao carregar indisponibilidades: ' + error.message);
    }
  }

  setupUnavailableForm() {
    const form = document.getElementById('unavailable-form');
    if (!form) return;

    // Load barbers
    this.api.barbeiros.getAll().then(barbers => {
      const selector = document.getElementById('barber-select-unavailable');
      if (selector) {
        selector.innerHTML = `
          <option value="">Seleccione um barbeiro</option>
          ${barbers.map(b => `<option value="${b.id}">${b.nome}</option>`).join('')}
        `;
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = {
        barbeiro_id: parseInt(formData.get('barber-select-unavailable')),
        data_hora_inicio: formData.get('unavailable-start'),
        data_hora_fim: formData.get('unavailable-end'),
        tipo: formData.get('unavailable-type'),
        motivo: formData.get('unavailable-reason'),
        dia_inteiro: formData.get('unavailable-allday') ? true : false
      };

      try {
        await this.api.unavailableTimes.create(data);
        this.showSuccess('Indisponibilidade registada com sucesso');
        form.reset();
        // Recarregar lista
        const result = await this.api.unavailableTimes.getAll({ limit: 50 });
        this.renderUnavailableList(result.data || []);
      } catch (error) {
        this.showError('Erro ao registar indisponibilidade: ' + error.message);
      }
    });
  }

  renderUnavailableList(times) {
    const container = document.getElementById('unavailable-list');
    if (!container) return;

    if (!times || times.length === 0) {
      container.innerHTML = '<p class="empty-state">Nenhuma indisponibilidade registada</p>';
      return;
    }

    container.innerHTML = times.map(t => `
      <div class="unavailable-card">
        <div class="unavailable-header">
          <h4>${t.barbeiro_nome || 'Barbeiro'}</h4>
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
      // 🏗️ NOVO: Chamar API real!
      const [barbers, services] = await Promise.all([
        this.api.barbeiros.getAll(),
        this.api.servicos.getAll()
      ]);

      this.populateSelects(barbers, services);
      this.setupFormHandlers();
    } catch (error) {
      console.error('New booking init error:', error);
      this.showError('Erro ao carregar dados de reserva: ' + error.message);
    }
  }

  populateSelects(barbers, services) {
    const bberSelect = document.getElementById('barber-select');
    const serviceSelect = document.getElementById('service-select');

    const bberOptions = `
      <option value="">Seleccione um barbeiro</option>
      ${barbers.map(b => `<option value="${b.id}">${b.nome}</option>`).join('')}
    `;

    if (bberSelect) bberSelect.innerHTML = bberOptions;

    if (serviceSelect) {
      serviceSelect.innerHTML = `
        <option value="">Seleccione um serviço</option>
        ${services.map(s => `<option value="${s.id}" data-duracao="${s.duracao}" data-preco="${s.preco}">${s.nome} - €${s.preco}</option>`).join('')}
      `;
    }
  }

  setupFormHandlers() {
    const bookingForm = document.getElementById('booking-form');
    if (!bookingForm) return;

    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(bookingForm);
      const data = {
        cliente_nome: formData.get('client-name'),
        cliente_email: formData.get('client-email'),
        cliente_telefone: formData.get('client-phone'),
        barbeiro_id: parseInt(formData.get('barber-select')),
        servico_id: parseInt(formData.get('service-select')),
        data_hora: `${formData.get('booking-date')} ${formData.get('booking-time')}:00`,
        notas: formData.get('booking-notes'),
        notificacao_email: formData.get('send-email') ? true : false,
        notificacao_whatsapp: formData.get('send-whatsapp') ? true : false
      };

      try {
        await this.api.reservations.create(data);
        this.showSuccess('Reserva criada com sucesso!');
        bookingForm.reset();
        setTimeout(() => window.location.href = '/admin/calendar', 2000);
      } catch (error) {
        this.showError('Erro ao criar reserva: ' + error.message);
      }
    });
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #ff6b6b; color: white; padding: 16px 24px; border-radius: 8px; z-index: 9999; font-weight: 500;';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }

  showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #51cf66; color: white; padding: 16px 24px; border-radius: 8px; z-index: 9999; font-weight: 500;';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 5000);
  }
}

// Initialize on page load
// Make sure api.js is loaded first!
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Check if API is ready
    if (window.api) {
      new AdminDashboard();
    } else {
      console.error('API not available. Make sure api.js is loaded before init.js');
    }
  });
} else {
  if (window.api) {
    new AdminDashboard();
  } else {
    console.error('API not available. Make sure api.js is loaded before init.js');
  }
}
