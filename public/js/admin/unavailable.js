/**
 * Unavailable Times Manager
 * Gerencia indisponibilidades de barbeiros
 */

class UnavailableManager {
  constructor() {
    this.unavailableTimes = window.mockData.unavailableTimes;
    this.barbeiros = window.mockData.barbeiros;
  }

  init() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const form = document.getElementById('unavailable-form');
    const startInput = document.getElementById('form-time-start');
    const endInput = document.getElementById('form-time-end');
    const durationInput = document.getElementById('form-duration');

    // Calcular duração automaticamente
    const calculateDuration = () => {
      if (startInput.value && endInput.value) {
        const [startH, startM] = startInput.value.split(':').map(Number);
        const [endH, endM] = endInput.value.split(':').map(Number);

        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;
        const duration = endMins - startMins;

        if (duration > 0) {
          durationInput.value = duration;
        } else {
          durationInput.value = '';
        }
      } else {
        durationInput.value = '';
      }
    };

    startInput.addEventListener('change', calculateDuration);
    endInput.addEventListener('change', calculateDuration);

    // Submeter formulário
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addUnavailableTime();
    });
  }

  addUnavailableTime() {
    const barbeiro_id = parseInt(document.getElementById('form-barber').value);
    const data = document.getElementById('form-date').value;
    const hora_inicio = document.getElementById('form-time-start').value;
    const hora_fim = document.getElementById('form-time-end').value;
    const motivo = document.getElementById('form-reason').value;

    if (!barbeiro_id || !data || !hora_inicio || !hora_fim || !motivo) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }

    // Criar novo registo
    const newId = Math.max(...this.unavailableTimes.map(u => u.id), 0) + 1;
    const novaIndisponibilidade = {
      id: newId,
      barbeiro_id,
      data,
      hora_inicio,
      hora_fim,
      motivo
    };

    this.unavailableTimes.push(novaIndisponibilidade);

    // Limpar form
    document.getElementById('unavailable-form').reset();
    document.getElementById('form-duration').value = '';

    // Renderizar
    this.render();
    alert('Indisponibilidade adicionada com sucesso!');
  }

  render() {
    const container = document.getElementById('unavailable-list');

    if (this.unavailableTimes.length === 0) {
      container.innerHTML = '<div class="unavailable-list empty"></div>';
      return;
    }

    container.className = 'unavailable-list';
    container.innerHTML = this.unavailableTimes
      .sort((a, b) => new Date(`${a.data}T${a.hora_inicio}`) - new Date(`${b.data}T${b.hora_inicio}`))
      .map(unavailable => this.renderCard(unavailable))
      .join('');
  }

  renderCard(unavailable) {
    const barber = this.barbeiros.find(b => b.id === unavailable.barbeiro_id);
    const [year, month, day] = unavailable.data.split('-');
    const dateFormatted = `${day}/${month}/${year}`;

    // Calcular duração
    const [startH, startM] = unavailable.hora_inicio.split(':').map(Number);
    const [endH, endM] = unavailable.hora_fim.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    const duration = endMins - startMins;

    return `
      <div class="unavailable-card">
        <div class="card-info">
          <div class="card-barber">👤 ${barber ? barber.nome : 'Desconhecido'}</div>
          <div class="card-date">📅 ${dateFormatted}</div>
          <div class="card-time">🕒 ${unavailable.hora_inicio} - ${unavailable.hora_fim}</div>
        </div>

        <div class="card-body">
          <div class="card-reason">"${unavailable.motivo}"</div>
          <div class="card-duration">⏳ ${duration} minutos</div>
        </div>

        <div class="card-actions">
          <button class="btn btn-sm btn-warning" onclick="unavailableManager.editUnavailable(${unavailable.id})">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="unavailableManager.removeUnavailable(${unavailable.id})">Remover</button>
        </div>
      </div>
    `;
  }

  editUnavailable(id) {
    console.log(`Editar indisponibilidade ${id}`);
    alert(`Editar indisponibilidade ${id}`);
  }

  removeUnavailable(id) {
    const unavailable = this.unavailableTimes.find(u => u.id === id);
    if (unavailable && confirm(`Remover indisponibilidade em ${unavailable.data}?`)) {
      this.unavailableTimes = this.unavailableTimes.filter(u => u.id !== id);
      this.render();
      alert('Indisponibilidade removida com sucesso!');
    }
  }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.unavailableManager = new UnavailableManager();
    window.unavailableManager.init();
  });
} else {
  window.unavailableManager = new UnavailableManager();
  window.unavailableManager.init();
}