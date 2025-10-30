export async function onRequestGet({ env, request }) {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
        return new Response(JSON.stringify({ error: 'Email não fornecido' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const reservas = await env.DB.prepare(
            `SELECT r.*, b.nome as barbeiro_nome, s.nome as servico_nome
             FROM reservas r
             JOIN barbeiros b ON r.barbeiro_id = b.id
             JOIN servicos s ON r.servico_id = s.id
             WHERE r.email = ?
             ORDER BY r.data_hora DESC`
        ).bind(email).all();

        return new Response(JSON.stringify(reservas.results), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
