/**
 * Services API
 * Handles service-related endpoints
 */

// Mock database
const mockServices = [
  {
    id: 1,
    name: 'Corte de Cabelo',
    description: 'Corte de cabelo clássico',
    duration: 30,
    price: 15,
    status: 'active',
  },
  {
    id: 2,
    name: 'Barba',
    description: 'Barba completa',
    duration: 20,
    price: 10,
    status: 'active',
  },
  {
    id: 3,
    name: 'Corte + Barba',
    description: 'Corte de cabelo + barba',
    duration: 45,
    price: 25,
    status: 'active',
  },
  {
    id: 4,
    name: 'Design de Barba',
    description: 'Design personalizado de barba',
    duration: 30,
    price: 20,
    status: 'active',
  },
];

/**
 * GET /api/services
 * Get all services
 */
export async function getServices(request) {
  return new Response(JSON.stringify(mockServices), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POST /api/services
 * Create a new service
 */
export async function createService(request) {
  const data = await request.json();

  const service = {
    id: Math.max(...mockServices.map(s => s.id)) + 1,
    ...data,
    status: data.status || 'active',
  };

  mockServices.push(service);

  return new Response(JSON.stringify(service), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * GET /api/services/:id
 * Get a specific service
 */
export async function getService(request, id) {
  const service = mockServices.find(s => s.id === parseInt(id));

  if (!service) {
    return new Response(JSON.stringify({ error: 'Service not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(service), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * PUT /api/services/:id
 * Update a service
 */
export async function updateService(request, id) {
  const data = await request.json();
  const index = mockServices.findIndex(s => s.id === parseInt(id));

  if (index === -1) {
    return new Response(JSON.stringify({ error: 'Service not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  mockServices[index] = {
    ...mockServices[index],
    ...data,
    id: parseInt(id),
  };

  return new Response(JSON.stringify(mockServices[index]), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * DELETE /api/services/:id
 * Delete a service
 */
export async function deleteService(request, id) {
  const index = mockServices.findIndex(s => s.id === parseInt(id));

  if (index === -1) {
    return new Response(JSON.stringify({ error: 'Service not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const deleted = mockServices.splice(index, 1);

  return new Response(JSON.stringify(deleted[0]), {
    headers: { 'Content-Type': 'application/json' },
  });
}
