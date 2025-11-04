export async function onRequest(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const data = url.searchParams.get('data');
        const barbeiroId = url.searchParams.get('barbeiro');

        if (!data || !barbeiroId) {
            return new Response(JSON.stringify({ error: 'Parâmetros inválidos' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const dayOfWeek = new Date(data).getDay();
        const horarios = [];

        let inicio, fim;
        if (dayOfWeek === 0) { // Domingo - Fechado
            return new Response(JSON.stringify([]), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        } else if (dayOfWeek === 6) { // Sábado - 9h às 18h
            inicio = 9;
            fim = 18;
        } else { // Segunda a Sexta - 10h às 20h
            inicio = 10;
            fim = 20;
        }

        // Gerar horários
        for (let h = inicio; h < fim; h++) {
            if (h === 13) continue; // Pausa para almoço
            horarios.push(`${h.toString().padStart(2, '0')}:00`);
        }

        // Remover horários já reservados
        const { results } = await env.DB.prepare(
            `SELECT strftime('%H:%M', data_hora) as hora
             FROM reservas
             WHERE barbeiro_id = ?
               AND date(data_hora) = ?
               AND status = 'confirmada'`
        ).bind(barbeiroId, data).all();

        const horasReservadas = results.map(r => r.hora);
        const disponiveis = horarios.filter(h => !horasReservadas.includes(h));

        return new Response(JSON.stringify(disponiveis), {
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
