// API de Gestão de Fotos de Perfil com Cloudinary
import { verifyJWT } from '../../utils/jwt.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary.js';

/**
 * GET /api/api_auth/profile-photo
 * Retorna a URL da foto de perfil do utilizador
 */
export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        // Verificar autenticação
        const cookies = request.headers.get('Cookie') || '';
        const tokenMatch = cookies.match(/auth_token=([^;]+)/);

        if (!tokenMatch) {
            return new Response(JSON.stringify({ error: 'Não autenticado' }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const userPayload = await verifyJWT(tokenMatch[1], env.JWT_SECRET);
        if (!userPayload) {
            return new Response(JSON.stringify({ error: 'Sessão expirada' }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Buscar foto do utilizador
        const cliente = await env.DB.prepare(
            'SELECT foto_perfil, atualizado_em FROM clientes WHERE id = ?'
        ).bind(userPayload.id).first();

        if (!cliente) {
            return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Se tem foto, retornar URL da Cloudinary com cache busting
        if (cliente.foto_perfil) {
            // ✨ Usar timestamp da última atualização para cache busting
            const timestamp = cliente.atualizado_em ? new Date(cliente.atualizado_em).getTime() : Date.now();
            
            // ✨ CROP INTELIGENTE BALANCEADO:
            // c_fill = Preenche o espaço mantendo proporções (melhor que c_thumb para contexto)
            // g_face = Foca no rosto detectado
            // z_0.8 = Zoom 80% (MENOS zoom, MAIS contexto ao redor)
            // q_auto:good = Qualidade automática otimizada
            const photoUrl = `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,g_face,h_200,w_200,z_0.8/q_auto:good/f_auto/${cliente.foto_perfil}?v=${timestamp}`;
            return new Response(JSON.stringify({ photoUrl }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Sem foto
        return new Response(JSON.stringify({ photoUrl: null }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao obter foto de perfil:', error);
        return new Response(JSON.stringify({ 
            error: 'Erro ao obter foto de perfil',
            details: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * POST /api/api_auth/profile-photo
 * Faz upload de uma nova foto de perfil
 * Body: { photo: "data:image/...;base64,..." }
 */
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        // Verificar autenticação
        const cookies = request.headers.get('Cookie') || '';
        const tokenMatch = cookies.match(/auth_token=([^;]+)/);

        if (!tokenMatch) {
            return new Response(JSON.stringify({ error: 'Não autenticado' }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const userPayload = await verifyJWT(tokenMatch[1], env.JWT_SECRET);
        if (!userPayload) {
            return new Response(JSON.stringify({ error: 'Sessão expirada' }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { photo } = await request.json();

        if (!photo) {
            return new Response(JSON.stringify({ error: 'Foto não fornecida' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validar formato base64
        if (!photo.startsWith('data:image/')) {
            return new Response(JSON.stringify({ error: 'Formato de imagem inválido' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verificar se já tem foto para deletar a antiga
        const cliente = await env.DB.prepare(
            'SELECT foto_perfil FROM clientes WHERE id = ?'
        ).bind(userPayload.id).first();

        if (cliente.foto_perfil) {
            // Deletar foto antiga do Cloudinary
            await deleteFromCloudinary(cliente.foto_perfil, env);
        }

        // Upload para Cloudinary com transformações automáticas
        const uploadResult = await uploadToCloudinary(
            photo,
            `barbearia-brooklyn/clientes/${userPayload.id}`,
            env
        );

        if (!uploadResult.success) {
            return new Response(JSON.stringify({ 
                error: 'Erro ao fazer upload da foto',
                details: uploadResult.error 
            }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Atualizar base de dados com public_id
        await env.DB.prepare(
            'UPDATE clientes SET foto_perfil = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(uploadResult.public_id, userPayload.id).run();

        // ✨ Retornar URL da foto com CROP INTELIGENTE BALANCEADO + cache busting
        const timestamp = Date.now();
        const photoUrl = `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,g_face,h_200,w_200,z_0.8/q_auto:good/f_auto/${uploadResult.public_id}?v=${timestamp}`;

        return new Response(JSON.stringify({ 
            success: true,
            photoUrl,
            message: 'Foto de perfil atualizada com sucesso'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao fazer upload de foto:', error);
        return new Response(JSON.stringify({ 
            error: 'Erro ao processar foto',
            details: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * DELETE /api/api_auth/profile-photo
 * Remove a foto de perfil do utilizador
 */
export async function onRequestDelete(context) {
    const { request, env } = context;

    try {
        // Verificar autenticação
        const cookies = request.headers.get('Cookie') || '';
        const tokenMatch = cookies.match(/auth_token=([^;]+)/);

        if (!tokenMatch) {
            return new Response(JSON.stringify({ error: 'Não autenticado' }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const userPayload = await verifyJWT(tokenMatch[1], env.JWT_SECRET);
        if (!userPayload) {
            return new Response(JSON.stringify({ error: 'Sessão expirada' }), { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Buscar foto atual
        const cliente = await env.DB.prepare(
            'SELECT foto_perfil FROM clientes WHERE id = ?'
        ).bind(userPayload.id).first();

        if (!cliente || !cliente.foto_perfil) {
            return new Response(JSON.stringify({ 
                success: true,
                message: 'Nenhuma foto para remover'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Deletar do Cloudinary
        await deleteFromCloudinary(cliente.foto_perfil, env);

        // Atualizar base de dados
        await env.DB.prepare(
            'UPDATE clientes SET foto_perfil = NULL, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(userPayload.id).run();

        return new Response(JSON.stringify({ 
            success: true,
            message: 'Foto de perfil removida com sucesso'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao remover foto de perfil:', error);
        return new Response(JSON.stringify({ 
            error: 'Erro ao remover foto',
            details: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}