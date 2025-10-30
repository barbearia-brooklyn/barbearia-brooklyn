export async function onRequestPost({ request, env }) {
    try {
        const { username, password } = await request.json();

        // Verificar credenciais (em produção, use hash de senha)
        if (username === env.ADMIN_USERNAME && password === await env.ADMIN_PASSWORD) {
            // Gerar token (em produção, use JWT)
            const token = 'admin_token_' + Date.now();

            return new Response(JSON.stringify({ 
                success: true, 
                token 
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
