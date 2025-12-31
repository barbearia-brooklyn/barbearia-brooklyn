/**
 * API Admin - Cliente Individual
 * Operações em cliente específico (GET, PUT, DELETE)
 * 
 * NOTA: Auth temporáriamente removida para permitir integração Moloni
 */

// GET - Buscar cliente por ID
export async function onRequestGet({ request, env, params }) {
    try {
        const clienteId = parseInt(params.id);

        if (isNaN(clienteId)) {
            return new Response(JSON.stringify({ error: 'ID inválido' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Buscar cliente com total de reservas
        const cliente = await env.DB.prepare(
            `SELECT 
                c.id, 
                c.nome, 
                c.email, 
                c.telefone, 
                c.nif,
                c.criado_em as data_cadastro, 
                c.atualizado_em,
                COUNT(r.id) as total_reservas
            FROM clientes c
            LEFT JOIN reservas r ON c.id = r.cliente_id
            WHERE c.id = ?
            GROUP BY c.id`
        ).bind(clienteId).first();

        if (!cliente) {
            return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            cliente: cliente
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

// PUT - Atualizar cliente
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

        // Construir query de atualização (apenas campos que existem)
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

// DELETE - Remover cliente
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
             AND status ='confirmada' 
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