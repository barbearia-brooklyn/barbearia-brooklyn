/**
 * API endpoints para gestão de notificações
 * GET: Obter lista de notificações
 * PATCH: Marcar notificação(ões) como lida(s)
 */

export async function onRequestGet(context) {
    const { request, env } = context;

    // Verificar autenticação
    const token = request.headers.get('Cookie')?.match(/auth_token=([^;]+)/)?.[1];
    if (!token) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Verificar se é admin
    const userStmt = env.DB.prepare('SELECT id, role FROM users WHERE session_token = ?');
    const user = await userStmt.bind(token).first();
    
    if (!user || user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Parâmetros de query
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const unreadOnly = url.searchParams.get('unread_only') === 'true';

    // Query de notificações
    let query = `
        SELECT id, type, message, reservation_id, client_name, barber_id, is_read, created_at
        FROM notifications
    `;
    
    if (unreadOnly) {
        query += ' WHERE is_read = 0';
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';

    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(limit).all();

    // Contar não lidas
    const countStmt = env.DB.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0');
    const countResult = await countStmt.first();

    return new Response(JSON.stringify({
        notifications: result.results || [],
        unread_count: countResult?.count || 0
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function onRequestPatch(context) {
    const { request, env } = context;

    // Verificar autenticação
    const token = request.headers.get('Cookie')?.match(/auth_token=([^;]+)/)?.[1];
    if (!token) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Verificar se é admin
    const userStmt = env.DB.prepare('SELECT id, role FROM users WHERE session_token = ?');
    const user = await userStmt.bind(token).first();
    
    if (!user || user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const body = await request.json();
    const { notification_id, mark_all } = body;

    if (mark_all) {
        // Marcar todas como lidas
        const stmt = env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE is_read = 0');
        await stmt.run();
        
        return new Response(JSON.stringify({ success: true, message: 'All notifications marked as read' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } else if (notification_id) {
        // Marcar uma específica como lida
        const stmt = env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?');
        await stmt.bind(notification_id).run();
        
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } else {
        return new Response(JSON.stringify({ error: 'Missing notification_id or mark_all' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestDelete(context) {
    const { request, env } = context;

    // Verificar autenticação
    const token = request.headers.get('Cookie')?.match(/auth_token=([^;]+)/)?.[1];
    if (!token) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Verificar se é admin
    const userStmt = env.DB.prepare('SELECT id, role FROM users WHERE session_token = ?');
    const user = await userStmt.bind(token).first();
    
    if (!user || user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');

    if (!notificationId) {
        return new Response(JSON.stringify({ error: 'Missing notification id' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const stmt = env.DB.prepare('DELETE FROM notifications WHERE id = ?');
    await stmt.bind(notificationId).run();

    return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
