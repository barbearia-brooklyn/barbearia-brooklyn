/**
 * Gestão de reservas
 */

class ReservationManager {
    static RESERVAS_API = '/api/admin/api_admin_reservas';
    static SERVICOS_API = '/api/api_servicos';
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
        document.getElementById('filterDate')?.addEventListener('change', () => this.loadReservationsList());

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
        const selectedBarber = ProfileManager.getSelectedBarber();
        const barbeiro = ProfileManager.getBarbeiros().find(b => b.id === selectedBarber);
        const nome = barbeiro ? barbeiro.nome : 'Todos os Barbeiros';
        UIHelper.updateHeaderTitle('Lista de Reservas', `Reservas de ${nome}`);
        UIHelper.showView('listView');

        // Popular filtro de barbeiros
        const filterSelect = document.getElementById('filterBarber');

        filterSelect.innerHTML = '';

        if (selectedBarber === null) {
            // Se é vista de todos
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Todos os Barbeiros';
            filterSelect.appendChild(option);

            ProfileManager.getBarbeiros().forEach(barbeiro => {
                const option = document.createElement('option');
                option.value = barbeiro.id;
                option.textContent = barbeiro.nome;
                filterSelect.appendChild(option);
            });
        } else {
            // Se é vista pessoal, desabilitar filtro
            const barber = ProfileManager.getBarbeiros().find(b => b.id === selectedBarber);
            const option = document.createElement('option');
            option.value = selectedBarber;
            option.textContent = barber.nome;
            filterSelect.appendChild(option);
        }

        this.loadReservationsList();
    }

    static async loadReservationsList() {
        try {
            UIHelper.showLoading(true);
            const selectedBarber = ProfileManager.getSelectedBarber();
            const filterDate = document.getElementById('filterDate')?.value;
            let params = new URLSearchParams();
            if (selectedBarber) {
                params.append('barbeiroId', selectedBarber);
            } else {
                const filtroBarber = document.getElementById('filterBarber')?.value;
                if (filtroBarber) {
                    params.append('barbeiroId', filtroBarber);
                }
            }

            if (filterDate) {
                params.append('date', filterDate);
            } else {
                const today = new Date().toISOString().split('T')[0];
                params.append('fromDate', today);
            }

            const response = await fetch(`${this.RESERVAS_API}?${params}`, {
                headers: { 'Authorization': `Bearer ${AuthManager.getToken()}` }
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

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filterDate = document.getElementById('filterDate')?.value;

        reservas = reservas.filter(reserva => {
            const reservaDate = new Date(reserva.data_hora);
            reservaDate.setHours(0, 0, 0, 0);

            if (filterDate) {
                const selectedDate = new Date(filterDate);
                return reservaDate.getTime() === selectedDate.getTime();
            } else {
                return reservaDate >= today;
            }
        });

        if (reservas.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.innerHTML = '<p>📋</p><p>Nenhuma reserva encontrada</p>';
            container.appendChild(empty);
            return;
        }

        // Ordenar por data e hora
        reservas.sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));

        // Agrupar por data
        const reservasPorData = {};
        reservas.forEach(reserva => {
            const data = UIHelper.formatDate(reserva.data_hora);
            if (!reservasPorData[data]) {
                reservasPorData[data] = [];
            }
            reservasPorData[data].push(reserva);
        });

        // Renderizar por data
        Object.entries(reservasPorData).forEach(([data, reservasData]) => {
            const dateHeaderDiv = document.createElement('div');
            dateHeaderDiv.className = 'list-date-header';
            dateHeaderDiv.textContent = data;
            container.appendChild(dateHeaderDiv);

            reservasData.forEach(reserva => {
                const card = document.createElement('div');
                card.className = 'reservation-list-item';

                const hora = UIHelper.formatTime(reserva.data_hora);

                const statusIcon = reserva.status === 'cancelada' ? '✗' : '✓';
                const statusClass = reserva.status === 'cancelada' ? 'status-cancelled' : 'status-confirmed';

                card.innerHTML = `
                <div class="list-item-left">
                    <div class="list-item-time-barber">${hora} - ${reserva.barbeiro_nome}</div>
                </div>
                <div class="list-item-center">
                    <div class="list-item-client-service"><strong>Cliente: ${reserva.nome_cliente}</strong> (${reserva.servico_nome})</div>
                </div>
                <div class="list-item-right">
                    <span class="list-item-status ${statusClass}">${statusIcon}</span>
                </div>
            `;

                card.addEventListener('click', () => {
                    ModalManager.showBookingDetail(reserva);
                });

                container.appendChild(card);
            });
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

        const form = e.target;
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        try {
            UIHelper.showLoading(true);

            const dataHora = `${form.bookDate.value}T${form.bookTime.value}:00`;

            const data = {
                barbeiro_id: parseInt(form.bookBarber.value),
                servico_id: parseInt(form.bookService.value),
                nome_cliente: form.bookClient.value,
                email: form.bookEmail.value || null,
                telefone: form.bookPhone.value || null,
                data_hora: dataHora,
                comentario: form.bookComment?.value || null,
                nota_privada: form.bookPrivateNote?.value || null
            };

            console.log('Enviando dados:', data); // Debug

            const response = await fetch(this.RESERVAS_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AuthManager.getToken()}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.details || 'Erro ao criar reserva');
            }

            const result = await response.json();
            UIHelper.showAlert('Reserva criada com sucesso!', 'success');

            form.reset();
            this.loadReservationsList();
            CalendarManager.loadCalendar(ProfileManager.getSelectedBarber());

        } catch (error) {
            console.error('Erro:', error);
            UIHelper.showAlert(error.message, 'error');
        } finally {
            UIHelper.showLoading(false);
        }
    }
}