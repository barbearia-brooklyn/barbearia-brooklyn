export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        // Obter utilizador autenticado
        const cookies = request.headers.get('Cookie') || '';
        const authToken = cookies.split(';')
            .find(c => c.trim().startsWith('auth_token='))
            ?.split('=')[1];

        if (!authToken) {
            return new Response(JSON.stringify({
                error: 'Não autenticado'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Decode JWT (simple decode sem verificação, apenas para obter ID)
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        const userId = payload.id;

        // Buscar dados do cliente
        const cliente = await env.DB.prepare(
            `SELECT 
                google_id, 
                facebook_id, 
                instagram_id,
                auth_methods,
                password_hash
            FROM clientes 
            WHERE id = ?`
        ).bind(userId).first();

        if (!cliente) {
            return new Response(JSON.stringify({
                error: 'Utilizador não encontrado'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Construir array de métodos de autenticação
        const authMethods = [];
        
        if (cliente.google_id) {
            authMethods.push('google');
        }
        if (cliente.facebook_id) {
            authMethods.push('facebook');
        }
        if (cliente.instagram_id) {
            authMethods.push('instagram');
        }

        // Verificar se tem password
        const hasPassword = cliente.password_hash && 
                           cliente.password_hash !== 'cliente_nunca_iniciou_sessão' &&
                           cliente.password_hash !== '';

        return new Response(JSON.stringify({
            authMethods,
            hasPassword
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao obter contas vinculadas:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao obter contas vinculadas',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}