/**
 * Helper para criar notificações no sistema
 */

export async function createNotification(db, { type, message, reservationId = null, clientName = null, barberId = null }) {
    try {
        const stmt = db.prepare(`
            INSERT INTO notifications (type, message, reservation_id, client_name, barber_id, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, 0, datetime('now'))
        `);
        
        await stmt.bind(type, message, reservationId, clientName, barberId).run();
        
        console.log(`Notification created: ${type} - ${message}`);
        return { success: true };
    } catch (error) {
        console.error('Error creating notification:', error);
        return { success: false, error };
    }
}

/**
 * Tipos de notificações suportados
 */
export const NotificationTypes = {
    NEW_BOOKING: 'new_booking',
    CANCELLED: 'cancelled',
    EDITED: 'edited',
    REMINDER: 'reminder'
};

/**
 * Gera mensagem formatada para notificação de nova reserva
 */
export function formatNewBookingMessage(clientName, barberName, date, time) {
    return `${clientName} agendou com ${barberName} para ${date} às ${time}`;
}

/**
 * Gera mensagem formatada para notificação de cancelamento
 */
export function formatCancelledMessage(clientName, barberName, date, time) {
    return `${clientName} cancelou a reserva com ${barberName} de ${date} às ${time}`;
}

/**
 * Gera mensagem formatada para notificação de edição
 * @param {string} clientName - Nome do cliente
 * @param {object} changes - Objeto com as alterações {campo: {anterior, novo}}
 * @returns {string} Mensagem formatada
 */
export function formatEditedMessage(clientName, changes) {
    console.log('📝 formatEditedMessage called with:', { clientName, changes });
    
    const changeDescriptions = [];
    
    // Verificar se há mudanças substanciais (não apenas comentário)
    const hasSubstantialChanges = changes.barbeiro || changes.servico || changes.data_hora;
    
    // ❗ Se APENAS mudou comentário (flag especial)
    if (changes.comentario === true && !hasSubstantialChanges) {
        console.log('✅ Only comment changed');
        return `${clientName} adicionou uma nota à reserva`;
    }
    
    if (changes.barbeiro) {
        changeDescriptions.push(`barbeiro (${changes.barbeiro.anterior} → ${changes.barbeiro.novo})`);
    }
    
    if (changes.servico) {
        changeDescriptions.push(`serviço (${changes.servico.anterior} → ${changes.servico.novo})`);
    }
    
    if (changes.data_hora) {
        const dataAnterior = new Date(changes.data_hora.anterior);
        const dataNova = new Date(changes.data_hora.novo);
        
        const dataAnteriorStr = dataAnterior.toLocaleDateString('pt-PT');
        const horaAnteriorStr = dataAnterior.toTimeString().substring(0, 5);
        const dataNovaStr = dataNova.toLocaleDateString('pt-PT');
        const horaNovaStr = dataNova.toTimeString().substring(0, 5);
        
        changeDescriptions.push(`data/hora (${dataAnteriorStr} ${horaAnteriorStr} → ${dataNovaStr} ${horaNovaStr})`);
    }
    
    if (changeDescriptions.length === 0) {
        console.log('⚠️ No substantial changes detected');
        return `${clientName} alterou a reserva`;
    }
    
    const message = `${clientName} alterou: ${changeDescriptions.join(', ')}`;
    console.log('✅ Final message:', message);
    return message;
}