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

        // Definir horários baseados no dia
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
            horarios.push(`${h.toString().padStart(2, '0')}:00`);
        }

        // 🔧 FIX CRÍTICO: Buscar reservas COM duração do serviço
        const { results: reservas } = await env.DB.prepare(
            `SELECT 
                r.data_hora,
                s.duracao
             FROM reservas r
             JOIN servicos s ON r.servico_id = s.id
             WHERE r.barbeiro_id = ? 
             AND date(r.data_hora) = ?
             AND r.status IN ('confirmada', 'faltou', 'concluida')`
        ).bind(barbeiroId, data).all();

        // 🔧 FIX CRÍTICO: Calcular TODOS os horários ocupados durante a duração
        const horasReservadas = new Set();
        
        reservas.forEach(reserva => {
            // Parse da data/hora de início
            const inicioReserva = new Date(reserva.data_hora);
            const duracaoMinutos = reserva.duracao || 30; // default 30min se não houver duração
            
            // Calcular fim da reserva
            const fimReserva = new Date(inicioReserva.getTime() + duracaoMinutos * 60000);
            
            // Marcar TODOS os slots ocupados durante a duração
            let current = new Date(inicioReserva);
            while (current < fimReserva) {
                const horaStr = current.toTimeString().substring(0, 5);
                horasReservadas.add(horaStr);
                
                // Incrementar 60 minutos (slots de 1 hora)
                current = new Date(current.getTime() + 60 * 60000);
            }
        });

        // Converter Set para Array para compatibilidade
        const horasReservadasArray = Array.from(horasReservadas);

        // Remover horários indisponíveis do barbeiro
        const { results: indisponibilidades } = await env.DB.prepare(
            `SELECT data_hora_inicio, data_hora_fim, is_all_day
             FROM horarios_indisponiveis
             WHERE barbeiro_id = ?
             AND (
                 -- Indisponibilidades do dia específico
                 (date(data_hora_inicio) <= ? AND date(data_hora_fim) >= ?)
                 OR
                 -- Indisponibilidades recorrentes semanais
                 (recurrence_type = 'weekly' 
                  AND CAST(strftime('%w', ?) AS INTEGER) = CAST(strftime('%w', data_hora_inicio) AS INTEGER)
                  AND (recurrence_end_date IS NULL OR date(?) <= date(recurrence_end_date)))
             )`
        ).bind(barbeiroId, data, data, data, data).all();

        // Função para verificar se um horário está dentro de um período indisponível
        function isHorarioIndisponivel(horario) {
            for (const indisponibilidade of indisponibilidades) {
                // Se é indisponibilidade de dia inteiro
                if (indisponibilidade.is_all_day === 1) {
                    return true;
                }

                // Extrair horas de início e fim
                const horaInicio = indisponibilidade.data_hora_inicio.split('T')[1]?.substring(0, 5) || 
                                  indisponibilidade.data_hora_inicio.split(' ')[1]?.substring(0, 5);
                const horaFim = indisponibilidade.data_hora_fim.split('T')[1]?.substring(0, 5) || 
                               indisponibilidade.data_hora_fim.split(' ')[1]?.substring(0, 5);

                if (horaInicio && horaFim) {
                    // Verificar se o horário está no intervalo
                    if (horario >= horaInicio && horario < horaFim) {
                        return true;
                    }
                }
            }
            return false;
        }

        // Filtrar horários disponíveis
        const disponiveis = horarios.filter(h => 
            !horasReservadasArray.includes(h) && !isHorarioIndisponivel(h)
        );

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
