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
      // GET /api/admin/horarios-indisponiveis - List all unavailable times
      if (method === 'GET') {
        const url = new URL(request.url);
        const barbeiro_id = url.searchParams.get('barbeiro_id');
        const data = url.searchParams.get('data'); // YYYY-MM-DD

        let query = `
          SELECT 
            id,
            barbeiro_id,
            data_hora_inicio,
            data_hora_fim,
            tipo,
            motivo,
            is_all_day,
            recurrence_type,
            recurrence_end_date,
            created_at
          FROM horarios_indisponiveis
          WHERE 1=1
        `;

        const params = [];

        if (barbeiro_id) {
          query += ` AND barbeiro_id = ?`;
          params.push(parseInt(barbeiro_id));
        }

        if (data) {
          query += ` AND DATE(data_hora_inicio) = ?`;
          params.push(data);
        }

        query += ` ORDER BY data_hora_inicio DESC`;

        const { results } = await db.prepare(query).bind(...params).all();

        return new Response(JSON.stringify(results || []), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // POST /api/admin/horarios-indisponiveis - Create unavailable time
      if (method === 'POST') {
        const body = await request.json();
        const { barbeiro_id, data_hora_inicio, data_hora_fim, tipo, motivo, is_all_day, recurrence_type, recurrence_end_date } = body;

        if (!barbeiro_id || !data_hora_inicio || !data_hora_fim || !tipo) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
          );
        }

        const result = await db
          .prepare(`
            INSERT INTO horarios_indisponiveis 
            (barbeiro_id, data_hora_inicio, data_hora_fim, tipo, motivo, is_all_day, recurrence_type, recurrence_end_date, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `)
          .bind(
            barbeiro_id,
            data_hora_inicio,
            data_hora_fim,
            tipo,
            motivo || '',
            is_all_day ? 1 : 0,
            recurrence_type || 'none',
            recurrence_end_date || null
          )
          .run();

        return new Response(
          JSON.stringify({ id: result.meta.last_row_id, success: true }),
          { headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }

      // DELETE /api/admin/horarios-indisponiveis/:id - Delete unavailable time
      if (method === 'DELETE') {
        const id = pathname.split('/').pop();

        await db
          .prepare(`DELETE FROM horarios_indisponiveis WHERE id = ?`)
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
