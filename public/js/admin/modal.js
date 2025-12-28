/**
 * Brooklyn Barbearia - Centralized Modal Manager
 * Handles all modal interactions across admin pages
 */

class ModalManager {
    constructor() {
        this.currentModal = null;
        this.selectedClientId = null;
        this.searchTimeout = null;
        this.onSaveCallback = null;
    }

    // ===== BOOKING MODAL (New + Edit) =====

    /**
     * Open booking modal for creating new reservation
     * @param {Object} barbeiro - Barbeiro object {id, nome}
     * @param {String} dateTime - ISO datetime string
     * @param {Array} servicos - Array of servico objects
     * @param {Function} onSave - Callback after successful save
     */
    openBookingModal(barbeiro, dateTime, servicos, onSave) {
        this.onSaveCallback = onSave;
        this.selectedClientId = null;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'bookingModal';
        
        const date = new Date(dateTime);
        const formattedDateTime = this.formatDateTime(date);

        modal.innerHTML = `
            <div class="modal-content modal-booking">
                <div class="modal-header">
                    <h3>Nova Reserva - ${barbeiro.nome}</h3>
                    <button class="modal-close" onclick="window.modalManager.closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-time-display">
                        📅 ${formattedDateTime}
                    </div>
                    
                    <div class="form-group">
                        <label>Cliente</label>
                        <input type="text" 
                               id="clientSearchInput" 
                               class="form-control" 
                               placeholder="Nome, telefone ou email"
                               autocomplete="off">
                        <div id="clientSuggestions" class="client-suggestions"></div>
                    </div>

                    <div id="clientDataForm" style="display: none;">
                        <div class="form-group">
                            <label for="clientName">Nome Completo *</label>
                            <input type="text" id="clientName" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="clientPhone">Telefone *</label>
                            <input type="tel" id="clientPhone" class="form-control" placeholder="+351" required>
                        </div>
                        <div class="form-group">
                            <label for="clientEmail">Email</label>
                            <input type="email" id="clientEmail" class="form-control">
                        </div>
                    </div>

                    <div id="bookingForm" style="display: none;">
                        <div class="form-group">
                            <label for="servicoSelect">Serviço *</label>
                            <select id="servicoSelect" class="form-control" required>
                                <option value="">Selecionar serviço...</option>
                                ${servicos.map(s => `<option value="${s.id}">${s.nome} (€${s.preco})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="bookingNotes">Notas</label>
                            <textarea id="bookingNotes" class="form-control" rows="2" placeholder="Notas adicionais..."></textarea>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="window.modalManager.closeModal()">
                        Cancelar
                    </button>
                    <button id="createBookingBtn" class="btn btn-primary" style="display: none;">
                        Criar Reserva
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.currentModal = modal;

        // Setup event listeners
        this.setupClientSearch();
        this.setupBookingButton(barbeiro.id, dateTime);

        setTimeout(() => {
            document.getElementById('clientSearchInput')?.focus();
        }, 100);
    }

    // ===== CLIENT SEARCH =====

