// profile.js - Gestão de perfil e reservas (ATUALIZADO)

let allReservations = [];
let currentFilter = 'all';
let currentReservation = null;
let editMode = false;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    const user = await utils.requireAuth('perfil.html');
    if (user) {
        displayUserInfo(user);
        loadReservations();
        initializeFilters();
        initializeLogoutButton();
        initializeEditProfileButton();
        initializeEditProfileForm();
    }
});

// ===== INFORMAÇÕES DO UTILIZADOR =====
function displayUserInfo(user) {
    document.getElementById('user-nome').textContent = user.nome;
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-telefone').textContent = user.telefone || 'Não definido';
}

// ===== CARREGAR RESERVAS =====
async function loadReservations() {
    const container = document.getElementById('reservations-container');

    const result = await utils.apiRequest('/api_consultar_reservas');

    if (result.ok) {
        allReservations = result.data;

        if (allReservations.length === 0) {
            container.style.display = 'none';
            document.getElementById('no-reservations').style.display = 'block';
        } else {
            container.style.display = 'grid';
            document.getElementById('no-reservations').style.display = 'none';
            displayReservations();
        }
    } else {
        container.innerHTML = '<div class="error-message">Erro ao carregar reservas</div>';
    }
}

// ===== MOSTRAR RESERVAS FILTRADAS =====
function displayReservations() {
    const container = document.getElementById('reservations-container');
    const now = new Date();

    let filtered = allReservations;

    if (currentFilter === 'upcoming') {
        filtered = allReservations.filter(r => new Date(r.data_hora) >= now);
    } else if (currentFilter === 'past') {
        filtered = allReservations.filter(r => new Date(r.data_hora) < now);
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div class="no-results">Nenhuma reserva encontrada neste filtro.</div>';
        return;
    }

    container.innerHTML = filtered.map(reserva => {
        const dataHora = new Date(reserva.data_hora);
        const isPast = dataHora < now;
        const statusClass = reserva.status === 'cancelada' ? 'cancelled' : (isPast ? 'past' : 'upcoming');

        return `
      <div class="reservation-card ${statusClass}" data-id="${reserva.id}">
        <div class="status-badge ${reserva.status}">${getStatusText(reserva.status)}</div>
        <div class="reservation-info">
          <h3>${reserva.servico_nome}</h3>
          <p><strong>Barbeiro:</strong> ${reserva.barbeiro_nome}</p>
          <p><strong>Data:</strong> ${utils.formatDate(dataHora)}</p>
          <p><strong>Hora:</strong> ${utils.formatTime(dataHora)}</p>
        </div>
        <button class="btn-secondary view-details" data-id="${reserva.id}">Ver Detalhes</button>
      </div>
    `;
    }).join('');

    // Adicionar listeners aos botões
    document.querySelectorAll('.view-details').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            showReservationDetails(id);
        });
    });
}

// ===== UTILITÁRIOS =====
function getStatusText(status) {
    const statusMap = {
        'confirmada': 'Confirmada',
        'cancelada': 'Cancelada',
        'concluida': 'Concluída'
    };
    return statusMap[status] || status;
}

