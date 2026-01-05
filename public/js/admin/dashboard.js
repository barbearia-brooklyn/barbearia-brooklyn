/**
 * Dashboard Manager
 * Gerencia a view do dashboard com estatísticas e ações rápidas
 * Suporta visualizações diferentes para Admin e Barbeiro
 */

const DashboardManager = {
    currentUser: null,
    stats: {},
    
    init() {
        console.log('📊 Inicializando DashboardManager...');
        this.currentUser = this.getCurrentUser();
        this.loadDashboardData();
    },

    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('admin_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('❌ Error parsing user data:', error);
            return null;
        }
    },

    async loadDashboardData() {
        try {
            console.log('👤 User role:', this.currentUser?.role);
            
            if (this.currentUser?.role === 'admin') {
                await this.loadAdminStats();
            } else if (this.currentUser?.role === 'barbeiro') {
                await this.loadBarbeiroStats(this.currentUser.barbeiro_id);
            } else {
                console.warn('⚠️ Role desconhecido, usando dados mock');
                this.showMockData();
            }
        } catch (error) {
            console.error('❌ Erro ao carregar dados do dashboard:', error);
            this.showMockData();
        }
    },

    /**
     * Carregar estatísticas gerais para ADMIN
     */
    async loadAdminStats() {
        try {
            console.log('🔧 Carregando estatísticas de admin (visão geral)...');
            
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const today = new Date(now.setHours(0, 0, 0, 0));
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Buscar reservas do mês
            const monthResponse = await window.adminAPI.getReservas({
                data_inicio: startOfMonth.toISOString().split('T')[0],
                data_fim: endOfMonth.toISOString().split('T')[0]
            });
            const monthReservations = monthResponse.reservas || monthResponse.data || [];

            // Buscar reservas de hoje
            const todayResponse = await window.adminAPI.getReservas({
                data_inicio: today.toISOString().split('T')[0],
                data_fim: tomorrow.toISOString().split('T')[0]
            });
            const todayReservations = todayResponse.reservas || todayResponse.data || [];

            // Buscar serviços para cálculo de receita
            const servicosResponse = await window.adminAPI.getServicos();
            const servicos = servicosResponse.servicos || servicosResponse || [];

            // Calcular estatísticas
            const monthTotal = monthReservations.length;
            const monthCompleted = monthReservations.filter(r => r.status === 'concluida').length;
            const monthCanceled = monthReservations.filter(r => r.status === 'cancelada').length;
            const todayTotal = todayReservations.length;
            const todayCompleted = todayReservations.filter(r => r.status === 'concluida').length;

            // Calcular receita do mês
            let monthRevenue = 0;
            monthReservations.filter(r => r.status === 'concluida').forEach(reserva => {
                const servico = servicos.find(s => s.id === reserva.servico_id);
                if (servico) {
                    monthRevenue += parseFloat(servico.preco || 0);
                }
            });

            // Atualizar UI
            this.updateStatsUI({
                monthTotal,
                monthCompleted,
                monthCanceled,
                monthRevenue,
                todayTotal,
                todayCompleted
            });

            // Renderizar gráfico comparativo de barbeiros
            await this.renderAdminChart();

        } catch (error) {
            console.error('❌ Erro ao carregar estatísticas de admin:', error);
            this.showMockData();
        }
    },

    /**
     * Carregar estatísticas pessoais para BARBEIRO
     */
    async loadBarbeiroStats(barbeiroId) {
        try {
            console.log('💈 Carregando estatísticas de barbeiro:', barbeiroId);
            
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const today = new Date(now.setHours(0, 0, 0, 0));
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Buscar reservas do mês do barbeiro
            const monthResponse = await window.adminAPI.getReservas({
                barbeiro_id: barbeiroId,
                data_inicio: startOfMonth.toISOString().split('T')[0],
                data_fim: endOfMonth.toISOString().split('T')[0]
            });
            const monthReservations = monthResponse.reservas || monthResponse.data || [];

            // Buscar reservas de hoje do barbeiro
            const todayResponse = await window.adminAPI.getReservas({
                barbeiro_id: barbeiroId,
                data_inicio: today.toISOString().split('T')[0],
                data_fim: tomorrow.toISOString().split('T')[0]
            });
            const todayReservations = todayResponse.reservas || todayResponse.data || [];

            // Buscar serviços para cálculo de receita
            const servicosResponse = await window.adminAPI.getServicos();
            const servicos = servicosResponse.servicos || servicosResponse || [];

            // Calcular estatísticas
            const monthTotal = monthReservations.length;
            const monthCompleted = monthReservations.filter(r => r.status === 'concluida').length;
            const monthCanceled = monthReservations.filter(r => r.status === 'cancelada').length;
            const todayTotal = todayReservations.length;
            const todayCompleted = todayReservations.filter(r => r.status === 'concluida').length;

            // Calcular receita do mês
            let monthRevenue = 0;
            monthReservations.filter(r => r.status === 'concluida').forEach(reserva => {
                const servico = servicos.find(s => s.id === reserva.servico_id);
                if (servico) {
                    monthRevenue += parseFloat(servico.preco || 0);
                }
            });

            // Atualizar UI
            this.updateStatsUI({
                monthTotal,
                monthCompleted,
                monthCanceled,
                monthRevenue,
                todayTotal,
                todayCompleted
            });

            // Renderizar gráfico pessoal (últimos 7 dias)
            await this.renderBarbeiroChart(barbeiroId);

        } catch (error) {
            console.error('❌ Erro ao carregar estatísticas de barbeiro:', error);
            this.showMockData();
        }
    },

    /**
     * Atualizar UI com estatísticas
     */
    updateStatsUI(stats) {
        // Mês
        const monthTotalEl = document.getElementById('statMonthReservations');
        if (monthTotalEl) monthTotalEl.textContent = stats.monthTotal || 0;

        const monthCompletedEl = document.getElementById('statMonthCompleted');
        if (monthCompletedEl) monthCompletedEl.textContent = stats.monthCompleted || 0;

        const monthCanceledEl = document.getElementById('statMonthCanceled');
        if (monthCanceledEl) monthCanceledEl.textContent = stats.monthCanceled || 0;

        const monthRevenueEl = document.getElementById('statMonthRevenue');
        if (monthRevenueEl) monthRevenueEl.textContent = this.formatCurrency(stats.monthRevenue || 0);

        // Hoje
        const todayTotalEl = document.getElementById('statTodayReservations');
        if (todayTotalEl) todayTotalEl.textContent = stats.todayTotal || 0;

        const todayCompletedEl = document.getElementById('statTodayCompleted');
        if (todayCompletedEl) todayCompletedEl.textContent = stats.todayCompleted || 0;

        // Taxa de conclusão
        const completionRate = stats.monthTotal > 0 
            ? Math.round((stats.monthCompleted / stats.monthTotal) * 100) 
            : 0;
        const completionRateEl = document.getElementById('statCompletionRate');
        if (completionRateEl) completionRateEl.textContent = `${completionRate}%`;

        // Receita média
        const avgRevenue = stats.monthCompleted > 0
            ? stats.monthRevenue / stats.monthCompleted
            : 0;
        const avgRevenueEl = document.getElementById('statAvgRevenue');
        if (avgRevenueEl) avgRevenueEl.textContent = this.formatCurrency(avgRevenue);
    },

    /**
     * Renderizar gráfico comparativo de barbeiros (ADMIN)
     */
    async renderAdminChart() {
        try {
            const barbeirosResponse = await window.adminAPI.getBarbeiros();
            const barbeiros = barbeirosResponse.barbeiros || barbeirosResponse || [];

            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            const yesterdayEnd = new Date(yesterday);
            yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);

            const today = new Date(now.setHours(0, 0, 0, 0));
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const chartData = [];

            for (const barbeiro of barbeiros) {
                // Ontem
                const yesterdayResponse = await window.adminAPI.getReservas({
                    barbeiro_id: barbeiro.id,
                    data_inicio: yesterday.toISOString().split('T')[0],
                    data_fim: yesterdayEnd.toISOString().split('T')[0],
                    status: 'concluida'
                });
                const yesterdayCompleted = (yesterdayResponse.reservas || yesterdayResponse.data || []).length;

                // Hoje
                const todayResponse = await window.adminAPI.getReservas({
                    barbeiro_id: barbeiro.id,
                    data_inicio: today.toISOString().split('T')[0],
                    data_fim: tomorrow.toISOString().split('T')[0]
                });
                const todayScheduled = (todayResponse.reservas || todayResponse.data || []).length;

                chartData.push({
                    name: barbeiro.nome,
                    completed: yesterdayCompleted,
                    scheduled: todayScheduled
                });
            }

            this.renderChart(chartData, 'Comparativo de Barbeiros');

        } catch (error) {
            console.error('❌ Erro ao renderizar gráfico de admin:', error);
        }
    },

    /**
     * Renderizar gráfico pessoal (BARBEIRO - últimos 7 dias)
     */
    async renderBarbeiroChart(barbeiroId) {
        try {
            const chartData = [];
            const now = new Date();

            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                const nextDay = new Date(date);
                nextDay.setDate(nextDay.getDate() + 1);

                const response = await window.adminAPI.getReservas({
                    barbeiro_id: barbeiroId,
                    data_inicio: date.toISOString().split('T')[0],
                    data_fim: nextDay.toISOString().split('T')[0]
                });
                const reservas = response.reservas || response.data || [];
                const completed = reservas.filter(r => r.status === 'concluida').length;
                const total = reservas.length;

                const dayName = date.toLocaleDateString('pt-PT', { weekday: 'short' });
                const dayMonth = date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });

                chartData.push({
                    name: `${dayName} ${dayMonth}`,
                    completed: completed,
                    scheduled: total - completed
                });
            }

            this.renderChart(chartData, 'Últimos 7 Dias');

        } catch (error) {
            console.error('❌ Erro ao renderizar gráfico de barbeiro:', error);
        }
    },

    /**
     * Renderizar gráfico genérico
     */
    renderChart(data, title = 'Estatísticas') {
        const chartContainer = document.getElementById('dashboardChart');
        if (!chartContainer) {
            console.warn('⚠️ Container de gráfico não encontrado');
            return;
        }

        if (!data || data.length === 0) {
            chartContainer.innerHTML = '<p class="text-muted">Sem dados para exibir</p>';
            return;
        }

        const maxValue = Math.max(...data.flatMap(d => [d.completed || 0, d.scheduled || 0]), 1);

        let html = `<h4 style="margin-bottom: 20px; color: #2d4a3e;">${title}</h4>`;

        data.forEach(item => {
            const completedPercent = maxValue > 0 ? (item.completed / maxValue) * 100 : 0;
            const scheduledPercent = maxValue > 0 ? (item.scheduled / maxValue) * 100 : 0;

            html += `
                <div class="chart-barber-group" style="margin-bottom: 20px;">
                    <div class="chart-label" style="font-weight: 600; margin-bottom: 8px; color: #333;">
                        ${item.name}
                    </div>
                    <div class="chart-bar-group" style="margin-bottom: 5px;">
                        <div class="chart-bar chart-bar-completed" style="width: ${Math.max(completedPercent, 5)}%; background: linear-gradient(90deg, #2d4a3e 0%, #3d5a4e 100%); height: 30px; border-radius: 6px; display: flex; align-items: center; padding: 0 10px; color: white; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <span class="chart-value">${item.completed || 0}</span>
                        </div>
                        <span class="chart-bar-label" style="font-size: 0.85rem; color: #666; margin-left: 10px;">Concluídas</span>
                    </div>
                    <div class="chart-bar-group">
                        <div class="chart-bar chart-bar-scheduled" style="width: ${Math.max(scheduledPercent, 5)}%; background: linear-gradient(90deg, #6c757d 0%, #7d8a96 100%); height: 30px; border-radius: 6px; display: flex; align-items: center; padding: 0 10px; color: white; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <span class="chart-value">${item.scheduled || 0}</span>
                        </div>
                        <span class="chart-bar-label" style="font-size: 0.85rem; color: #666; margin-left: 10px;">Agendadas</span>
                    </div>
                </div>
            `;
        });

        chartContainer.innerHTML = html;
    },

    /**
     * Dados mock para desenvolvimento
     */
    showMockData() {
        console.log('📊 Exibindo dados mock');
        
        this.updateStatsUI({
            monthTotal: 45,
            monthCompleted: 38,
            monthCanceled: 5,
            monthRevenue: 570,
            todayTotal: 8,
            todayCompleted: 3
        });

        this.renderChart([
            { name: 'Barbeiro 1', completed: 5, scheduled: 3 },
            { name: 'Barbeiro 2', completed: 4, scheduled: 2 }
        ], 'Dados Mock');
    },

    /**
     * Formatar moeda
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);
    }
};

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        DashboardManager.init();
    });
} else {
    DashboardManager.init();
}

console.log('✅ Dashboard Manager loaded (v2.0 - Admin + Barbeiro)');
