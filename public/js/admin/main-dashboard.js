/**
 * Dashboard Page Initialization
 * Loads header and initializes dashboard components
 */

// Load header first
loadHeaderComponent();

function loadHeaderComponent() {
    fetch('/admin/header.html')
        .then(response => response.text())
        .then(html => {
            const container = document.getElementById('headerContainer');
            if (container) {
                container.innerHTML = html;
                setupHeaderEventListeners();
            }
        })
        .catch(error => console.error('Erro ao carregar header:', error));
}

function setupHeaderEventListeners() {
    // Check auth first
    if (typeof AuthManager !== 'undefined') {
        AuthManager.checkAuth();
    }

    // Profile selector
    const profileToggle = document.getElementById('profileToggle');
    const profileMenu = document.getElementById('profileMenu');

    if (profileToggle && profileMenu) {
        profileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('active');
            loadProfilesList();
        });

        document.addEventListener('click', (e) => {
            if (!profileToggle.contains(e.target) && !profileMenu.contains(e.target)) {
                profileMenu.classList.remove('active');
            }
        });
    }

    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (typeof AuthManager !== 'undefined') {
            AuthManager.logout();
        }
    });

    // Quick actions
    document.getElementById('quickNewBooking')?.addEventListener('click', () => {
        window.location.href = '/admin/new-booking';
    });

    document.getElementById('quickUnavailable')?.addEventListener('click', () => {
        window.location.href = '/admin/unavailable';
    });

    document.getElementById('quickClosure')?.addEventListener('click', () => {
        ModalManager.openModal('closureModal');
    });

    // Initialize other modules when DOM is ready
    initializeDashboard();
}

function loadProfilesList() {
    const profilesList = document.getElementById('profilesList');
    if (!profilesList) return;

    profilesList.innerHTML = '';
    
    if (typeof ProfileManager === 'undefined') {
        console.error('ProfileManager not loaded yet');
        return;
    }

    const barbeiros = ProfileManager.getBarbeiros();
    const selectedBarber = ProfileManager.getSelectedBarber();

    if (barbeiros.length === 0) {
        profilesList.innerHTML = '<div class="profile-menu-item" disabled>Nenhum barbeiro disponível</div>';
        return;
    }

    barbeiros.forEach(barber => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'profile-menu-item';
        if (selectedBarber === barber.id) {
            item.classList.add('active');
        }

        item.innerHTML = `
            <i class="fas fa-check" style="opacity: ${selectedBarber === barber.id ? 1 : 0}"></i>
            <span>${barber.nome}</span>
        `;

        item.addEventListener('click', (e) => {
            e.preventDefault();
            ProfileManager.selectBarber(barber.id);
            document.getElementById('currentBarberName').textContent = barber.nome;
            document.getElementById('profileMenu').classList.remove('active');
            
            if (typeof DashboardManager !== 'undefined') {
                DashboardManager.loadDashboardData();
            }
        });

        profilesList.appendChild(item);
    });
}

function initializeDashboard() {
    // Initialize modules
    if (typeof UIHelper !== 'undefined') {
        console.log('UIHelper loaded');
    }
    
    if (typeof ModalManager !== 'undefined') {
        ModalManager.init();
        console.log('ModalManager initialized');
    }
    
    if (typeof ProfileManager !== 'undefined') {
        ProfileManager.init();
        console.log('ProfileManager initialized');
    }

    if (typeof DashboardManager !== 'undefined') {
        DashboardManager.init();
        console.log('DashboardManager initialized');
    }

    // Load initial data
    if (typeof ProfileManager !== 'undefined') {
        const barbeiros = ProfileManager.getBarbeiros();
        if (barbeiros.length > 0 && !ProfileManager.getSelectedBarber()) {
            const firstBarber = barbeiros[0];
            ProfileManager.selectBarber(firstBarber.id);
            document.getElementById('currentBarberName').textContent = firstBarber.nome;
        }
    }

    // Load dashboard data
    if (typeof DashboardManager !== 'undefined') {
        DashboardManager.loadDashboardData();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard page loaded');
});
