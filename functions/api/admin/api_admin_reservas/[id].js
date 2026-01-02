// functions/admin/api/api_admin_reservas/[id].js
// API para operações em reserva específica (ADMIN)

// GET - Obter detalhes de uma reserva específica
export async function onRequestGet({ params, env }) {
    try {
        const { id } = params;

        const reserva = await env.DB.prepare(`
            SELECT 
                r.id,
                r.cliente_id,
                r.barbeiro_id,
                r.servico_id,
                r.data_hora,
                r.comentario,
                r.nota_privada,
                r.status,
                r.created_by,
                r.duracao_minutos,
                r.criado_em,
                c.nome as cliente_nome,
                c.email as cliente_email,
                c.telefone as cliente_telefone,
                b.nome as barbeiro_nome,
                s.nome as servico_nome,
                s.duracao as servico_duracao,
                s.preco as servico_preco
            FROM reservas r
            INNER JOIN clientes c ON r.cliente_id = c.id
            INNER JOIN barbeiros b ON r.barbeiro_id = b.id
            INNER JOIN servicos s ON r.servico_id = s.id
            WHERE r.id = ?
        `).bind(parseInt(id)).first();

        if (!reserva) {
            return new Response(JSON.stringify({ error: 'Reserva não encontrada' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify(reserva), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao obter reserva:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao obter reserva',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// PUT - Atualizar reserva (ADMIN - sem restrições de tempo)
export async function onRequestPut({ params, request, env }) {
    try {
        const { id } = params;
        const data = await request.json();

        // Verificar se reserva existe
        const reservaAtual = await env.DB.prepare(
            'SELECT id, cliente_id FROM reservas WHERE id = ?'
        ).bind(parseInt(id)).first();

        if (!reservaAtual) {
            return new Response(JSON.stringify({ error: 'Reserva não encontrada' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Se for apenas atualização de status ou nota privada (rápido)
        if (data.status && !data.barbeiro_id && !data.servico_id && !data.data_hora) {
            const result = await env.DB.prepare(
                `UPDATE reservas 
                 SET status = ?, nota_privada = COALESCE(?, nota_privada)
                 WHERE id = ?`
            ).bind(
                data.status,
                data.nota_privada || null,
                parseInt(id)
            ).run();

            if (!result.success) {
                throw new Error('Falha ao atualizar status');
            }

            return new Response(JSON.stringify({
                success: true,
                message: 'Status atualizado com sucesso'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Atualização completa
        if (!data.cliente_id || !data.barbeiro_id || !data.servico_id || !data.data_hora) {
            return new Response(JSON.stringify({
                error: 'Campos obrigatórios em falta para edição completa'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar se o cliente existe
        const cliente = await env.DB.prepare(
            'SELECT id FROM clientes WHERE id = ?'
        ).bind(parseInt(data.cliente_id)).first();

        if (!cliente) {
            return new Response(JSON.stringify({
                error: 'Cliente não encontrado'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar disponibilidade (exceto própria reserva)
        const { results } = await env.DB.prepare(
            'SELECT id FROM reservas WHERE barbeiro_id = ? AND data_hora = ? AND status IN ("confirmada", "faltou", "concluida") AND id != ?'
        ).bind(data.barbeiro_id, data.data_hora, parseInt(id)).all();

        if (results.length > 0) {
            return new Response(JSON.stringify({ error: 'Horário já reservado' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Atualizar reserva
        const result = await env.DB.prepare(
            `UPDATE reservas 
            SET cliente_id = ?, barbeiro_id = ?, servico_id = ?, 
                data_hora = ?, comentario = ?, nota_privada = ?, status = ?, duracao_minutos = ?
            WHERE id = ?`
        ).bind(
            parseInt(data.cliente_id),
            parseInt(data.barbeiro_id),
            parseInt(data.servico_id),
            data.data_hora,
            data.comentario || null,
            data.nota_privada || null,
            data.status || 'confirmada',
            data.duracao_minutos ? parseInt(data.duracao_minutos) : null,
            parseInt(id)
        ).run();

        if (!result.success) {
            throw new Error('Falha ao atualizar reserva');
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Reserva atualizada com sucesso'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao atualizar reserva:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao atualizar reserva',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// DELETE - Eliminar reserva permanentemente (ADMIN)
export async function onRequestDelete({ params, env }) {
    try {
        const { id } = params;

        // Verificar se existe
        const reserva = await env.DB.prepare(
            'SELECT id FROM reservas WHERE id = ?'
        ).bind(parseInt(id)).first();

        if (!reserva) {
            return new Response(JSON.stringify({ error: 'Reserva não encontrada' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Eliminar permanentemente
        const result = await env.DB.prepare(
            'DELETE FROM reservas WHERE id = ?'
        ).bind(parseInt(id)).run();

        if (!result.success) {
            throw new Error('Falha ao eliminar reserva');
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Reserva eliminada com sucesso'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao eliminar reserva:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao eliminar reserva',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
