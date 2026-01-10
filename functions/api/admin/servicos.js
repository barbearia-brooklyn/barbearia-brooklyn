/**
 * API Admin - Servicos
 * Returns list of all services from database
 */

export async function onRequestGet({ request, env }) {
    try {
        // Get auth token from header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Não autorizado' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.substring(7);
        
        // Verify admin token
        const adminToken = await env.DB.prepare(
            'SELECT * FROM admin_tokens WHERE token = ? AND expires_at > datetime("now")'
        ).bind(token).first();

        if (!adminToken) {
            return new Response(JSON.stringify({ error: 'Token inválido ou expirado' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get all services
        const servicos = await env.DB.prepare(
            'SELECT id, nome, descricao, duracao, preco, ativo FROM servicos ORDER BY nome'
        ).all();

        return new Response(JSON.stringify({
            success: true,
            servicos: servicos.results || []
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Error fetching services:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao buscar serviços',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Handle OPTIONS request for CORS
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}