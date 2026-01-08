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
        
        console.log('🔔 NotificationManager: Initializing...');
        this.init();
    }

    async init() {
        console.log('🔔 NotificationManager: Starting init...');
        
        // Aguardar o header estar carregado
        await this.waitForHeader();
        
        // Criar elementos UI
        this.createBellIcon();
        this.createDropdown();
        this.createToastContainer();
        
        // Carregar notificações existentes
        await this.loadNotifications();
        
        // Iniciar polling a cada 5 segundos
        this.startPolling();
        
        // Event listeners
        this.setupEventListeners();
        console.log('✅ NotificationManager: Init complete');
    }

    async waitForHeader() {
        return new Promise((resolve) => {
            const checkHeader = () => {
                const container = document.getElementById('notificationBellContainer');
                if (container) {
                    console.log('✅ Header container found!');
                    resolve();
                } else {
                    console.log('⏳ Waiting for header container...');
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
        
        // Inserir no container específico
        const container = document.getElementById('notificationBellContainer');
        if (container) {
            container.innerHTML = bellHTML;
            console.log('✅ Bell icon created in notificationBellContainer');
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
        console.log('✅ Dropdown created');
    }

    createToastContainer() {
        const toastHTML = `<div class="toast-container" id="toastContainer"></div>`;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
        console.log('✅ Toast container created');
    }

    setupEventListeners() {
        // Toggle dropdown
        const bell = document.getElementById('notificationBell');
        if (bell) {
            bell.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
            console.log('✅ Bell click listener added');
        } else {
            console.error('❌ Bell element not found for event listener!');
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
        
        console.log('✅ Event listeners setup');
    }

    async loadNotifications() {
        try {
            console.log('📥 Loading notifications from /api/admin/notifications...');
            const response = await fetch('/api/admin/notifications?limit=10');
            
            console.log('📥 Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                console.error('❌ Failed to load notifications:', response.status, response.statusText);
                const text = await response.text();
                console.error('❌ Response body:', text);
                return;
            }
            
            const data = await response.json();
            console.log('📥 Notifications loaded:', data);
            
            this.notifications = data.notifications || [];
            this.unreadCount = data.unread_count || 0;
            
            if (this.notifications.length > 0) {
                this.lastNotificationId = this.notifications[0].id;
            }
            
            this.updateBadge();
            this.renderNotificationList();
            console.log('✅ Notifications loaded successfully. Count:', this.notifications.length, 'Unread:', this.unreadCount);
        } catch (error) {
            console.error('❌ Error loading notifications:', error);
            console.error('❌ Error stack:', error.stack);
        }
    }

    startPolling() {
        console.log('🔄 Starting polling (every 5s)...');
        // Poll a cada 5 segundos
        this.pollingInterval = setInterval(async () => {
            await this.checkNewNotifications();
        }, 5000);
    }

    async checkNewNotifications() {
        try {
            const response = await fetch('/api/admin/notifications?limit=10');
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
        
        // Auto remover após 5 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    playSound() {
        this.audio.play().catch(err => {
            console.log('🔇 Could not play notification sound:', err);
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
            }
        } else {
            console.warn('⚠️ Badge element not found');
        }
    }

    renderNotificationList() {
        const list = document.getElementById('notificationList');
        if (!list) return;
        
        console.log('📝 Rendering', this.notifications.length, 'notifications');
        
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
            <div class="notification-item ${notif.is_read ? 'read' : 'unread'}" data-id="${notif.id}">
                <div class="notification-icon ${notif.type}">
                    <i class="fas ${this.getNotificationIcon(notif.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">${this.formatTime(notif.created_at)}</div>
                </div>
                ${!notif.is_read ? '<div class="notification-dot"></div>' : ''}
            </div>
        `).join('');
        
        // Adicionar click listeners
        list.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                this.markAsRead(id);
                
                // Se tiver reservation_id, redirecionar para calendário
                const notification = this.notifications.find(n => n.id == id);
                if (notification && notification.reservation_id) {
                    window.location.href = '/admin/calendar.html';
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
            'edited': 'fa-calendar-edit',
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
            console.log('✅ Polling stopped');
        }
    }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 DOM loaded, creating NotificationManager...');
        window.notificationManager = new NotificationManager();
    });
} else {
    console.log('🚀 DOM already loaded, creating NotificationManager...');
    window.notificationManager = new NotificationManager();
}

// Cleanup ao sair da página
window.addEventListener('beforeunload', () => {
    if (window.notificationManager) {
        window.notificationManager.destroy();
    }
});