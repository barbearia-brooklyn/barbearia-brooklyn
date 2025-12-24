/**
 * Reservations Manager
 * Gerencia a lista de reservas com filtros
 */

class ReservationsManager {
  constructor() {
    this.reservations = window.mockData.reservations;
    this.barbeiros = window.mockData.barbeiros;
    this.servicos = window.mockData.servicos;
    this.filters = {
      status: '',
      barber: '',
      date: ''
    };
  }

  init() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById('filter-status').addEventListener('change', (e) => {
      this.filters.status = e.target.value;
      this.render();
    });

    document.getElementById('filter-barber').addEventListener('change', (e) => {
      this.filters.barber = e.target.value;
      this.render();
    });

    document.getElementById('filter-date').addEventListener('change', (e) => {
      this.filters.date = e.target.value;
      this.render();
    });

    document.getElementById('reset-filters').addEventListener('click', () => {
      this.filters = { status: '', barber: '', date: '' };
      document.getElementById('filter-status').value = '';
      document.getElementById('filter-barber').value = '';
      document.getElementById('filter-date').value = '';
      this.render();
    });
  }

  getFiltered() {
    return this.reservations.filter(reservation => {
      // Filtro por status
      if (this.filters.status && reservation.status !== this.filters.status) {
        return false;
      }

      // Filtro por barbeiro
      if (this.filters.barber && reservation.barbeiro_id !== parseInt(this.filters.barber)) {
        return false;
      }

      // Filtro por data
      if (this.filters.date && reservation.data !== this.filters.date) {
        return false;
      }

      return true;
    });
  }

  render() {
    const filtered = this.getFiltered();
    const container = document.getElementById('reservations-list');

    if (filtered.length === 0) {
      container.innerHTML = '<div class="reservations-list empty"></div>';
      return;
    }

    container.className = 'reservations-list';
    container.innerHTML = filtered
      .sort((a, b) => {
        // Ordenar por data + hora
        const dateA = new Date(`${a.data}T${a.hora}`);
        const dateB = new Date(`${b.data}T${b.hora}`);
        return dateB - dateA;
      })
      .map(reservation => this.renderCard(reservation))
      .join('');

    // Add event listeners
    container.querySelectorAll('.reservation-card').forEach(card => {
      card.addEventListener('click', () => {
        const reservaId = card.dataset.id;
        this.viewDetails(reservaId);
      });
    });
  }

  renderCard(reservation) {
    const barber = this.barbeiros.find(b => b.id === reservation.barbeiro_id);
    const service = this.servicos.find(s => s.id === reservation.servico_id);
    const statusLabel = this.getStatusLabel(reservation.status);
    const statusIcon = this.getStatusIcon(reservation.status);

    // Formatar data
    const [year, month, day] = reservation.data.split('-');
    const dateFormatted = `${day}/${month}/${year}`;

    return `
      <div class="reservation-card" data-id="${reservation.id}">
        <div class="card-header">
          <h3>${reservation.cliente}</h3>
          <span class="card-status ${reservation.status}">${statusIcon} ${statusLabel}</span>
        </div>

        <div class="card-body">
          <p>
            <strong>👤 Barbeiro:</strong>
            <em>${barber ? barber.nome : 'Desconhecido'}</em>
          </p>

          <p>
            <strong>✂️ Serviço:</strong>
            <em>${service ? service.nome : 'N/A'}</em>
          </p>

          <div class="info-box date">
            📅 ${dateFormatted} às ${reservation.hora}
          </div>

          <p>
            <strong>⏳ Duração:</strong>
            <em>${reservation.duracao} min</em>
          </p>

          <div class="info-box price">
            💵 €${reservation.preco}
          </div>

          <p>
            <strong>☎️ Telefone:</strong>
            <em>${reservation.telefone}</em>
          </p>

          <p>
            <strong>📧 Email:</strong>
            <em style="word-break: break-all; font-size: 11px;">${reservation.email}</em>
          </p>

          ${this.getNotificationBadges(reservation)}
        </div>

        <div class="card-actions">
          <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); reservationsManager.editReservation(${reservation.id})">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); reservationsManager.cancelReservation(${reservation.id})">Cancelar</button>
        </div>
      </div>
    `;
  }

  getStatusLabel(status) {
    const labels = {
      confirmada: 'Confirmada',
      pendente: 'Pendente',
      concluida: 'Concluída',
      cancelada: 'Cancelada'
    };
    return labels[status] || status;
  }

  getStatusIcon(status) {
    const icons = {
      confirmada: '✓',
      pendente: '⏳',
      concluida: '✓',
      cancelada: '×'
    };
    return icons[status] || '?';
  }

  getNotificationBadges(reservation) {
    let badges = '';

    if (reservation.notificacao_email) {
      badges += '<p style="margin: 6px 0; font-size: 12px; color: #27ae60;"><strong>✓ Email</strong> enviado</p>';
    }

    if (reservation.notificacao_lembrete) {
      badges += '<p style="margin: 6px 0; font-size: 12px; color: #27ae60;"><strong>✓ Lembrete</strong> agendado</p>';
    }

    return badges;
  }

  viewDetails(reservaId) {
    console.log(`Ver detalhes da reserva ${reservaId}`);
    const reservation = this.reservations.find(r => r.id === reservaId);
    if (reservation) {
      alert(`Detalhes da reserva:\n${JSON.stringify(reservation, null, 2)}`);
    }
  }

  editReservation(reservaId) {
    console.log(`Editar reserva ${reservaId}`);
    alert(`Editar reserva ${reservaId}`);
  }

  cancelReservation(reservaId) {
    const reservation = this.reservations.find(r => r.id === reservaId);
    if (reservation && confirm(`Cancelar reserva de ${reservation.cliente}?`)) {
      reservation.status = 'cancelada';
      this.render();
      alert('Reserva cancelada com sucesso!');
    }
  }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.reservationsManager = new ReservationsManager();
    window.reservationsManager.init();
  });
} else {
  window.reservationsManager = new ReservationsManager();
  window.reservationsManager.init();
}