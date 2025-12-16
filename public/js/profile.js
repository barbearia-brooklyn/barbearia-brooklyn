// profile.js - Gestão de perfil e reservas (CORRIGIDO)

let allReservations = [];
let currentFilter = 'upcoming';
let currentReservation = null;
let availableBarbers = [];
let availableTimes = [];

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    const user = await utils.requireAuth('perfil.html');
    if (user) {
        displayUserInfo(user);
        await loadBarbers();
        loadReservations();
        initializeFilters();
        initializeLogoutButton();
        initializeEditProfileButton();
        initializeEditProfileForm();
        initializeModalCloseHandlers();
    }
});

// ===== INFORMAÇÕES DO UTILIZADOR =====
function displayUserInfo(user) {
    document.getElementById('user-nome').textContent = user.nome;
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-telefone').textContent = user.telefone || 'Não definido';
    document.getElementById('user-nif').textContent = user.nif || 'Não definido';
}

// ===== CARREGAR BARBEIROS =====
async function loadBarbers() {
    const result = await utils.apiRequest('/api_barbeiros');
    if (result.ok) {
        availableBarbers = result.data;
    }
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

    let filtered;

    if (currentFilter === 'upcoming') {
        filtered = allReservations.filter(r => new Date(r.data_hora) >= now);
    } else if (currentFilter === 'past') {
        filtered = allReservations.filter(r => new Date(r.data_hora) < now);
    } else {
        filtered = allReservations.filter(r => new Date(r.data_hora) >= now);
        currentFilter = 'upcoming';
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
        <div class="status-badge ${reserva.status} text-right">${getStatusText(reserva.status)}</div>
        <div class="reservation-info">
          <h4>${reserva.servico_nome}</h4>
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

// ===== MOSTRAR DETALHES DA RESERVA =====
function showReservationDetails(id) {
    const reserva = allReservations.find(r => r.id === id);
    if (!reserva) return;

    currentReservation = reserva;

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
        <div class="modal-detail-row alert-warning text-center">
             ⚠️ Não é possível modificar ou cancelar reservas com menos de 5 horas de antecedência. Por favor contacte +351 224 938 542.
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

// ===== EDITAR RESERVA =====
async function editReservation() {
    if (!currentReservation) return;

    const dataHora = new Date(currentReservation.data_hora);
    const dataFormatada = dataHora.toISOString().split('T')[0];
    const horaFormatada = `${String(dataHora.getHours()).padStart(2, '0')}:${String(dataHora.getMinutes()).padStart(2, '0')}`;

    // Preencher select de barbeiros
    const barbeiroSelect = document.getElementById('edit-booking-barbeiro');
    barbeiroSelect.innerHTML = availableBarbers.map(b => `
        <option value="${b.id}" ${b.id === currentReservation.barbeiro_id ? 'selected' : ''}>
            ${b.nome}
        </option>
    `).join('');

    // Preencher data
    const dataInput = document.getElementById('edit-booking-data');
    dataInput.value = dataFormatada;
    dataInput.min = new Date().toISOString().split('T')[0];

    // Preencher comentário
    document.getElementById('edit-booking-comentario').value = currentReservation.comentario || '';

    // Limpar mensagens de erro/sucesso
    document.getElementById('edit-booking-error').style.display = 'none';
    document.getElementById('edit-booking-success').style.display = 'none';

    // Carregar horários disponíveis com a hora atual pré-selecionada
    await loadAvailableTimesForEdit(currentReservation.barbeiro_id, dataFormatada, horaFormatada);

    // Fechar modal de detalhes e abrir modal de edição
    utils.closeModal('reservationDetailModal');
    utils.openModal('editBookingModal');

    // Event listeners para mudança de data ou barbeiro
    const horaSelect = document.getElementById('edit-booking-hora');
    
    dataInput.onchange = async () => {
        const barbeiro = barbeiroSelect.value;
        const data = dataInput.value;
        if (barbeiro && data) {
            await loadAvailableTimesForEdit(barbeiro, data);
        }
    };

    barbeiroSelect.onchange = async () => {
        const barbeiro = barbeiroSelect.value;
        const data = dataInput.value;
        if (barbeiro && data) {
            await loadAvailableTimesForEdit(barbeiro, data);
        }
    };

    // Botão de salvar
    document.getElementById('saveBookingBtn').onclick = saveReservationEdits;
}

// ===== CARREGAR HORÁRIOS DISPONÍVEIS PARA EDIÇÃO =====
async function loadAvailableTimesForEdit(barbeiroId, data, currentTime = null) {
    const horaSelect = document.getElementById('edit-booking-hora');
    horaSelect.innerHTML = '<option value="">A carregar...</option>';

    const result = await utils.apiRequest(`/api_horarios_disponiveis?barbeiro=${barbeiroId}&data=${data}`);

    if (result.ok && result.data && result.data.length > 0) {
        availableTimes = result.data;

        // Filtrar horas passadas se for hoje
        const hoje = new Date().toISOString().split('T')[0];
        let timesFiltrados = availableTimes;
        
        if (data === hoje) {
            const agora = new Date();
            timesFiltrados = availableTimes.filter(time => {
                const [horas, minutos] = time.split(':').map(Number);
                const horaReserva = new Date();
                horaReserva.setHours(horas, minutos, 0, 0);
                return horaReserva > agora;
            });
        }

        if (timesFiltrados.length === 0) {
            horaSelect.innerHTML = '<option value="">Sem horários disponíveis</option>';
            return;
        }

        // Se a hora atual não estiver na lista (já reservada), adicionar como opção
        if (currentTime && !timesFiltrados.includes(currentTime)) {
            timesFiltrados.push(currentTime);
            timesFiltrados.sort();
        }

        horaSelect.innerHTML = timesFiltrados.map(time => `
            <option value="${time}" ${time === currentTime ? 'selected' : ''}>
                ${time}
            </option>
        `).join('');
    } else {
        // Se não houver horários disponíveis mas temos uma hora atual, mantê-la
        if (currentTime) {
            horaSelect.innerHTML = `<option value="${currentTime}" selected>${currentTime} (hora atual)</option>`;
        } else {
            horaSelect.innerHTML = '<option value="">Sem horários disponíveis</option>';
        }
    }
}

// ===== SALVAR EDIÇÕES DA RESERVA =====
async function saveReservationEdits() {
    const errorDiv = document.getElementById('edit-booking-error');
    const successDiv = document.getElementById('edit-booking-success');

    // Esconder mensagens anteriores
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    const novoBarbeiroId = parseInt(document.getElementById('edit-booking-barbeiro').value);
    const novaData = document.getElementById('edit-booking-data').value;
    const novaHora = document.getElementById('edit-booking-hora').value;
    const comentario = document.getElementById('edit-booking-comentario').value;

    // Validação
    if (!novoBarbeiroId || !novaData || !novaHora) {
        errorDiv.textContent = 'Por favor, preencha todos os campos obrigatórios';
        errorDiv.style.display = 'block';
        return;
    }

    // Desabilitar botão durante o processo
    const saveBtn = document.getElementById('saveBookingBtn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'A guardar...';

    try {
        const result = await utils.apiRequest('/api_editar_reserva', {
            method: 'PUT',
            body: JSON.stringify({
                reserva_id: currentReservation.id,
                novo_barbeiro_id: novoBarbeiroId,
                nova_data: novaData,
                nova_hora: novaHora,
                comentario: comentario
            })
        });

        if (result.ok) {
            successDiv.textContent = 'Reserva atualizada com sucesso!';
            successDiv.style.display = 'block';

            // Recarregar reservas
            await loadReservations();

            // Fechar modal após 2 segundos
            setTimeout(() => {
                utils.closeModal('editBookingModal');
                currentReservation = null;
            }, 2000);
        } else {
            errorDiv.textContent = result.data?.error || result.error || 'Erro ao atualizar reserva';
            errorDiv.style.display = 'block';
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Erro ao salvar edições:', error);
        errorDiv.textContent = 'Erro ao processar solicitação';
        errorDiv.style.display = 'block';
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// ===== HANDLERS DE FECHAR MODAIS =====
function initializeModalCloseHandlers() {
    // Quando fechar o modal de edição, resetar estado
    const editModal = document.getElementById('editBookingModal');
    if (editModal) {
        const closeButtons = editModal.querySelectorAll('.close, .close-modal');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                currentReservation = null;
                // Resetar formulário
                document.getElementById('edit-booking-error').style.display = 'none';
                document.getElementById('edit-booking-success').style.display = 'none';
                const saveBtn = document.getElementById('saveBookingBtn');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Guardar Alterações';
                }
            });
        });
    }
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
        // Carregar dados atuais do utilizador
        const userData = utils.getCurrentUser();
        
        document.getElementById('edit-nome').value = document.getElementById('user-nome').textContent;
        
        const email = document.getElementById('user-email').textContent;
        document.getElementById('edit-email').value = email !== '-' ? email : '';
        
        const telefone = document.getElementById('user-telefone').textContent;
        document.getElementById('edit-telefone').value = telefone !== 'Não definido' ? telefone : '';
        
        const nif = document.getElementById('user-nif').textContent;
        document.getElementById('edit-nif').value = nif !== 'Não definido' ? nif : '';

        utils.openModal('editProfileModal');
    });
}

