export async function onRequestPost({ request, env }) {
    try {
        const data = await request.json();
        
        // Validar dados
        if (!data.nome || !data.email || !data.barbeiro_id || !data.servico_id || !data.data || !data.hora) {
            return new Response(JSON.stringify({ error: 'Dados incompletos' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar disponibilidade
        const dataHora = `${data.data}T${data.hora}:00`;
        const conflito = await env.DB.prepare(
            'SELECT id FROM reservas WHERE barbeiro_id = ? AND data_hora = ? AND status = "confirmada"'
        ).bind(data.barbeiro_id, dataHora).first();

        if (conflito) {
            return new Response(JSON.stringify({ error: 'Horário já reservado' }), { 
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Criar reserva
        const result = await env.DB.prepare(
            `INSERT INTO reservas (nome_cliente, email, telefone, barbeiro_id, servico_id, data_hora, comentario)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            data.nome,
            data.email,
            data.telefone || null,
            data.barbeiro_id,
            data.servico_id,
            dataHora,
            data.comentario || null
        ).run();

        return new Response(JSON.stringify({ 
            success: true, 
            id: result.meta.last_row_id 
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestGet({ env, request }) {
    const url = new URL(request.url);
    const tipo = url.searchParams.get('tipo');

    try {
        if (tipo === 'barbeiros') {
            const barbeiros = await env.DB.prepare(
                'SELECT id, nome, especialidades FROM barbeiros WHERE ativo = 1'
            ).all();
            return new Response(JSON.stringify(barbeiros.results), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (tipo === 'servicos') {
            const servicos = await env.DB.prepare(
                'SELECT id, nome, duracao FROM servicos'
            ).all();
            return new Response(JSON.stringify(servicos.results), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Tipo inválido' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
