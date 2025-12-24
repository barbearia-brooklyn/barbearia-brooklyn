export default {
  async fetch(request, env) {
    const { method } = new URL(request.url);
    const db = env.DB;

    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    try {
      if (method === 'GET') {
        const { results } = await db
          .prepare(`
            SELECT 
              id,
              nome,
              especialidades,
              foto,
              ativo
            FROM barbeiros
            WHERE ativo = 1
            ORDER BY nome
          `)
          .all();

        return new Response(JSON.stringify(results || []), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
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
