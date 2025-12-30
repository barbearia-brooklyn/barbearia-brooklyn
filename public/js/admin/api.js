/**
 * Brooklyn Barbearia - Admin API Client
 * Centralized API communication handler with all endpoints
 */

class AdminAPI {
    constructor() {
        this.baseURL = '';
        this.token = this.getToken();
        this.debugMode = true; // Temporary: disable auto-logout on 401

    }

    getToken() {
        // Try both token names for backward compatibility
        const token = localStorage.getItem('admin_token') || localStorage.getItem('adminToken');
        return token;
    }

    setToken(token) {
        localStorage.setItem('admin_token', token);
        // Also save as adminToken for backward compatibility
        localStorage.setItem('adminToken', token);
        this.token = token;
    }

    clearAuth() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin_user');
        this.token = null;
    }

    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
        
        // Refresh token from localStorage in case it changed
        this.token = this.getToken();
        
        if (this.debugMode && !this.token) {
            console.warn('⚠️ No auth token found for request to:', endpoint);
        }
        
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (response.status === 401) {
                if (this.debugMode) {
                    console.warn('⚠️ 401 Unauthorized - Debug mode: NOT logging out');
                    // In debug mode, just throw error without logout
                    const errorData = await response.json().catch(() => ({ error: 'Não autorizado' }));
                    throw new Error(errorData.error || 'Não autorizado');
                } else {
                    // Production mode: logout and redirect
                    this.clearAuth();
                    window.location.href = '/admin/login.html';
                    throw new Error('Não autorizado. Por favor faça login novamente.');
                }
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
                console.error('❌ API Error Response:', errorData);
                throw new Error(errorData.error || errorData.message || `Erro HTTP ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ API Error:', error);
            throw error;
        }
    }

    buildQueryString(params) {
        if (!params || Object.keys(params).length === 0) return '';
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                query.append(key, value);
            }
        });
        const queryString = query.toString();
        return queryString ? `?${queryString}` : '';
    }

    // ===== AUTHENTICATION =====
    async login(username, password, turnstileToken) {
        const data = await this.request('/api/admin/api_admin_login', {
            method: 'POST',
            body: JSON.stringify({ username, password, turnstileToken })
        });
        
        if (data.token) {
            this.setToken(data.token);
            if (data.user) {
                localStorage.setItem('admin_user', JSON.stringify(data.user));
            }
        }
        
        return data;
    }

    // ===== BARBEIROS =====
    async getBarbeiros() {
        return this.request('/api/api_barbeiros');
    }

    async getBarbeiroById(id) {
        return this.request(`/api/api_barbeiros/${id}`);
    }

    // ===== SERVIÇOS =====
    async getServicos() {
        return this.request('/api/api_servicos');
    }

    async getServicoById(id) {
        return this.request(`/api/api_servicos/${id}`);
    }

    // ===== CLIENTES =====
    async getClientes(params = {}) {
        const queryString = this.buildQueryString(params);
        return this.request(`/api/admin/api_admin_clientes${queryString}`);
    }

    async getClienteById(id) {
        return this.request(`/api/admin/api_admin_clientes/${id}`);
    }

    async createCliente(data) {
        return this.request('/api/admin/api_admin_clientes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateCliente(id, data) {
        return this.request(`/api/admin/api_admin_clientes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteCliente(id) {
        return this.request(`/api/admin/api_admin_clientes/${id}`, {
            method: 'DELETE'
        });
    }

    // ===== RESERVAS (Admin) =====
    async getReservas(params = {}) {
        const queryString = this.buildQueryString(params);
        return this.request(`/api/admin/api_admin_reservas${queryString}`);
    }

    async getReservaById(id) {
        return this.request(`/api/admin/api_admin_reservas/${id}`);
    }

    async createReserva(data) {
        return this.request('/api/admin/api_admin_reservas', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateReserva(id, data) {
        return this.request(`/api/admin/api_admin_reservas/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteReserva(id) {
        return this.request(`/api/admin/api_admin_reservas/${id}`, {
            method: 'DELETE'
        });
    }

    // ===== HORÁRIOS INDISPONÍVEIS =====
    async getHorariosIndisponiveis(params = {}) {
        const queryString = this.buildQueryString(params);
        return this.request(`/api/admin/api_horarios_indisponiveis${queryString}`);
    }

    async getHorarioIndisponivelById(id) {
        return this.request(`/api/admin/api_horarios_indisponiveis/${id}`);
    }

    async createHorarioIndisponivel(data) {
        return this.request('/api/admin/api_horarios_indisponiveis', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateHorarioIndisponivel(id, data) {
        return this.request(`/api/admin/api_horarios_indisponiveis/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteHorarioIndisponivel(id) {
        return this.request(`/api/admin/api_horarios_indisponiveis/${id}`, {
            method: 'DELETE'
        });
    }

    // ===== HORÁRIOS DISPONÍVEIS (para criar reserva) =====
    async getHorariosDisponiveis(params = {}) {
        const queryString = this.buildQueryString(params);
        return this.request(`/api/api_horarios_disponiveis${queryString}`);
    }

    // ===== DASHBOARD STATS =====
    async getDashboardStats() {
        try {
            return await this.request('/api/admin/api_admin_stats');
        } catch (error) {
            console.warn('Stats API not ready, returning mock data');
            return {
                monthReservations: 0,
                todayReservations: 0,
                yesterdayCompleted: 0
            };
        }
    }
}

// Create global instance
window.adminAPI = new AdminAPI();

// Create compatibility wrapper for components expecting window.api structure
window.api = {
    barbeiros: {
        getAll: () => window.adminAPI.getBarbeiros(),
        getById: (id) => window.adminAPI.getBarbeiroById(id)
    },
    servicos: {
        getAll: () => window.adminAPI.getServicos(),
        getById: (id) => window.adminAPI.getServicoById(id)
    },
    reservas: {
        getAll: (params) => window.adminAPI.getReservas(params),
        getById: (id) => window.adminAPI.getReservaById(id),
        create: (data) => window.adminAPI.createReserva(data),
        update: (id, data) => window.adminAPI.updateReserva(id, data),
        delete: (id) => window.adminAPI.deleteReserva(id)
    },
    horariosIndisponiveis: {
        getAll: (params) => window.adminAPI.getHorariosIndisponiveis(params),
        getById: (id) => window.adminAPI.getHorarioIndisponivelById(id),
        create: (data) => window.adminAPI.createHorarioIndisponivel(data),
        update: (id, data) => window.adminAPI.updateHorarioIndisponivel(id, data),
        delete: (id) => window.adminAPI.deleteHorarioIndisponivel(id)
    }
};

console.log('✅ AdminAPI loaded');
console.log('✅ Compatibility wrapper window.api loaded');