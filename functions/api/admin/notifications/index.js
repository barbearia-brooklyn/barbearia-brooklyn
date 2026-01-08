/**
 * API Endpoints para Notificações Admin
 */

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 20;

    try {
        // Buscar notificações recentes
        const stmt = env.DB.prepare(`
            SELECT * FROM notifications
            ORDER BY created_at DESC
            LIMIT ?
        `);
        
        const { results } = await stmt.bind(limit).all();
        
        // Contar não lidas
        const countStmt = env.DB.prepare(`
            SELECT COUNT(*) as count FROM notifications WHERE is_read = 0
        `);
        const countResult = await countStmt.first();
        
        return new Response(JSON.stringify({
            notifications: results,
            unread_count: countResult.count || 0
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPatch(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        
        if (body.mark_all) {
            // Marcar todas como lidas
            await env.DB.prepare(`
                UPDATE notifications SET is_read = 1 WHERE is_read = 0
            `).run();
        } else if (body.notification_id) {
            // Marcar uma específica como lida
            await env.DB.prepare(`
                UPDATE notifications SET is_read = 1 WHERE id = ?
            `).bind(body.notification_id).run();
        }
        
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error updating notifications:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}