// Centralized API Client for Admin Dashboard
// Handles all API communications with proper error handling and auth

class AdminAPIClient {
  constructor() {
    this.baseURL = '/api/admin';
    this.token = this.getAuthToken();
  }

  getAuthToken() {
    return localStorage.getItem('admin_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API Error');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Reservations API
  reservations = {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.barbeiro_id) params.append('barbeiro_id', filters.barbeiro_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
      if (filters.data_fim) params.append('data_fim', filters.data_fim);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      return this.request(`/reservations?${params}`);
    },

    getOne: async (id) => {
      return this.request(`/reservations/${id}`);
    },

    create: async (data) => {
      return this.request('/reservations', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    update: async (id, data) => {
      return this.request(`/reservations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    delete: async (id) => {
      return this.request(`/reservations/${id}`, {
        method: 'DELETE'
      });
    }
  };

  // Unavailable Times API
  unavailableTimes = {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.barbeiro_id) params.append('barbeiro_id', filters.barbeiro_id);
      if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
      if (filters.data_fim) params.append('data_fim', filters.data_fim);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      return this.request(`/unavailable-times?${params}`);
    },

    getOne: async (id) => {
      return this.request(`/unavailable-times/${id}`);
    },

    create: async (data) => {
      return this.request('/unavailable-times', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    update: async (id, data) => {
      return this.request(`/unavailable-times/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    delete: async (id) => {
      return this.request(`/unavailable-times/${id}`, {
        method: 'DELETE'
      });
    }
  };

  // Barbers API
  barbeiros = {
    getAll: async () => {
      return this.request('/barbeiros');
    },

    getOne: async (id) => {
      return this.request(`/barbeiros/${id}`);
    }
  };

  // Services API
  servicos = {
    getAll: async () => {
      return this.request('/servicos');
    },

    getOne: async (id) => {
      return this.request(`/servicos/${id}`);
    }
  };

  // Clients API
  clientes = {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.q) params.append('q', filters.q);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      return this.request(`/clientes?${params}`);
    },

    getOne: async (id) => {
      return this.request(`/clientes/${id}`);
    },

    search: async (query) => {
      return this.clientes.getAll({ q: query, limit: 10 });
    },

    create: async (data) => {
      return this.request('/clientes', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  };
}

// Export singleton instance
window.api = new AdminAPIClient();
export default AdminAPIClient;
