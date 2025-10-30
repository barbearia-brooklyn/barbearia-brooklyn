export async function onRequestGet({ env, request }) {
    const url = new URL(request.url);
    const data = url.searchParams.get('data');
    const barbeiroId = url.searchParams.get('barbeiro');

    try {
        const dayOfWeek = new Date(data).getDay();
        const horarios = [];

        // Definir horários baseados no dia
        let inicio = 10, fim = 20;
        if (dayOfWeek === 6) { // Sábado
            fim = 19;
        } else if (dayOfWeek === 0) { // Domingo
            return new Response(JSON.stringify([]), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Gerar horários
        for (let h = inicio; h < fim; h++) {
            if (h === 13) continue; // Pausa para almoço
            horarios.push(`${h.toString().padStart(2, '0')}:00`);
        }

        // Remover horários já reservados
        const reservadas = await env.DB.prepare(
            `SELECT strftime('%H:%M', data_hora) as hora 
             FROM reservas 
             WHERE barbeiro_id = ? 
             AND date(data_hora) = ? 
             AND status = 'confirmada'`
        ).bind(barbeiroId, data).all();

        const horasReservadas = reservadas.results.map(r => r.hora);
        const disponiveis = horarios.filter(h => !horasReservadas.includes(h));

        return new Response(JSON.stringify(disponiveis), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
