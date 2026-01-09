/**
 * Sistema de Notificações em Tempo Real
 * Usa Polling (mais confiável para Cloudflare Pages)
 */

console.log('📦 notifications.js: File loaded');

class NotificationManager {
    constructor() {
        console.log('🔔 NotificationManager: Constructor called');
        this.unreadCount = 0;
        this.notifications = [];
        // 💰 Som local da pasta sounds
        this.audio = new Audio('/sounds/notification.mp3');
        this.isDropdownOpen = false;
        this.pollingInterval = null;
        this.lastNotificationId = 0;
        this.initialized = false;
    }

    async init() {
        console.log('🔔 NotificationManager.init(): Starting...');
        
        if (this.initialized) {
            console.log('⚠️ Already initialized, skipping');
            return;
        }
        
        // Aguardar o header estar carregado
        await this.waitForHeader();
        
        // Criar elementos UI
        this.createBellIcon();
        this.createDropdown();
        this.createToastContainer();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Carregar notificações existentes
        await this.loadNotifications();
        
        // Iniciar polling a cada 5 segundos
        this.startPolling();
        
        this.initialized = true;
        console.log('✅ NotificationManager: Init complete');
    }

    async waitForHeader() {
        console.log('⏳ Waiting for header container...');
        return new Promise((resolve) => {
            const checkHeader = () => {
                const container = document.getElementById('notificationBellContainer');
                if (container) {
                    console.log('✅ Header container found!');
                    resolve();
                } else {
                    setTimeout(checkHeader, 100);
                }
            };
            checkHeader();
        });
    }

    createBellIcon() {
        console.log('🔔 Creating bell icon...');
        const bellHTML = `
            <div class="notification-bell" id="notificationBell">
                <i class="fas fa-bell"></i>
                <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
            </div>
        `;
        
        const container = document.getElementById('notificationBellContainer');
        if (container) {
            container.innerHTML = bellHTML;
            console.log('✅ Bell icon created');
        } else {
            console.error('❌ notificationBellContainer NOT FOUND!');
        }
    }

