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
            
            // Usar o mesmo dia até 23:59:59
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);

            console.log('📅 Datas de hoje:');
            console.log('  Início:', today.toISOString());
            console.log('  Fim:', endOfDay.toISOString());

            // Buscar reservas do mês
            const monthResponse = await window.adminAPI.getReservas({
                data_inicio: startOfMonth.toISOString().split('T')[0],
                data_fim: endOfMonth.toISOString().split('T')[0]
            });
            const monthReservations = monthResponse.reservas || monthResponse.data || [];

            // Buscar APENAS reservas de HOJE
            const todayResponse = await window.adminAPI.getReservas({
                data_inicio: today.toISOString().split('T')[0],
                data_fim: today.toISOString().split('T')[0]
            });
            const todayReservations = todayResponse.reservas || todayResponse.data || [];

            console.log('📅 Reservas de hoje (TOTAL):', todayReservations.length);

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
            
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);

            // Buscar reservas do mês do barbeiro
            const monthResponse = await window.adminAPI.getReservas({
                barbeiro_id: barbeiroId,
                data_inicio: startOfMonth.toISOString().split('T')[0],
                data_fim: endOfMonth.toISOString().split('T')[0]
            });
            const monthReservations = monthResponse.reservas || monthResponse.data || [];

            // Buscar APENAS reservas de HOJE
            const todayResponse = await window.adminAPI.getReservas({
                barbeiro_id: barbeiroId,
                data_inicio: today.toISOString().split('T')[0],
                data_fim: today.toISOString().split('T')[0]
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

            console.log('\n=== 🔍 DEBUG: CÁLCULO POR BARBEIRO ===');

            const chartData = [];

            // ✅ NOVO: Processar TODOS os barbeiros (mesmo sem reservas)
            barbeiros.forEach(barbeiro => {
                const barbeiroReservas = todayReservations.filter(r => r.barbeiro_id === barbeiro.id);
                
                console.log(`\n👨‍⚖️ Barbeiro: ${barbeiro.nome} (ID: ${barbeiro.id})`);
                console.log(`  📄 Total reservas hoje (BRUTAS): ${barbeiroReservas.length}`);
                
                if (barbeiroReservas.length > 0) {
                    console.log('  Reservas:', barbeiroReservas.map(r => `${r.id} - ${r.status}`).join(', '));
                }
                
                // Contadores individuais
                const confirmadas = barbeiroReservas.filter(r => r.status === 'confirmada');
                const concluidas = barbeiroReservas.filter(r => r.status === 'concluida');
                const canceladas = barbeiroReservas.filter(r => r.status === 'cancelada');
                const faltas = barbeiroReservas.filter(r => r.status === 'faltou');
                const pendentes = barbeiroReservas.filter(r => r.status === 'pendente');
                
                console.log(`  🔵 Confirmadas: ${confirmadas.length}`);
                console.log(`  ✅ Concluídas: ${concluidas.length}`);
                console.log(`  ❌ Canceladas: ${canceladas.length}`);
                console.log(`  ⚠️ Faltas: ${faltas.length}`);
                console.log(`  🔶 Pendentes: ${pendentes.length}`);
                
                // Excluir canceladas do total
                const total = barbeiroReservas.filter(r => r.status !== 'cancelada').length;
                
                console.log(`  📊 TOTAL (sem canceladas): ${total}`);
                console.log(`  ✅ Vai aparecer no dashboard? SIM (SEMPRE)`);

                // ✅ NOVO: Adicionar TODOS os barbeiros (mesmo com total = 0)
                // Pegar só primeiro nome
                const firstName = barbeiro.nome.split(' ')[0];
                
                chartData.push({
                    name: firstName,
                    fullName: barbeiro.nome,
                    total: total,
                    concluidas: concluidas.length,
                    canceladas: canceladas.length,
                    faltas: faltas.length,
                    pendentes: pendentes.length,
                    confirmadas: confirmadas.length
                });
            });

            console.log('\n=== 📋 DADOS FINAIS PARA GRÁFICO ===');
            console.log(chartData);
            console.log('===================================\n');

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
            // Excluir canceladas do total
            const total = todayReservations.filter(r => r.status !== 'cancelada').length;
            const concluidas = todayReservations.filter(r => r.status === 'concluida').length;
            const canceladas = todayReservations.filter(r => r.status === 'cancelada').length;
            const faltas = todayReservations.filter(r => r.status === 'faltou').length;
            const pendentes = todayReservations.filter(r => r.status === 'pendente').length;
            const confirmadas = todayReservations.filter(r => r.status === 'confirmada').length;

            const chartData = [{
                name: this.currentUser.nome?.split(' ')[0] || 'Você',
                fullName: this.currentUser.nome || 'Você',
                total,
                concluidas,
                canceladas,
                faltas,
                pendentes,
                confirmadas
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
            chartContainer.innerHTML = '<p class="text-muted" style="text-align: center; padding: 40px; color: #999;">Sem barbeiros disponíveis</p>';
            return;
        }

        // ✅ NOVO: Grid com colunas iguais e responsivo
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; width: 100%;">';

        data.forEach(item => {
            html += `
                <div class="stats-barbeiro-card" style="
                    padding: 20px; 
                    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); 
                    border-radius: 12px; 
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
                    border: 2px solid #e9ecef;
                    min-height: 200px;
                    display: flex;
                    flex-direction: column;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h5 style="margin: 0; color: #2d4a3e; font-size: 1.2rem; font-weight: 700;" title="${item.fullName}">${item.name}</h5>
                        <span style="background: linear-gradient(135deg, #2d4a3e 0%, #3d5a4e 100%); color: white; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.9rem;">Total: ${item.total}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; flex-grow: 1;">
                        <div class="stat-badge" style="background: linear-gradient(135deg, #28a745 0%, #34c759 100%); color: white; padding: 12px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);">
                            <div style="font-size: 1.6rem; font-weight: 700; margin-bottom: 4px;">${item.concluidas}</div>
                            <div style="font-size: 0.75rem; opacity: 0.95;">✅ Concluídas</div>
                        </div>
                        <div class="stat-badge" style="background: linear-gradient(135deg, #007bff 0%, #0d6efd 100%); color: white; padding: 12px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);">
                            <div style="font-size: 1.6rem; font-weight: 700; margin-bottom: 4px;">${item.confirmadas}</div>
                            <div style="font-size: 0.75rem; opacity: 0.95;">🔵 Confirmadas</div>
                        </div>
                        <div class="stat-badge" style="background: linear-gradient(135deg, #dc3545 0%, #e74c5c 100%); color: white; padding: 12px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);">
                            <div style="font-size: 1.6rem; font-weight: 700; margin-bottom: 4px;">${item.canceladas}</div>
                            <div style="font-size: 0.75rem; opacity: 0.95;">❌ Canceladas</div>
                        </div>
                        <div class="stat-badge" style="background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%); color: #000; padding: 12px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(255, 193, 7, 0.3);">
                            <div style="font-size: 1.6rem; font-weight: 700; margin-bottom: 4px;">${item.faltas}</div>
                            <div style="font-size: 0.75rem; opacity: 0.85;">⚠️ Faltas</div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
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
            { name: 'João', fullName: 'João Silva', total: 5, concluidas: 3, canceladas: 1, faltas: 0, confirmadas: 1, pendentes: 0 },
            { name: 'Maria', fullName: 'Maria Santos', total: 4, concluidas: 2, canceladas: 0, faltas: 1, confirmadas: 1, pendentes: 0 },
            { name: 'Pedro', fullName: 'Pedro Costa', total: 0, concluidas: 0, canceladas: 0, faltas: 0, confirmadas: 0, pendentes: 0 }
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

console.log('✅ Dashboard Manager loaded (v5.0 - TODOS barbeiros + largura igual + primeiro nome)');
