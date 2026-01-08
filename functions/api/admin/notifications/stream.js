/**
 * SSE Stream endpoint for real-time notifications
 * Mantém conexão aberta e envia notificações em tempo real
 */

export async function onRequestGet(context) {
    const { request, env } = context;

    // Verificar autenticação
    const token = request.headers.get('Cookie')?.match(/auth_token=([^;]+)/)?.[1];
    if (!token) {
        return new Response('Unauthorized', { status: 401 });
    }

    // Verificar se é admin
    const stmt = env.DB.prepare('SELECT id, role FROM users WHERE session_token = ?');
    const user = await stmt.bind(token).first();
    
    if (!user || user.role !== 'admin') {
        return new Response('Forbidden', { status: 403 });
    }

    // Configurar SSE
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Função para enviar evento SSE
    const sendEvent = async (data) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        await writer.write(encoder.encode(message));
    };

    // Enviar heartbeat inicial
    await sendEvent({ type: 'connected', timestamp: Date.now() });

    // Configurar interval para heartbeat (manter conexão viva)
    const heartbeatInterval = setInterval(async () => {
        try {
            await sendEvent({ type: 'heartbeat', timestamp: Date.now() });
        } catch (error) {
            clearInterval(heartbeatInterval);
        }
    }, 30000); // 30 segundos

    // Verificar novas notificações periodicamente
    let lastCheckTime = Date.now();
    const checkInterval = setInterval(async () => {
        try {
            const stmt = env.DB.prepare(
                `SELECT id, type, message, reservation_id, client_name, barber_id, created_at
                 FROM notifications 
                 WHERE created_at > ? AND is_read = 0
                 ORDER BY created_at DESC`
            );
            
            const notifications = await stmt.bind(new Date(lastCheckTime).toISOString()).all();
            
            if (notifications.results && notifications.results.length > 0) {
                for (const notification of notifications.results) {
                    await sendEvent({
                        type: 'notification',
                        data: notification
                    });
                }
                lastCheckTime = Date.now();
            }
        } catch (error) {
            console.error('Error checking notifications:', error);
            clearInterval(checkInterval);
            clearInterval(heartbeatInterval);
        }
    }, 5000); // Verificar a cada 5 segundos

    // Cleanup quando conexão fechar
    request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        clearInterval(checkInterval);
        writer.close();
    });

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
        },
    });
}
