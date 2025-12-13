import { hashPassword, generateToken } from '../../utils/crypto.js';
import { generateJWT } from '../../utils/jwt.js';
import { enviarEmailVerificacao } from '../../utils/email.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { id, nome, email, telefone, password } = await request.json();
        
        // Validações
        if (!id || !nome || !password) {
            return new Response(JSON.stringify({ error: 'Dados incompletos' }), { status: 400 });
        }
        
        if (password.length < 8) {
            return new Response(JSON.stringify({ error: 'Password deve ter pelo menos 8 caracteres' }), { status: 400 });
        }
        
        // Buscar cliente com password placeholder
        const cliente = await env.DB.prepare(
            'SELECT * FROM clientes WHERE id = ? AND password_hash = ?'
        ).bind(id, 'cliente_nunca_iniciou_sessão').first();
        
        if (!cliente) {
            return new Response(JSON.stringify({ error: 'Cliente não encontrado ou já tem conta ativa' }), { status: 404 });
        }
        
        // Hash da password
        const passwordHash = await hashPassword(password);
        const tokenVerificacao = generateToken();
        
        // Atualizar dados e password
        await env.DB.prepare(
            `UPDATE clientes 
             SET nome = ?, email = ?, telefone = ?, password_hash = ?, token_verificacao = ?, auth_methods = 'password'
             WHERE id = ?`
        ).bind(nome, email, telefone, passwordHash, tokenVerificacao, id).run();
        
        // Enviar email de verificação
        await enviarEmailVerificacao(email, nome, tokenVerificacao, env);
        
        // Gerar JWT para login automático
        const token = await generateJWT({
            id: cliente.id,
            email: email,
            nome: nome,
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
        }, env.JWT_SECRET);
        
        return new Response(JSON.stringify({
            success: true,
            message: 'Perfil completado! Verifique o seu email.'
        }), { 
            status: 200,
            headers: {
                'Set-Cookie': `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`,
                'Content-Type': 'application/json'
            }
        });
        
    } catch (error) {
        console.error('Erro ao completar perfil:', error);
        return new Response(JSON.stringify({ error: 'Erro ao completar perfil' }), { status: 500 });
    }
}