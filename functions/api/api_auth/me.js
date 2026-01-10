// Endpoint para verificar o utilizador autenticado
import { verifyJWT } from '../../utils/jwt.js';

export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        // Ler cookie de autenticação
        const cookies = request.headers.get('Cookie') || '';
        const tokenMatch = cookies.match(/auth_token=([^;]+)/);

        if (!tokenMatch) {
            return new Response(JSON.stringify({ error: 'Não autenticado' }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar e descodificar token JWT
        const userPayload = await verifyJWT(tokenMatch[1], env.JWT_SECRET);

        if (!userPayload) {
            return new Response(JSON.stringify({ error: 'Sessão expirada' }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Buscar dados completos do utilizador na base de dados
        const user = await env.DB.prepare(
            'SELECT id, nome, email, telefone, nif, foto_perfil, atualizado_em FROM clientes WHERE id = ?'
        ).bind(userPayload.id).first();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Utilizador não encontrado' }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // ✨ Adicionar URL da foto com CROP INTELIGENTE + cache busting se existir
        let photoUrl = null;
        if (user.foto_perfil) {
            const timestamp = user.atualizado_em ? new Date(user.atualizado_em).getTime() : Date.now();
            // ✨ c_thumb com g_face e z_1.2 para focar no rosto
            photoUrl = `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/c_thumb,g_face,h_200,w_200,z_0.8/q_auto:good/f_auto/${user.foto_perfil}?v=${timestamp}`;
        }

        // Retornar dados do utilizador
        return new Response(JSON.stringify({ 
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                telefone: user.telefone,
                nif: user.nif,
                photoUrl: photoUrl
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        return new Response(JSON.stringify({ 
            error: 'Erro ao processar pedido',
            details: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}