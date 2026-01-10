// profile.js - Gestão de perfil e reservas
import { compressImageIfNeeded, isValidImageType, formatFileSize } from './image-compressor.js';

let allReservations = [];
let currentFilter = 'upcoming';
let currentReservation = null;
let availableBarbers = [];
let availableServices = [];
let availableTimes = [];
let isSavingReservation = false; // ❗ Flag para prevenir duplo submit

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    const user = await utils.requireAuth('perfil.html');
    if (user) {
        displayUserInfo(user);
        await loadBarbers();
        await loadServices();
        await loadLinkedAccounts();
        loadReservations();
        initializeFilters();
        initializeLogoutButton();
        initializeEditProfileButton();
        initializeEditProfileForm();
        initializeModalCloseHandlers();
        initializeProfilePhoto();
    }
});

// ===== INFORMAÇÕES DO UTILIZADOR =====
function displayUserInfo(user) {
    document.getElementById('user-nome').textContent = user.nome;
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-telefone').textContent = user.telefone || 'Não definido';
    document.getElementById('user-nif').textContent = user.nif || 'Não definido';
}

// ===== GESTÃO DE FOTO DE PERFIL =====
function initializeProfilePhoto() {
    const photoInput = document.getElementById('profile-photo-input');
    const photoDisplay = document.getElementById('profile-photo-display');
    const removePhotoBtn = document.getElementById('remove-photo-btn');

    // Carregar foto existente
    loadProfilePhoto();

    // Upload de nova foto
    if (photoInput) {
        photoInput.addEventListener('change', handlePhotoUpload);
    }

    // Remover foto
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', removeProfilePhoto);
    }
}

async function loadProfilePhoto() {
    const result = await utils.apiRequest('/api_auth/profile-photo');
    if (result.ok && result.data.photoUrl) {
        updateProfilePhotoDisplay(result.data.photoUrl);
        document.getElementById('remove-photo-btn').style.display = 'inline-flex';
    }
}

// ✨ Função para criar loading overlay
function createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'upload-loading-overlay';
    overlay.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        ">
            <div style="
                background: white;
                padding: 30px 40px;
                border-radius: 15px;
                text-align: center;
                min-width: 300px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            ">
                <div style="font-size: 40px; margin-bottom: 15px;">📷</div>
                <div style="
                    font-size: 18px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 20px;
                ">A carregar imagem</div>
                
                <!-- Barra de loading -->
                <div style="
                    width: 100%;
                    height: 6px;
                    background: #e0e0e0;
                    border-radius: 3px;
                    overflow: hidden;
                    position: relative;
                ">
                    <div style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        height: 100%;
                        width: 100%;
                        background: linear-gradient(90deg, #4CAF50, #45a049, #4CAF50);
                        background-size: 200% 100%;
                        animation: loading-bar 1.5s ease-in-out infinite;
                    "></div>
                </div>
                
                <div style="
                    font-size: 12px;
                    color: #666;
                    margin-top: 15px;
                ">Por favor aguarde...</div>
            </div>
        </div>
    `;
    
    // Adicionar animação CSS
    if (!document.getElementById('loading-animation-style')) {
        const style = document.createElement('style');
        style.id = 'loading-animation-style';
        style.textContent = `
            @keyframes loading-bar {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    return overlay;
}

function showLoadingOverlay() {
    // Remover overlay antigo se existir
    const oldOverlay = document.getElementById('upload-loading-overlay');
    if (oldOverlay) oldOverlay.remove();
    
    const overlay = createLoadingOverlay();
    document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('upload-loading-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => overlay.remove(), 300);
    }
}

async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validações
    if (!isValidImageType(file)) {
        alert('Por favor, selecione uma imagem válida (JPG, PNG, GIF ou WebP)');
        return;
    }

    const maxSize = 25 * 1024 * 1024; // 25MB em bytes
    if (file.size > maxSize) {
        alert(`A imagem é muito grande (${formatFileSize(file.size)}). O tamanho máximo é 25MB.`);
        return;
    }

    // ✨ Mostrar loading unificado
    showLoadingOverlay();

    try {
        // Comprimir imagem se necessário (para Cloudinary free tier de 10MB)
        const base64Image = await compressImageIfNeeded(file, 10, 2000);

        // Enviar para o servidor (loading continua visível)
        const result = await utils.apiRequest('/api_auth/profile-photo', {
            method: 'POST',
            body: JSON.stringify({ photo: base64Image })
        });

        if (result.ok) {
            // ✨ Forçar reload completo das imagens
            await forcePhotoReload(result.data.photoUrl);
            document.getElementById('remove-photo-btn').style.display = 'inline-flex';
            
            // ✨ Remover loading (sem alert)
            hideLoadingOverlay();
        } else {
            hideLoadingOverlay();
            alert('❌ ' + (result.data?.error || result.error || 'Erro ao fazer upload da foto'));
        }
    } catch (error) {
        hideLoadingOverlay();
        alert('❌ Erro ao processar foto: ' + error.message);
    }
}

