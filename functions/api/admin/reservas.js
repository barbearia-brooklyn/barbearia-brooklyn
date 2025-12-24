export default {
  async fetch(request, env) {
    const { method, pathname } = new URL(request.url);
    const db = env.DB;

    // CORS
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    try {
      // GET /api/admin/reservas - List all reservations
      if (method === 'GET') {
        const url = new URL(request.url);
        const barbeiro_id = url.searchParams.get('barbeiro_id');
        const data = url.searchParams.get('data'); // YYYY-MM-DD
        const status = url.searchParams.get('status');

        let query = `
          SELECT 
            r.id,
            r.cliente_id,
            c.nome as cliente_nome,
            c.email as cliente_email,
            c.telefone as cliente_telefone,
            r.barbeiro_id,
            b.nome as barbeiro_nome,
            r.servico_id,
            s.nome as servico_nome,
            s.duracao,
            s.preco,
            r.data_hora,
            r.comentario,
            r.status,
            r.criado_em,
            r.atualizado_em
          FROM reservas r
          LEFT JOIN clientes c ON r.cliente_id = c.id
          LEFT JOIN barbeiros b ON r.barbeiro_id = b.id
          LEFT JOIN servicos s ON r.servico_id = s.id
          WHERE 1=1
        `;

        const params = [];

        if (barbeiro_id) {
          query += ` AND r.barbeiro_id = ?`;
          params.push(parseInt(barbeiro_id));
        }

        if (data) {
          query += ` AND DATE(r.data_hora) = ?`;
          params.push(data);
        }

        if (status) {
          query += ` AND r.status = ?`;
          params.push(status);
        }

        query += ` ORDER BY r.data_hora DESC`;

        const { results } = await db.prepare(query).bind(...params).all();

        return new Response(JSON.stringify(results || []), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // POST /api/admin/reservas - Create reservation
      if (method === 'POST') {
        const body = await request.json();
        const { cliente_id, barbeiro_id, servico_id, data_hora, comentario, enviar_confirmacao } = body;

        if (!cliente_id || !barbeiro_id || !servico_id || !data_hora) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
          );
        }

        const result = await db
          .prepare(`
            INSERT INTO reservas (cliente_id, barbeiro_id, servico_id, data_hora, comentario, status, criado_em, atualizado_em)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `)
          .bind(cliente_id, barbeiro_id, servico_id, data_hora, comentario || '', 'confirmada')
          .run();

        // TODO: Send email confirmation if enviar_confirmacao is true

        return new Response(
          JSON.stringify({ id: result.meta.last_row_id, success: true }),
          { headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }

      // PUT /api/admin/reservas/:id - Update reservation
      if (method === 'PUT') {
        const id = pathname.split('/').pop();
        const body = await request.json();
        const { status, comentario, nota_privada } = body;

        await db
          .prepare(`
            UPDATE reservas
            SET status = ?, comentario = ?, nota_privada = ?, atualizado_em = datetime('now')
            WHERE id = ?
          `)
          .bind(status || 'confirmada', comentario || '', nota_privada || '', id)
          .run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Access-Control-Allow-Origin': '*' },
        });
      }

      // DELETE /api/admin/reservas/:id - Cancel reservation
      if (method === 'DELETE') {
        const id = pathname.split('/').pop();

        await db
          .prepare(`
            UPDATE reservas
            SET status = 'cancelada', atualizado_em = datetime('now')
            WHERE id = ?
          `)
          .bind(id)
          .run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Access-Control-Allow-Origin': '*' },
        });
      }

      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    } catch (error) {
      console.error('API Error:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Internal server error' }),
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }
  },
};
