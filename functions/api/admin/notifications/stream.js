/**
 * SSE Endpoint para Streaming de Notificações
 */

let clients = [];

export async function onRequest(context) {
    const { request, env } = context;
    
    // Configurar headers para SSE
    const headers = new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    // Criar stream
    const stream = new ReadableStream({
        start(controller) {
            // Enviar mensagem inicial
            const welcome = `data: ${JSON.stringify({ type: 'connected', message: 'Connected to notifications stream' })}\n\n`;
            controller.enqueue(new TextEncoder().encode(welcome));
            
            // Adicionar cliente à lista
            const clientId = Date.now();
            clients.push({ id: clientId, controller });
            
            // Heartbeat a cada 30 segundos
            const heartbeat = setInterval(() => {
                try {
                    const beat = `data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`;
                    controller.enqueue(new TextEncoder().encode(beat));
                } catch (error) {
                    clearInterval(heartbeat);
                    clients = clients.filter(c => c.id !== clientId);
                }
            }, 30000);
            
            // Cleanup ao fechar
            request.signal.addEventListener('abort', () => {
                clearInterval(heartbeat);
                clients = clients.filter(c => c.id !== clientId);
                try {
                    controller.close();
                } catch (e) {
                    // Stream já fechado
                }
            });
        }
    });

    return new Response(stream, { headers });
}

/**
 * Função helper para broadcast de notificações
 * Esta função é chamada quando uma notificação é criada
 */
export function broadcastNotification(notification) {
    const message = `data: ${JSON.stringify({ type: 'notification', data: notification })}\n\n`;
    const encoded = new TextEncoder().encode(message);
    
    clients.forEach(client => {
        try {
            client.controller.enqueue(encoded);
        } catch (error) {
            console.error('Error broadcasting to client:', error);
        }
    });
}