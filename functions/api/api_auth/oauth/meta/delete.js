// Meta Data Deletion Callback
// Endpoint chamado pelo Facebook/Instagram quando um utilizador solicita deleção de dados
// Documentação: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const body = await request.json();
        const userId = body.user_id; // ID do Facebook/Instagram
        
        if (!userId) {
            return new Response(JSON.stringify({ 
                error: 'Missing user_id' 
            }), { status: 400 });
        }
        
        // Procurar utilizador por facebook_id ou instagram_id
        const cliente = await env.DB.prepare(
            'SELECT id, nome, email FROM clientes WHERE facebook_id = ? OR instagram_id = ?'
        ).bind(userId, userId).first();
        
        if (cliente) {
            // Opção 1: Remover apenas os IDs sociais (recomendado)
            await env.DB.prepare(
                `UPDATE clientes 
                 SET facebook_id = NULL, 
                     instagram_id = NULL,
                     auth_methods = REPLACE(REPLACE(auth_methods, ',facebook', ''), ',instagram', '')
                 WHERE id = ?`
            ).bind(cliente.id).run();
            
            // Opção 2: Apagar completamente o utilizador (apenas se não tiver outros métodos)
            // Descomente se preferir apagar a conta completa:
            /*
            const hasPassword = await env.DB.prepare(
                'SELECT password_hash FROM clientes WHERE id = ?'
            ).bind(cliente.id).first();
            
            if (!hasPassword || hasPassword.password_hash === 'cliente_nunca_iniciou_sessão') {
                // Apagar reservas associadas (opcional)
                await env.DB.prepare(
                    'DELETE FROM reservas WHERE cliente_id = ?'
                ).bind(cliente.id).run();
                
                // Apagar cliente
                await env.DB.prepare(
                    'DELETE FROM clientes WHERE id = ?'
                ).bind(cliente.id).run();
            }
            */
            
            // Log da deleção (opcional - guardar para auditoria)
            console.log(`Data deletion request for user ${userId} - Cliente ID: ${cliente.id}`);
        }
        
        // Resposta conforme especificação da Meta
        const confirmationCode = `${userId}_${Date.now()}`;
        const statusUrl = `${env.BASE_URL}/privacy/deletion-status?code=${confirmationCode}`;
        
        return new Response(JSON.stringify({
            url: statusUrl,
            confirmation_code: confirmationCode
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Erro no callback de deleção Meta:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error' 
        }), { status: 500 });
    }
}