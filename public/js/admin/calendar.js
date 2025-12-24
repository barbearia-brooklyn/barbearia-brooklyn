/**
 * Calendar Manager
 * Gerencia a visão geral (5 colunas) e individual (semanal)
 */

class CalendarManager {
  constructor() {
    this.barbeiros = window.mockData.barbeiros;
    this.reservations = window.mockData.reservations;
    this.unavailableTimes = window.mockData.unavailableTimes;
    this.currentView = 'general';
    this.currentBarber = 1;
    this.currentWeek = this.getWeekNumber(new Date());
    this.currentDate = new Date();
  }

  init() {
    this.setupEventListeners();
    this.renderGeneralView();
  }

  setupEventListeners() {
    // Selecionar vista
    document.getElementById('view-general').addEventListener('click', () => this.switchView('general'));
    document.getElementById('view-individual').addEventListener('click', () => this.switchView('individual'));

    // Navegação de semana
    document.getElementById('prev-btn').addEventListener('click', () => this.previousWeek());
    document.getElementById('next-btn').addEventListener('click', () => this.nextWeek());

    // Header selector de barbeiro
    const barbeiroSelector = document.getElementById('barber-selector');
    if (barbeiroSelector) {
      barbeiroSelector.addEventListener('change', (e) => {
        this.currentBarber = parseInt(e.target.value) || 1;
        if (this.currentView === 'individual') {
          this.renderIndividualView();
        }
      });
    }
  }

  switchView(view) {
    this.currentView = view;

    // Atualizar botões
    document.getElementById('view-general').classList.toggle('active', view === 'general');
    document.getElementById('view-individual').classList.toggle('active', view === 'individual');

    // Atualizar vistas
    document.getElementById('general-view').classList.toggle('active', view === 'general');
    document.getElementById('individual-view').classList.toggle('active', view === 'individual');

    if (view === 'general') {
      this.renderGeneralView();
    } else {
      this.renderIndividualView();
    }
  }

  // ========== VISTA GERAL: 5 Colunas ==========

  renderGeneralView() {
    const grid = document.getElementById('general-grid');
    if (!grid) return;

    // Obter data base (hoje ou semana atual)
    const today = new Date();
    const html = this.barbeiros.map(barber => 
      this.renderBarberColumn(barber, today)
    ).join('');

    grid.innerHTML = html;

    // Add event listeners aos slots
    grid.querySelectorAll('.time-slot').forEach(slot => {
      slot.addEventListener('click', (e) => {
        const data = slot.dataset.data;
        const hora = slot.dataset.hora;
        const barbeiro_id = slot.dataset.barber_id;
        if (!slot.classList.contains('unavailable')) {
          this.openBookingModal(data, hora, barbeiro_id);
        }
      });
    });
  }

  renderBarberColumn(barber, date) {
    const slots = [];
    const horaAbertura = 9;
    const horaFecho = 18;

    // Gerar slots de 30 em 30 minutos
    for (let hora = horaAbertura; hora < horaFecho; hora++) {
      for (let minuto of [0, 30]) {
        const hStr = String(hora).padStart(2, '0');
        const mStr = String(minuto).padStart(2, '0');
        const horaFormatada = `${hStr}:${mStr}`;
        const dataStr = this.formatDate(date);

        // Verificar se tem indisponibilidade
        const indisponivel = this.unavailableTimes.some(u =>
          u.barbeiro_id === barber.id &&
          u.data === dataStr &&
          this.isTimeInRange(horaFormatada, u.hora_inicio, u.hora_fim)
        );

        // Verificar se tem reserva
        const reserva = this.reservations.find(r =>
          r.barbeiro_id === barber.id &&
          r.data === dataStr &&
          r.hora === horaFormatada
        );

        let slotClass = 'time-slot';
        let content = `<div class="time-slot-header">${horaFormatada}</div>`;

        if (indisponivel) {
          slotClass += ' unavailable';
          const indisp = this.unavailableTimes.find(u =>
            u.barbeiro_id === barber.id &&
            u.data === dataStr &&
            this.isTimeInRange(horaFormatada, u.hora_inicio, u.hora_fim)
          );
          content += `<div class="time-slot-content">🚫 ${indisp.motivo}</div>`;
        } else if (reserva) {
          slotClass += ' booked';
          content += `
            <div class="time-slot-content">
              <div class="client-name">${reserva.cliente.substring(0, 12)}</div>
              <div class="service-name">${this.getServiceName(reserva.servico_id).substring(0, 15)}</div>
            </div>
          `;
        } else {
          slotClass += ' free';
        }

        slots.push(`
          <div class="${slotClass}" 
               data-data="${dataStr}" 
               data-hora="${horaFormatada}"
               data-barber_id="${barber.id}">
            ${content}
          </div>
        `);
      }
    }

    return `
      <div class="barber-column">
        <div class="barber-column-header">${barber.nome}</div>
        <div class="barber-column-content">
          ${slots.join('')}
        </div>
      </div>
    `;
  }

