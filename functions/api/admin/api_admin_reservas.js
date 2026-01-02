/**
 * API Admin - Reservas com Filtro por Role
 * Admin: vê todas as reservas
 * Barbeiro: vê apenas suas próprias reservas
 */

import { authenticate, hasPermission } from './auth.js';

// GET - Listar reservas
export async function onRequestGet({ request, env }) {
    try {
        console.log('✅ GET Reservas - Iniciando...');

        // AUTENTICAÇÃO
        const authResult = await authenticate(request, env);
        if (authResult instanceof Response) return authResult;
        const user = authResult;

        console.log('👤 User autenticado:', user.username, 'Role:', user.role);

        const url = new URL(request.url);
        const barbeiro_id = url.searchParams.get('barbeiro_id');
        const data = url.searchParams.get('data');
        const data_inicio = url.searchParams.get('data_inicio');
        const data_fim = url.searchParams.get('data_fim');
        const status = url.searchParams.get('status');
        const cliente_id = url.searchParams.get('cliente_id');

        console.log('Parâmetros:', { barbeiro_id, data, data_inicio, data_fim, status, cliente_id });

        let query = `
            SELECT 
                r.id,
                r.cliente_id,
                r.barbeiro_id,
                r.servico_id,
                r.data_hora,
                r.comentario,
                r.nota_privada,
                r.status,
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
            WHERE 1=1
        `;

        const params = [];

        // FILTRO POR ROLE: Barbeiro só vê suas reservas
        if (user.role === 'barbeiro' && user.barbeiro_id) {
            query += ` AND r.barbeiro_id = ?`;
            params.push(user.barbeiro_id);
            console.log('🔒 Filtro barbeiro aplicado:', user.barbeiro_id);
        }

        // Admin pode filtrar por barbeiro específico
        if (user.role === 'admin' && barbeiro_id) {
            query += ' AND r.barbeiro_id = ?';
            params.push(parseInt(barbeiro_id));
        }

        if (cliente_id) {
            query += ' AND r.cliente_id = ?';
            params.push(parseInt(cliente_id));
        }

        // Filtro por data exata
        if (data) {
            query += ' AND DATE(r.data_hora) = DATE(?)';
            params.push(data);
        }

        // Filtro por intervalo de datas
        if (data_inicio && data_fim) {
            query += ' AND DATE(r.data_hora) BETWEEN DATE(?) AND DATE(?)';
            params.push(data_inicio, data_fim);
        } else if (data_inicio) {
            query += ' AND DATE(r.data_hora) >= DATE(?)';
            params.push(data_inicio);
        } else if (data_fim) {
            query += ' AND DATE(r.data_hora) <= DATE(?)';
            params.push(data_fim);
        }

        if (status) {
            query += ' AND r.status = ?';
            params.push(status);
        }

        query += ' ORDER BY r.data_hora DESC';

        console.log('Executando query...');
        const stmt = env.DB.prepare(query);
        const { results } = await stmt.bind(...params).all();

        console.log(`✅ Reservas encontradas: ${results ? results.length : 0}`);

        const response = {
            reservas: results || [],
            total: results ? results.length : 0,
            user: {
                role: user.role,
                barbeiro_id: user.barbeiro_id
            }
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar reservas:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao buscar reservas',
            details: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// POST - Criar nova reserva (ADMIN + BARBEIRO)
export async function onRequestPost({ request, env }) {
    try {
        console.log('✅ POST Reserva - Iniciando...');

        // AUTENTICAÇÃO
        const authResult = await authenticate(request, env);
        if (authResult instanceof Response) return authResult;
        const user = authResult;

        console.log('👤 User autenticado:', user.username, 'Role:', user.role);

        const data = await request.json();
        console.log('Dados recebidos:', data);

        // Validações
        if (!data.cliente_id || !data.barbeiro_id || !data.servico_id || !data.data_hora) {
            return new Response(JSON.stringify({
                error: 'Campos obrigatórios em falta: cliente_id, barbeiro_id, servico_id, data_hora'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // PERMISSÃO: Barbeiro só pode criar reservas para si mesmo
        if (user.role === 'barbeiro' && user.barbeiro_id !== parseInt(data.barbeiro_id)) {
            return new Response(JSON.stringify({
                error: 'Você só pode criar reservas para si mesmo'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar se o cliente existe
        console.log('Verificando cliente...');
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

        // Verificar se barbeiro existe
        console.log('Verificando barbeiro...');
        const barbeiro = await env.DB.prepare(
            'SELECT id FROM barbeiros WHERE id = ?'
        ).bind(parseInt(data.barbeiro_id)).first();

        if (!barbeiro) {
            return new Response(JSON.stringify({
                error: 'Barbeiro não encontrado'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar se serviço existe
        console.log('Verificando serviço...');
        const servico = await env.DB.prepare(
            'SELECT id FROM servicos WHERE id = ?'
        ).bind(parseInt(data.servico_id)).first();

        if (!servico) {
            return new Response(JSON.stringify({
                error: 'Serviço não encontrado'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar disponibilidade
        console.log('Verificando disponibilidade...');
        const { results: conflicts } = await env.DB.prepare(
            `SELECT id FROM reservas 
             WHERE barbeiro_id = ? 
             AND data_hora = ? 
             AND status IN ('confirmada', 'faltou', 'concluida')`
        ).bind(parseInt(data.barbeiro_id), data.data_hora).all();

        if (conflicts && conflicts.length > 0) {
            return new Response(JSON.stringify({
                error: 'Horário já reservado para este barbeiro'
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Criar reserva
        console.log('Criando reserva...');
        const result = await env.DB.prepare(
            `INSERT INTO reservas (cliente_id, barbeiro_id, servico_id, data_hora, comentario, nota_privada, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            parseInt(data.cliente_id),
            parseInt(data.barbeiro_id),
            parseInt(data.servico_id),
            data.data_hora,
            data.comentario || data.notas || null,
            data.nota_privada || null,
            data.status || 'confirmada'
        ).run();

        if (!result.success) {
            throw new Error('Falha ao criar reserva');
        }

        console.log('✅ Reserva criada com ID:', result.meta.last_row_id);

        // Buscar reserva criada com todos os detalhes
        const newReserva = await env.DB.prepare(
            `SELECT 
                r.*,
                c.nome as cliente_nome,
                b.nome as barbeiro_nome,
                s.nome as servico_nome,
                s.preco as servico_preco
             FROM reservas r
             INNER JOIN clientes c ON r.cliente_id = c.id
             INNER JOIN barbeiros b ON r.barbeiro_id = b.id
             INNER JOIN servicos s ON r.servico_id = s.id
             WHERE r.id = ?`
        ).bind(result.meta.last_row_id).first();

        return new Response(JSON.stringify({
            success: true,
            id: result.meta.last_row_id,
            reserva: newReserva,
            message: 'Reserva criada com sucesso'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Erro ao criar reserva:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao criar reserva',
            details: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// PUT - Atualizar reserva
export async function onRequestPut({ request, env }) {
    try {
        console.log('✅ PUT Reserva - Iniciando...');

        // AUTENTICAÇÃO
        const authResult = await authenticate(request, env);
        if (authResult instanceof Response) return authResult;
        const user = authResult;

        const url = new URL(request.url);
        const id = url.pathname.split('/').pop();
        const data = await request.json();

        console.log('Atualizando reserva ID:', id);

        // Buscar reserva existente
        const reserva = await env.DB.prepare(
            'SELECT * FROM reservas WHERE id = ?'
        ).bind(parseInt(id)).first();

        if (!reserva) {
            return new Response(JSON.stringify({
                error: 'Reserva não encontrada'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // PERMISSÃO: Barbeiro só pode atualizar suas próprias reservas
        if (user.role === 'barbeiro' && user.barbeiro_id !== reserva.barbeiro_id) {
            return new Response(JSON.stringify({
                error: 'Você só pode atualizar suas próprias reservas'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Atualizar apenas campos fornecidos
        const updates = [];
        const params = [];

        if (data.status) {
            updates.push('status = ?');
            params.push(data.status);
        }

        if (data.comentario !== undefined) {
            updates.push('comentario = ?');
            params.push(data.comentario);
        }

        if (data.nota_privada !== undefined) {
            updates.push('nota_privada = ?');
            params.push(data.nota_privada);
        }

        if (data.data_hora) {
            updates.push('data_hora = ?');
            params.push(data.data_hora);
        }

        if (updates.length === 0) {
            return new Response(JSON.stringify({
                error: 'Nenhum campo para atualizar'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        params.push(parseInt(id));

        await env.DB.prepare(
            `UPDATE reservas SET ${updates.join(', ')} WHERE id = ?`
        ).bind(...params).run();

        console.log('✅ Reserva atualizada');

        return new Response(JSON.stringify({
            success: true,
            message: 'Reserva atualizada com sucesso'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar reserva:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao atualizar reserva',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// DELETE - Deletar reserva
export async function onRequestDelete({ request, env }) {
    try {
        console.log('✅ DELETE Reserva - Iniciando...');

        // AUTENTICAÇÃO
        const authResult = await authenticate(request, env);
        if (authResult instanceof Response) return authResult;
        const user = authResult;

        const url = new URL(request.url);
        const id = url.pathname.split('/').pop();

        console.log('Deletando reserva ID:', id);

        // Buscar reserva existente
        const reserva = await env.DB.prepare(
            'SELECT * FROM reservas WHERE id = ?'
        ).bind(parseInt(id)).first();

        if (!reserva) {
            return new Response(JSON.stringify({
                error: 'Reserva não encontrada'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // PERMISSÃO: Barbeiro só pode deletar suas próprias reservas
        if (user.role === 'barbeiro' && user.barbeiro_id !== reserva.barbeiro_id) {
            return new Response(JSON.stringify({
                error: 'Você só pode deletar suas próprias reservas'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await env.DB.prepare(
            'DELETE FROM reservas WHERE id = ?'
        ).bind(parseInt(id)).run();

        console.log('✅ Reserva deletada');

        return new Response(JSON.stringify({
            success: true,
            message: 'Reserva deletada com sucesso'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Erro ao deletar reserva:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao deletar reserva',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
