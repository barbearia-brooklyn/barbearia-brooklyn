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

            // Buscar informações do barbeiro e serviço para o email
            const barbeiro = await env.DB.prepare(
                'SELECT nome FROM barbeiros WHERE id = ?'
            ).bind(data.barbeiro_id).first();

            const servico = await env.DB.prepare(
                'SELECT nome FROM servicos WHERE id = ?'
            ).bind(data.servico_id).first();

            // Enviar email de confirmação via API REST do Resend
            try {
                const [ano, mes, dia] = data.data.split('-');
                const dataFormatada = `${dia}/${mes}/${ano}`;

                const emailHTML = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
                            .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
                            .detail { margin: 10px 0; padding: 10px; background-color: white; border-left: 4px solid #3498db; }
                            .detail strong { color: #2c3e50; }
                            .footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Reserva Confirmada!</h1>
                            </div>
                            <div class="content">
                                <p>Olá <strong>${data.nome}</strong>,</p>
                                <p>A sua reserva foi confirmada com sucesso. Aqui estão os detalhes:</p>
                                
                                <div class="detail">
                                    <strong>📅 Data:</strong> ${dataFormatada}
                                </div>
                                <div class="detail">
                                    <strong>🕐 Hora:</strong> ${data.hora}
                                </div>
                                <div class="detail">
                                    <strong>✂️ Serviço:</strong> ${servico.nome}
                                </div>
                                <div class="detail">
                                    <strong>👤 Barbeiro:</strong> ${barbeiro.nome}
                                </div>
                                ${data.telefone ? `
                                <div class="detail">
                                    <strong>📱 Telefone:</strong> ${data.telefone}
                                </div>
                                ` : ''}
                                ${data.comentario ? `
                                <div class="detail">
                                    <strong>💬 Comentário:</strong> ${data.comentario}
                                </div>
                                ` : ''}
                                
                                <p style="margin-top: 30px;">Aguardamos por si! Se precisar de cancelar ou reagendar, por favor contacte-nos.</p>
                            </div>
                            <div class="footer">
                                <p>Este é um email automático, por favor não responda.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'Barbearia <noreply@brooklyn.tiagoanoliveira.pt>', // IMPORTANTE: Substitui pelo teu domínio verificado
                        to: data.email,
                        subject: 'Confirmação de Reserva - Barbearia',
                        html: emailHTML
                    })
                });

                console.log('Email de confirmação enviado com sucesso');
            } catch (emailError) {
                // Log do erro mas não falha a reserva
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