  // ========== VISTA INDIVIDUAL: Semana ==========

  renderIndividualView() {
    const grid = document.getElementById('individual-grid');
    if (!grid) return;

    const barber = this.barbeiros.find(b => b.id === this.currentBarber);
    if (!barber) return;

    // Obter semana atual
    const startDate = this.getWeekStart(this.currentDate);
    const days = [];

    // Gerar 7 dias
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      days.push(this.renderDayCard(barber, day));
    }

    // Atualizar indicador de semana
    const weekNum = this.getWeekNumber(startDate);
    document.getElementById('week-indicator').textContent = `Semana ${weekNum}`;

    const weekNav = `
      <div class="week-navigation">
        <button id="prev-btn" class="btn btn-sm btn-outline">\u2190 Semana Anterior</button>
        <span id="barber-name-header" style="font-weight: 600; color: #218089;">${barber.nome}</span>
        <button id="next-btn" class="btn btn-sm btn-outline">Próxima Semana \u2192</button>
      </div>
      <div class="week-days">
        ${days.join('')}
      </div>
    `;

    grid.innerHTML = weekNav;

    // Atualizar event listeners de navegação
    document.getElementById('prev-btn').addEventListener('click', () => this.previousWeek());
    document.getElementById('next-btn').addEventListener('click', () => this.nextWeek());

    // Reservations click
    grid.querySelectorAll('.reservation-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const reservaId = item.dataset.reserva_id;
        this.editReservation(reservaId);
      });
    });
  }

  renderDayCard(barber, date) {
    const dataStr = this.formatDate(date);
    const dayName = this.getDayName(date);
    const dayNum = date.getDate();

    // Obter reservas do dia
    const dayReservations = this.reservations.filter(r =>
      r.barbeiro_id === barber.id && r.data === dataStr
    ).sort((a, b) => a.hora.localeCompare(b.hora));

    const reservaHtml = dayReservations.length > 0
      ? dayReservations.map(r => `
          <div class="reservation-item" data-reserva_id="${r.id}">
            <div class="reservation-time">${r.hora}</div>
            <div class="reservation-client">${r.cliente}</div>
            <div class="reservation-service">${this.getServiceName(r.servico_id)}</div>
            <div class="reservation-price">\u20ac${r.preco}</div>
            <div class="status-badge ${r.status}">${this.getStatusLabel(r.status)}</div>
            <div class="reservation-actions">
              <button class="btn btn-sm btn-primary" onclick="alert('Editar: ${r.id}')">Editar</button>
              <button class="btn btn-sm btn-danger" onclick="alert('Cancelar: ${r.id}')">Cancelar</button>
            </div>
          </div>
        `).join('')
      : '<div class="day-content empty"></div>';

    return `
      <div class="day-column">
        <div class="day-header">
          <span class="day-name">${dayName}</span>
          <span class="day-date">${dayNum}</span>
        </div>
        <div class="day-content">
          ${reservaHtml}
        </div>
      </div>
    `;
  }

  // ========== HELPERS ==========

  previousWeek() {
    this.currentDate.setDate(this.currentDate.getDate() - 7);
    if (this.currentView === 'individual') {
      this.renderIndividualView();
    }
  }

  nextWeek() {
    this.currentDate.setDate(this.currentDate.getDate() + 7);
    if (this.currentView === 'individual') {
      this.renderIndividualView();
    }
  }

  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  getDayName(date) {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    return days[date.getDay()];
  }

  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getServiceName(serviceId) {
    const service = window.mockData.servicos.find(s => s.id === serviceId);
    return service ? service.nome : 'Serviço';
  }

  getStatusLabel(status) {
    const labels = {
      confirmada: '✓ Confirmada',
      pendente: '⏳ Pendente',
      concluida: '✓ Concluída',
      cancelada: '× Cancelada'
    };
    return labels[status] || status;
  }

  isTimeInRange(time, start, end) {
    return time >= start && time < end;
  }

  openBookingModal(data, hora, barbeiro_id) {
    console.log(`Criar reserva: ${data} ${hora} com barbeiro ${barbeiro_id}`);
    // TODO: Implementar modal
  }

  editReservation(reservaId) {
    console.log(`Editar reserva: ${reservaId}`);
    // TODO: Implementar edição
  }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.calendarManager = new CalendarManager();
    window.calendarManager.init();
  });
} else {
  window.calendarManager = new CalendarManager();
  window.calendarManager.init();
}