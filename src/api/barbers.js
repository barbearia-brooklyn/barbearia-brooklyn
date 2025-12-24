/**
 * Barbers API
 * Handles barber-related endpoints
 */

// Mock database
const mockBarbers = [
  {
    id: 1,
    name: 'Barbeiro 1',
    email: 'barber1@email.com',
    phone: '912000001',
    status: 'active',
    workingHours: {
      start: '09:00',
      end: '19:00',
    },
    daysOff: [],
  },
  {
    id: 2,
    name: 'Barbeiro 2',
    email: 'barber2@email.com',
    phone: '912000002',
    status: 'active',
    workingHours: {
      start: '09:00',
      end: '19:00',
    },
    daysOff: [],
  },
  {
    id: 3,
    name: 'Barbeiro 3',
    email: 'barber3@email.com',
    phone: '912000003',
    status: 'active',
    workingHours: {
      start: '10:00',
      end: '20:00',
    },
    daysOff: [],
  },
];

/**
 * GET /api/barbers
 * Get all barbers
 */
export async function getBarbers(request) {
  return new Response(JSON.stringify(mockBarbers), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POST /api/barbers
 * Create a new barber
 */
export async function createBarber(request) {
  const data = await request.json();

  const barber = {
    id: Math.max(...mockBarbers.map(b => b.id)) + 1,
    ...data,
    status: data.status || 'active',
  };

  mockBarbers.push(barber);

  return new Response(JSON.stringify(barber), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * GET /api/barbers/:id
 * Get a specific barber
 */
export async function getBarber(request, id) {
  const barber = mockBarbers.find(b => b.id === parseInt(id));

  if (!barber) {
    return new Response(JSON.stringify({ error: 'Barber not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(barber), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * PUT /api/barbers/:id
 * Update a barber
 */
export async function updateBarber(request, id) {
  const data = await request.json();
  const index = mockBarbers.findIndex(b => b.id === parseInt(id));

  if (index === -1) {
    return new Response(JSON.stringify({ error: 'Barber not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  mockBarbers[index] = {
    ...mockBarbers[index],
    ...data,
    id: parseInt(id),
  };

  return new Response(JSON.stringify(mockBarbers[index]), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * DELETE /api/barbers/:id
 * Delete a barber
 */
export async function deleteBarber(request, id) {
  const index = mockBarbers.findIndex(b => b.id === parseInt(id));

  if (index === -1) {
    return new Response(JSON.stringify({ error: 'Barber not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const deleted = mockBarbers.splice(index, 1);

  return new Response(JSON.stringify(deleted[0]), {
    headers: { 'Content-Type': 'application/json' },
  });
}