async function removeProfilePhoto() {
    if (!confirm('Tem certeza que deseja remover a foto de perfil?')) return;

    showLoadingOverlay();

    const result = await utils.apiRequest('/api_auth/profile-photo', {
        method: 'DELETE'
    });

    if (result.ok) {
        // ✨ Forçar reload com foto default
        await forcePhotoReload('/images/default-avatar.png');
        document.getElementById('remove-photo-btn').style.display = 'none';
        document.getElementById('profile-photo-input').value = '';
        
        hideLoadingOverlay();
    } else {
        hideLoadingOverlay();
        alert('❌ ' + (result.data?.error || result.error || 'Erro ao remover foto'));
    }
}

/**
 * ✨ Força o reload completo da foto em TODAS as localizações
 * @param {string} newPhotoUrl - Nova URL da foto
 */
async function forcePhotoReload(newPhotoUrl) {
    // 1️⃣ Atualizar foto na página de perfil
    const profilePhoto = document.getElementById('profile-photo-display');
    if (profilePhoto) {
        // Limpar src temporariamente para forçar reload
        profilePhoto.src = '';
        
        // Aguardar 50ms para garantir que o browser registou a mudança
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Definir nova foto com cache busting
        const cacheBuster = `?v=${Date.now()}`;
        const finalUrl = newPhotoUrl.includes('?') ? `${newPhotoUrl}&cb=${Date.now()}` : `${newPhotoUrl}${cacheBuster}`;
        profilePhoto.src = finalUrl;
    }
    
    // 2️⃣ Atualizar foto no header
    const headerPhoto = document.getElementById('header-profile-photo');
    if (headerPhoto) {
        // Limpar src temporariamente
        headerPhoto.src = '';
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Definir nova foto com cache busting
        const cacheBuster = `?v=${Date.now()}`;
        const finalUrl = newPhotoUrl.includes('?') ? `${newPhotoUrl}&cb=${Date.now()}` : `${newPhotoUrl}${cacheBuster}`;
        headerPhoto.src = finalUrl;
    }
    
    // 3️⃣ Forçar atualização do estado de autenticação global
    await utils.updateAuthUI();
}

function updateProfilePhotoDisplay(photoUrl) {
    const photoDisplay = document.getElementById('profile-photo-display');
    if (photoDisplay && photoUrl) {
        // ✨ Adicionar cache busting para forçar refresh
        const cacheBuster = `?v=${Date.now()}`;
        photoDisplay.src = photoUrl.includes('?') ? `${photoUrl}&v=${Date.now()}` : `${photoUrl}${cacheBuster}`;
    }
}

// ===== CARREGAR BARBEIROS =====
async function loadBarbers() {
    const result = await utils.apiRequest('/api_barbeiros');
    if (result.ok) {
        availableBarbers = result.data;
    }
}