    setupClientSearch() {
        const input = document.getElementById('clientSearchInput');
        if (!input) return;

        input.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => this.searchClients(e.target.value), 300);
        });
    }

    async searchClients(query) {
        const container = document.getElementById('clientSuggestions');
        if (!container) return;

        if (!query || query.length < 2) {
            container.innerHTML = '';
            document.getElementById('clientDataForm').style.display = 'none';
            document.getElementById('bookingForm').style.display = 'none';
            document.getElementById('createBookingBtn').style.display = 'none';
            return;
        }

        container.innerHTML = '<div class="client-suggestions-loading">🔍 A buscar...</div>';

        try {
            const response = await window.adminAPI.getClientes({ search: query, limit: 10 });
            const clientes = response.clientes || response || [];

            const normalizedQuery = query.toLowerCase().trim();
            const matches = clientes.filter(c => 
                c.nome?.toLowerCase().includes(normalizedQuery) ||
                c.telefone?.includes(query) ||
                c.email?.toLowerCase().includes(normalizedQuery)
            ).slice(0, 5);

            let html = '<div class="client-suggestions-list">';
            
            // Always show "Create new client" option
            html += `
                <div class="client-suggestion-item" onclick="window.modalManager.showNewClientForm('${this.escapeHtml(query)}')">
                    <div class="client-suggestion-name">➕ Criar novo cliente</div>
                    <div class="client-suggestion-contact">Nome: ${this.escapeHtml(query)}</div>
                </div>
            `;

            // Show existing matches
            if (matches.length > 0) {
                matches.forEach(c => {
                    html += `
                        <div class="client-suggestion-item" onclick="window.modalManager.selectClient(${c.id}, '${this.escapeHtml(c.nome)}')">
                            <div class="client-suggestion-name">${this.escapeHtml(c.nome)}</div>
                            <div class="client-suggestion-contact">
                                ${c.telefone || ''} ${c.email ? '• ' + c.email : ''}
                            </div>
                        </div>
                    `;
                });
            }

            html += '</div>';
            container.innerHTML = html;
            document.getElementById('clientDataForm').style.display = 'none';

        } catch (error) {
            console.error('Error searching clients:', error);
            container.innerHTML = '<div class="client-suggestions-empty">Erro ao buscar clientes</div>';
        }
    }

    showNewClientForm(defaultName = '') {
        document.getElementById('clientSuggestions').innerHTML = '';
        document.getElementById('clientSearchInput').value = defaultName;
        document.getElementById('clientName').value = defaultName;
        document.getElementById('clientDataForm').style.display = 'block';
        document.getElementById('bookingForm').style.display = 'block';
        document.getElementById('createBookingBtn').style.display = 'block';
        this.selectedClientId = null;

        setTimeout(() => {
            document.getElementById('clientPhone')?.focus();
        }, 100);
    }

    selectClient(clientId, clientName) {
        document.getElementById('clientSearchInput').value = clientName;
        document.getElementById('clientSuggestions').innerHTML = '';
        document.getElementById('clientDataForm').style.display = 'none';
        document.getElementById('bookingForm').style.display = 'block';
        document.getElementById('createBookingBtn').style.display = 'block';
        this.selectedClientId = clientId;
    }

    setupBookingButton(barbeiroId, dateTime) {
        const btn = document.getElementById('createBookingBtn');
        if (!btn) return;

        btn.addEventListener('click', () => this.createBooking(barbeiroId, dateTime));
    }

    async createBooking(barbeiroId, dateTime) {
        const servicoId = document.getElementById('servicoSelect')?.value;
        const notes = document.getElementById('bookingNotes')?.value;

        let clientId = this.selectedClientId;
        
        // Create new client if needed
        if (!clientId) {
            const name = document.getElementById('clientName')?.value?.trim();
            const phone = document.getElementById('clientPhone')?.value?.trim();
            const email = document.getElementById('clientEmail')?.value?.trim();

            if (!name || !phone) {
                alert('❌ Nome e telefone são obrigatórios');
                return;
            }

            try {
                const response = await window.adminAPI.createCliente({ 
                    nome: name, 
                    telefone: phone, 
                    email: email || null 
                });
                clientId = response.id || response.cliente?.id;
            } catch (error) {
                // Check if error is duplicate phone/email
                if (error.message.includes('telefone') || error.message.includes('email')) {
                    alert('❌ Já existe um cliente com este telefone/email.\n\nPor favor pesquise esse contacto e selecione o respetivo cliente.');
                } else {
                    alert('❌ Erro ao criar cliente: ' + error.message);
                }
                return;
            }
        }

        if (!servicoId) {
            alert('❌ Selecione um serviço');
            return;
        }

        try {
            const btn = document.getElementById('createBookingBtn');
            btn.disabled = true;
            btn.textContent = '⏳ A criar...';

            await window.adminAPI.createReserva({
                cliente_id: clientId,
                barbeiro_id: barbeiroId,
                servico_id: servicoId,
                data_hora: dateTime,
                comentario: notes
            });

            this.closeModal();
            alert('✅ Reserva criada com sucesso!');
            
            if (this.onSaveCallback) {
                this.onSaveCallback();
            }

        } catch (error) {
            alert('❌ Erro ao criar reserva: ' + error.message);
            document.getElementById('createBookingBtn').disabled = false;
            document.getElementById('createBookingBtn').textContent = 'Criar Reserva';
        }
    }

    // ===== DETAILS MODAL =====

    /**
     * Show reservation details with edit, status change, delete options
     * @param {Object} reserva - Reservation object
     * @param {Object} barbeiro - Barbeiro object
     * @param {Object} servico - Servico object
     * @param {Function} onUpdate - Callback after update
     */
    showDetailsModal(reserva, barbeiro, servico, onUpdate) {
        this.onSaveCallback = onUpdate;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'detailsModal';

        const dataHora = new Date(reserva.data_hora);

        modal.innerHTML = `
            <div class="modal-content modal-details">
                <div class="modal-header">
                    <h3>Detalhes da Reserva #${reserva.id}</h3>
                    <button class="modal-close" onclick="window.modalManager.closeModal()">&times;</button>
                </div>
                <div class="modal-body" id="detailsModalBody">
                    ${this.renderDetailsView(reserva, barbeiro, servico)}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="window.modalManager.closeModal()">
                        Fechar
                    </button>
                    <button class="btn btn-primary" onclick="window.modalManager.showStatusChangeForm(${JSON.stringify(reserva).replace(/"/g, '&quot;')})">
                        <i class="fas fa-sync"></i> Alterar Status
                    </button>
                    <button class="btn btn-primary" onclick="window.modalManager.showEditForm(${JSON.stringify(reserva).replace(/"/g, '&quot;')})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.currentModal = modal;
    }

    renderDetailsView(reserva, barbeiro, servico) {
        return `
            <div class="modal-details">
                <div class="detail-row">
                    <strong>Cliente:</strong> ${reserva.cliente_nome}
                </div>
                <div class="detail-row">
                    <strong>Barbeiro:</strong> ${barbeiro?.nome || 'N/A'}
                </div>
                <div class="detail-row">
                    <strong>Serviço:</strong> ${servico?.nome || 'N/A'} (€${servico?.preco || '0'})
                </div>
                <div class="detail-row">
                    <strong>Data/Hora:</strong> ${this.formatDateTime(new Date(reserva.data_hora))}
                </div>
                <div class="detail-row">
                    <strong>Duração:</strong> ${servico?.duracao || '0'} min
                </div>
                <div class="detail-row">
                    <strong>Status:</strong> <span class="status-badge ${reserva.status}">${this.getStatusText(reserva.status)}</span>
                </div>
                ${reserva.comentario ? `
                <div class="detail-row">
                    <strong>Notas:</strong> ${reserva.comentario}
                </div>
                ` : ''}
                ${reserva.motivo_cancelamento ? `
                <div class="detail-row alert-warning">
                    <strong>Motivo Cancelamento:</strong> ${reserva.motivo_cancelamento}
                </div>
                ` : ''}
            </div>
        `;
    }

    // ===== STATUS CHANGE FORM =====

    showStatusChangeForm(reserva) {
        const body = document.getElementById('detailsModalBody');
        if (!body) return;

        body.innerHTML = `
            <form id="statusChangeForm">
                <div class="form-group">
                    <label for="statusSelect">Novo Status *</label>
                    <select id="statusSelect" class="form-control" required>
                        <option value="confirmada" ${reserva.status === 'confirmada' ? 'selected' : ''}>✅ Confirmada</option>
                        <option value="cancelada" ${reserva.status === 'cancelada' ? 'selected' : ''}>❌ Cancelada</option>
                        <option value="faltou" ${reserva.status === 'faltou' ? 'selected' : ''}>⚠️ Faltou</option>
                        <option value="concluida" ${reserva.status === 'concluida' ? 'selected' : ''}>✔️ Concluída</option>
                    </select>
                </div>
                <div id="cancelamentoReason" style="display: ${reserva.status === 'cancelada' ? 'block' : 'none'};">
                    <div class="form-group">
                        <label for="motivoCancelamento">Motivo do Cancelamento *</label>
                        <textarea id="motivoCancelamento" class="form-control" rows="3" 
                                  placeholder="Ex: Cliente cancelou por motivos pessoais"
                                  required>${reserva.motivo_cancelamento || ''}</textarea>
                        <small style="color: #666; display: block; margin-top: 5px;">
                            ℹ️ Este motivo será visível para o cliente
                        </small>
                    </div>
                </div>
            </form>
        `;

        // Show/hide cancellation reason
        document.getElementById('statusSelect')?.addEventListener('change', (e) => {
            const reasonDiv = document.getElementById('cancelamentoReason');
            if (e.target.value === 'cancelada') {
                reasonDiv.style.display = 'block';
                document.getElementById('motivoCancelamento').required = true;
            } else {
                reasonDiv.style.display = 'none';
                document.getElementById('motivoCancelamento').required = false;
            }
        });

        // Update footer buttons
        const footer = this.currentModal.querySelector('.modal-footer');
        footer.innerHTML = `
            <button class="btn btn-secondary" onclick="window.modalManager.showDetailsModal(
                ${JSON.stringify(reserva).replace(/"/g, '&quot;')},
                null, null, window.modalManager.onSaveCallback
            )">
                Cancelar
            </button>
            <button class="btn btn-primary" onclick="window.modalManager.saveStatusChange(${reserva.id})">
                Guardar Status
            </button>
        `;
    }

    async saveStatusChange(reservaId) {
        const form = document.getElementById('statusChangeForm');
        if (!form || !form.checkValidity()) {
            alert('❌ Preencha todos os campos obrigatórios');
            return;
        }

        const status = document.getElementById('statusSelect').value;
        const motivo = status === 'cancelada' ? document.getElementById('motivoCancelamento').value : null;

        try {
            await window.adminAPI.updateReserva(reservaId, { 
                status,
                motivo_cancelamento: motivo
            });

            this.closeModal();
            alert('✅ Status atualizado com sucesso!');
            
            if (this.onSaveCallback) {
                this.onSaveCallback();
            }

        } catch (error) {
            alert('❌ Erro ao atualizar status: ' + error.message);
        }
    }

    // ===== EDIT FORM =====

    async showEditForm(reserva) {
        // Load data if needed
        const [barbeirosResp, servicosResp] = await Promise.all([
            window.adminAPI.getBarbeiros(),
            window.adminAPI.getServicos()
        ]);

        const barbeiros = barbeirosResp.barbeiros || barbeirosResp || [];
        const servicos = servicosResp.servicos || servicosResp || [];

        const body = document.getElementById('detailsModalBody');
        if (!body) return;

        const dataHora = new Date(reserva.data_hora);

        body.innerHTML = `
            <form id="editReservaForm">
                <div class="form-group">
                    <label>Cliente</label>
                    <input type="text" class="form-control" value="${reserva.cliente_nome}" disabled>
                    <small style="color: #666;">ℹ️ Para alterar o cliente, crie uma nova reserva</small>
                </div>
                <div class="form-group">
                    <label for="editBarbeiroId">Barbeiro *</label>
                    <select id="editBarbeiroId" class="form-control" required>
                        ${barbeiros.map(b => `<option value="${b.id}" ${b.id == reserva.barbeiro_id ? 'selected' : ''}>${b.nome}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="editServicoId">Serviço *</label>
                    <select id="editServicoId" class="form-control" required>
                        ${servicos.map(s => `<option value="${s.id}" ${s.id == reserva.servico_id ? 'selected' : ''}>${s.nome} (€${s.preco})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="editData">Data *</label>
                    <input type="date" id="editData" class="form-control" value="${dataHora.toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label for="editHora">Hora *</label>
                    <input type="time" id="editHora" class="form-control" value="${this.formatTime(dataHora)}" required>
                </div>
                <div class="form-group">
                    <label for="editNotas">Notas</label>
                    <textarea id="editNotas" class="form-control" rows="2">${reserva.comentario || ''}</textarea>
                </div>
            </form>
        `;

        // Update footer
        const footer = this.currentModal.querySelector('.modal-footer');
        footer.innerHTML = `
            <button class="btn btn-secondary" onclick="window.modalManager.showDetailsModal(
                ${JSON.stringify(reserva).replace(/"/g, '&quot;')},
                null, null, window.modalManager.onSaveCallback
            )">
                Cancelar
            </button>
            <button class="btn btn-primary" onclick="window.modalManager.saveEdit(${reserva.id})">
                Guardar Alterações
            </button>
        `;
    }

    async saveEdit(reservaId) {
        const form = document.getElementById('editReservaForm');
        if (!form || !form.checkValidity()) {
            alert('❌ Preencha todos os campos obrigatórios');
            return;
        }

        const data = {
            barbeiro_id: parseInt(document.getElementById('editBarbeiroId').value),
            servico_id: parseInt(document.getElementById('editServicoId').value),
            data_hora: `${document.getElementById('editData').value}T${document.getElementById('editHora').value}:00`,
            comentario: document.getElementById('editNotas').value
        };

        try {
            await window.adminAPI.updateReserva(reservaId, data);

            this.closeModal();
            alert('✅ Reserva atualizada com sucesso!');
            
            if (this.onSaveCallback) {
                this.onSaveCallback();
            }

        } catch (error) {
            alert('❌ Erro ao atualizar reserva: ' + error.message);
        }
    }

    // ===== UTILITIES =====

    closeModal() {
        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
        }
        this.selectedClientId = null;
        this.onSaveCallback = null;
    }

    formatDateTime(date) {
        if (typeof date === 'string') date = new Date(date);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} às ${hours}:${minutes}`;
    }

    formatTime(date) {
        if (typeof date === 'string') date = new Date(date);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    getStatusText(status) {
        const map = {
            'confirmada': 'Confirmada',
            'cancelada': 'Cancelada',
            'faltou': 'Faltou',
            'concluida': 'Concluída'
        };
        return map[status] || status;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize global instance
window.modalManager = new ModalManager();

console.log('✅ Modal Manager loaded');
