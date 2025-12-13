import { verifyJWT } from '../../../utils/jwt.js';

export async function onRequestGet(context) {
    const { request, env } = context;
    
    try {
        // Verificar autenticação
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
        
        // Buscar cliente
        const cliente = await env.DB.prepare(
            'SELECT google_id, facebook_id, instagram_id, auth_methods, password_hash FROM clientes WHERE id = ?'
        ).bind(userId).first();
        
        if (!cliente) {
            return new Response(JSON.stringify({ 
                error: 'Cliente não encontrado' 
            }), { status: 404 });
        }
        
        const authMethods = cliente.auth_methods?.split(',') || [];
        const hasPassword = cliente.password_hash !== null && cliente.password_hash !== 'cliente_nunca_iniciou_sessão';
        
        return new Response(JSON.stringify({ 
            success: true,
            authMethods,
            hasPassword,
            linkedAccounts: {
                google: !!cliente.google_id,
                facebook: !!cliente.facebook_id,
                instagram: !!cliente.instagram_id
            }
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Erro ao obter contas vinculadas:', error);
        return new Response(JSON.stringify({ 
            error: 'Erro ao obter contas vinculadas' 
        }), { status: 500 });
    }
}