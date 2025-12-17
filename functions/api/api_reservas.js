import { generateEmailContent } from '../templates/emailReserva.js';

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

    // Handle POST - Criar reserva
    if (request.method === 'POST') {
        try {
            // Verificar autenticação
            const cookies = request.headers.get('Cookie') || '';
            const tokenMatch = cookies.match(/auth_token=([^;]+)/);

            if (!tokenMatch) {
                return new Response(JSON.stringify({ error: 'Autenticação necessária', needsAuth: true }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            }

            // Verificar JWT
            const userPayload = await verifyJWT(tokenMatch[1], env.JWT_SECRET);
            if (!userPayload) {
                return new Response(JSON.stringify({ error: 'Sessão expirada', needsAuth: true }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            }

            // Buscar dados do cliente
            const cliente = await env.DB.prepare(
                'SELECT id, nome, email, telefone FROM clientes WHERE id = ?'
            ).bind(userPayload.id).first();

            const data = await request.json();

            // Validar dados
            if (!data.barbeiro_id || !data.servico_id || !data.data || !data.hora) {
                return new Response(JSON.stringify({ error: 'Dados incompletos' }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            // Verificar disponibilidade do barbeiro no horário
            const dataHora = `${data.data}T${data.hora}:00`;
            const { results: reservasExistentes } = await env.DB.prepare(
                'SELECT id FROM reservas WHERE barbeiro_id = ? AND data_hora = ? AND status = "confirmada"'
            ).bind(data.barbeiro_id, dataHora).all();

            if (reservasExistentes.length > 0) {
                return new Response(JSON.stringify({ error: 'Horário já reservado' }), {
                    status: 409,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            // Validar que o cliente não tem outra reserva no mesmo horário
            const { results: reservasCliente } = await env.DB.prepare(
                'SELECT id, barbeiro_id FROM reservas WHERE cliente_id = ? AND data_hora = ? AND status = "confirmada"'
            ).bind(cliente.id, dataHora).all();

            if (reservasCliente.length > 0) {
                // Buscar nome do barbeiro da reserva existente
                const barbeiroExistente = await env.DB.prepare(
                    'SELECT nome FROM barbeiros WHERE id = ?'
                ).bind(reservasCliente[0].barbeiro_id).first();

                return new Response(JSON.stringify({ 
                    error: `Já tem uma reserva marcada para este horário com ${barbeiroExistente.nome}. Não é possível ter múltiplas reservas ao mesmo tempo.` 
                }), {
                    status: 409,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            // Criar reserva
            const result = await env.DB.prepare(
                `INSERT INTO reservas (cliente_id, barbeiro_id, servico_id, data_hora, comentario)
                 VALUES (?, ?, ?, ?, ?)`
            ).bind(
                cliente.id,
                data.barbeiro_id,
                data.servico_id,
                dataHora,
                data.comentario || null
            ).run();

            // Buscar informações do barbeiro e serviço
            const barbeiro = await env.DB.prepare(
                'SELECT nome FROM barbeiros WHERE id = ?'
            ).bind(data.barbeiro_id).first();

            const servico = await env.DB.prepare(
                'SELECT nome FROM servicos WHERE id = ?'
            ).bind(data.servico_id).first();

            // Gerar conteúdo do email
            const emailContent = generateEmailContent({ ...data, nome: cliente.nome, email: cliente.email, telefone: cliente.telefone }, barbeiro, servico, result.meta.last_row_id);

            // Enviar email de confirmação
            try {
                const emailResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'Brooklyn Barbearia <noreply@brooklynbarbearia.pt>',
                        to: cliente.email,
                        subject: 'Confirmação de Reserva - Brooklyn Barbearia',
                        html: emailContent.html,
                        attachments: [
                            {
                                filename: `reserva-${result.meta.last_row_id}.ics`,
                                content: btoa(emailContent.ics),
                                content_type: 'text/calendar'
                            }
                        ]
                    })
                });

                const emailResponseData = await emailResponse.json();

                if (!emailResponse.ok) {
                    console.error('Erro ao enviar email:', emailResponseData);
                } else {
                    console.log('Email enviado com sucesso:', emailResponseData);
                }
            } catch (emailError) {
                console.error('Erro ao enviar email:', emailError);
            }

            return new Response(JSON.stringify({
                success: true,
                id: result.meta.last_row_id
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });

        } catch (error) {
            console.error('Erro:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }

    // Handle GET
    return new Response(JSON.stringify({ error: 'Método não suportado' }), {
        status: 405,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}