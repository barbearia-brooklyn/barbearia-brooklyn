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
            const todayTotal = todayReservations.filter(r => r.status !== 'cancelada').length;
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

            // Renderizar estatísticas do dia por barbeiro
            await this.renderTodayStatsByBarber(todayReservations);

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
            const todayTotal = todayReservations.filter(r => r.status !== 'cancelada').length;
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

            // Renderizar estatísticas pessoais do dia
            await this.renderBarbeiroTodayStats(todayReservations);

        } catch (error) {
            console.error('❌ Erro ao carregar estatísticas de barbeiro:', error);
            this.showMockData();
        }
    },

    /**
     * Renderizar estatísticas do dia por barbeiro (ADMIN)
     */
    async renderTodayStatsByBarber(todayReservations) {
        try {
            const barbeirosResponse = await window.adminAPI.getBarbeiros();
            const barbeiros = barbeirosResponse.barbeiros || barbeirosResponse || [];

            const chartData = [];

            barbeiros.forEach(barbeiro => {
                const barbeiroReservas = todayReservations.filter(r => r.barbeiro_id === barbeiro.id);
                
                // 🐛 FIX: Excluir canceladas do total
                const total = barbeiroReservas.filter(r => r.status !== 'cancelada').length;
                const concluidas = barbeiroReservas.filter(r => r.status === 'concluida').length;
                const canceladas = barbeiroReservas.filter(r => r.status === 'cancelada').length;
                const faltas = barbeiroReservas.filter(r => r.status === 'faltou').length;

                // 🐛 FIX: Só adicionar barbeiros com reservas hoje
                if (total > 0 || canceladas > 0 || faltas > 0) {
                    chartData.push({
                        name: barbeiro.nome,
                        total,
                        concluidas,
                        canceladas,
                        faltas
                    });
                }
            });

            this.renderTodayStatsChart(chartData);

        } catch (error) {
            console.error('❌ Erro ao renderizar estatísticas de hoje:', error);
        }
    },

    /**
     * Renderizar estatísticas pessoais do dia (BARBEIRO)
     */
    async renderBarbeiroTodayStats(todayReservations) {
        try {
            // 🐛 FIX: Excluir canceladas do total
            const total = todayReservations.filter(r => r.status !== 'cancelada').length;
            const concluidas = todayReservations.filter(r => r.status === 'concluida').length;
            const canceladas = todayReservations.filter(r => r.status === 'cancelada').length;
            const faltas = todayReservations.filter(r => r.status === 'faltou').length;

            const chartData = [{
                name: this.currentUser.nome || 'Você',
                total,
                concluidas,
                canceladas,
                faltas
            }];

            this.renderTodayStatsChart(chartData);

        } catch (error) {
            console.error('❌ Erro ao renderizar estatísticas pessoais:', error);
        }
    },

    /**
     * Renderizar gráfico de estatísticas do dia
     */
    renderTodayStatsChart(data) {
        const chartContainer = document.getElementById('dashboardChart');
        if (!chartContainer) {
            console.warn('⚠️ Container de gráfico não encontrado');
            return;
        }

        if (!data || data.length === 0) {
            chartContainer.innerHTML = '<p class="text-muted" style="text-align: center; padding: 40px; color: #999;">Sem reservas para hoje</p>';
            return;
        }

        // 🐛 FIX: Sem título redundante
        let html = '';

        data.forEach(item => {
            html += `
                <div class="stats-barbeiro-card" style="margin-bottom: 25px; padding: 20px; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 2px solid #e9ecef;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h5 style="margin: 0; color: #2d4a3e; font-size: 1.2rem; font-weight: 700;">${item.name}</h5>
                        <span style="background: linear-gradient(135deg, #2d4a3e 0%, #3d5a4e 100%); color: white; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.9rem;">Total: ${item.total}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
                        <div class="stat-badge" style="background: linear-gradient(135deg, #28a745 0%, #34c759 100%); color: white; padding: 12px 16px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);">
                            <div style="font-size: 1.8rem; font-weight: 700; margin-bottom: 4px;">${item.concluidas}</div>
                            <div style="font-size: 0.85rem; opacity: 0.95;">✅ Concluídas</div>
                        </div>
                        <div class="stat-badge" style="background: linear-gradient(135deg, #dc3545 0%, #e74c5c 100%); color: white; padding: 12px 16px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);">
                            <div style="font-size: 1.8rem; font-weight: 700; margin-bottom: 4px;">${item.canceladas}</div>
                            <div style="font-size: 0.85rem; opacity: 0.95;">❌ Canceladas</div>
                        </div>
                        <div class="stat-badge" style="background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%); color: #000; padding: 12px 16px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(255, 193, 7, 0.3);">
                            <div style="font-size: 1.8rem; font-weight: 700; margin-bottom: 4px;">${item.faltas}</div>
                            <div style="font-size: 0.85rem; opacity: 0.85;">⚠️ Faltas</div>
                        </div>
                    </div>
                </div>
            `;
        });

        chartContainer.innerHTML = html;
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

        this.renderTodayStatsChart([
            { name: 'Barbeiro 1', total: 5, concluidas: 3, canceladas: 1, faltas: 0 },
            { name: 'Barbeiro 2', total: 4, concluidas: 2, canceladas: 0, faltas: 1 }
        ]);
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

console.log('✅ Dashboard Manager loaded (v3.1 - Fix: Total correto, sem título)');
