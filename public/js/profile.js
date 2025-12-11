const API_BASE = '/api';
let allReservations = [];
let currentFilter = 'all';

// Verificar autenticação
async function checkAuthAndLoad() {
    try {
        const response = await fetch(`${API_BASE}/api_auth/me`);

        if (!response.ok) {
            window.location.href = 'login.html?redirect=perfil.html';
            return;
        }

        const data = await response.json();
        displayUserInfo(data.user);
        loadReservations();

    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = 'login.html';
    }
}

// Mostrar informações do utilizador
function displayUserInfo(user) {
    document.getElementById('user-nome').textContent = user.nome;
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-telefone').textContent = user.telefone || 'Não definido';
}

// Carregar reservas
async function loadReservations() {
    const container = document.getElementById('reservations-container');

    try {
        const response = await fetch(`${API_BASE}/api_consultar_reservas`);

        if (!response.ok) {
            throw new Error('Erro ao carregar reservas');
        }

        allReservations = await response.json();

        if (allReservations.length === 0) {
            container.style.display = 'none';
            document.getElementById('no-reservations').style.display = 'block';
        } else {
            container.style.display = 'grid';
            document.getElementById('no-reservations').style.display = 'none';
            displayReservations();
        }

    } catch (error) {
        console.error('Erro ao carregar reservas:', error);
        container.innerHTML = '<div class="error-message">Erro ao carregar reservas</div>';
    }
}

// Mostrar reservas filtradas
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
        <div class="reservation-status ${reserva.status}">${getStatusText(reserva.status)}</div>
        <div class="reservation-info">
          <h3>${reserva.servico_nome}</h3>
          <p><strong>Barbeiro:</strong> ${reserva.barbeiro_nome}</p>
          <p><strong>Data:</strong> ${formatDate(dataHora)}</p>
          <p><strong>Hora:</strong> ${formatTime(dataHora)}</p>
        </div>
        <button class="btn-secondary view-details" data-id="${reserva.id}">Ver Detalhes</button>
      </div>
    `;
    }).join('');

    // Adicionar listeners
    document.querySelectorAll('.view-details').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            showReservationDetails(id);
        });
    });
}

// Formatar data
function formatDate(date) {
    return date.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

// Formatar hora
function formatTime(date) {
    return date.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Obter texto do status
function getStatusText(status) {
    const statusMap = {
        'confirmada': 'Confirmada',
        'cancelada': 'Cancelada',
        'concluida': 'Concluída'
    };
    return statusMap[status] || status;
}

// Mostrar detalhes da reserva
function showReservationDetails(id) {
    const reserva = allReservations.find(r => r.id === id);
    if (!reserva) return;

    const dataHora = new Date(reserva.data_hora);
    const now = new Date();
    const canCancel = dataHora > now && reserva.status === 'confirmada';

    const detailsHtml = `
    <div class="detail-row">
      <span class="detail-label">Serviço:</span>
      <span class="detail-value">${reserva.servico_nome}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Barbeiro:</span>
      <span class="detail-value">${reserva.barbeiro_nome}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Data:</span>
      <span class="detail-value">${formatDate(dataHora)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Hora:</span>
      <span class="detail-value">${formatTime(dataHora)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Status:</span>
      <span class="detail-value status-${reserva.status}">${getStatusText(reserva.status)}</span>
    </div>
    ${reserva.comentario ? `
    <div class="detail-row">
      <span class="detail-label">Comentário:</span>
      <span class="detail-value">${reserva.comentario}</span>
    </div>
    ` : ''}
  `;

    document.getElementById('reservation-details').innerHTML = detailsHtml;

    const cancelBtn = document.getElementById('cancelReservationBtn');
    if (canCancel) {
        cancelBtn.style.display = 'block';
        cancelBtn.onclick = () => cancelReservation(id);
    } else {
        cancelBtn.style.display = 'none';
    }

    document.getElementById('reservationDetailModal').style.display = 'block';
}

// Cancelar reserva
async function cancelReservation(id) {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;

    try {
        const response = await fetch(`${API_BASE}/admin/api_admin_reservas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelada' })
        });

        if (response.ok) {
            alert('Reserva cancelada com sucesso!');
            document.getElementById('reservationDetailModal').style.display = 'none';
            loadReservations();
        } else {
            alert('Erro ao cancelar reserva');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao cancelar reserva');
    }
}

// Filtros
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        displayReservations();
    });
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async function() {
    try {
        await fetch(`${API_BASE}/api_auth/me/logout`, { method: 'POST' });
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        window.location.href = 'index.html';
    }
});

// Modal de edição
const editModal = document.getElementById('editProfileModal');
const editBtn = document.getElementById('editProfileBtn');
const closeBtns = document.querySelectorAll('.close, .close-modal');

editBtn.addEventListener('click', function() {
    document.getElementById('edit-nome').value = document.getElementById('user-nome').textContent;
    const telefone = document.getElementById('user-telefone').textContent;
    document.getElementById('edit-telefone').value = telefone !== 'Não definido' ? telefone : '';
    editModal.style.display = 'block';
});

closeBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        editModal.style.display = 'none';
        document.getElementById('reservationDetailModal').style.display = 'none';
    });
});

window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Editar perfil
document.getElementById('editProfileForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const nome = document.getElementById('edit-nome').value;
    const telefone = document.getElementById('edit-telefone').value;
    const currentPassword = document.getElementById('edit-current-password').value;
    const newPassword = document.getElementById('edit-new-password').value;
    const newPasswordConfirm = document.getElementById('edit-new-password-confirm').value;

    const errorDiv = document.getElementById('edit-error');
    const successDiv = document.getElementById('edit-success');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    if (newPassword || newPasswordConfirm) {
        if (!currentPassword) {
            errorDiv.textContent = 'Deve fornecer a password atual para alterar a password';
            errorDiv.style.display = 'block';
            return;
        }
        if (newPassword !== newPasswordConfirm) {
            errorDiv.textContent = 'As novas passwords não coincidem';
            errorDiv.style.display = 'block';
            return;
        }
        if (newPassword.length < 8) {
            errorDiv.textContent = 'A nova password deve ter pelo menos 8 caracteres';
            errorDiv.style.display = 'block';
            return;
        }
    }

    try {
        const updateData = { nome, telefone };
        if (currentPassword && newPassword) {
            updateData.currentPassword = currentPassword;
            updateData.newPassword = newPassword;
        }

        const response = await fetch(`${API_BASE}/api_auth/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (response.ok) {
            successDiv.textContent = 'Perfil atualizado com sucesso!';
            successDiv.style.display = 'block';

            document.getElementById('user-nome').textContent = nome;
            document.getElementById('user-telefone').textContent = telefone || 'Não definido';

            document.getElementById('edit-current-password').value = '';
            document.getElementById('edit-new-password').value = '';
            document.getElementById('edit-new-password-confirm').value = '';

            setTimeout(() => {
                editModal.style.display = 'none';
            }, 2000);
        } else {
            errorDiv.textContent = data.error || 'Erro ao atualizar perfil';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro:', error);
        errorDiv.textContent = 'Erro ao processar atualização';
        errorDiv.style.display = 'block';
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', checkAuthAndLoad);
