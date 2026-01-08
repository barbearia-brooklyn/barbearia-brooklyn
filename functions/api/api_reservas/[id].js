// functions/api/api_reservas/[id].js

import { createNotification, NotificationTypes, formatCancelledMessage, formatEditedMessage } from '../helpers/notifications.js';

async function verifyJWT(token, secret) {
    try {
        const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
        const data = `${encodedHeader}.${encodedPayload}`;

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const signature = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0));
        const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));

        if (!valid) return null;

        const payload = JSON.parse(atob(encodedPayload));
        if (payload.exp && payload.exp < Date.now() / 1000) return null;

        return payload;
    } catch {
        return null;
    }
}

// GET - Obter detalhes de uma reserva específica
export async function onRequestGet({ params, request, env }) {
    try {
        const { id } = params;

        // Verificar autenticação
        const cookies = request.headers.get('Cookie') || '';
        const tokenMatch = cookies.match(/auth_token=([^;]+)/);

        if (!tokenMatch) {
            return new Response(JSON.stringify({ error: 'Autenticação necessária' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const userPayload = await verifyJWT(tokenMatch[1], env.JWT_SECRET);
        if (!userPayload) {
            return new Response(JSON.stringify({ error: 'Sessão expirada' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Buscar reserva com join nas tabelas relacionadas
        const reserva = await env.DB.prepare(`
            SELECT 
                r.id,
                r.cliente_id,
                r.barbeiro_id,
                r.servico_id,
                r.data_hora,
                r.comentario,
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
            WHERE r.id = ? AND r.cliente_id = ?
        `).bind(parseInt(id), userPayload.id).first();

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

// PUT - Atualizar reserva (apenas se >5h antes)
export async function onRequestPut({ params, request, env }) {
    try {
        const { id } = params;
        const data = await request.json();

        // Verificar autenticação
        const cookies = request.headers.get('Cookie') || '';
        const tokenMatch = cookies.match(/auth_token=([^;]+)/);

        if (!tokenMatch) {
            return new Response(JSON.stringify({ error: 'Autenticação necessária' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const userPayload = await verifyJWT(tokenMatch[1], env.JWT_SECRET);
        if (!userPayload) {
            return new Response(JSON.stringify({ error: 'Sessão expirada' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Buscar reserva para verificar se pertence ao cliente
        const reserva = await env.DB.prepare(`
            SELECT r.*, b.nome as barbeiro_nome, s.nome as servico_nome, c.nome as cliente_nome
            FROM reservas r
            JOIN barbeiros b ON r.barbeiro_id = b.id
            JOIN servicos s ON r.servico_id = s.id
            JOIN clientes c ON r.cliente_id = c.id
            WHERE r.id = ?
        `).bind(parseInt(id)).first();

        if (!reserva) {
            return new Response(JSON.stringify({ error: 'Reserva não encontrada' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar se a reserva pertence ao cliente autenticado
        if (reserva.cliente_id !== userPayload.id) {
            return new Response(JSON.stringify({ error: 'Não tem permissão para editar esta reserva' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar se a reserva está a mais de 5 horas
        const dataHora = new Date(reserva.data_hora);
        const now = new Date();
        const hoursUntil = (dataHora - now) / (1000 * 60 * 60);

        if (hoursUntil <= 5) {
            return new Response(JSON.stringify({
                error: 'Não é possível modificar reservas com menos de 5 horas de antecedência'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Se for apenas cancelamento (status)
        if (data.status && Object.keys(data).length === 1) {
            const result = await env.DB.prepare(
                'UPDATE reservas SET status = ? WHERE id = ?'
            ).bind(data.status, parseInt(id)).run();

            if (!result.success) {
                throw new Error('Falha ao atualizar status');
            }

            return new Response(JSON.stringify({
                success: true,
                message: 'Reserva atualizada com sucesso'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Se for edição completa (data/hora, serviço, barbeiro, comentário)
        if (data.barbeiro_id || data.servico_id || data.data_hora || data.comentario !== undefined) {
            // Validar nova disponibilidade se mudar data/hora/barbeiro
            if (data.data_hora || data.barbeiro_id) {
                const novaDataHora = data.data_hora || reserva.data_hora;
                const novoBarbeiro = data.barbeiro_id || reserva.barbeiro_id;

                const { results } = await env.DB.prepare(
                    'SELECT id FROM reservas WHERE barbeiro_id = ? AND data_hora = ? AND status IN ("confirmada", "faltou", "concluida") AND id != ?'
                ).bind(novoBarbeiro, novaDataHora, parseInt(id)).all();

                if (results.length > 0) {
                    return new Response(JSON.stringify({ error: 'Horário já reservado' }), {
                        status: 409,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }

            // Preparar objeto de mudanças para notificação
            const changes = {};

            if (data.barbeiro_id && data.barbeiro_id !== reserva.barbeiro_id) {
                const novoBarbeiro = await env.DB.prepare(
                    'SELECT nome FROM barbeiros WHERE id = ?'
                ).bind(data.barbeiro_id).first();
                
                changes.barbeiro = {
                    anterior: reserva.barbeiro_nome,
                    novo: novoBarbeiro.nome
                };
            }

            if (data.servico_id && data.servico_id !== reserva.servico_id) {
                const novoServico = await env.DB.prepare(
                    'SELECT nome FROM servicos WHERE id = ?'
                ).bind(data.servico_id).first();
                
                changes.servico = {
                    anterior: reserva.servico_nome,
                    novo: novoServico.nome
                };
            }

            if (data.data_hora && data.data_hora !== reserva.data_hora) {
                changes.data_hora = {
                    anterior: reserva.data_hora,
                    novo: data.data_hora
                };
            }
            
            // Detectar mudança apenas de comentário
            if (data.comentario !== undefined && data.comentario !== reserva.comentario && Object.keys(changes).length === 0) {
                changes.comentario = true;
            }

            // Atualizar reserva
            const result = await env.DB.prepare(`
                UPDATE reservas 
                SET barbeiro_id = COALESCE(?, barbeiro_id),
                    servico_id = COALESCE(?, servico_id),
                    data_hora = COALESCE(?, data_hora),
                    comentario = COALESCE(?, comentario),
                    atualizado_em = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(
                data.barbeiro_id ? parseInt(data.barbeiro_id) : null,
                data.servico_id ? parseInt(data.servico_id) : null,
                data.data_hora || null,
                data.comentario !== undefined ? data.comentario : null,
                parseInt(id)
            ).run();

            if (!result.success) {
                throw new Error('Falha ao atualizar reserva');
            }

            // 🔔 CRIAR NOTIFICAÇÃO (só para CLIENTES)
            if (Object.keys(changes).length > 0) {
                try {
                    console.log('🔔 Creating notification for edited booking:', changes);
                    const message = formatEditedMessage(reserva.cliente_nome, changes);
                    
                    await createNotification(env.DB, {
                        type: NotificationTypes.EDITED,
                        message: message,
                        reservationId: parseInt(id),
                        clientName: reserva.cliente_nome,
                        barberId: data.barbeiro_id || reserva.barbeiro_id
                    });
                    
                    console.log('✅ Notification created for client edited booking');
                } catch (notifError) {
                    console.error('❌ Error creating notification:', notifError);
                }
            }

            return new Response(JSON.stringify({
                success: true,
                message: 'Reserva atualizada com sucesso'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Nenhum dado para atualizar' }), {
            status: 400,
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

// DELETE - Cancelar reserva (soft delete - muda status)
export async function onRequestDelete({ params, request, env }) {
    try {
        const { id } = params;
        console.log('🚫 Starting DELETE request for reservation:', id);

        // Verificar autenticação
        const cookies = request.headers.get('Cookie') || '';
        const tokenMatch = cookies.match(/auth_token=([^;]+)/);

        if (!tokenMatch) {
            console.log('❌ No auth token found');
            return new Response(JSON.stringify({ error: 'Autenticação necessária' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const userPayload = await verifyJWT(tokenMatch[1], env.JWT_SECRET);
        if (!userPayload) {
            console.log('❌ Invalid JWT');
            return new Response(JSON.stringify({ error: 'Sessão expirada' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        console.log('✅ User authenticated:', userPayload.id);

        // Buscar reserva com informações para notificação
        const reserva = await env.DB.prepare(`
            SELECT r.id, r.cliente_id, r.data_hora, r.status, r.barbeiro_id,
                   c.nome as cliente_nome, b.nome as barbeiro_nome
            FROM reservas r
            JOIN clientes c ON r.cliente_id = c.id
            JOIN barbeiros b ON r.barbeiro_id = b.id
            WHERE r.id = ?
        `).bind(parseInt(id)).first();

        if (!reserva) {
            console.log('❌ Reservation not found:', id);
            return new Response(JSON.stringify({ error: 'Reserva não encontrada' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        console.log('✅ Reservation found:', reserva);

        // Verificar propriedade
        if (reserva.cliente_id !== userPayload.id) {
            console.log('❌ User does not own this reservation');
            return new Response(JSON.stringify({ error: 'Não tem permissão para cancelar esta reserva' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar se está a mais de 5 horas
        const dataHora = new Date(reserva.data_hora);
        const now = new Date();
        const hoursUntil = (dataHora - now) / (1000 * 60 * 60);
        console.log(`⏰ Hours until reservation: ${hoursUntil}`);

        if (hoursUntil <= 5) {
            console.log('❌ Too close to cancel (less than 5h)');
            return new Response(JSON.stringify({
                error: 'Não é possível cancelar reservas com menos de 5 horas de antecedência'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Cancelar (soft delete)
        console.log('🚫 Cancelling reservation...');
        const result = await env.DB.prepare(
            'UPDATE reservas SET status = ? WHERE id = ?'
        ).bind('cancelada', parseInt(id)).run();

        if (!result.success) {
            throw new Error('Falha ao cancelar reserva');
        }
        console.log('✅ Reservation cancelled successfully');

        // 🔔 CRIAR NOTIFICAÇÃO (só para CLIENTES)
        try {
            console.log('========== CREATING CANCEL NOTIFICATION ==========');
            console.log('Client:', reserva.cliente_nome);
            console.log('Barber:', reserva.barbeiro_nome);
            console.log('Date/Time:', reserva.data_hora);
            
            const message = formatCancelledMessage(
                reserva.cliente_nome,
                reserva.barbeiro_nome,
                dataHora.toLocaleDateString('pt-PT'),
                dataHora.toTimeString().substring(0, 5)
            );
            
            console.log('Message:', message);
            
            await createNotification(env.DB, {
                type: NotificationTypes.CANCELLED,
                message: message,
                reservationId: parseInt(id),
                clientName: reserva.cliente_nome,
                barberId: reserva.barbeiro_id
            });
            
            console.log('✅✅✅ NOTIFICATION CREATED SUCCESSFULLY!');
        } catch (notifError) {
            console.error('❌❌❌ ERROR CREATING NOTIFICATION:', notifError);
            console.error('Stack:', notifError.stack);
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Reserva cancelada com sucesso'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao cancelar reserva:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao cancelar reserva',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}