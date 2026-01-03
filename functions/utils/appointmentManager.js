/**
 * Funções auxiliares para gestão de next_appointment_date e last_appointment_date
 */

/**
 * Atualiza o next_appointment_date do cliente quando uma reserva é criada
 * @param {Object} env - Environment context (DB)
 * @param {number} clienteId - ID do cliente
 * @param {string} dataHora - Data/hora da reserva (formato ISO)
 */
export async function setNextAppointment(env, clienteId, dataHora) {
    try {
        await env.DB.prepare(
            'UPDATE clientes SET next_appointment_date = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(dataHora, clienteId).run();
        
        console.log(`✅ Next appointment definido para cliente ${clienteId}: ${dataHora}`);
    } catch (error) {
        console.error('❌ Erro ao definir next appointment:', error);
    }
}

/**
 * Remove o next_appointment_date do cliente se corresponder à data fornecida
 * @param {Object} env - Environment context (DB)
 * @param {number} clienteId - ID do cliente
 * @param {string} dataHora - Data/hora da reserva a remover (formato ISO)
 */
export async function removeNextAppointmentIfMatches(env, clienteId, dataHora) {
    try {
        // Só remove se a data atual no campo corresponder à reserva que está sendo processada
        await env.DB.prepare(
            `UPDATE clientes 
             SET next_appointment_date = NULL, 
                 atualizado_em = CURRENT_TIMESTAMP 
             WHERE id = ? AND next_appointment_date = ?`
        ).bind(clienteId, dataHora).run();
        
        console.log(`✅ Next appointment removido para cliente ${clienteId} (se era ${dataHora})`);
    } catch (error) {
        console.error('❌ Erro ao remover next appointment:', error);
    }
}

/**
 * Quando uma reserva é concluída, move a data para last_appointment e incrementa contador
 * @param {Object} env - Environment context (DB)
 * @param {number} clienteId - ID do cliente
 * @param {string} dataHora - Data/hora da reserva concluída (formato ISO)
 */
export async function markAppointmentAsCompleted(env, clienteId, dataHora) {
    try {
        // 1. Define last_appointment_date com a data da reserva concluída
        // 2. Remove next_appointment_date se corresponder à mesma data
        // 3. Incrementa reservas_concluidas
        await env.DB.prepare(
            `UPDATE clientes 
             SET last_appointment_date = ?,
                 next_appointment_date = CASE 
                     WHEN next_appointment_date = ? THEN NULL 
                     ELSE next_appointment_date 
                 END,
                 reservas_concluidas = reservas_concluidas + 1,
                 atualizado_em = CURRENT_TIMESTAMP
             WHERE id = ?`
        ).bind(dataHora, dataHora, clienteId).run();
        
        console.log(`✅ Reserva marcada como concluída para cliente ${clienteId}`);
    } catch (error) {
        console.error('❌ Erro ao marcar reserva como concluída:', error);
    }
}

/**
 * Quando uma reserva 'concluída' volta para outro status, reverte as alterações
 * @param {Object} env - Environment context (DB)
 * @param {number} clienteId - ID do cliente
 * @param {string} dataHora - Data/hora da reserva (formato ISO)
 */
export async function undoCompletedAppointment(env, clienteId, dataHora) {
    try {
        // 1. Remove last_appointment_date se corresponder a esta reserva
        // 2. Decrementa reservas_concluidas (mínimo 0)
        await env.DB.prepare(
            `UPDATE clientes 
             SET last_appointment_date = CASE 
                     WHEN last_appointment_date = ? THEN NULL 
                     ELSE last_appointment_date 
                 END,
                 reservas_concluidas = MAX(0, reservas_concluidas - 1),
                 atualizado_em = CURRENT_TIMESTAMP
             WHERE id = ?`
        ).bind(dataHora, clienteId).run();
        
        console.log(`✅ Reversão de reserva concluída para cliente ${clienteId}`);
    } catch (error) {
        console.error('❌ Erro ao reverter reserva concluída:', error);
    }
}

/**
 * Atualiza next_appointment quando uma reserva é cancelada
 * Procura a próxima reserva confirmada do cliente e define como next_appointment
 * @param {Object} env - Environment context (DB)
 * @param {number} clienteId - ID do cliente
 */
export async function updateNextAppointmentAfterCancellation(env, clienteId) {
    try {
        // Buscar próxima reserva confirmada do cliente
        const nextReserva = await env.DB.prepare(
            `SELECT data_hora 
             FROM reservas 
             WHERE cliente_id = ? 
             AND status = 'confirmada' 
             AND datetime(data_hora) > datetime('now')
             ORDER BY data_hora ASC 
             LIMIT 1`
        ).bind(clienteId).first();
        
        if (nextReserva) {
            await env.DB.prepare(
                'UPDATE clientes SET next_appointment_date = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(nextReserva.data_hora, clienteId).run();
            console.log(`✅ Next appointment atualizado para cliente ${clienteId}: ${nextReserva.data_hora}`);
        } else {
            // Se não houver mais reservas, limpa o next_appointment
            await env.DB.prepare(
                'UPDATE clientes SET next_appointment_date = NULL, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(clienteId).run();
            console.log(`✅ Next appointment limpo para cliente ${clienteId} (sem reservas futuras)`);
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar next appointment após cancelamento:', error);
    }
}
