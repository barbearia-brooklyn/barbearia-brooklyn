/**
 * Funções auxiliares para UI e manipulação do DOM
 */

class UIHelper {
    static showView(viewId) {
        // Esconder todas as views
        document.querySelectorAll('.view-section').forEach(view => {
            view.classList.remove('active');
        });

        // Mostrar a view desejada
        const view = document.getElementById(viewId);
        if (view) {
            view.classList.add('active');
        }

        // Atualizar nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const navItem = document.querySelector(`[data-view="${viewId.replace('View', '')}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }
    }

    static updateHeaderTitle(title, subtitle = '') {
        document.getElementById('viewTitle').textContent = title;
        const subtitleEl = document.getElementById('viewSubtitle');
        subtitleEl.textContent = subtitle;
        subtitleEl.style.display = subtitle ? 'block' : 'none';
    }

    static setUserInfo(username) {
        document.getElementById('userInfo').textContent = `👤 ${username}`;
    }

    static showAlert(message, type = 'success', duration = 3000) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => alertDiv.remove(), 300);
        }, duration);
    }

    static showLoading(show = true) {
        let loader = document.getElementById('globalLoader');
        if (show) {
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'globalLoader';
                loader.className = 'global-loader';
                loader.innerHTML = '<div class="spinner"></div>';
                document.body.appendChild(loader);
            }
            loader.style.display = 'flex';
        } else if (loader) {
            loader.style.display = 'none';
        }
    }

    static formatDate(date, format = 'pt-PT') {
        return new Date(date).toLocaleDateString(format, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    static formatTime(date) {
        return new Date(date).toLocaleTimeString('pt-PT', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static formatDateISO(date) {
        return date instanceof Date
            ? date.toISOString().split('T')[0]
            : new Date(date).toISOString().split('T')[0];
    }

    static getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    static getWeekEnd(date) {
        const start = UIHelper.getWeekStart(date);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return end;
    }
}

// Adicionar CSS para animações globais
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    .global-loader {
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        align-items: center;
        justify-content: center;
        z-index: 999;
    }

    .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(31, 94, 43, 0.2);
        border-top-color: var(--primary-green);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .alert {
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: 500;
        box-shadow: var(--shadow-lg);
    }

    .alert-success {
        background-color: #e8f5e9;
        color: #2e7d32;
        border: 1px solid #81c784;
    }

    .alert-error {
        background-color: #ffebee;
        color: #c62828;
        border: 1px solid #ef5350;
    }

    .alert-info {
        background-color: #e3f2fd;
        color: #1565c0;
        border: 1px solid #64b5f6;
    }
`;
document.head.appendChild(style);
