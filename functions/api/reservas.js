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
