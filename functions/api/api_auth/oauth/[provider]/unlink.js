import { verifyJWT } from '../../../../utils/jwt.js';

export async function onRequestDelete(context) {
    const { request, env, params } = context;
    
    try {
        const cookies = request.headers.get('Cookie') || '';
        const authToken = cookies.split(';')
            .find(c => c.trim().startsWith('auth_token='))
            ?.split('=')[1];
        
        if (!authToken) {
            return new Response(JSON.stringify({ 
                error: 'Não autenticado' 
            }), { status: 401 });
        }
        
        const payload = await verifyJWT(authToken, env.JWT_SECRET);
        const userId = payload.id;
        const provider = params.provider;
        
        const cliente = await env.DB.prepare(
            'SELECT * FROM clientes WHERE id = ?'
        ).bind(userId).first();
        
        if (!cliente) {
            return new Response(JSON.stringify({ 
                error: 'Cliente não encontrado' 
            }), { status: 404 });
        }
        
        const authMethods = cliente.auth_methods?.split(',') || [];
        
        if (authMethods.length === 1 && authMethods[0] === provider && !cliente.password_hash) {
            return new Response(JSON.stringify({ 
                error: 'Não pode desassociar o único método de autenticação. Defina uma password primeiro.',
                needsPassword: true
            }), { status: 400 });
        }
        
        const providerIdField = `${provider}_id`;
        const newAuthMethods = authMethods.filter(m => m !== provider).join(',');
        
        await env.DB.prepare(
            `UPDATE clientes 
             SET ${providerIdField} = NULL,
                 auth_methods = ?
             WHERE id = ?`
        ).bind(newAuthMethods || null, userId).run();
        
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
            error: 'Erro ao desassociar conta' 
        }), { status: 500 });
    }
}