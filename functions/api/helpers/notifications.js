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
 */
export function formatEditedMessage(clientName, barberName, date, time) {
    return `${clientName} alterou a reserva com ${barberName} para ${date} às ${time}`;
}
