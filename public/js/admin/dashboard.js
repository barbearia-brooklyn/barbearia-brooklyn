/**
 * Dashboard Manager
 * Gerencia a view do dashboard com estatísticas e ações rápidas
 */

const DashboardManager = {
    apiBase: '/api/admin',
    
    init() {
        console.log('Inicializando DashboardManager...');
        this.loadDashboardData();
        this.attachEventListeners();
    },

    attachEventListeners() {
        // Quick actions
        document.getElementById('quickNewBooking')?.addEventListener('click', () => {
            UIHelper.showView('newBookingView');
            document.querySelector('[data-view="new-booking"]').click();
        });

        document.getElementById('quickUnavailable')?.addEventListener('click', () => {
            UIHelper.showView('unavailableView');
            document.getElementById('addUnavailableBtn').click();
        });

        document.getElementById('quickClosure')?.addEventListener('click', () => {
            ModalManager.openModal('closureModal');
        });
    },

    async loadDashboardData() {
        try {
            const selectedBarber = ProfileManager.getSelectedBarber();
            if (!selectedBarber) {
                return; // Não carregar dados se não há barbeiro selecionado
            }

            // Carregar dados
            const [monthReservations, todayReservations, yesterdayCompleted, comparativeData] = await Promise.all([
                this.getMonthReservations(selectedBarber),
                this.getTodayReservations(selectedBarber),
                this.getYesterdayCompletedReservations(selectedBarber),
                this.getComparativeData(selectedBarber)
            ]);

            // Atualizar UI
            document.getElementById('statMonthReservations').textContent = monthReservations;
            document.getElementById('statTodayReservations').textContent = todayReservations;
            document.getElementById('statYesterdayCompleted').textContent = yesterdayCompleted;

            // Renderizar gráfico
            this.renderChart(comparativeData);
        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
        }
    },

    async getMonthReservations(barberId) {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const response = await fetch(`${this.apiBase}/reservations?barberId=${barberId}&startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`);
            if (!response.ok) throw new Error('Erro ao carregar reservas do mês');

            const data = await response.json();
            return data.length || 0;
        } catch (error) {
            console.error('Erro ao contar reservas do mês:', error);
            return 0;
        }
    },

    async getTodayReservations(barberId) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const response = await fetch(`${this.apiBase}/reservations?barberId=${barberId}&startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`);
            if (!response.ok) throw new Error('Erro ao carregar reservas de hoje');

            const data = await response.json();
            return data.length || 0;
        } catch (error) {
            console.error('Erro ao contar reservas de hoje:', error);
            return 0;
        }
    },

    async getYesterdayCompletedReservations(barberId) {
        try {
            // Se hoje for domingo, retornar reservas de sábado
            const today = new Date();
            const dayOfWeek = today.getDay();
            let targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() - 1);

            if (dayOfWeek === 0) { // Domingo
                targetDate.setDate(targetDate.getDate() - 1); // Voltar para sábado
            }

            targetDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);

            const response = await fetch(`${this.apiBase}/reservations?barberId=${barberId}&status=concluída&startDate=${targetDate.toISOString()}&endDate=${nextDay.toISOString()}`);
            if (!response.ok) throw new Error('Erro ao carregar reservas concluídas');

            const data = await response.json();
            return data.length || 0;
        } catch (error) {
            console.error('Erro ao contar reservas concluídas:', error);
            return 0;
        }
    },

    async getComparativeData(barberId) {
        try {
            const barbers = ProfileManager.getBarbeiros();
            const comparativeData = [];

            for (const barber of barbers) {
                const yesterday = await this.getYesterdayCompletedReservations(barber.id);
                const today = await this.getTodayReservations(barber.id);

                comparativeData.push({
                    name: barber.nome,
                    completed: yesterday,
                    scheduled: today
                });
            }

            return comparativeData;
        } catch (error) {
            console.error('Erro ao carregar dados comparativos:', error);
            return [];
        }
    },

    renderChart(data) {
        const chartContainer = document.getElementById('dashboardChart');
        if (!chartContainer || !data.length) {
            return;
        }

        chartContainer.innerHTML = '';
        const maxValue = Math.max(...data.flatMap(d => [d.completed, d.scheduled]));

        data.forEach(barber => {
            const group = document.createElement('div');
            group.className = 'chart-barber-group';

            // Barbeiro nome
            const label = document.createElement('div');
            label.className = 'chart-label';
            label.textContent = barber.name;

            // Barra de concluídas
            const barCompleted = document.createElement('div');
            barCompleted.className = 'chart-bar-group';
            const completedPercent = maxValue > 0 ? (barber.completed / maxValue) * 100 : 0;
            barCompleted.innerHTML = `
                <div class="chart-bar chart-bar-completed" style="width: ${completedPercent}%">
                    <span class="chart-value">${barber.completed}</span>
                </div>
                <span class="chart-bar-label">Concluídas ontem</span>
            `;

            // Barra de agendadas
            const barScheduled = document.createElement('div');
            barScheduled.className = 'chart-bar-group';
            const scheduledPercent = maxValue > 0 ? (barber.scheduled / maxValue) * 100 : 0;
            barScheduled.innerHTML = `
                <div class="chart-bar chart-bar-scheduled" style="width: ${scheduledPercent}%">
                    <span class="chart-value">${barber.scheduled}</span>
                </div>
                <span class="chart-bar-label">Agendadas hoje</span>
            `;

            group.appendChild(label);
            group.appendChild(barCompleted);
            group.appendChild(barScheduled);

            chartContainer.appendChild(group);
        });
    }
};
