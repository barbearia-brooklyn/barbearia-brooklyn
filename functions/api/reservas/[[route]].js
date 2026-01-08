/**
 * Exemplo de integração do sistema de notificações nas operações de reserva
 * Este ficheiro mostra como adicionar notificações quando:
 * - Uma nova reserva é criada
 * - Uma reserva é cancelada
 * - Uma reserva é editada
 */

import { createNotification, NotificationTypes, formatNewBookingMessage, formatCancelledMessage, formatEditedMessage } from '../helpers/notifications.js';

/**
 * Exemplo: Criar nova reserva COM notificação
 */
export async function createBookingWithNotification(env, bookingData) {
    // 1. Criar a reserva normalmente
    const createStmt = env.DB.prepare(`
        INSERT INTO reservations (client_id, barber_id, service_id, date, time, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
    `);
    
    const result = await createStmt.bind(
        bookingData.client_id,
        bookingData.barber_id,
        bookingData.service_id,
        bookingData.date,
        bookingData.time
    ).run();
    
    const reservationId = result.meta.last_row_id;
    
    // 2. Obter informações para a notificação
    const infoStmt = env.DB.prepare(`
        SELECT 
            c.name as client_name,
            u.name as barber_name,
            r.date,
            r.time
        FROM reservations r
        JOIN clients c ON r.client_id = c.id
        JOIN users u ON r.barber_id = u.id
        WHERE r.id = ?
    `);
    
    const info = await infoStmt.bind(reservationId).first();
    
    // 3. Criar notificação
    if (info) {
        const message = formatNewBookingMessage(
            info.client_name,
            info.barber_name,
            new Date(info.date).toLocaleDateString('pt-PT'),
            info.time
        );
        
        await createNotification(env.DB, {
            type: NotificationTypes.NEW_BOOKING,
            message: message,
            reservationId: reservationId,
            clientName: info.client_name,
            barberId: bookingData.barber_id
        });
    }
    
    return { success: true, reservationId };
}

/**
 * Exemplo: Cancelar reserva COM notificação
 */
export async function cancelBookingWithNotification(env, reservationId) {
    // 1. Obter informações antes de cancelar
    const infoStmt = env.DB.prepare(`
        SELECT 
            c.name as client_name,
            u.name as barber_name,
            r.date,
            r.time,
            r.barber_id
        FROM reservations r
        JOIN clients c ON r.client_id = c.id
        JOIN users u ON r.barber_id = u.id
        WHERE r.id = ?
    `);
    
    const info = await infoStmt.bind(reservationId).first();
    
    // 2. Cancelar a reserva
    const cancelStmt = env.DB.prepare(`
        UPDATE reservations 
        SET status = 'cancelled', updated_at = datetime('now')
        WHERE id = ?
    `);
    
    await cancelStmt.bind(reservationId).run();
    
    // 3. Criar notificação
    if (info) {
        const message = formatCancelledMessage(
            info.client_name,
            info.barber_name,
            new Date(info.date).toLocaleDateString('pt-PT'),
            info.time
        );
        
        await createNotification(env.DB, {
            type: NotificationTypes.CANCELLED,
            message: message,
            reservationId: reservationId,
            clientName: info.client_name,
            barberId: info.barber_id
        });
    }
    
    return { success: true };
}

/**
 * Exemplo: Editar reserva COM notificação
 */
export async function updateBookingWithNotification(env, reservationId, updateData) {
    // 1. Atualizar a reserva
    const updateStmt = env.DB.prepare(`
        UPDATE reservations 
        SET date = ?, time = ?, updated_at = datetime('now')
        WHERE id = ?
    `);
    
    await updateStmt.bind(updateData.date, updateData.time, reservationId).run();
    
    // 2. Obter informações atualizadas
    const infoStmt = env.DB.prepare(`
        SELECT 
            c.name as client_name,
            u.name as barber_name,
            r.date,
            r.time,
            r.barber_id
        FROM reservations r
        JOIN clients c ON r.client_id = c.id
        JOIN users u ON r.barber_id = u.id
        WHERE r.id = ?
    `);
    
    const info = await infoStmt.bind(reservationId).first();
    
    // 3. Criar notificação
    if (info) {
        const message = formatEditedMessage(
            info.client_name,
            info.barber_name,
            new Date(info.date).toLocaleDateString('pt-PT'),
            info.time
        );
        
        await createNotification(env.DB, {
            type: NotificationTypes.EDITED,
            message: message,
            reservationId: reservationId,
            clientName: info.client_name,
            barberId: info.barber_id
        });
    }
    
    return { success: true };
}

// Nota: Este é um ficheiro de exemplo
// Você precisará integrar estas funções nos seus endpoints existentes de reservas
