export async function onRequestDelete({ request, env, params }) {
    try {
        const id = params.id;

        if (!id || isNaN(id)) {
            return new Response(JSON.stringify({ error: 'ID inválido' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await env.DB.prepare(
            `DELETE FROM horarios_indisponiveis WHERE id = ?`
        ).bind(parseInt(id)).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Erro ao eliminar horário indisponível:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
