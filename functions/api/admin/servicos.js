// Services API for Admin Dashboard
// GET /api/admin/servicos - Get all services
// GET /api/admin/servicos/:id - Get single service

import { getDatabase } from '../../../src/db';
import { validateAdminAuth } from '../../../src/auth';

export default async function handler(request, context) {
  try {
    // Validate admin authentication
    const user = await validateAdminAuth(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { method } = request;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const serviceid = pathParts[pathParts.length - 1];
    const isDetailRoute = serviceid !== 'servicos' && serviceid !== '';

    const db = getDatabase();

    if (method === 'GET') {
      return handleGet(db, isDetailRoute, serviceid);
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Services API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function handleGet(db, isDetailRoute, serviceid) {
  try {
    if (isDetailRoute) {
      // Get single service
      const stmt = db.prepare('SELECT * FROM servicos WHERE id = ?');
      const service = stmt.get(parseInt(serviceid));

      if (!service) {
        return new Response(JSON.stringify({ error: 'Service not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(service), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Get all services
      const stmt = db.prepare('SELECT * FROM servicos ORDER BY nome');
      const services = stmt.all();

      return new Response(JSON.stringify(services), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    throw error;
  }
}
