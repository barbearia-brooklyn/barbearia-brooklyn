/**
 * API Client
 * Handles all API calls to backend
 */

const API_BASE = '/api';

/**
 * Make a generic fetch request
 */
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * RESERVATIONS
 */
export const apiReservations = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.barberId) params.append('barberId', filters.barberId);
    if (filters.status) params.append('status', filters.status);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);

    const endpoint = `/reservations${params.toString() ? '?' + params.toString() : ''}`;
    return apiCall(endpoint);
  },
  get: (id) => apiCall(`/reservations/${id}`),
  create: (data) => apiCall('/reservations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/reservations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/reservations/${id}`, {
    method: 'DELETE',
  }),
};

/**
 * CLIENTS
 */
export const apiClients = {
  getAll: (search = '') => {
    const endpoint = search ? `/clients?search=${encodeURIComponent(search)}` : '/clients';
    return apiCall(endpoint);
  },
  get: (id) => apiCall(`/clients/${id}`),
  create: (data) => apiCall('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/clients/${id}`, {
    method: 'DELETE',
  }),
};

/**
 * BARBERS
 */
export const apiBarbers = {
  getAll: () => apiCall('/barbers'),
  get: (id) => apiCall(`/barbers/${id}`),
  create: (data) => apiCall('/barbers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/barbers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/barbers/${id}`, {
    method: 'DELETE',
  }),
};

/**
 * SERVICES
 */
export const apiServices = {
  getAll: () => apiCall('/services'),
  get: (id) => apiCall(`/services/${id}`),
  create: (data) => apiCall('/services', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/services/${id}`, {
    method: 'DELETE',
  }),
};

/**
 * UNAVAILABLE SLOTS
 */
export const apiUnavailable = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.barberId) params.append('barberId', filters.barberId);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);

    const endpoint = `/unavailable${params.toString() ? '?' + params.toString() : ''}`;
    return apiCall(endpoint);
  },
  get: (id) => apiCall(`/unavailable/${id}`),
  create: (data) => apiCall('/unavailable', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/unavailable/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/unavailable/${id}`, {
    method: 'DELETE',
  }),
};

/**
 * Utility function to fetch all data needed for admin
 */
export async function fetchAdminData() {
  try {
    const [barbers, services, clients, reservations, unavailable] = await Promise.all([
      apiBarbers.getAll(),
      apiServices.getAll(),
      apiClients.getAll(),
      apiReservations.getAll(),
      apiUnavailable.getAll(),
    ]);

    return {
      barbers,
      services,
      clients,
      reservations,
      unavailable,
    };
  } catch (error) {
    console.error('Failed to fetch admin data:', error);
    throw error;
  }
}
