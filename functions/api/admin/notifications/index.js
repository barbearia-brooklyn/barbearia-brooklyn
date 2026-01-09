/**
 * API de Notificações
 * GET - Lista notificações (filtradas por barbeiro se user for barbeiro)
 * PATCH - Marca notificações como lidas
 */

import { authenticate } from '../auth.js';

// GET - Listar notificações
export async function onRequestGet({ request, env }) {
    try {
        // Autenticação
        const user = await authenticate(request, env);
        
        if (!user) {
            return new Response(JSON.stringify({
                error: 'Autenticação necessária'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Parametros
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '50');

        console.log('📥 Fetching notifications for user:', user.id, 'role:', user.role, 'barbeiro_id:', user.barbeiro_id);

        let query;
        let params;

        // 👨‍⚖️ Se for barbeiro, filtrar apenas notificações do seu barber_id
        if (user.role === 'barbeiro' && user.barbeiro_id) {
            console.log('👨‍⚖️ User is barber, filtering by barber_id:', user.barbeiro_id);
            
            query = `
                SELECT * FROM notifications 
                WHERE 
                    barber_id = ?
                    AND (
                        is_read = 0 
                        OR (is_read = 1 AND datetime(created_at) > datetime('now', '-1 day'))
                    )
                ORDER BY created_at DESC 
                LIMIT ?
            `;
            params = [user.barbeiro_id, limit];
        } 
        // 👨‍💼 Admin vê todas as notificações
        else {
            console.log('👨‍💼 User is admin, showing all notifications');
            
            query = `
                SELECT * FROM notifications 
                WHERE 
                    is_read = 0 
                    OR (is_read = 1 AND datetime(created_at) > datetime('now', '-1 day'))
                ORDER BY created_at DESC 
                LIMIT ?
            `;
            params = [limit];
        }

        // Buscar notificações
        const { results } = await env.DB.prepare(query).bind(...params).all();

        // Contar não lidas
        let unreadQuery;
        let unreadParams;
        
        if (user.role === 'barbeiro' && user.barbeiro_id) {
            unreadQuery = 'SELECT COUNT(*) as count FROM notifications WHERE is_read = 0 AND barber_id = ?';
            unreadParams = [user.barbeiro_id];
        } else {
            unreadQuery = 'SELECT COUNT(*) as count FROM notifications WHERE is_read = 0';
            unreadParams = [];
        }
        
        const unreadResult = await env.DB.prepare(unreadQuery).bind(...unreadParams).first();

        console.log('📊 Total notifications:', results.length, 'Unread:', unreadResult.count);

        return new Response(JSON.stringify({
            notifications: results,
            unread_count: unreadResult.count
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao buscar notificações',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// PATCH - Marcar notificações como lidas
export async function onRequestPatch({ request, env }) {
    try {
        // Autenticação
        const user = await authenticate(request, env);
        
        if (!user) {
            return new Response(JSON.stringify({
                error: 'Autenticação necessária'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const data = await request.json();

        if (data.mark_all) {
            // Marcar todas como lidas (filtrar por barbeiro se necessário)
            let query;
            let params;
            
            if (user.role === 'barbeiro' && user.barbeiro_id) {
                query = 'UPDATE notifications SET is_read = 1 WHERE is_read = 0 AND barber_id = ?';
                params = [user.barbeiro_id];
            } else {
                query = 'UPDATE notifications SET is_read = 1 WHERE is_read = 0';
                params = [];
            }
            
            await env.DB.prepare(query).bind(...params).run();

            console.log('✅ All notifications marked as read for user:', user.id);

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (data.notification_id) {
            // Marcar uma notificação específica como lida
            // (Verificar permissão se for barbeiro)
            let query;
            let params;
            
            if (user.role === 'barbeiro' && user.barbeiro_id) {
                query = 'UPDATE notifications SET is_read = 1 WHERE id = ? AND barber_id = ?';
                params = [data.notification_id, user.barbeiro_id];
            } else {
                query = 'UPDATE notifications SET is_read = 1 WHERE id = ?';
                params = [data.notification_id];
            }
            
            await env.DB.prepare(query).bind(...params).run();

            console.log(`✅ Notification ${data.notification_id} marked as read`);

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Dados inválidos' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Error marking notifications as read:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao marcar notificações',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}