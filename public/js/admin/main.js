/**
 * Dashboard Initialization
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando dashboard...');

    // Check authentication
    AuthManager.checkAuth();

    // Initialize modules
    UIHelper;
    ProfileManager.init();
    DashboardManager.init();
    CalendarManager.init();
    ReservationManager.init();
    ModalManager.init();
    UnavailableManager.init();

    // Setup profile selector
    setupProfileSelector();

    // Setup header navigation
    setupHeaderNavigation();

    // Setup responsive nav
    setupResponsiveNav();

    // Show dashboard by default
    showDashboard();

    console.log('Dashboard inicializado com sucesso');
});

/**
 * Profile Selector Setup
 */
function setupProfileSelector() {
    const profileToggle = document.getElementById('profileToggle');
    const profileMenu = document.getElementById('profileMenu');
    const profilesList = document.getElementById('profilesList');

    if (!profileToggle || !profileMenu) return;

    // Toggle menu
    profileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle('active');
        loadProfilesList();
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!profileToggle.contains(e.target) && !profileMenu.contains(e.target)) {
            profileMenu.classList.remove('active');
        }
    });

    // Edit profiles link
    document.getElementById('editProfilesLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        profileMenu.classList.remove('active');
        document.querySelector('[data-view="profiles"]')?.click();
    });
}

/**
 * Load Profiles List
 */
function loadProfilesList() {
    const profilesList = document.getElementById('profilesList');
    if (!profilesList) return;

    profilesList.innerHTML = '';
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
            DashboardManager.loadDashboardData();
        });

        profilesList.appendChild(item);
    });
}

/**
 * Header Navigation Setup
 */
function setupHeaderNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;

            // Remove active class from all nav items
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Close more menu if open
            document.querySelector('.nav-more-menu')?.classList.remove('active');

            // Handle view switch
            switch(view) {
                case 'dashboard':
                    showDashboard();
                    break;
                case 'calendar':
                    showCalendarView();
                    break;
                case 'list':
                    ReservationManager.showListView();
                    break;
                case 'new-booking':
                    ReservationManager.showNewBookingView();
                    break;
                case 'unavailable':
                    UnavailableManager.showUnavailableView();
                    break;
            }
        });
    });
}

/**
 * Show Dashboard
 */
function showDashboard() {
    UIHelper.showView('dashboardView');
    document.querySelector('[data-view="dashboard"]').classList.add('active');
}

/**
 * Show Calendar View
 */
function showCalendarView() {
    const selectedBarber = ProfileManager.getSelectedBarber();
    
    if (!selectedBarber && ProfileManager.getBarbeiros().length > 0) {
        // Auto-select first barber if none selected
        const firstBarber = ProfileManager.getBarbeiros()[0];
        ProfileManager.selectBarber(firstBarber.id);
        document.getElementById('currentBarberName').textContent = firstBarber.nome;
    }

    UIHelper.showView('calendarView');
    CalendarManager.loadCalendar(selectedBarber);
}

/**
 * Responsive Navigation Setup
 */
function setupResponsiveNav() {
    const navMoreBtn = document.querySelector('.nav-more-btn');
    const navMoreMenu = document.querySelector('.nav-more-menu');
    const headerNav = document.querySelector('.header-nav');

    if (!navMoreBtn || !navMoreMenu || !headerNav) return;

    // Toggle more menu
    navMoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navMoreMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navMoreBtn.contains(e.target) && !navMoreMenu.contains(e.target)) {
            navMoreMenu.classList.remove('active');
        }
    });

    // Handle responsive hiding/showing of nav items
    updateResponsiveNav();
    window.addEventListener('resize', updateResponsiveNav);
}

/**
 * Update Responsive Nav Items
 */
function updateResponsiveNav() {
    const headerNav = document.querySelector('.header-nav');
    const navMoreBtn = document.querySelector('.nav-more-btn');
    const navMoreMenu = document.querySelector('.nav-more-menu');
    const navItems = document.querySelectorAll('.header-nav > .nav-item:not(.nav-more-container)');

    if (!headerNav || !navMoreBtn || !navMoreMenu) return;

    const headerWidth = headerNav.offsetWidth;
    let usedWidth = navMoreBtn.offsetWidth + 10; // More button width + gap
    const itemWidth = 120; // Approximate width per nav item
    const maxItems = Math.floor((headerWidth - usedWidth) / itemWidth);

    // Show/hide nav items based on available space
    navItems.forEach((item, index) => {
        if (index < Math.max(maxItems, 2)) { // Always show at least 2 items
            item.style.display = '';
        } else {
            item.style.display = 'none';
            // Add to more menu
            const menuItem = document.createElement('a');
            menuItem.href = '#';
            menuItem.className = 'nav-item';
            menuItem.dataset.view = item.dataset.view;
            menuItem.innerHTML = item.innerHTML;
            
            // Check if already in menu
            const existing = navMoreMenu.querySelector(`[data-view="${item.dataset.view}"]`);
            if (!existing) {
                navMoreMenu.appendChild(menuItem);
                menuItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    item.click();
                    navMoreMenu.classList.remove('active');
                });
            }
        }
    });
}

/**
 * Logout Handler
 */
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    AuthManager.logout();
});
