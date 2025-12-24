/**
 * Unavailable Manager
 * Gerencia horários indisponíveis
 */

const UnavailableManager = {
    unavailableTimes: [],
    barbers: [],
    apiBase: '/api/admin',

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
            if (typeof ProfileManager !== 'undefined') {
                this.barbers = ProfileManager.getBarbeiros();
            } else {
                this.barbers = [
                    { id: 1, nome: 'Barbeiro 1' },
                    { id: 2, nome: 'Barbeiro 2' },
                    { id: 3, nome: 'Barbeiro 3' }
                ];
            }
            this.populateBarberSelect();
        } catch (error) {
            console.error('Erro ao carregar barbeiros:', error);
        }
    },

    populateBarberSelect() {
        const select = document.getElementById('unavailableBarber');
        if (!select) return;

        this.barbers.forEach(barber => {
            const option = document.createElement('option');
            option.value = barber.id;
            option.textContent = barber.nome;
            select.appendChild(option);
        });
    },

    async loadUnavailable() {
        try {
            // Mock data
            this.unavailableTimes = [
                {
                    id: 1,
                    barberId: 1,
                    barberName: 'Barbeiro 1',
                    date: new Date(2025, 11, 24),
                    startTime: '12:00',
                    endTime: '13:00',
                    reason: 'Almoço'
                },
                {
                    id: 2,
                    barberId: 2,
                    barberName: 'Barbeiro 2',
                    date: new Date(2025, 11, 24),
                    startTime: '17:00',
                    endTime: '18:00',
                    reason: 'Reunião'
                },
                {
                    id: 3,
                    barberId: 3,
                    barberName: 'Barbeiro 3',
                    date: new Date(2025, 11, 25),
                    startTime: '11:00',
                    endTime: '12:00',
                    reason: 'Cumprimentação'
                }
            ];
            this.renderUnavailableList();
        } catch (error) {
            console.error('Erro ao carregar indisponibilidades:', error);
        }
    },

    async handleSubmit(e) {
        e.preventDefault();

        const barberId = document.getElementById('unavailableBarber').value;
        const date = document.getElementById('unavailableDate').value;
        const startTime = document.getElementById('unavailableStartTime').value;
        const endTime = document.getElementById('unavailableEndTime').value;
        const reason = document.getElementById('unavailableReason').value || 'Sem motivo';

        if (!barberId || !date || !startTime || !endTime) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        // Validate times
        if (startTime >= endTime) {
            alert('A hora de início deve ser anterior à hora de fim');
            return;
        }

        const barber = this.barbers.find(b => b.id == barberId);

        // Create new unavailable time
        const newUnavailable = {
            id: Date.now(),
            barberId: parseInt(barberId),
            barberName: barber.nome,
            date: new Date(date),
            startTime: startTime,
            endTime: endTime,
            reason: reason
        };

        this.unavailableTimes.push(newUnavailable);
        this.renderUnavailableList();

        // Reset form
        e.target.reset();
        alert('Indisponibilidade registada com sucesso!');
    },

    renderUnavailableList() {
        const container = document.getElementById('unavailableList');
        if (!container) return;

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

    deleteUnavailable(id) {
        if (confirm('Tem a certeza que deseja remover esta indisponibilidade?')) {
            this.unavailableTimes = this.unavailableTimes.filter(u => u.id !== id);
            this.renderUnavailableList();
        }
    }
};
