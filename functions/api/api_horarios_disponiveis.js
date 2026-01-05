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

        // Gerar horários de HORA EM HORA (clientes só podem reservar assim)
        for (let h = inicio; h < fim; h++) {
            horarios.push(`${h.toString().padStart(2, '0')}:00`);
        }

        // 🔧 BUSCAR RESERVAS COM DURAÇÃO CUSTOMIZADA
        const { results: reservas } = await env.DB.prepare(
            `SELECT 
                r.data_hora,
                COALESCE(r.duracao_minutos, s.duracao) as duracao
             FROM reservas r
             JOIN servicos s ON r.servico_id = s.id
             WHERE r.barbeiro_id = ? 
             AND date(r.data_hora) = ?
             AND r.status IN ('confirmada', 'faltou', 'concluida')`
        ).bind(barbeiroId, data).all();

        // 🔧 CALCULAR SLOTS OCUPADOS
        const horasReservadas = new Set();
        
        reservas.forEach(reserva => {
            // Parse: pode vir como "2026-01-05 14:15:00" ou "2026-01-05T14:15:00"
            const dataHoraStr = reserva.data_hora.includes('T') 
                ? reserva.data_hora 
                : reserva.data_hora.replace(' ', 'T');
            
            const inicioReserva = new Date(dataHoraStr);
            const duracaoMinutos = reserva.duracao || 30;
            const fimReserva = new Date(inicioReserva.getTime() + duracaoMinutos * 60000);
            
            // 🎯 Cliente só pode reservar de HORA EM HORA (14:00, 15:00, etc)
            // Barbeiro pode criar reservas em qualquer minuto (14:15, 14:37, etc)
            // Bloquear TODOS os slots de 1h afetados pela reserva
            
            // Arredondar início para baixo (hora anterior)
            const horaInicioSlot = new Date(inicioReserva);
            horaInicioSlot.setMinutes(0, 0, 0);
            
            // Percorrer de hora em hora até cobrir toda a duração
            let currentSlot = new Date(horaInicioSlot);
            while (currentSlot < fimReserva) {
                const horaStr = `${currentSlot.getHours().toString().padStart(2, '0')}:00`;
                horasReservadas.add(horaStr);
                currentSlot = new Date(currentSlot.getTime() + 60 * 60000); // +1 hora
            }
        });

        // Converter Set para Array
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
