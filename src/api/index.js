/**
 * Main API Router
 * Routes all API requests to appropriate handlers
 */

import * as reservations from './reservations.js';
import * as clients from './clients.js';
import * as barbers from './barbers.js';
import * as services from './services.js';
import * as unavailable from './unavailable.js';

/**
 * Handle incoming API requests
 * Routes based on path and method
 */
export async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    let response;

    // Reservations endpoints
    if (pathname === '/api/reservations' && method === 'GET') {
      response = await reservations.getReservations(request);
    } else if (pathname === '/api/reservations' && method === 'POST') {
      response = await reservations.createReservation(request);
    } else if (pathname.match(/\/api\/reservations\/\d+$/) && method === 'GET') {
      const id = pathname.split('/').pop();
      response = await reservations.getReservation(request, id);
    } else if (pathname.match(/\/api\/reservations\/\d+$/) && method === 'PUT') {
      const id = pathname.split('/').pop();
      response = await reservations.updateReservation(request, id);
    } else if (pathname.match(/\/api\/reservations\/\d+$/) && method === 'DELETE') {
      const id = pathname.split('/').pop();
      response = await reservations.deleteReservation(request, id);
    }
    // Clients endpoints
    else if (pathname === '/api/clients' && method === 'GET') {
      response = await clients.getClients(request);
    } else if (pathname === '/api/clients' && method === 'POST') {
      response = await clients.createClient(request);
    } else if (pathname.match(/\/api\/clients\/\d+$/) && method === 'GET') {
      const id = pathname.split('/').pop();
      response = await clients.getClient(request, id);
    } else if (pathname.match(/\/api\/clients\/\d+$/) && method === 'PUT') {
      const id = pathname.split('/').pop();
      response = await clients.updateClient(request, id);
    } else if (pathname.match(/\/api\/clients\/\d+$/) && method === 'DELETE') {
      const id = pathname.split('/').pop();
      response = await clients.deleteClient(request, id);
    }
    // Barbers endpoints
    else if (pathname === '/api/barbers' && method === 'GET') {
      response = await barbers.getBarbers(request);
    } else if (pathname === '/api/barbers' && method === 'POST') {
      response = await barbers.createBarber(request);
    } else if (pathname.match(/\/api\/barbers\/\d+$/) && method === 'GET') {
      const id = pathname.split('/').pop();
      response = await barbers.getBarber(request, id);
    } else if (pathname.match(/\/api\/barbers\/\d+$/) && method === 'PUT') {
      const id = pathname.split('/').pop();
      response = await barbers.updateBarber(request, id);
    } else if (pathname.match(/\/api\/barbers\/\d+$/) && method === 'DELETE') {
      const id = pathname.split('/').pop();
      response = await barbers.deleteBarber(request, id);
    }
    // Services endpoints
    else if (pathname === '/api/services' && method === 'GET') {
      response = await services.getServices(request);
    } else if (pathname === '/api/services' && method === 'POST') {
      response = await services.createService(request);
    } else if (pathname.match(/\/api\/services\/\d+$/) && method === 'GET') {
      const id = pathname.split('/').pop();
      response = await services.getService(request, id);
    } else if (pathname.match(/\/api\/services\/\d+$/) && method === 'PUT') {
      const id = pathname.split('/').pop();
      response = await services.updateService(request, id);
    } else if (pathname.match(/\/api\/services\/\d+$/) && method === 'DELETE') {
      const id = pathname.split('/').pop();
      response = await services.deleteService(request, id);
    }
    // Unavailable endpoints
    else if (pathname === '/api/unavailable' && method === 'GET') {
      response = await unavailable.getUnavailable(request);
    } else if (pathname === '/api/unavailable' && method === 'POST') {
      response = await unavailable.createUnavailable(request);
    } else if (pathname.match(/\/api\/unavailable\/\d+$/) && method === 'GET') {
      const id = pathname.split('/').pop();
      response = await unavailable.getUnavailableSlot(request, id);
    } else if (pathname.match(/\/api\/unavailable\/\d+$/) && method === 'PUT') {
      const id = pathname.split('/').pop();
      response = await unavailable.updateUnavailable(request, id);
    } else if (pathname.match(/\/api\/unavailable\/\d+$/) && method === 'DELETE') {
      const id = pathname.split('/').pop();
      response = await unavailable.deleteUnavailable(request, id);
    } else {
      response = new Response(JSON.stringify({ error: 'Endpoint not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add CORS headers to response
    const newResponse = new Response(response.body, response);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });

    return newResponse;
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
}

/**
 * API Endpoints Documentation
 *
 * RESERVATIONS:
 * GET    /api/reservations                 - Get all reservations (with filters)
 * POST   /api/reservations                 - Create new reservation
 * GET    /api/reservations/:id             - Get specific reservation
 * PUT    /api/reservations/:id             - Update reservation
 * DELETE /api/reservations/:id             - Cancel reservation
 *
 * CLIENTS:
 * GET    /api/clients                      - Get all clients (with search)
 * POST   /api/clients                      - Create new client
 * GET    /api/clients/:id                  - Get specific client
 * PUT    /api/clients/:id                  - Update client
 * DELETE /api/clients/:id                  - Delete client
 *
 * BARBERS:
 * GET    /api/barbers                      - Get all barbers
 * POST   /api/barbers                      - Create new barber
 * GET    /api/barbers/:id                  - Get specific barber
 * PUT    /api/barbers/:id                  - Update barber
 * DELETE /api/barbers/:id                  - Delete barber
 *
 * SERVICES:
 * GET    /api/services                     - Get all services
 * POST   /api/services                     - Create new service
 * GET    /api/services/:id                 - Get specific service
 * PUT    /api/services/:id                 - Update service
 * DELETE /api/services/:id                 - Delete service
 *
 * UNAVAILABLE SLOTS:
 * GET    /api/unavailable                  - Get unavailable slots (with filters)
 * POST   /api/unavailable                  - Create unavailable slot
 * GET    /api/unavailable/:id              - Get specific slot
 * PUT    /api/unavailable/:id              - Update slot
 * DELETE /api/unavailable/:id              - Delete slot
 */
