export async function onRequestDelete(context) {
    const { request, env, params } = context;

    try {
        const provider = params.provider;
        
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

        // Decode JWT
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        const userId = payload.id;

        // Verificar se é o último método de autenticação
        const cliente = await env.DB.prepare(
            'SELECT google_id, facebook_id, instagram_id, password_hash FROM clientes WHERE id = ?'
        ).bind(userId).first();

        if (!cliente) {
            return new Response(JSON.stringify({
                error: 'Utilizador não encontrado'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Contar métodos de autenticação
        let authMethodsCount = 0;
        if (cliente.google_id) authMethodsCount++;
        if (cliente.facebook_id) authMethodsCount++;
        if (cliente.instagram_id) authMethodsCount++;
        
        const hasPassword = cliente.password_hash && 
                           cliente.password_hash !== 'cliente_nunca_iniciou_sessão' &&
                           cliente.password_hash !== '';
        
        if (hasPassword) authMethodsCount++;

        // Se for o último método e não tiver password, não pode desassociar
        if (authMethodsCount === 1 && !hasPassword) {
            return new Response(JSON.stringify({
                error: 'Não pode desassociar o último método de autenticação sem definir uma password primeiro'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Remover provider
        const providerIdField = `${provider}_id`;
        
        await env.DB.prepare(
            `UPDATE clientes 
             SET ${providerIdField} = NULL,
                 auth_methods = REPLACE(REPLACE(REPLACE(
                     auth_methods, 
                     ',${provider}', ''
                 ), '${provider},', ''), '${provider}', '')
             WHERE id = ?`
        ).bind(userId).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Conta desassociada com sucesso'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao desassociar conta:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao desassociar conta',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}