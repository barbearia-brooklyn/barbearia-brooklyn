/**
 * Gestão de reservas
 */

class ReservationManager {
    static RESERVAS_API = '/api/admin/reservas';
    static SERVICOS_API = '/api/servicos';
    static allServicos = [];

    static init() {
        this.loadServicos();
        this.setupEventListeners();
    }

    static setupEventListeners() {
        // Lista de reservas
        document.querySelectorAll('.nav-item-list').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showListView();
            });
        });

        // Filtros de lista
        document.getElementById('filterBarber')?.addEventListener('change', () => this.loadReservationsList());
        document.getElementById('filterPeriod')?.addEventListener('change', () => this.loadReservationsList());

        // Nova reserva
        document.querySelectorAll('.nav-item-new').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNewBookingView();
            });
        });

        // Form nova reserva
        document.getElementById('newBookingForm')?.addEventListener('submit', (e) => this.handleNewBooking(e));
    }

    static async loadServicos() {
        try {
            const response = await fetch(this.SERVICOS_API);
            if (response.ok) {
                this.allServicos = await response.json();
                this.populateServiceSelects();
            }
        } catch (error) {
            console.error('Erro ao carregar serviços:', error);
        }
    }

    static populateServiceSelects() {
        const select = document.getElementById('bookService');
        if (select) {
            select.innerHTML = '<option value="">Selecione um serviço</option>';
            this.allServicos.forEach(servico => {
                const option = document.createElement('option');
                option.value = servico.id;
                option.textContent = `${servico.nome} (${servico.duracao}min)`;
                select.appendChild(option);
            });
        }
    }

    static async showListView() {
        UIHelper.updateHeaderTitle('Lista de Reservas', 'Todas as reservas');
        UIHelper.showView('listView');

        // Popular filtro de barbeiros
        const filterSelect = document.getElementById('filterBarber');
        filterSelect.innerHTML = '<option value="">Todos os Barbeiros</option>';
        ProfileManager.getBarbeiros().forEach(barbeiro => {
            const option = document.createElement('option');
            option.value = barbeiro.id;
            option.textContent = barbeiro.nome;
            filterSelect.appendChild(option);
        });

        this.loadReservationsList();
    }

    static async loadReservationsList() {
        try {
            UIHelper.showLoading(true);

            const barberId = document.getElementById('filterBarber')?.value;
            const period = document.getElementById('filterPeriod')?.value || 'all';

            const params = new URLSearchParams({ period });
            if (barberId) params.append('barbeiroId', barberId);

            const response = await fetch(`${this.RESERVAS_API}?${params}`, {
                headers: {
                    'Authorization': `Bearer ${AuthManager.getToken()}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar reservas');

            const reservas = await response.json();
            this.renderReservationsList(reservas);
        } catch (error) {
            console.error('Erro:', error);
            UIHelper.showAlert('Erro ao carregar reservas', 'error');
        } finally {
            UIHelper.showLoading(false);
        }
    }

    static renderReservationsList(reservas) {
        const container = document.getElementById('reservationsList');
        container.innerHTML = '';

        if (reservas.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhuma reserva encontrada</p>';
            return;
        }

        reservas.forEach(reserva => {
            const card = document.createElement('div');
            card.className = 'booking-item';

            const dataHora = new Date(reserva.data_hora);
            const dataFormatada = UIHelper.formatDate(dataHora);
            const horaFormatada = UIHelper.formatTime(dataHora);

            card.innerHTML = `
                <div class="booking-item-header">
                    <h4>${reserva.cliente_nome}</h4>
                    <span class="time">${horaFormatada}</span>
                </div>
                <div class="booking-item-details">
                    <p><strong>Barbeiro:</strong> ${reserva.barbeiro_nome}</p>
                    <p><strong>Serviço:</strong> ${reserva.servico_nome}</p>
                    <p><strong>Data:</strong> ${dataFormatada}</p>
                </div>
            `;

            card.addEventListener('click', () => {
                ModalManager.showBookingDetail(reserva);
            });

            container.appendChild(card);
        });
    }

    static showNewBookingView() {
        UIHelper.updateHeaderTitle('Nova Reserva', 'Criar uma nova reserva');
        UIHelper.showView('newBookingView');

        // Popular selects
        const barberSelect = document.getElementById('bookBarber');
        barberSelect.innerHTML = '<option value="">Selecione um barbeiro</option>';
        ProfileManager.getBarbeiros().forEach(barbeiro => {
            const option = document.createElement('option');
            option.value = barbeiro.id;
            option.textContent = barbeiro.nome;
            barberSelect.appendChild(option);
        });

        this.populateServiceSelects();
    }

    static async handleNewBooking(e) {
        e.preventDefault();

        const formData = {
            barbeiro_id: document.getElementById('bookBarber').value,
            servico_id: document.getElementById('bookService').value,
            data_hora: `${document.getElementById('bookDate').value}T${document.getElementById('bookTime').value}`,
            cliente_nome: document.getElementById('bookClient').value,
            telefone: document.getElementById('bookPhone').value || null,
            email: document.getElementById('bookEmail').value || null,
            nota_privada: document.getElementById('bookNotes').value || null
        };

        try {
            UIHelper.showLoading(true);

            const response = await fetch(`${this.RESERVAS_API}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AuthManager.getToken()}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Erro ao criar reserva');

            UIHelper.showAlert('Reserva criada com sucesso!', 'success');
            document.getElementById('newBookingForm').reset();

            // Voltar à view anterior
            setTimeout(() => {
                ProfileManager.showProfilesView();
            }, 1000);
        } catch (error) {
            console.error('Erro:', error);
            UIHelper.showAlert('Erro ao criar reserva', 'error');
        } finally {
            UIHelper.showLoading(false);
        }
    }
}
