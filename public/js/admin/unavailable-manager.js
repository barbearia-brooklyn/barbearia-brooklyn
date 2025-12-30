/**
 * Unavailable Manager
 * Gerencia horários indisponíveis
 */

const UnavailableManager = {
    unavailableTimes: [],
    barbers: [],

    init() {
        console.log('Inicializando UnavailableManager...');
        this.setupEventListeners();
        this.loadBarbers();
        this.loadUnavailable();
    },

    setupEventListeners() {
        const form = document.getElementById('unavailableForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    },

    async loadBarbers() {
        try {
            const response = await window.adminAPI.getBarbeiros();
            this.barbers = response.barbeiros || response || [];
            this.populateBarberSelect();
            console.log(`✅ ${this.barbers.length} barbeiros carregados`);
        } catch (error) {
            console.error('Erro ao carregar barbeiros:', error);
            this.barbers = [];
        }
    },

    populateBarberSelect() {
        const select = document.getElementById('unavailableBarber');
        if (!select) return;

        select.innerHTML = '<option value="">Selecione um barbeiro</option>';
        this.barbers.forEach(barber => {
            const option = document.createElement('option');
            option.value = barber.id;
            option.textContent = barber.nome;
            select.appendChild(option);
        });
    },

    async loadUnavailable() {
        try {
            const response = await window.adminAPI.getHorariosIndisponiveis();
            const data = response.horarios || response.data || response || [];
            
            // Converter formato da API para formato interno
            this.unavailableTimes = data.map(item => {
                const dataInicio = new Date(item.data_inicio);
                const dataFim = new Date(item.data_fim);
                
                return {
                    id: item.id,
                    barberId: item.barbeiro_id,
                    barberName: item.barbeiro_nome || this.getBarberName(item.barbeiro_id),
                    date: dataInicio,
                    startTime: dataInicio.toLocaleTimeString('pt-PT', {hour: '2-digit', minute: '2-digit'}),
                    endTime: dataFim.toLocaleTimeString('pt-PT', {hour: '2-digit', minute: '2-digit'}),
                    reason: item.motivo || ''
                };
            });
            
            console.log(`✅ ${this.unavailableTimes.length} indisponibilidades carregadas`);
            this.renderUnavailableList();
        } catch (error) {
            console.error('Erro ao carregar indisponibilidades:', error);
            this.unavailableTimes = [];
            this.renderUnavailableList();
        }
    },

    getBarberName(barberId) {
        const barber = this.barbers.find(b => b.id == barberId);
        return barber ? barber.nome : 'N/A';
    },

    async handleSubmit(e) {
        e.preventDefault();

        const barberId = document.getElementById('unavailableBarber').value;
        const date = document.getElementById('unavailableDate').value;
        const startTime = document.getElementById('unavailableStartTime').value;
        const endTime = document.getElementById('unavailableEndTime').value;
        const reason = document.getElementById('unavailableReason').value || '';

        if (!barberId || !date || !startTime || !endTime) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        // Validate times
        if (startTime >= endTime) {
            alert('A hora de início deve ser anterior à hora de fim');
            return;
        }

        try {
            const data = {
                barbeiro_id: parseInt(barberId),
                data_inicio: `${date}T${startTime}:00`,
                data_fim: `${date}T${endTime}:00`,
                motivo: reason
            };

            await window.adminAPI.createHorarioIndisponivel(data);
            alert('Indisponibilidade registada com sucesso!');
            e.target.reset();
            await this.loadUnavailable();
        } catch (error) {
            console.error('Erro ao criar indisponibilidade:', error);
            alert('Erro ao registar indisponibilidade: ' + error.message);
        }
    },

    renderUnavailableList() {
        const container = document.getElementById('unavailableList');
        if (!container) {
            // Se não existe o container da lista, pode ser que estamos na página com container diferente
            const altContainer = document.getElementById('unavailableContainer');
            if (altContainer) {
                this.renderInContainer(altContainer);
            }
            return;
        }

        if (this.unavailableTimes.length === 0) {
            container.innerHTML = `
                <div class="unavailable-empty">
                    <div class="unavailable-empty-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <p>Nenhuma indisponibilidade registada</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        // Sort by date and time
        const sorted = [...this.unavailableTimes].sort((a, b) => {
            const dateCompare = a.date - b.date;
            if (dateCompare !== 0) return dateCompare;
            return a.startTime.localeCompare(b.startTime);
        });

        sorted.forEach(unavail => {
            const dateStr = this.formatDate(unavail.date);
            const item = document.createElement('div');
            item.className = 'unavailable-item';
            item.innerHTML = `
                <div class="unavailable-item-info">
                    <div class="unavailable-item-date">
                        ${dateStr} | ${unavail.startTime} - ${unavail.endTime}
                    </div>
                    <div class="unavailable-item-time">
                        ${unavail.barberName}
                    </div>
                    ${unavail.reason ? `<div class="unavailable-item-reason">${unavail.reason}</div>` : ''}
                </div>
                <span style="color: var(--color-text-secondary); font-size: var(--font-size-sm);">
                    ${this.calculateDuration(unavail.startTime, unavail.endTime)} min
                </span>
                <div class="unavailable-item-actions">
                    <button class="unavailable-action-btn danger" onclick="UnavailableManager.deleteUnavailable(${unavail.id})">
                        <i class="fas fa-trash"></i> Remover
                    </button>
                </div>
            `;
            container.appendChild(item);
        });
    },

    renderInContainer(container) {
        if (this.unavailableTimes.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; background: white; border-radius: 12px;">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: #0f7e44; margin-bottom: 15px;"></i>
                    <h3 style="color: #666; margin-bottom: 8px;">Sem indisponibilidades</h3>
                    <p style="color: #999;">Nenhuma indisponibilidade registada.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="unavailable-list">';
        
        // Sort by date and time
        const sorted = [...this.unavailableTimes].sort((a, b) => {
            const dateCompare = a.date - b.date;
            if (dateCompare !== 0) return dateCompare;
            return a.startTime.localeCompare(b.startTime);
        });

        sorted.forEach(unavail => {
            const dateStr = this.formatDate(unavail.date);
            html += `
                <div class="unavailable-item" style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600; color: #333; margin-bottom: 5px;">
                            ${dateStr} | ${unavail.startTime} - ${unavail.endTime}
                        </div>
                        <div style="color: #666; font-size: 0.9rem;">
                            ${unavail.barberName}
                        </div>
                        ${unavail.reason ? `<div style="color: #999; font-size: 0.85rem; margin-top: 5px;">${unavail.reason}</div>` : ''}
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span style="color: #999; font-size: 0.9rem;">
                            ${this.calculateDuration(unavail.startTime, unavail.endTime)} min
                        </span>
                        <button class="btn btn-danger" onclick="UnavailableManager.deleteUnavailable(${unavail.id})" style="padding: 8px 15px;">
                            <i class="fas fa-trash"></i> Remover
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    },

    calculateDuration(startTime, endTime) {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const start = startH * 60 + startM;
        const end = endH * 60 + endM;
        return Math.max(0, end - start);
    },

    formatDate(date) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('pt-PT', options);
    },

    async deleteUnavailable(id) {
        if (!confirm('Tem a certeza que deseja remover esta indisponibilidade?')) {
            return;
        }

        try {
            await window.adminAPI.deleteHorarioIndisponivel(id);
            alert('Indisponibilidade removida com sucesso!');
            await this.loadUnavailable();
        } catch (error) {
            console.error('Erro ao remover indisponibilidade:', error);
            alert('Erro ao remover indisponibilidade: ' + error.message);
        }
    }
};

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        UnavailableManager.init();
    });
} else {
    UnavailableManager.init();
}

console.log('✅ Unavailable Manager loaded');