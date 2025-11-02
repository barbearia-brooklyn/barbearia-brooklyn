/**
 * Gestão de perfis de barbeiros
 */

class ProfileManager {
    static BARBERS_API = '/api/barbeiros';
    static allBarbeiros = [];
    static selectedBarberId = null;

    static init() {
        this.loadProfiles();
        this.setupEventListeners();
    }

    static setupEventListeners() {
        document.querySelectorAll('.nav-item-profiles').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showProfilesView();
            });
        });
    }

    static async loadProfiles() {
        try {
            UIHelper.showLoading(true);

            const response = await fetch(this.BARBERS_API, {
                headers: {
                    'Authorization': `Bearer ${AuthManager.getToken()}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar barbeiros');

            this.allBarbeiros = await response.json();
            this.renderProfiles();
        } catch (error) {
            console.error('Erro:', error);
            UIHelper.showAlert('Erro ao carregar perfis', 'error');
        } finally {
            UIHelper.showLoading(false);
        }
    }

    static renderProfiles() {
        const grid = document.getElementById('profilesGrid');
        grid.innerHTML = '';

        // Card "Todos os Barbeiros"
        const allCard = document.createElement('div');
        allCard.className = 'profile-card all-barbers';
        allCard.innerHTML = `
            <div class="profile-photo">👥</div>
            <h3>Todos os Barbeiros</h3>
            <p>Ver calendário geral</p>
            <span class="badge">${this.allBarbeiros.length} barbeiros</span>
        `;
        allCard.addEventListener('click', () => this.selectProfile(null));
        grid.appendChild(allCard);

        // Cards dos barbeiros
        this.allBarbeiros.forEach(barbeiro => {
            const card = document.createElement('div');
            card.className = 'profile-card';

            const photoHTML = barbeiro.avatar
                ? `<img src="${barbeiro.avatar}" alt="${barbeiro.nome}">`
                : `<span>${barbeiro.nome.charAt(0).toUpperCase()}</span>`;

            card.innerHTML = `
                <div class="profile-photo">${photoHTML}</div>
                <h3>${barbeiro.nome}</h3>
                <p>${barbeiro.especialidade || 'Barbeiro'}</p>
            `;

            card.addEventListener('click', () => this.selectProfile(barbeiro.id));
            grid.appendChild(card);
        });
    }

    static selectProfile(barberId) {
        this.selectedBarberId = barberId;

        if (barberId === null) {
            UIHelper.updateHeaderTitle('Todos os Barbeiros', 'Calendário geral');
        } else {
            const barbeiro = this.allBarbeiros.find(b => b.id === barberId);
            UIHelper.updateHeaderTitle(barbeiro.nome, 'Calendário pessoal');
        }

        UIHelper.showView('calendarView');
        CalendarManager.loadCalendar(barberId);
    }

    static showProfilesView() {
        UIHelper.updateHeaderTitle('Selecionar Perfil', 'Escolha um barbeiro');
        UIHelper.showView('profilesView');
    }

    static getSelectedBarber() {
        return this.selectedBarberId;
    }

    static getBarbeiros() {
        return this.allBarbeiros;
    }
}
