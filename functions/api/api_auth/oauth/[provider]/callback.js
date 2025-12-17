import { getOAuthConfig } from '../../../../utils/oauth-config.js';
import { generateJWT } from '../../../../utils/jwt.js';

async function exchangeCodeForToken(code, config) {
    const body = new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: config.grantType
    });

    const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        body: body.toString()
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao trocar código: ${error}`);
    }

    return await response.json();
}

async function getUserInfo(accessToken, config, provider) {
    let url = config.userInfoUrl;
    
    if (provider === 'facebook') {
        url += `?fields=${config.fields}&access_token=${accessToken}`;
    } else if (provider === 'instagram') {
        url += `?fields=${config.fields}&access_token=${accessToken}`;
    }

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao obter informações do utilizador');
    }

    return await response.json();
}

function normalizeUserInfo(userInfo, provider) {
    switch (provider) {
        case 'google':
            return {
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name
            };
        case 'facebook':
            return {
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name
            };
        case 'instagram':
            return {
                id: userInfo.id,
                username: userInfo.username,
                name: userInfo.username
            };
        default:
            return userInfo;
    }
}

export async function onRequestGet(context) {
    const { request, env, params } = context;
    
    try {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        
        console.log('Callback OAuth:', { provider: params.provider, hasCode: !!code, hasState: !!state, error });
        
        if (error) {
            return new Response(null, {
                status: 302,
                headers: {
                    'Location': `/login.html?error=${encodeURIComponent('Autenticação cancelada')}`
                }
            });
        }

        if (!code || !state) {
            return new Response(null, {
                status: 302,
                headers: {
                    'Location': '/login.html?error=invalid_request'
                }
            });
        }

        const provider = params.provider;
        
        // Verificar state
        const stateKey = `oauth_state_${state}`;
        const stateData = await env.KV_OAUTH.get(stateKey, 'json');
        
        console.log('State data:', stateData);
        
        if (!stateData) {
            return new Response(null, {
                status: 302,
                headers: {
                    'Location': '/login.html?error=invalid_state'
                }
            });
        }
        
        // Remover state usado
        await env.KV_OAUTH.delete(stateKey);
        
        const config = getOAuthConfig(provider, env);
        
        // Trocar código por token
        console.log('Trocando código por token...');
        const tokenData = await exchangeCodeForToken(code, config);
        const accessToken = tokenData.access_token;
        
        // Obter informações do utilizador
        console.log('Obtendo user info...');
        const userInfo = await getUserInfo(accessToken, config, provider);
        const normalizedUser = normalizeUserInfo(userInfo, provider);
        
        console.log('User info:', normalizedUser);
        console.log('Action:', stateData.action);
        
        // Verificar se é fluxo de registo (verificando action no stateData)
        if (stateData.action === 'register') {
            return handleOAuthRegister(normalizedUser, provider, env);
        } else if (stateData.action === 'link') {
            return await handleAccountLinking(normalizedUser, provider, stateData, env);
        } else {
            return await handleOAuthLogin(normalizedUser, provider, env);
        }

    } catch (error) {
        console.error('Erro no callback OAuth:', error);
        console.error('Stack:', error.stack);
        return new Response(null, {
            status: 302,
            headers: {
                'Location': `/login.html?error=${encodeURIComponent('Erro na autenticação')}`
            }
        });
    }
}

// Função para registo OAuth
function handleOAuthRegister(userInfo, provider, env) {
    console.log('Handling OAuth register');
    // Criar HTML para passar dados via sessionStorage (JavaScript)
    const userData = JSON.stringify({
        id: userInfo.id,
        name: userInfo.name || userInfo.username,
        email: userInfo.email
    });
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>A processar...</title>
</head>
<body>
    <p>A redirecionar...</p>
    <script>
        sessionStorage.setItem('oauth_user_data', ${JSON.stringify(userData)});
        sessionStorage.setItem('oauth_provider', '${provider}');
        sessionStorage.setItem('oauth_flow', 'register');
        window.location.href = '/login.html?oauth_register=1';
    </script>
</body>
</html>
    `;
    
    return new Response(html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8'
        }
    });
}

