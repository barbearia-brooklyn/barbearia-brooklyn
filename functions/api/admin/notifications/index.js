/**
 * API de Notificações
 * GET - Lista notificações
 * PATCH - Marca notificações como lidas
 */

import { authenticate } from '../auth.js';

// GET - Listar notificações
export async function onRequestGet({ request, env }) {
    try {
        // Autenticação
        const authResult = await authenticate(request, env);
        if (authResult instanceof Response) return authResult;

        // Parametros
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '50');

        console.log('📥 Fetching notifications, limit:', limit);

        // Buscar notificações
        // Não mostrar notificações lidas com mais de 24 horas
        const { results } = await env.DB.prepare(`
            SELECT * FROM notifications 
            WHERE 
                is_read = 0 
                OR (is_read = 1 AND datetime(created_at) > datetime('now', '-1 day'))
            ORDER BY created_at DESC 
            LIMIT ?
        `).bind(limit).all();

        // Contar não lidas
        const unreadResult = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM notifications WHERE is_read = 0'
        ).first();

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
        const authResult = await authenticate(request, env);
        if (authResult instanceof Response) return authResult;

        const data = await request.json();

        if (data.mark_all) {
            // Marcar todas como lidas
            await env.DB.prepare(
                'UPDATE notifications SET is_read = 1 WHERE is_read = 0'
            ).run();

            console.log('✅ All notifications marked as read');

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (data.notification_id) {
            // Marcar uma notificação específica como lida
            await env.DB.prepare(
                'UPDATE notifications SET is_read = 1 WHERE id = ?'
            ).bind(data.notification_id).run();

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