function initializeEditProfileForm() {
    const form = document.getElementById('editProfileForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nome = document.getElementById('edit-nome').value;
        const email = document.getElementById('edit-email').value;
        const telefone = document.getElementById('edit-telefone').value;
        const nif = document.getElementById('edit-nif').value;
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

        const updateData = { nome, telefone, email, nif };
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
            document.getElementById('user-email').textContent = email || '-';
            document.getElementById('user-telefone').textContent = telefone || 'Não definido';
            document.getElementById('user-nif').textContent = nif || 'Não definido';

            document.getElementById('edit-current-password').value = '';
            document.getElementById('edit-new-password').value = '';
            document.getElementById('edit-new-password-confirm').value = '';

            setTimeout(() => utils.closeModal('editProfileModal'), 2000);
        } else {
            utils.showError('edit-error', result.data?.error || result.error);
        }
    });
}

// ===== GESTÃO DE CONTAS VINCULADAS =====
async function loadLinkedAccounts() {
    const container = document.getElementById('linkedAccounts');
    if (!container) return;

    const result = await utils.apiRequest('/api_auth/linked-accounts', {
        method: 'GET'
    });

    if (result.ok) {
        const accounts = result.data.authMethods || [];
        const hasPassword = result.data.hasPassword;

        container.innerHTML = `
            <div class="account-item">
                <span><i class="fab fa-google"></i> Google</span>
                ${accounts.includes('google')
            ? `<button class="btn-small btn-unlink" onclick="unlinkAccount('google', ${hasPassword})">Desassociar</button>`
            : `<button class="btn-small" onclick="linkAccount('google')">Associar</button>`
        }
            </div>
            <div class="account-item">
                <span><i class="fab fa-facebook-f"></i> Facebook</span>
                ${accounts.includes('facebook')
            ? `<button class="btn-small btn-unlink" onclick="unlinkAccount('facebook', ${hasPassword})">Desassociar</button>`
            : `<button class="btn-small" onclick="linkAccount('facebook')">Associar</button>`
        }
            </div>
            <div class="account-item">
                <span><i class="fab fa-instagram"></i> Instagram</span>
                ${accounts.includes('instagram')
            ? `<button class="btn-small btn-unlink" onclick="unlinkAccount('instagram', ${hasPassword})">Desassociar</button>`
            : `<button class="btn-small" onclick="linkAccount('instagram')">Associar</button>`
        }
            </div>
        `;
    }
}

async function linkAccount(provider) {
    const result = await utils.apiRequest(`/api_auth/oauth/${provider}/link`, {
        method: 'GET'
    });

    if (result.ok) {
        window.location.href = result.data.authUrl;
    }
}

async function unlinkAccount(provider, hasPassword) {
    const accountsLinked = document.querySelectorAll('.btn-unlink').length;

    // Se é a última conta e não tem password
    if (accountsLinked === 1 && !hasPassword) {
        utils.openModal('passwordRequiredModal');
        return;
    }

    if (!confirm(`Tem a certeza que deseja desassociar a sua conta ${provider}?`)) {
        return;
    }

    const result = await utils.apiRequest(`/api_auth/oauth/${provider}/unlink`, {
        method: 'DELETE'
    });

    if (result.ok) {
        utils.showSuccess('profile-success', 'Conta desassociada com sucesso');
        loadLinkedAccounts();
    } else {
        utils.showError('profile-error', result.data?.error || 'Erro ao desassociar conta');
    }
}