async function handleOAuthLogin(userInfo, provider, env) {
    console.log('Handling OAuth login');
    const providerIdField = `${provider}_id`;
    
    let cliente = await env.DB.prepare(
        `SELECT * FROM clientes WHERE ${providerIdField} = ?`
    ).bind(userInfo.id).first();
    
    console.log('Cliente encontrado por provider ID:', !!cliente);
    
    if (!cliente && userInfo.email) {
        cliente = await env.DB.prepare(
            'SELECT * FROM clientes WHERE email = ?'
        ).bind(userInfo.email).first();
        
        console.log('Cliente encontrado por email:', !!cliente);
        
        if (cliente) {
            if (cliente.password_hash === 'cliente_nunca_iniciou_sessão') {
                await env.DB.prepare(
                    `UPDATE clientes 
                     SET ${providerIdField} = ?, 
                         auth_methods = COALESCE(auth_methods || ',${provider}', '${provider}'),
                         email_verificado = 1
                     WHERE id = ?`
                ).bind(userInfo.id, cliente.id).run();
                
                cliente[providerIdField] = userInfo.id;
            } else {
                return new Response(null, {
                    status: 302,
                    headers: {
                        'Location': `/login.html?error=${encodeURIComponent('Email já registado. Faça login e associe sua conta ' + provider + ' no perfil.')}`
                    }
                });
            }
        }
    }
    
    if (!cliente) {
        console.log('Criando novo cliente...');
        const nome = userInfo.name || userInfo.username || 'Utilizador';
        const email = userInfo.email || null;
        
        const result = await env.DB.prepare(
            `INSERT INTO clientes 
             (nome, email, ${providerIdField}, auth_methods, email_verificado, password_hash)
             VALUES (?, ?, ?, ?, 1, NULL)`
        ).bind(nome, email, userInfo.id, provider).run();
        
        cliente = {
            id: result.meta.last_row_id,
            nome,
            email,
            [providerIdField]: userInfo.id
        };
    }
    
    console.log('Gerando JWT para cliente:', cliente.id);
    const token = await generateJWT({
        id: cliente.id,
        email: cliente.email,
        nome: cliente.nome,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    }, env.JWT_SECRET);
    
    return new Response(null, {
        status: 302,
        headers: {
            'Location': '/perfil.html',
            'Set-Cookie': `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`
        }
    });
}

async function handleAccountLinking(userInfo, provider, stateData, env) {
    try {
        console.log('Handling account linking');
        console.log('State data:', stateData);
        
        // Obter userId do state em vez do cookie!
        const userId = stateData.userId;
        
        if (!userId) {
            console.error('userId não encontrado no state!');
            return new Response(null, {
                status: 302,
                headers: {
                    'Location': '/login.html?error=invalid_state'
                }
            });
        }
        
        console.log('User ID do state:', userId);
        
        const providerIdField = `${provider}_id`;
        
        const existingAccount = await env.DB.prepare(
            `SELECT id FROM clientes WHERE ${providerIdField} = ? AND id != ?`
        ).bind(userInfo.id, userId).first();
        
        if (existingAccount) {
            console.log('Conta já associada a outro utilizador');
            return new Response(null, {
                status: 302,
                headers: {
                    'Location': `/perfil.html?error=${encodeURIComponent('Esta conta ' + provider + ' já está associada a outro utilizador')}`
                }
            });
        }
        
        console.log('Associando conta...');
        await env.DB.prepare(
            `UPDATE clientes 
             SET ${providerIdField} = ?,
                 auth_methods = CASE 
                     WHEN auth_methods IS NULL THEN '${provider}'
                     WHEN auth_methods NOT LIKE '%${provider}%' THEN auth_methods || ',${provider}'
                     ELSE auth_methods
                 END
             WHERE id = ?`
        ).bind(userInfo.id, userId).run();
        
        console.log('Conta associada com sucesso!');
        return new Response(null, {
            status: 302,
            headers: {
                'Location': '/perfil.html?success=account_linked'
            }
        });
        
    } catch (error) {
        console.error('Erro ao linkar conta:', error);
        console.error('Stack:', error.stack);
        return new Response(null, {
            status: 302,
            headers: {
                'Location': `/perfil.html?error=${encodeURIComponent('Erro ao associar conta')}`
            }
        });
    }
}