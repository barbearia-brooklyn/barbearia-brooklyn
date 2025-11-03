export async function onRequestGet({ env, request }) {
    const url = new URL(request.url);
    const barbeiroId = url.searchParams.get('barbeiroId');
    const fromDate = url.searchParams.get('fromDate');

    try {
        let query = `
            SELECT * FROM horarios_indisponiveis
            WHERE 1=1
        `;

        const bindings = [];

        if (barbeiroId) {
            query += ` AND barbeiro_id = ?`;
            bindings.push(parseInt(barbeiroId));
        }

        if (fromDate) {
            query += ` AND DATE(data_hora_fim) >= ?`;
            bindings.push(fromDate);
        }

        query += ` ORDER BY data_hora_inicio ASC`;

        const stmt = env.DB.prepare(query);
        const horarios = bindings.length > 0
            ? await stmt.bind(...bindings).all()
            : await stmt.all();

        return new Response(JSON.stringify(horarios.results || []), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPost({ request, env }) {
    try {
        const data = await request.json();

        // Inserir horário indisponível
        const result = await env.DB.prepare(
            `INSERT INTO horarios_indisponiveis (barbeiro_id, data_hora_inicio, data_hora_fim, tipo, motivo)
             VALUES (?, ?, ?, ?, ?)`
        ).bind(
            data.barbeiro_id,
            data.data_hora_inicio,
            data.data_hora_fim,
            data.tipo,
            data.motivo || null
        ).run();

        // Cancelar reservas conflitantes
        await env.DB.prepare(
            `UPDATE reservas 
             SET status = 'cancelada'
             WHERE barbeiro_id = ?
             AND status = 'confirmada'
             AND data_hora >= ?
             AND data_hora < ?`
        ).bind(
            data.barbeiro_id,
            data.data_hora_inicio,
            data.data_hora_fim
        ).run();

        return new Response(JSON.stringify({
            success: true,
            id: result.meta.last_row_id
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Erro ao criar horário indisponível:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
