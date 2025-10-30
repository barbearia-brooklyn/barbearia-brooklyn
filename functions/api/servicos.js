export async function onRequestGet({ env }) {
    try {
        const servicos = await env.DB.prepare(
            'SELECT id, nome, duracao FROM servicos'
        ).all();

        return new Response(JSON.stringify(servicos.results), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
