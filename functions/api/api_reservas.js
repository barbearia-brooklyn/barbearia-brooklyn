import { generateEmailContent } from '../templates/emailReserva.js';

async function validateTurnstile(token, ip, secretKey) {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    formData.append('remoteip', ip);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData
    });

    const result = await response.json();
    return result.success;
}

export async function onRequest(context) {
    const { request, env } = context;

    // Handle POST - Criar reserva
    if (request.method === 'POST') {
        try {
            const data = await request.json();

            // Validar dados
            if (!data.nome || !data.email || !data.barbeiro_id || !data.servico_id || !data.data || !data.hora) {
                return new Response(JSON.stringify({ error: 'Dados incompletos' }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            // Validação do Turnstile
            if (!data.turnstileToken) {
                return new Response(JSON.stringify({ error: 'Token de verificação ausente' }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            // Obter IP do cliente
            const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';

            // Validar token do Turnstile
            const isValidToken = await validateTurnstile(data.turnstileToken, clientIP, env.TURNSTILE_SECRET_KEY);

            if (!isValidToken) {
                return new Response(JSON.stringify({ error: 'Verificação de segurança falhou. Por favor, tente novamente.' }), {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            // Verificar disponibilidade
            const dataHora = `${data.data}T${data.hora}:00`;
            const { results } = await env.DB.prepare(
                'SELECT id FROM reservas WHERE barbeiro_id = ? AND data_hora = ? AND status = "confirmada"'
            ).bind(data.barbeiro_id, dataHora).all();

            if (results.length > 0) {
                return new Response(JSON.stringify({ error: 'Horário já reservado' }), {
                    status: 409,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
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

            // Buscar informações do barbeiro e serviço
            const barbeiro = await env.DB.prepare(
                'SELECT nome FROM barbeiros WHERE id = ?'
            ).bind(data.barbeiro_id).first();

            const servico = await env.DB.prepare(
                'SELECT nome FROM servicos WHERE id = ?'
            ).bind(data.servico_id).first();

            // Gerar conteúdo do email
            const emailContent = generateEmailContent(data, barbeiro, servico, result.meta.last_row_id);

            // Enviar email de confirmação
            try {
                const emailResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'Brooklyn Barbearia <noreply@brooklyn.tiagoanoliveira.pt>',
                        to: data.email,
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
