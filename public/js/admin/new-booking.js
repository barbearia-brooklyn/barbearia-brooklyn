/**
 * New Booking Manager
 * Gerencia criação de novas reservas com auto-complete de clientes
 */

class NewBookingManager {
  constructor() {
    this.barbeiros = window.mockData.barbeiros;
    this.servicos = window.mockData.servicos;
    this.clientes = window.mockData.clientes || [];
    this.reservations = window.mockData.reservations;
    this.unavailableTimes = window.mockData.unavailableTimes;
  }

  init() {
    this.setupEventListeners();
    this.renderServiceOptions();
  }

  setupEventListeners() {
    // Form submit
    document.getElementById('booking-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitBooking();
    });

    // Auto-complete de clientes
    const clientInput = document.getElementById('client-name');
    clientInput.addEventListener('input', (e) => {
      this.updateClientSuggestions(e.target.value);
    });

    // Atualizar horas disponíveis quando barbeiro ou data mudam
    document.getElementById('booking-barber').addEventListener('change', () => {
      this.updateAvailableHours();
    });

    document.getElementById('booking-date').addEventListener('change', () => {
      this.updateAvailableHours();
    });

    // Atualizar preço do serviço
    document.getElementById('booking-service').addEventListener('change', () => {
      this.updateServicePrice();
    });
  }

  renderServiceOptions() {
    const select = document.getElementById('booking-service');
    const defaultOption = select.querySelector('option[value=""]');

    this.servicos.forEach(servico => {
      const option = document.createElement('option');
      option.value = servico.id;
      option.textContent = `${servico.nome} (${servico.duracao}min) - €${servico.preco}`;
      select.appendChild(option);
    });
  }

  updateClientSuggestions(searchTerm) {
    const suggestionsContainer = document.getElementById('client-suggestions');

    if (searchTerm.length < 1) {
      suggestionsContainer.innerHTML = '';
      suggestionsContainer.classList.remove('active');
      return;
    }

    const matches = this.clientes.filter(cliente => 
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (matches.length === 0) {
      suggestionsContainer.innerHTML = '<div class="suggestion" style="color: #999; cursor: default;">Nenhum cliente encontrado</div>';
      suggestionsContainer.classList.add('active');
      return;
    }

    suggestionsContainer.innerHTML = matches
      .map(cliente => `
        <div class="suggestion" onclick="newBookingManager.selectClient(${cliente.id})">
          <div class="suggestion-name">${cliente.nome}</div>
          <div class="suggestion-phone">🗣️ ${cliente.telefone}</div>
        </div>
      `)
      .join('');

    suggestionsContainer.classList.add('active');
  }

  selectClient(clientId) {
    const cliente = this.clientes.find(c => c.id === clientId);
    if (cliente) {
      document.getElementById('client-name').value = cliente.nome;
      document.getElementById('client-phone').value = cliente.telefone;
      document.getElementById('client-email').value = cliente.email;
      document.getElementById('client-suggestions').innerHTML = '';
      document.getElementById('client-suggestions').classList.remove('active');
    }
  }

  updateAvailableHours() {
    const barbeiro_id = parseInt(document.getElementById('booking-barber').value);
    const data = document.getElementById('booking-date').value;
    const select = document.getElementById('booking-time');

    // Limpar opções anteriores
    select.innerHTML = '<option value="">-- Selecione --</option>';

    if (!barbeiro_id || !data) {
      return;
    }

    // Horas de funcionação (9:00 - 18:00, slots de 30 minutos)
    const hours = [];
    for (let h = 9; h < 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        hours.push(time);
      }
    }

    // Filtrar horas reservadas e indisponíveis
    const availableHours = hours.filter(time => {
      // Verificar se já existe reserva
      const hasReservation = this.reservations.some(r => 
        r.barbeiro_id === barbeiro_id && 
        r.data === data && 
        r.hora === time
      );

      if (hasReservation) return false;

      // Verificar se está em indisponibilidade
      const isUnavailable = this.unavailableTimes.some(u => {
        if (u.barbeiro_id !== barbeiro_id || u.data !== data) return false;
        return time >= u.hora_inicio && time < u.hora_fim;
      });

      return !isUnavailable;
    });

    // Renderizar opções
    availableHours.forEach(time => {
      const option = document.createElement('option');
      option.value = time;
      option.textContent = time;
      select.appendChild(option);
    });

    if (availableHours.length === 0) {
      const option = document.createElement('option');
      option.textContent = 'Sem horas disponíveis';
      option.disabled = true;
      select.appendChild(option);
    }
  }

  updateServicePrice() {
    const serviceId = parseInt(document.getElementById('booking-service').value);
    const service = this.servicos.find(s => s.id === serviceId);
    // Aqui poderíamos mostrar o preço em tempo real
    console.log('Serviço selecionado:', service);
  }

  submitBooking() {
    const barbeiro_id = parseInt(document.getElementById('booking-barber').value);
    const data = document.getElementById('booking-date').value;
    const hora = document.getElementById('booking-time').value;
    const servico_id = parseInt(document.getElementById('booking-service').value);
    const cliente_nome = document.getElementById('client-name').value;
    const cliente_telefone = document.getElementById('client-phone').value;
    const cliente_email = document.getElementById('client-email').value;
    const notificacao_email = document.getElementById('notify-email').checked;
    const notificacao_lembrete = document.getElementById('notify-reminder').checked;

    // Validação
    if (!barbeiro_id || !data || !hora || !servico_id || !cliente_nome) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }

    // Dados do serviço
    const servico = this.servicos.find(s => s.id === servico_id);
    const barber = this.barbeiros.find(b => b.id === barbeiro_id);

    // Criar nova reserva
    const newId = Math.max(...this.reservations.map(r => r.id), 0) + 1;
    const novaReserva = {
      id: newId,
      cliente: cliente_nome,
      barbeiro_id,
      servico_id,
      data,
      hora,
      status: 'confirmada',
      telefone: cliente_telefone,
      email: cliente_email,
      duracao: servico.duracao,
      preco: servico.preco,
      notificacao_email,
      notificacao_lembrete
    };

    this.reservations.push(novaReserva);

    // Feedback e reset
    alert(`Reserva criada com sucesso!\n\nCliente: ${cliente_nome}\nBarbeiro: ${barber.nome}\nData: ${data} às ${hora}\nServiço: ${servico.nome}`);
    document.getElementById('booking-form').reset();
    document.getElementById('client-suggestions').innerHTML = '';
    document.getElementById('booking-time').innerHTML = '<option value="">-- Selecione --</option>';
  }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.newBookingManager = new NewBookingManager();
    window.newBookingManager.init();
  });
} else {
  window.newBookingManager = new NewBookingManager();
  window.newBookingManager.init();
}