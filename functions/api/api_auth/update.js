import { hashPassword, verifyPassword } from '../../utils/crypto.js';

async function verifyJWT(token, secret) {
    try {
        const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
        const data = `${encodedHeader}.${encodedPayload}`;

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const signature = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0));
        const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));

        if (!valid) return null;

        const payload = JSON.parse(atob(encodedPayload));
        if (payload.exp && payload.exp < Date.now() / 1000) return null;

        return payload;
    } catch {
        return null;
    }
}

export async function onRequestPut(context) {
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

        const { nome, telefone, email, nif, currentPassword, newPassword } = await request.json();

        // Validações básicas
        if (!nome || nome.trim().length === 0) {
            return new Response(JSON.stringify({ error: 'Nome é obrigatório' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validar NIF se fornecido (9 dígitos numéricos)
        if (nif !== null && nif !== undefined && nif !== '') {
            const nifStr = String(nif).trim();
            if (!/^\d{9}$/.test(nifStr)) {
                return new Response(JSON.stringify({ 
                    error: 'NIF deve ter exatamente 9 dígitos numéricos' 
                }), { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Validar email se fornecido
        if (email && email.trim().length > 0) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                return new Response(JSON.stringify({ 
                    error: 'Email inválido' 
                }), { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Verificar se o email já existe noutro cliente
            const emailExists = await env.DB.prepare(
                'SELECT id FROM clientes WHERE email = ? AND id != ?'
            ).bind(email.trim(), userPayload.id).first();

            if (emailExists) {
                return new Response(JSON.stringify({ 
                    error: 'Este email já está registado por outro cliente' 
                }), { 
                    status: 409,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Se está a alterar password, verificar a atual
        if (currentPassword && newPassword) {
            if (newPassword.length < 8) {
                return new Response(JSON.stringify({ 
                    error: 'A nova password deve ter pelo menos 8 caracteres' 
                }), { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const cliente = await env.DB.prepare(
                'SELECT password_hash FROM clientes WHERE id = ?'
            ).bind(userPayload.id).first();

            const passwordMatch = await verifyPassword(currentPassword, cliente.password_hash);

            if (!passwordMatch) {
                return new Response(JSON.stringify({ 
                    error: 'Password atual incorreta' 
                }), { 
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Atualizar com nova password
            const newPasswordHash = await hashPassword(newPassword);

            await env.DB.prepare(
                'UPDATE clientes SET nome = ?, telefone = ?, email = ?, nif = ?, password_hash = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(
                nome.trim(), 
                telefone?.trim() || null, 
                email?.trim() || null, 
                nif ? String(nif).trim() : null, 
                newPasswordHash, 
                userPayload.id
            ).run();
        } else {
            // Atualizar sem alterar password
            await env.DB.prepare(
                'UPDATE clientes SET nome = ?, telefone = ?, email = ?, nif = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(
                nome.trim(), 
                telefone?.trim() || null, 
                email?.trim() || null, 
                nif ? String(nif).trim() : null, 
                userPayload.id
            ).run();
        }

        return new Response(JSON.stringify({ 
            success: true,
            message: 'Perfil atualizado com sucesso'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        return new Response(JSON.stringify({ 
            error: 'Erro ao atualizar perfil',
            details: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
