// Clients API for Admin Dashboard
// GET /api/admin/clientes - Get clients with optional search
// GET /api/admin/clientes/:id - Get single client
// POST /api/admin/clientes - Create new client

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
    const clientid = pathParts[pathParts.length - 1];
    const isDetailRoute = clientid !== 'clientes' && clientid !== '';

    const db = getDatabase();

    if (method === 'GET') {
      return handleGet(db, url, isDetailRoute, clientid);
    } else if (method === 'POST') {
      return handlePost(db, request);
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Clients API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function handleGet(db, url, isDetailRoute, clientid) {
  try {
    if (isDetailRoute) {
      // Get single client
      const stmt = db.prepare('SELECT * FROM clientes WHERE id = ?');
      const client = stmt.get(parseInt(clientid));

      if (!client) {
        return new Response(JSON.stringify({ error: 'Client not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(client), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Get clients with optional search
      const search = url.searchParams.get('q');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM clientes WHERE 1=1';
      const params = [];

      if (search) {
        query += ` AND (nome LIKE ? OR email LIKE ? OR telefone LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      query += ' ORDER BY nome LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const stmt = db.prepare(query);
      const clients = stmt.all(...params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM clientes WHERE 1=1';
      const countParams = [];
      if (search) {
        countQuery += ` AND (nome LIKE ? OR email LIKE ? OR telefone LIKE ?)`;
        const searchPattern = `%${search}%`;
        countParams.push(searchPattern, searchPattern, searchPattern);
      }

      const countStmt = db.prepare(countQuery);
      const { total } = countStmt.get(...countParams);

      return new Response(JSON.stringify({
        data: clients,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    throw error;
  }
}

async function handlePost(db, request) {
  try {
    const body = await request.json();
    const { nome, email, telefone, nif } = body;

    // Validate required fields
    if (!nome || !email || !telefone) {
      return new Response(JSON.stringify({ error: 'Missing required fields: nome, email, telefone' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if client already exists
    const checkStmt = db.prepare('SELECT id FROM clientes WHERE email = ? OR telefone = ?');
    const existing = checkStmt.get(email, telefone);

    if (existing) {
      return new Response(JSON.stringify({ error: 'Client with this email or phone already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create password hash (default temporary password)
    const tempPassword = 'temp_' + Math.random().toString(36).substring(7);
    const passwordHash = await hashPassword(tempPassword);

    const stmt = db.prepare(`
      INSERT INTO clientes (nome, email, telefone, nif, password_hash, email_verificado)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
      nome,
      email,
      telefone,
      nif || null,
      passwordHash
    );

    return new Response(JSON.stringify({
      id: result.lastInsertRowid,
      message: 'Client created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    throw error;
  }
}

// Simple password hashing (in production, use bcrypt)
async function hashPassword(password) {
  return 'hashed_' + btoa(password);
}