// CARREGAR SERVIÇOS
async function loadServices() {
    const result = await utils.apiRequest('/api_servicos');
    if (result.ok) {
        availableServices = result.data;
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
        
        <div id="notes-view-profile-${reserva.id}" style="margin-top: 15px;"></div>
        
        ${!canModify && hoursUntil > 0 && hoursUntil <= 5 ? `
        <div class="modal-detail-row alert-warning text-center">
             ⚠️ Não é possível modificar ou cancelar reservas com menos de 5 horas de antecedência. Por favor contacte +351 224 938 542.
        </div>
        ` : ''}
    `;

    // Inicializar sistema de notas em modo COMPACTO
    if (window.notesManager) {
        const user = JSON.parse(localStorage.getItem('user') || '{"nome":"Cliente"}');
        window.notesManager.initClientNotes(
            `#notes-view-profile-${reserva.id}`,
            user,
            reserva.comentario || '',
            true
        );
    }

    // Botões de ação
    const cancelBtn = document.getElementById('cancelReservationBtn');
    const editBtn = document.getElementById('editReservationBtn');

    if (canModify) {
        if (cancelBtn) {
            cancelBtn.style.display = 'inline-flex';
            cancelBtn.onclick = () => cancelReservation(id);
        }
        if (editBtn) {
            editBtn.style.display = 'inline-flex';
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

    console.log('🚫 Cancelling reservation with DELETE:', id);

    const result = await utils.apiRequest(`/api_reservas/${id}`, {
        method: 'DELETE'
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

    // Preencher select de serviços
    const servicoSelect = document.getElementById('edit-booking-servico');
    servicoSelect.innerHTML = availableServices.map(s => `
        <option value="${s.id}" ${s.id === currentReservation.servico_id ? 'selected' : ''}>
            ${s.nome} (€${s.preco})
        </option>
    `).join('');

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

    // Sistema de notas
    if (window.notesManager) {
        const user = JSON.parse(localStorage.getItem('user') || '{"nome":"Cliente"}');
        window.notesManager.initClientNotes(
            '#notes-container-edit-profile',
            user,
            currentReservation.comentario || ''
        );
    }

    // Limpar mensagens de erro/sucesso
    document.getElementById('edit-booking-error').style.display = 'none';
    document.getElementById('edit-booking-success').style.display = 'none';

    // Carregar horários disponíveis com a hora atual pré-selecionada
    await loadAvailableTimesForEdit(currentReservation.barbeiro_id, dataFormatada, horaFormatada);

    // Fechar modal de detalhes e abrir modal de edição
    utils.closeModal('reservationDetailModal');
    utils.openModal('editBookingModal');

    // Event listeners para mudança de data ou barbeiro
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

    // Botão de salvar - REMOVER LISTENER ANTIGO E ADICIONAR NOVO
    const saveBtn = document.getElementById('saveBookingBtn');
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    newSaveBtn.onclick = saveReservationEdits;
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

        // Se a hora atual não estiver na lista, adicionar
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
        if (currentTime) {
            horaSelect.innerHTML = `<option value="${currentTime}" selected>${currentTime} (hora atual)</option>`;
        } else {
            horaSelect.innerHTML = '<option value="">Sem horários disponíveis</option>';
        }
    }
}

// ===== SALVAR EDIÇÕES DA RESERVA =====
async function saveReservationEdits() {
    if (isSavingReservation) {
        console.log('⚠️ Already saving, ignoring duplicate call');
        return;
    }

    const errorDiv = document.getElementById('edit-booking-error');
    const successDiv = document.getElementById('edit-booking-success');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    const novoServicoId = parseInt(document.getElementById('edit-booking-servico').value);
    const novoBarbeiroId = parseInt(document.getElementById('edit-booking-barbeiro').value);
    const novaData = document.getElementById('edit-booking-data').value;
    const novaHora = document.getElementById('edit-booking-hora').value;
    const comentario = window.notesManager?.getPublicNotes() || '';

    if (!novoServicoId || !novoBarbeiroId || !novaData || !novaHora) {
        errorDiv.textContent = 'Por favor, preencha todos os campos obrigatórios';
        errorDiv.style.display = 'block';
        return;
    }

    isSavingReservation = true;
    const saveBtn = document.getElementById('saveBookingBtn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'A guardar...';

    try {
        const result = await utils.apiRequest('/api_editar_reserva', {
            method: 'PUT',
            body: JSON.stringify({
                reserva_id: currentReservation.id,
                novo_servico_id: novoServicoId,
                novo_barbeiro_id: novoBarbeiroId,
                nova_data: novaData,
                nova_hora: novaHora,
                comentario: comentario || null
            })
        });

        if (result.ok) {
            successDiv.textContent = 'Reserva atualizada com sucesso!';
            successDiv.style.display = 'block';

            await loadReservations();

            setTimeout(() => {
                utils.closeModal('editBookingModal');
                currentReservation = null;
                isSavingReservation = false;
            }, 2000);
        } else {
            errorDiv.textContent = result.data?.error || result.error || 'Erro ao atualizar reserva';
            errorDiv.style.display = 'block';
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
            isSavingReservation = false;
        }
    } catch (error) {
        console.error('Erro ao salvar edições:', error);
        errorDiv.textContent = 'Erro ao processar solicitação';
        errorDiv.style.display = 'block';
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
        isSavingReservation = false;
    }
}

// ===== HANDLERS DE FECHAR MODAIS =====
function initializeModalCloseHandlers() {
    const editModal = document.getElementById('editBookingModal');
    if (editModal) {
        const closeButtons = editModal.querySelectorAll('.close, .close-modal');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                currentReservation = null;
                isSavingReservation = false;
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