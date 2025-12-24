// Brooklyn Barbearia - Admin API Client
// Centralized API communication handler

class AdminAPI {
    constructor() {
        this.baseURL = '/api/admin';
        this.token = this.getToken();
    }

    // Get authentication token from localStorage
    getToken() {
        return localStorage.getItem('admin_token');
    }

    // Set authentication token
    setToken(token) {
        localStorage.setItem('admin_token', token);
        this.token = token;
    }

    // Clear authentication
    clearAuth() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        this.token = null;
    }

    // Generic request handler
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
        
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

            // Handle unauthorized
            if (response.status === 401) {
                this.clearAuth();
                window.location.href = '/admin-login.html';
                throw new Error('Não autorizado. Por favor faça login novamente.');
            }

            // Handle error responses
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
                throw new Error(errorData.error || errorData.message || `Erro HTTP ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Build query string from params object
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
        const data = await this.request('/api_admin_login', {
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
        return this.request('/api/barbeiros');
    }

    async getBarbeiroById(id) {
        return this.request(`/api/barbeiros/${id}`);
    }

    // ===== SERVIÇOS =====
    async getServicos() {
        return this.request('/api/servicos');
    }

    // ===== RESERVAS =====
    async getReservas(params = {}) {
        const queryString = this.buildQueryString(params);
        return this.request(`/api_admin_reservas${queryString}`);
    }

    async getReservaById(id) {
        return this.request(`/api_admin_reservas/${id}`);
    }

    async createReserva(data) {
        return this.request('/api_admin_reservas', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateReserva(id, data) {
        return this.request(`/api_admin_reservas/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteReserva(id) {
        return this.request(`/api_admin_reservas/${id}`, {
            method: 'DELETE'
        });
    }

    // ===== HORÁRIOS INDISPONÍVEIS =====
    async getHorariosIndisponiveis(params = {}) {
        const queryString = this.buildQueryString(params);
        return this.request(`/api_horarios_indisponiveis${queryString}`);
    }

    async getHorarioIndisponivelById(id) {
        return this.request(`/api_horarios_indisponiveis/${id}`);
    }

    async createHorarioIndisponivel(data) {
        return this.request('/api_horarios_indisponiveis', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateHorarioIndisponivel(id, data) {
        return this.request(`/api_horarios_indisponiveis/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteHorarioIndisponivel(id) {
        return this.request(`/api_horarios_indisponiveis/${id}`, {
            method: 'DELETE'
        });
    }

    // ===== DASHBOARD STATS =====
    async getDashboardStats() {
        return this.request('/dashboard/stats');
    }
}

// Create global instance
window.adminAPI = new AdminAPI();

console.log('✅ Admin API Client initialized');
