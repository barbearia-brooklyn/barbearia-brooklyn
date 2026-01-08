// API para clientes editarem suas próprias reservas
// Permite alteração de serviço, data, hora e barbeiro com pelo menos 5h de antecedência

import { createNotification, NotificationTypes, formatEditedMessage } from './helpers/notifications.js';

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

export async function onRequest(context) {
    const { request, env } = context;

    // Apenas PUT permitido
    if (request.method !== 'PUT') {
        return new Response(JSON.stringify({ error: 'Método não permitido' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    try {
        // Verificar autenticação
        const cookies = request.headers.get('Cookie') || '';
        const tokenMatch = cookies.match(/auth_token=([^;]+)/);

        if (!tokenMatch) {
            return new Response(JSON.stringify({ 
                error: 'Autenticação necessária',
                needsAuth: true 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Verificar JWT
        const userPayload = await verifyJWT(tokenMatch[1], env.JWT_SECRET);
        if (!userPayload) {
            return new Response(JSON.stringify({ 
                error: 'Sessão expirada',
                needsAuth: true 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        const data = await request.json();
        const { 
            reserva_id, 
            nova_data, 
            nova_hora, 
            novo_servico_id,
            novo_barbeiro_id, 
            comentario 
        } = data;

        // Validar campos obrigatórios
        if (!reserva_id || !nova_data || !nova_hora || !novo_barbeiro_id) {
            return new Response(JSON.stringify({ 
                error: 'Dados incompletos. É necessário fornecer reserva_id, nova_data, nova_hora e novo_barbeiro_id' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Buscar reserva atual e verificar proprietário
        const reservaAtual = await env.DB.prepare(
            'SELECT * FROM reservas WHERE id = ? AND cliente_id = ? AND status IN ("confirmada", "faltou", "concluida")'
        ).bind(reserva_id, userPayload.id).first();

        if (!reservaAtual) {
            return new Response(JSON.stringify({ 
                error: 'Reserva não encontrada ou não pode ser editada' 
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Verificar se pode editar (apenas reservas futuras com 5h de antecedência)
        const dataReservaAtual = new Date(reservaAtual.data_hora);
        const agora = new Date();
        const diferencaHoras = (dataReservaAtual - agora) / (1000 * 60 * 60);

        if (diferencaHoras < 5) {
            return new Response(JSON.stringify({ 
                error: 'Só é possível editar reservas com pelo menos 5 horas de antecedência' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Construir nova data/hora
        const novaDataHora = `${nova_data}T${nova_hora}:00`;
        
        // Verificar se a nova data é futura
        const novaDataReserva = new Date(novaDataHora);
        if (novaDataReserva <= agora) {
            return new Response(JSON.stringify({ 
                error: 'Não é possível reservar para uma data/hora passada' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Verificar disponibilidade do novo horário
        const conflito = await env.DB.prepare(
            'SELECT id FROM reservas WHERE barbeiro_id = ? AND data_hora = ? AND status IN ("confirmada", "faltou", "concluida") AND id != ?'
        ).bind(novo_barbeiro_id, novaDataHora, reserva_id).first();

        if (conflito) {
            return new Response(JSON.stringify({ 
                error: 'Horário já reservado para este barbeiro' 
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Usar novo_servico_id se fornecido, senão manter o atual
        const servicoId = novo_servico_id || reservaAtual.servico_id;

        // Buscar nomes para o histórico
        const barbeiro = await env.DB.prepare(
            'SELECT nome FROM barbeiros WHERE id = ?'
        ).bind(novo_barbeiro_id).first();

        const barbeiroAntigo = await env.DB.prepare(
            'SELECT nome FROM barbeiros WHERE id = ?'
        ).bind(reservaAtual.barbeiro_id).first();

        const servico = novo_servico_id ? await env.DB.prepare(
            'SELECT nome FROM servicos WHERE id = ?'
        ).bind(novo_servico_id).first() : null;

        const servicoAntigo = await env.DB.prepare(
            'SELECT nome FROM servicos WHERE id = ?'
        ).bind(reservaAtual.servico_id).first();

        // Buscar nome do cliente
        const cliente = await env.DB.prepare(
            'SELECT nome FROM clientes WHERE id = ?'
        ).bind(reservaAtual.cliente_id).first();

        // Registrar no histórico
        const historico = JSON.parse(reservaAtual.historico_edicoes || '[]');
        
        const alteracao = {
            tipo: 'alteracao',
            campos_alterados: {},
            data: new Date().toISOString(),
            usuario_tipo: 'cliente'
        };

        // Registrar apenas campos alterados
        if (reservaAtual.data_hora !== novaDataHora) {
            alteracao.campos_alterados.data_hora = {
                anterior: reservaAtual.data_hora,
                novo: novaDataHora
            };
        }

        if (reservaAtual.barbeiro_id !== novo_barbeiro_id) {
            alteracao.campos_alterados.barbeiro = {
                anterior: `${barbeiroAntigo?.nome || 'N/A'} (ID: ${reservaAtual.barbeiro_id})`,
                novo: `${barbeiro?.nome || 'N/A'} (ID: ${novo_barbeiro_id})`
            };
        }

        if (novo_servico_id && reservaAtual.servico_id !== novo_servico_id) {
            alteracao.campos_alterados.servico = {
                anterior: `${servicoAntigo?.nome || 'N/A'} (ID: ${reservaAtual.servico_id})`,
                novo: `${servico?.nome || 'N/A'} (ID: ${novo_servico_id})`
            };
        }

        if (comentario !== undefined && reservaAtual.comentario !== comentario) {
            alteracao.campos_alterados.comentario = {
                anterior: reservaAtual.comentario || '',
                novo: comentario || ''
            };
        }

        historico.push(alteracao);

        // Atualizar reserva incluindo barbeiro_id e servico_id
        const result = await env.DB.prepare(
            `UPDATE reservas 
             SET servico_id = ?, barbeiro_id = ?, data_hora = ?, comentario = ?, 
                 historico_edicoes = ?, atualizado_em = CURRENT_TIMESTAMP
             WHERE id = ?`
        ).bind(
            servicoId,
            novo_barbeiro_id,
            novaDataHora,
            comentario || reservaAtual.comentario,
            JSON.stringify(historico),
            reserva_id
        ).run();

        if (!result.success) {
            throw new Error('Falha ao atualizar reserva na base de dados');
        }

        // 🔔 CRIAR NOTIFICAÇÃO
        try {
            const message = formatEditedMessage(
                cliente.nome,
                barbeiro.nome,
                new Date(novaDataHora).toLocaleDateString('pt-PT'),
                nova_hora
            );
            
            await createNotification(env.DB, {
                type: NotificationTypes.EDITED,
                message: message,
                reservationId: reserva_id,
                clientName: cliente.nome,
                barberId: novo_barbeiro_id
            });
            
            console.log('✅ Notification created for edited booking');
        } catch (notifError) {
            console.error('❌ Error creating notification:', notifError);
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Reserva atualizada com sucesso'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        console.error('Erro ao editar reserva:', error);
        return new Response(JSON.stringify({ 
            error: 'Erro ao processar edição da reserva',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}