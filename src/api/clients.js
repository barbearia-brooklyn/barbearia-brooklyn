/**
 * Clients API
 * Handles client-related endpoints
 */

// Mock database
const mockClients = [
  {
    id: 1,
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '912345678',
    createdAt: new Date(2025, 10, 1),
    notes: 'Cliente regular',
  },
  {
    id: 2,
    name: 'Maria Santos',
    email: 'maria@email.com',
    phone: '911223344',
    createdAt: new Date(2025, 11, 1),
    notes: 'Cliente novo',
  },
  {
    id: 3,
    name: 'Carlos Oliveira',
    email: 'carlos@email.com',
    phone: '913456789',
    createdAt: new Date(2025, 10, 15),
    notes: '',
  },
  {
    id: 4,
    name: 'Pedro Costa',
    email: 'pedro@email.com',
    phone: '914567890',
    createdAt: new Date(2025, 9, 20),
    notes: 'Preferência por manhs',
  },
];

let clientId = 5;

/**
 * GET /api/clients
 * Get all clients with optional search
 */
export async function getClients(request) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search');

  let filtered = mockClients;

  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(
      c =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone.includes(query)
    );
  }

  return new Response(JSON.stringify(filtered), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POST /api/clients
 * Create a new client
 */
export async function createClient(request) {
  const data = await request.json();

  const client = {
    id: clientId++,
    ...data,
    createdAt: new Date(),
  };

  mockClients.push(client);

  return new Response(JSON.stringify(client), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * GET /api/clients/:id
 * Get a specific client
 */
export async function getClient(request, id) {
  const client = mockClients.find(c => c.id === parseInt(id));

  if (!client) {
    return new Response(JSON.stringify({ error: 'Client not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(client), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * PUT /api/clients/:id
 * Update a client
 */
export async function updateClient(request, id) {
  const data = await request.json();
  const index = mockClients.findIndex(c => c.id === parseInt(id));

  if (index === -1) {
    return new Response(JSON.stringify({ error: 'Client not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  mockClients[index] = {
    ...mockClients[index],
    ...data,
    id: parseInt(id),
  };

  return new Response(JSON.stringify(mockClients[index]), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * DELETE /api/clients/:id
 * Delete a client
 */
export async function deleteClient(request, id) {
  const index = mockClients.findIndex(c => c.id === parseInt(id));

  if (index === -1) {
    return new Response(JSON.stringify({ error: 'Client not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const deleted = mockClients.splice(index, 1);

  return new Response(JSON.stringify(deleted[0]), {
    headers: { 'Content-Type': 'application/json' },
  });
}