// ===== MOSTRAR DETALHES DA RESERVA (MELHORADO) =====
function showReservationDetails(id) {
    const reserva = allReservations.find(r => r.id === id);
    if (!reserva) return;

    currentReservation = reserva;
    editMode = false;

    const dataHora = new Date(reserva.data_hora);
    const now = new Date();
    const hoursUntil = (dataHora - now) / (1000 * 60 * 60);
    const canModify = hoursUntil > 5 && reserva.status === 'confirmada';

    document.getElementById('reservation-details').innerHTML = `
        <div class="modal-detail-row">
            <strong>Barbeiro:</strong> ${reserva.barbeiro_nome}
        </div>
        <div class="modal-detail-row">
            <strong>Serviço:</strong> ${reserva.servico_nome}
        </div>
        <div class="modal-detail-row">
            <strong>Data:</strong> ${utils.formatDate(dataHora)}
        </div>
        <div class="modal-detail-row">
            <strong>Hora:</strong> ${utils.formatTime(dataHora)}
        </div>
        <div class="modal-detail-row">
            <strong>Status:</strong> 
            <span class="status-badge ${reserva.status}">${getStatusText(reserva.status)}</span>
        </div>
        ${reserva.comentario ? `
        <div class="modal-detail-row">
            <strong>Comentário:</strong> ${reserva.comentario}
        </div>
        ` : ''}
        ${!canModify && hoursUntil > 0 && hoursUntil <= 5 ? `
        <div class="modal-detail-row alert-warning">
             ⚠️ Faltam menos de 5 horas. Não é possível modificar ou cancelar.
        </div>
        ` : ''}
    `;

    // Botões de ação
    const cancelBtn = document.getElementById('cancelReservationBtn');
    const editBtn = document.getElementById('editReservationBtn');

    if (canModify) {
        if (cancelBtn) {
            cancelBtn.style.display = 'block';
            cancelBtn.onclick = () => cancelReservation(id);
        }
        if (editBtn) {
            editBtn.style.display = 'block';
            editBtn.onclick = () => editReservation();
        }
    } else {
        if (cancelBtn) cancelBtn.style.display = 'none';
        if (editBtn) editBtn.style.display = 'none';
    }

    utils.openModal('reservationDetailModal');
}

// ===== CANCELAR RESERVA =====
async function cancelReservation(id) {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;

    // Usar novo endpoint
    const result = await utils.apiRequest(`/api_reservas/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelada' })
    });

    if (result.ok) {
        alert('Reserva cancelada com sucesso!');
        utils.closeModal('reservationDetailModal');
        loadReservations();
    } else {
        alert(result.data?.error || result.error || 'Erro ao cancelar reserva');
    }
}

// ===== EDITAR RESERVA (FUTURO) =====
function editReservation() {
    // Implementar formulário de edição aqui
    alert('Funcionalidade de edição em desenvolvimento');
}

// ===== FILTROS =====
function initializeFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            displayReservations();
        });
    });
}

// ===== LOGOUT =====
function initializeLogoutButton() {
    const btn = document.getElementById('logoutBtn');
    if (btn) {
        btn.addEventListener('click', utils.logout);
    }
}

// ===== EDITAR PERFIL =====
function initializeEditProfileButton() {
    const btn = document.getElementById('editProfileBtn');
    if (!btn) return;

    btn.addEventListener('click', function() {
        document.getElementById('edit-nome').value = document.getElementById('user-nome').textContent;
        const telefone = document.getElementById('user-telefone').textContent;
        document.getElementById('edit-telefone').value = telefone !== 'Não definido' ? telefone : '';

        utils.openModal('editProfileModal');
    });
}

function initializeEditProfileForm() {
    const form = document.getElementById('editProfileForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nome = document.getElementById('edit-nome').value;
        const telefone = document.getElementById('edit-telefone').value;
        const currentPassword = document.getElementById('edit-current-password').value;
        const newPassword = document.getElementById('edit-new-password').value;
        const newPasswordConfirm = document.getElementById('edit-new-password-confirm').value;

        utils.hideMessages('edit-error', 'edit-success');

        if (newPassword || newPasswordConfirm) {
            if (!currentPassword) {
                utils.showError('edit-error', 'Deve fornecer a password atual para alterar a password');
                return;
            }
            if (!utils.validatePasswords(newPassword, newPasswordConfirm, 'edit-error')) {
                return;
            }
        }

        const updateData = { nome, telefone };
        if (currentPassword && newPassword) {
            updateData.currentPassword = currentPassword;
            updateData.newPassword = newPassword;
        }

        const result = await utils.apiRequest('/api_auth/update', {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        if (result.ok) {
            utils.showSuccess('edit-success', 'Perfil atualizado com sucesso!');

            document.getElementById('user-nome').textContent = nome;
            document.getElementById('user-telefone').textContent = telefone || 'Não definido';

            document.getElementById('edit-current-password').value = '';
            document.getElementById('edit-new-password').value = '';
            document.getElementById('edit-new-password-confirm').value = '';

            setTimeout(() => utils.closeModal('editProfileModal'), 2000);
        } else {
            utils.showError('edit-error', result.data?.error || result.error);
        }
    });
}