    createDropdown() {
        console.log('📋 Creating dropdown...');
        const dropdownHTML = `
            <div class="notification-dropdown" id="notificationDropdown" style="display: none;">
                <div class="notification-dropdown-header">
                    <h3>Notificações</h3>
                    <button class="mark-all-read" id="markAllRead" title="Marcar todas como lidas">
                        <i class="fas fa-check-double"></i>
                    </button>
                </div>
                <div class="notification-list" id="notificationList">
                    <div class="notification-empty">
                        <i class="fas fa-bell-slash"></i>
                        <p>Sem notificações</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', dropdownHTML);
        console.log('✅ Dropdown created');
    }

    createToastContainer() {
        console.log('🍞 Creating toast container...');
        const toastHTML = `<div class="toast-container" id="toastContainer"></div>`;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
        console.log('✅ Toast container created');
    }

    setupEventListeners() {
        console.log('👂 Setting up event listeners...');
        
        // Toggle dropdown
        const bell = document.getElementById('notificationBell');
        if (bell) {
            bell.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
            console.log('✅ Bell click listener added');
        } else {
            console.error('❌ Bell element not found!');
        }

        // Marcar todas como lidas
        const markAllBtn = document.getElementById('markAllRead');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => {
                this.markAllAsRead();
            });
            console.log('✅ Mark all read listener added');
        }

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notificationDropdown');
            if (dropdown && !dropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });
        
        console.log('✅ Event listeners setup complete');
    }

    async loadNotifications() {
        try {
            console.log('📥 Loading notifications from API...');
            const response = await fetch('/api/admin/notifications?limit=50');
            
            console.log('📡 API Response:', {
                status: response.status,
                ok: response.ok,
                statusText: response.statusText
            });
            
            if (!response.ok) {
                const text = await response.text();
                console.error('❌ API Error:', text);
                return;
            }
            
            const data = await response.json();
            console.log('📥 Notifications loaded:', data);
            
            this.notifications = data.notifications || [];
            this.unreadCount = data.unread_count || 0;
            
            if (this.notifications.length > 0) {
                this.lastNotificationId = this.notifications[0].id;
                console.log('🆔 Last notification ID:', this.lastNotificationId);
            }
            
            this.updateBadge();
            this.renderNotificationList();
            console.log('✅ Notifications loaded successfully');
        } catch (error) {
            console.error('❌ Error loading notifications:', error);
            console.error('Stack:', error.stack);
        }
    }

    startPolling() {
        console.log('🔄 Starting polling (every 5s)...');
        this.pollingInterval = setInterval(async () => {
            await this.checkNewNotifications();
        }, 5000);
    }

    async checkNewNotifications() {
        try {
            const response = await fetch('/api/admin/notifications?limit=50');
            if (!response.ok) {
                console.warn('⚠️ Polling failed:', response.status);
                return;
            }
            
            const data = await response.json();
            const newNotifications = data.notifications || [];
            
            // Verificar se existem notificações novas
            if (newNotifications.length > 0 && newNotifications[0].id > this.lastNotificationId) {
                console.log('🆕 NEW NOTIFICATION detected!', newNotifications[0]);
                
                // Encontrar todas as notificações novas
                const newOnes = newNotifications.filter(n => n.id > this.lastNotificationId);
                console.log(`🆕 Total new notifications: ${newOnes.length}`);
                
                newOnes.forEach(notif => {
                    this.handleNewNotification(notif);
                });
                
                this.lastNotificationId = newNotifications[0].id;
            }
            
            // Atualizar contador
            if (this.unreadCount !== data.unread_count) {
                console.log(`📊 Unread count changed: ${this.unreadCount} → ${data.unread_count}`);
                this.unreadCount = data.unread_count;
                this.updateBadge();
            }
        } catch (error) {
            console.error('❌ Error checking notifications:', error);
        }
    }

    handleNewNotification(notification) {
        console.log('✅ Handling new notification:', notification);
        
        // Adicionar à lista
        this.notifications.unshift(notification);
        this.unreadCount++;
        
        // Atualizar UI
        this.updateBadge();
        this.renderNotificationList();
        
        // Mostrar toast
        this.showToast(notification);
        
        // Tocar som
        this.playSound();
    }

    showToast(notification) {
        console.log('🍞 Showing toast for:', notification.type);
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        
        const icon = this.getNotificationIcon(notification.type);
        const message = notification.message;
        
        toast.innerHTML = `
            <div class="toast-icon ${notification.type}">
                <i class="fas ${icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${this.getNotificationTitle(notification.type)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        const container = document.getElementById('toastContainer');
        container.appendChild(toast);
        
        // Animar entrada
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto remover após 10 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 10000);
    }

    playSound() {
        this.audio.play().catch(err => {
            console.log('🔇 Could not play notification sound:', err.message);
        });
    }

    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.style.display = 'flex';
                console.log('🔴 Badge updated:', this.unreadCount);
            } else {
                badge.style.display = 'none';
                console.log('⚪ Badge hidden (no unread)');
            }
        }
    }

    renderNotificationList() {
        const list = document.getElementById('notificationList');
        if (!list) return;
        
        console.log('📋 Rendering', this.notifications.length, 'notifications');
        
        if (this.notifications.length === 0) {
            list.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>Sem notificações</p>
                </div>
            `;
            return;
        }
        
        list.innerHTML = this.notifications.map(notif => `
            <div class="notification-item ${notif.is_read ? 'read' : 'unread'}" data-id="${notif.id}" data-reservation-id="${notif.reservation_id || ''}">
                <div class="notification-icon ${notif.type}">
                    <i class="fas ${this.getNotificationIcon(notif.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">${this.formatTime(notif.created_at)}</div>
                </div>
                ${!notif.is_read ? `
                    <button class="notification-mark-read" data-id="${notif.id}" title="Marcar como lida">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
            </div>
        `).join('');
        
        // Adicionar click listeners
        list.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Se clicou no botão de marcar como lida, não redirecionar
                if (e.target.closest('.notification-mark-read')) {
                    e.stopPropagation();
                    const id = e.target.closest('.notification-mark-read').dataset.id;
                    this.markAsRead(id);
                    return;
                }
                
                const id = item.dataset.id;
                const reservationId = item.dataset.reservationId;
                
                // Marcar como lida
                this.markAsRead(id);
                
                // Redirecionar para calendário com reserva em foco
                if (reservationId) {
                    window.location.href = `/admin/calendar?highlight=${reservationId}`;
                } else {
                    window.location.href = '/admin/calendar';
                }
            });
        });
    }

    toggleDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (!dropdown) return;
        
        this.isDropdownOpen = !this.isDropdownOpen;
        dropdown.style.display = this.isDropdownOpen ? 'block' : 'none';
        console.log('🔽 Dropdown toggled:', this.isDropdownOpen);
        
        // Posicionar dropdown
        if (this.isDropdownOpen) {
            const bell = document.getElementById('notificationBell');
            if (bell) {
                const rect = bell.getBoundingClientRect();
                dropdown.style.top = `${rect.bottom + 10}px`;
                dropdown.style.right = `${window.innerWidth - rect.right}px`;
            }
        }
    }

    closeDropdown() {
        this.isDropdownOpen = false;
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }

    async markAsRead(notificationId) {
        try {
            await fetch('/api/admin/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification_id: notificationId })
            });
            
            // Atualizar localmente
            const notification = this.notifications.find(n => n.id == notificationId);
            if (notification && !notification.is_read) {
                notification.is_read = 1;
                this.unreadCount--;
                this.updateBadge();
                this.renderNotificationList();
                console.log('✅ Notification', notificationId, 'marked as read');
            }
        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            await fetch('/api/admin/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mark_all: true })
            });
            
            // Atualizar localmente
            this.notifications.forEach(n => n.is_read = 1);
            this.unreadCount = 0;
            this.updateBadge();
            this.renderNotificationList();
            console.log('✅ All notifications marked as read');
        } catch (error) {
            console.error('❌ Error marking all as read:', error);
        }
    }

    getNotificationIcon(type) {
        const icons = {
            'new_booking': 'fa-calendar-plus',
            'cancelled': 'fa-calendar-times',
            'edited': 'fa-edit',
            'reminder': 'fa-bell'
        };
        return icons[type] || 'fa-info-circle';
    }

    getNotificationTitle(type) {
        const titles = {
            'new_booking': 'Nova Reserva',
            'cancelled': 'Reserva Cancelada',
            'edited': 'Reserva Editada',
            'reminder': 'Lembrete'
        };
        return titles[type] || 'Notificação';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `Há ${diffMins} min`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Há ${diffHours}h`;
        
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `Há ${diffDays}d`;
        
        return date.toLocaleDateString('pt-PT');
    }

    destroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            console.log('🛑 Polling stopped');
        }
    }
}

// Expor globalmente para ser chamado pelo header-loader
window.initNotificationSystem = function() {
    console.log('🎬 window.initNotificationSystem() called');
    if (!window.notificationManager) {
        console.log('🆕 Creating new NotificationManager...');
        window.notificationManager = new NotificationManager();
        window.notificationManager.init();
    } else {
        console.log('⚠️ NotificationManager already exists');
    }
};

console.log('✅ notifications.js: Setup complete, waiting for initNotificationSystem() call');

// Cleanup ao sair da página
window.addEventListener('beforeunload', () => {
    if (window.notificationManager) {
        window.notificationManager.destroy();
    }
});