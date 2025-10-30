export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Método não permitido' }), { 
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { username, password } = await request.json();

        // Buscar credenciais das environment variables
        const adminUsername = env.ADMIN_USERNAME || 'admin';
        const adminPassword = env.ADMIN_PASSWORD;

        console.log('Tentativa de login:', username); // Para debug
        console.log('Admin username esperado:', adminUsername); // Para debug

        // Verificar credenciais
        if (username === adminUsername && password === adminPassword) {
            // Gerar um token simples (em produção, usa JWT)
            const token = btoa(`${username}:${password}:${Date.now()}`);

            return new Response(JSON.stringify({ 
                success: true, 
                token 
            }), {
                status: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        return new Response(JSON.stringify({ 
            error: 'Credenciais inválidas' 
        }), { 
            status: 401,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        return new Response(JSON.stringify({ 
            error: error.message 
        }), { 
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
