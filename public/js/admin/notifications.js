/**
 * Sistema de Notificações em Tempo Real
 * Usa Polling (mais confiável para Cloudflare Pages)
 */

class NotificationManager {
    constructor() {
        this.unreadCount = 0;
        this.notifications = [];
        this.audio = new Audio('/sounds/notification.mp3');
        this.isDropdownOpen = false;
        this.pollingInterval = null;
        this.lastNotificationId = 0;
        this.initialized = false;
        this.authToken = null;
    }

    async init() {
        if (this.initialized) {
            console.log('⚠️ Already initialized, skipping');
            return;
        }
        
        // Obter token de autenticação
        this.authToken = localStorage.getItem('admin_token') || localStorage.getItem('adminToken');
        
        if (!this.authToken) {
            console.error('❌ No auth token found - cannot initialize notifications');
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
    }

    async waitForHeader() {
        return new Promise((resolve) => {
            const checkHeader = () => {
                const container = document.getElementById('notificationBellContainer');
                if (container) {
                    resolve();
                } else {
                    setTimeout(checkHeader, 100);
                }
            };
            checkHeader();
        });
    }

    createBellIcon() {
        const bellHTML = `
            <div class="notification-bell" id="notificationBell">
                <i class="fas fa-bell"></i>
                <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
            </div>
        `;
        
        const container = document.getElementById('notificationBellContainer');
        if (container) {
            container.innerHTML = bellHTML;
        } else {
            console.error('❌ notificationBellContainer NOT FOUND!');
        }
    }

    createDropdown() {
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
    }

    createToastContainer() {
        const toastHTML = `<div class="toast-container" id="toastContainer"></div>`;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
    }

    setupEventListeners() {
        // Toggle dropdown
        const bell = document.getElementById('notificationBell');
        if (bell) {
            bell.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        } else {
            console.error('❌ Bell element not found!');
        }

        // Marcar todas como lidas
        const markAllBtn = document.getElementById('markAllRead');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notificationDropdown');
            if (dropdown && !dropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
        };
    }

    async loadNotifications() {
        try {
            const response = await fetch('/api/admin/notifications?limit=50', {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('❌ API Error:', text);
                return;
            }
            
            const data = await response.json();

            this.notifications = data.notifications || [];
            this.unreadCount = data.unread_count || 0;
            
            if (this.notifications.length > 0) {
                this.lastNotificationId = this.notifications[0].id;
            }
            
            this.updateBadge();
            this.renderNotificationList();
        } catch (error) {
            console.error('❌ Error loading notifications:', error);
            console.error('Stack:', error.stack);
        }
    }

    startPolling() {
        this.pollingInterval = setInterval(async () => {
            await this.checkNewNotifications();
        }, 5000);
    }

    async checkNewNotifications() {
        try {
            const response = await fetch('/api/admin/notifications?limit=50', {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                console.warn('⚠️ Polling failed:', response.status);
                return;
            }
            
            const data = await response.json();
            const newNotifications = data.notifications || [];
            
            // Verificar se existem notificações novas
            if (newNotifications.length > 0 && newNotifications[0].id > this.lastNotificationId) {
                // Encontrar todas as notificações novas
                const newOnes = newNotifications.filter(n => n.id > this.lastNotificationId);

                newOnes.forEach(notif => {
                    this.handleNewNotification(notif);
                });
                
                this.lastNotificationId = newNotifications[0].id;
            }
            
            // Atualizar contador
            if (this.unreadCount !== data.unread_count) {
                this.unreadCount = data.unread_count;
                this.updateBadge();
            }
        } catch (error) {
            console.error('❌ Error checking notifications:', error);
        }
    }

    handleNewNotification(notification) {
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
            } else {
                badge.style.display = 'none';
            }
        }
    }

    renderNotificationList() {
        const list = document.getElementById('notificationList');
        if (!list) return;

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
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ notification_id: notificationId })
            });
            
            // Atualizar localmente
            const notification = this.notifications.find(n => n.id == notificationId);
            if (notification && !notification.is_read) {
                notification.is_read = 1;
                this.unreadCount--;
                this.updateBadge();
                this.renderNotificationList();
            }
        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            await fetch('/api/admin/notifications', {
                method: 'PATCH',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ mark_all: true })
            });
            
            // Atualizar localmente
            this.notifications.forEach(n => n.is_read = 1);
            this.unreadCount = 0;
            this.updateBadge();
            this.renderNotificationList();
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
    if (!window.notificationManager) {
        window.notificationManager = new NotificationManager();
        window.notificationManager.init();
    }
};

// Cleanup ao sair da página
window.addEventListener('beforeunload', () => {
    if (window.notificationManager) {
        window.notificationManager.destroy();
    }
});