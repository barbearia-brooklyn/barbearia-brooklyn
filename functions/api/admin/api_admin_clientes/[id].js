/**
 * API Admin - Cliente Individual
 * Operações em cliente específico (GET, PUT, DELETE)
 * 
 * NOTA: Auth temporáriamente removida para permitir integração Moloni
 */

// GET - Buscar cliente por ID
export async function onRequestGet({ request, env, params }) {
    try {
        // TODO: Restaurar auth após Moloni configurado
        // const authResult = await verifyAdminToken(request, env);
        // if (!authResult.valid) {
        //     return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        //         status: 401,
        //         headers: { 'Content-Type': 'application/json' }
        //     });
        // }

        const clienteId = parseInt(params.id);

        if (isNaN(clienteId)) {
            return new Response(JSON.stringify({ error: 'ID inválido' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const cliente = await env.DB.prepare(
            `SELECT 
                id, nome, email, telefone, nif, data_nascimento, notas,
                criado_em, atualizado_em
            FROM clientes 
            WHERE id = ?`
        ).bind(clienteId).first();

        if (!cliente) {
            return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Buscar histórico de reservas
        const { results: reservas } = await env.DB.prepare(
            `SELECT 
                r.id, r.data_hora, r.status,
                b.nome as barbeiro_nome,
                s.nome as servico_nome, s.preco
            FROM reservas r
            INNER JOIN barbeiros b ON r.barbeiro_id = b.id
            INNER JOIN servicos s ON r.servico_id = s.id
            WHERE r.cliente_id = ?
            ORDER BY r.data_hora DESC
            LIMIT 10`
        ).bind(clienteId).all();

        return new Response(JSON.stringify({
            ...cliente,
            reservas: reservas || []
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao buscar cliente',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// PUT - Atualizar cliente (mantém auth)
export async function onRequestPut({ request, env, params }) {
    try {
        // Mantém auth em updates por segurança
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Não autorizado' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const clienteId = parseInt(params.id);
        const data = await request.json();

        // Verificar se cliente existe
        const existing = await env.DB.prepare(
            'SELECT id FROM clientes WHERE id = ?'
        ).bind(clienteId).first();

        if (!existing) {
            return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Construir query de atualização
        const updates = [];
        const params_query = [];

        if (data.nome !== undefined) {
            updates.push('nome = ?');
            params_query.push(data.nome);
        }
        if (data.email !== undefined) {
            updates.push('email = ?');
            params_query.push(data.email || null);
        }
        if (data.telefone !== undefined) {
            updates.push('telefone = ?');
            params_query.push(data.telefone);
        }
        if (data.nif !== undefined) {
            updates.push('nif = ?');
            params_query.push(data.nif || null);
        }
        if (data.data_nascimento !== undefined) {
            updates.push('data_nascimento = ?');
            params_query.push(data.data_nascimento || null);
        }
        if (data.notas !== undefined) {
            updates.push('notas = ?');
            params_query.push(data.notas || null);
        }

        if (updates.length === 0) {
            return new Response(JSON.stringify({ error: 'Nenhum campo para atualizar' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        updates.push('atualizado_em = CURRENT_TIMESTAMP');
        params_query.push(clienteId);

        const query = `UPDATE clientes SET ${updates.join(', ')} WHERE id = ?`;
        const result = await env.DB.prepare(query).bind(...params_query).run();

        if (!result.success) {
            throw new Error('Falha ao atualizar cliente');
        }

        // Buscar cliente atualizado
        const updated = await env.DB.prepare(
            'SELECT * FROM clientes WHERE id = ?'
        ).bind(clienteId).first();

        return new Response(JSON.stringify({
            success: true,
            cliente: updated,
            message: 'Cliente atualizado com sucesso'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao atualizar cliente',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// DELETE - Remover cliente (mantém auth)
export async function onRequestDelete({ request, env, params }) {
    try {
        // Mantém auth em deletes por segurança
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Não autorizado' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const clienteId = parseInt(params.id);

        // Verificar se cliente existe
        const existing = await env.DB.prepare(
            'SELECT id FROM clientes WHERE id = ?'
        ).bind(clienteId).first();

        if (!existing) {
            return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar se tem reservas ativas
        const { results: reservasAtivas } = await env.DB.prepare(
            `SELECT id FROM reservas 
             WHERE cliente_id = ? 
             AND status IN ('confirmada', 'pendente') 
             AND data_hora >= datetime('now')`
        ).bind(clienteId).all();

        if (reservasAtivas && reservasAtivas.length > 0) {
            return new Response(JSON.stringify({
                error: 'Não é possível eliminar cliente com reservas ativas',
                reservas_ativas: reservasAtivas.length
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Deletar cliente
        const result = await env.DB.prepare(
            'DELETE FROM clientes WHERE id = ?'
        ).bind(clienteId).run();

        if (!result.success) {
            throw new Error('Falha ao eliminar cliente');
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Cliente eliminado com sucesso'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao eliminar cliente:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao eliminar cliente',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}