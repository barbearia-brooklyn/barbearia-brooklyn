/**
 * Brooklyn Barbearia - New Booking Manager
 * Handles creating new reservas from admin panel
 */

class NewBookingManager {
    constructor() {
        this.selectedClientId = null;
        this.searchTimeout = null;
        this.barbeiros = [];
        this.servicos = [];
        this.init();
    }

    async init() {
        try {
            // Verify API is loaded
            if (!window.api) {
                console.error('❌ API client not loaded');
                alert('Erro: Cliente API não foi carregado. Por favor, recarregue a página.');
                return;
            }

            // Load barbeiros
            await this.loadBarbeiros();

            // Load servicos
            await this.loadServicos();

            // Set min date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('bookingDate').min = today;
            document.getElementById('bookingDate').value = today;

            // Setup client search
            this.setupClientSearch();

            // Setup form submission
            this.setupFormHandler();

            console.log('✅ New booking form initialized');
        } catch (error) {
            console.error('❌ Error initializing form:', error);
            alert('Erro ao carregar dados do formulário. Por favor, recarregue a página.');
        }
    }

    /**
     * Load barbeiros into dropdown
     */
    async loadBarbeiros() {
        try {
            const response = await window.api.barbeiros.getAll();
            this.barbeiros = response.barbeiros || response || [];

            const barberSelect = document.getElementById('bookingBarber');
            barberSelect.innerHTML = '<option value="">Selecione um barbeiro</option>';
            
            this.barbeiros.forEach(barbeiro => {
                const option = document.createElement('option');
                option.value = barbeiro.id;
                option.textContent = barbeiro.nome;
                barberSelect.appendChild(option);
            });

            console.log(`✅ Loaded ${this.barbeiros.length} barbeiros`);
        } catch (error) {
            console.error('❌ Error loading barbeiros:', error);
            throw error;
        }
    }

    /**
     * Load servicos into dropdown
     */
    async loadServicos() {
        try {
            const response = await window.api.servicos.getAll();
            this.servicos = response.servicos || response || [];

            const serviceSelect = document.getElementById('bookingService');
            serviceSelect.innerHTML = '<option value="">Selecione um serviço</option>';
            
            this.servicos.forEach(servico => {
                const option = document.createElement('option');
                option.value = servico.id;
                option.textContent = `${servico.nome} - €${servico.preco}`;
                serviceSelect.appendChild(option);
            });

            console.log(`✅ Loaded ${this.servicos.length} servicos`);
        } catch (error) {
            console.error('❌ Error loading servicos:', error);
            throw error;
        }
    }

    /**
     * Setup client search (like modal.js)
     */
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
            document.getElementById('bookingFormFields').style.display = 'none';
            this.selectedClientId = null;
            return;
        }

        container.innerHTML = '<div class="client-suggestions-loading">🔍 A buscar...</div>';

        try {
            const response = await window.api.clientes.getAll({ search: query, limit: 10 });
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
                <div class="client-suggestion-item" onclick="window.bookingManager.showNewClientForm('${this.escapeHtml(query)}')">
                    <div class="client-suggestion-name">➡️ Criar novo cliente</div>
                    <div class="client-suggestion-contact">Nome: ${this.escapeHtml(query)}</div>
                </div>
            `;

            // Show existing matches
            if (matches.length > 0) {
                matches.forEach(c => {
                    html += `
                        <div class="client-suggestion-item" onclick="window.bookingManager.selectClient(${c.id}, '${this.escapeHtml(c.nome)}')">
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
        document.getElementById('bookingFormFields').style.display = 'block';
        this.selectedClientId = null;

        setTimeout(() => {
            document.getElementById('clientPhone')?.focus();
        }, 100);
    }

    selectClient(clientId, clientName) {
        document.getElementById('clientSearchInput').value = clientName;
        document.getElementById('clientSuggestions').innerHTML = '';
        document.getElementById('clientDataForm').style.display = 'none';
        document.getElementById('bookingFormFields').style.display = 'block';
        this.selectedClientId = clientId;
    }

    /**
     * Setup form submission handler
     */
    setupFormHandler() {
        const form = document.getElementById('newBookingForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createBooking();
        });
    }

    async createBooking() {
        const submitBtn = document.querySelector('#newBookingForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A criar...';

        try {
            let clientId = this.selectedClientId;
            
            // Create new client if needed
            if (!clientId) {
                const name = document.getElementById('clientName')?.value?.trim();
                const phone = document.getElementById('clientPhone')?.value?.trim();
                const email = document.getElementById('clientEmail')?.value?.trim();

                if (!name || !phone) {
                    alert('❌ Nome e telefone são obrigatórios');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                    return;
                }

                try {
                    const response = await window.api.clientes.create({ 
                        nome: name, 
                        telefone: phone, 
                        email: email || null 
                    });
                    clientId = response.id || response.cliente?.id;
                } catch (error) {
                    if (error.message.includes('telefone') || error.message.includes('email')) {
                        alert('❌ Já existe um cliente com este telefone/email.\n\nPor favor pesquise esse contacto e selecione o respetivo cliente.');
                    } else {
                        alert('❌ Erro ao criar cliente: ' + error.message);
                    }
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                    return;
                }
            }

            // Validate form data
            const formData = {
                barbeiro_id: parseInt(document.getElementById('bookingBarber').value),
                servico_id: parseInt(document.getElementById('bookingService').value),
                cliente_id: clientId,
                data_hora: `${document.getElementById('bookingDate').value}T${document.getElementById('bookingTime').value}:00`,
                comentario: document.getElementById('bookingNotes').value || null,
                notificar_email: document.getElementById('notifyEmail')?.checked || false,
                notificar_lembrete: document.getElementById('notifyReminder')?.checked || false
            };

            // Validate required fields
            if (!formData.barbeiro_id || !formData.servico_id || !clientId) {
                throw new Error('Por favor, preencha todos os campos obrigatórios.');
            }

            // Create reserva
            const response = await window.api.reservas.create(formData);
            console.log('✅ Reserva created successfully:', response);

            // Success feedback
            alert('✅ Reserva criada com sucesso!');
            window.location.href = '/admin/reservations.html';
        } catch (error) {
            console.error('❌ Error creating booking:', error);
            alert(`❌ Erro ao criar reserva: ${error.message}`);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.bookingManager = new NewBookingManager();
    });
} else {
    window.bookingManager = new NewBookingManager();
}

console.log('✅ New Booking Manager loaded');