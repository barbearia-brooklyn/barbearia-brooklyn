// reservar.js - Sistema de Reservas

const { apiRequest, hideMessages, showError, showSuccess, formatDate, formatTime } = utils;

let selectedService = null;
let selectedBarber = null;
let selectedDate = null;
let selectedTime = null;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    await loadServices();
    await loadBarbers();
    setupEventListeners();
});

// ===== CARREGAR SERVIÇOS =====
async function loadServices() {
    const result = await apiRequest('/api_servicos');

    if (result.ok) {
        const container = document.getElementById('services-container');
        container.innerHTML = result.data.map(service => `
            <div class="service-card" data-id="${service.id}">
                <div class="service-icon">
                    <img src="/images/icons/${service.icone || 'haircut'}.svg" alt="${service.nome}">
                </div>
                <h3>${service.nome}</h3>
                <p class="service-duration">${service.duracao} min</p>
                <p class="service-price">${service.preco}€</p>
                <p class="service-description">${service.descricao || ''}</p>
            </div>
        `).join('');

        // Listeners para selecionar serviço
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', function() {
                document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
                selectedService = parseInt(this.dataset.id);
                updateAvailableTimes();
            });
        });
    } else {
        console.error('Erro ao carregar serviços');
    }
}

// ===== CARREGAR BARBEIROS =====
async function loadBarbers() {
    const result = await apiRequest('/api_barbeiros');

    if (result.ok) {
        const container = document.getElementById('barbers-container');
        container.innerHTML = result.data.map(barber => `
            <div class="barber-card" data-id="${barber.id}">
                <img src="/images/persons/${barber.foto || 'default'}.png" alt="${barber.nome}">
                <h3>${barber.nome}</h3>
                <p>${barber.especialidade || ''}</p>
            </div>
        `).join('');

        // Listeners para selecionar barbeiro
        document.querySelectorAll('.barber-card').forEach(card => {
            card.addEventListener('click', function() {
                document.querySelectorAll('.barber-card').forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
                selectedBarber = parseInt(this.dataset.id);
                updateAvailableTimes();
            });
        });
    } else {
        console.error('Erro ao carregar barbeiros');
    }
}

// ===== CONFIGURAR LISTENERS =====
function setupEventListeners() {
    // Date picker
    const datePicker = document.getElementById('reservation-date');
    if (datePicker) {
        // Definir data mínima como hoje
        const today = new Date().toISOString().split('T')[0];
        datePicker.min = today;

        datePicker.addEventListener('change', function() {
            selectedDate = this.value;
            updateAvailableTimes();
        });
    }

    // Form de reserva
    const form = document.getElementById('reservationForm');
    if (form) {
        form.addEventListener('submit', handleReservationSubmit);
    }
}

// ===== ATUALIZAR HORÁRIOS DISPONÍVEIS =====
async function updateAvailableTimes() {
    const timesContainer = document.getElementById('available-times');

    if (!selectedService || !selectedBarber || !selectedDate) {
        timesContainer.innerHTML = '<p class="info-message">Selecione serviço, barbeiro e data para ver horários disponíveis</p>';
        return;
    }

    timesContainer.innerHTML = '<p class="loading">A carregar horários...</p>';

    const result = await apiRequest(
        `/api_horarios_disponiveis?barbeiro_id=${selectedBarber}&data=${selectedDate}&servico_id=${selectedService}`
    );

    if (result.ok && result.data.length > 0) {
        timesContainer.innerHTML = result.data.map(time => `
            <button type="button" class="time-slot" data-time="${time}">
                ${time}
            </button>
        `).join('');

        // Listeners para selecionar horário
        document.querySelectorAll('.time-slot').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                selectedTime = this.dataset.time;
            });
        });
    } else {
        timesContainer.innerHTML = '<p class="error-message">Não há horários disponíveis para esta data</p>';
    }
}

// ===== SUBMETER RESERVA =====
async function handleReservationSubmit(e) {
    e.preventDefault();

    hideMessages('reservation-error', 'reservation-success');

    // Validar seleções
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
        showError('reservation-error', 'Por favor, preencha todos os campos');
        return;
    }

    const comentario = document.getElementById('reservation-comments')?.value || '';

    const reservationData = {
        servico_id: selectedService,
        barbeiro_id: selectedBarber,
        data: selectedDate,
        hora: selectedTime,
        comentario: comentario
    };

    const result = await apiRequest('/api_reservas', {
        method: 'POST',
        body: JSON.stringify(reservationData)
    });

    if (result.ok) {
        showSuccess('reservation-success', 'Reserva criada com sucesso! Receberá um email de confirmação.');

        // Limpar seleções
        resetForm();

        // Redirecionar para perfil após 2 segundos
        setTimeout(() => {
            window.location.href = 'perfil.html';
        }, 2000);
    } else {
        // Se não estiver autenticado, guardar tentativa e redirecionar para login
        if (result.status === 401) {
            sessionStorage.setItem('pendingBooking', JSON.stringify(reservationData));
            showError('reservation-error', 'É necessário fazer login para reservar.');
            setTimeout(() => {
                window.location.href = 'login.html?redirect=reservar.html';
            }, 1500);
        } else {
            showError('reservation-error', result.data?.error || result.error);
        }
    }
}

// ===== LIMPAR FORMULÁRIO =====
function resetForm() {
    selectedService = null;
    selectedBarber = null;
    selectedDate = null;
    selectedTime = null;

    document.querySelectorAll('.service-card.selected').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.barber-card.selected').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.time-slot.selected').forEach(b => b.classList.remove('selected'));

    const datePicker = document.getElementById('reservation-date');
    if (datePicker) datePicker.value = '';

    const comments = document.getElementById('reservation-comments');
    if (comments) comments.value = '';

    document.getElementById('available-times').innerHTML = '';
}

// ===== VERIFICAR RESERVA PENDENTE =====
// Se o utilizador voltou após fazer login
const pendingBooking = sessionStorage.getItem('pendingBooking');
if (pendingBooking) {
    const data = JSON.parse(pendingBooking);
    // Pré-preencher campos com a reserva pendente
    selectedService = data.servico_id;
    selectedBarber = data.barbeiro_id;
    selectedDate = data.data;
    selectedTime = data.hora;

    // Marcar visualmente após carregar
    setTimeout(() => {
        document.querySelector(`[data-id="${selectedService}"]`)?.classList.add('selected');
        document.querySelector(`[data-id="${selectedBarber}"]`)?.classList.add('selected');
        document.getElementById('reservation-date').value = selectedDate;
        updateAvailableTimes();
    }, 500);
}