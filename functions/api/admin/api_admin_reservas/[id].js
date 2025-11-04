// DELETE - Eliminar reserva
export async function onRequestDelete({ params, env }) {
    try {
        const { id } = params;

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

// PUT - Atualizar reserva
export async function onRequestPut({ params, request, env }) {
    try {
        const { id } = params;
        const data = await request.json();

        // Validações
        if (!data.barbeiro_id || !data.servico_id || !data.nome_cliente || !data.data_hora) {
            return new Response(JSON.stringify({
                error: 'Campos obrigatórios em falta'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await env.DB.prepare(
            `UPDATE reservas 
            SET barbeiro_id = ?, servico_id = ?, nome_cliente = ?, 
                email = ?, telefone = ?, data_hora = ?, 
                comentario = ?, nota_privada = ?, status = ?
            WHERE id = ?`
        ).bind(
            parseInt(data.barbeiro_id),
            parseInt(data.servico_id),
            data.nome_cliente,
            data.email || null,
            data.telefone || null,
            data.data_hora,
            data.comentario || null,
            data.nota_privada || null,
            data.status || 'confirmada',
            parseInt(id)
        ).run();

        if (!result.success) {
            throw new Error('Falha ao atualizar no banco de dados');
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