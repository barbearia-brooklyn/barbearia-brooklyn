// Configurações OAuth para cada provedor
export const OAUTH_PROVIDERS = {
    google: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scope: 'openid email profile',
        responseType: 'code',
        grantType: 'authorization_code'
    },
    facebook: {
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
        userInfoUrl: 'https://graph.facebook.com/me',
        scope: 'email,public_profile',
        responseType: 'code',
        grantType: 'authorization_code',
        fields: 'id,name,email,picture'
    },
    instagram: {
        authUrl: 'https://api.instagram.com/oauth/authorize',
        tokenUrl: 'https://api.instagram.com/oauth/access_token',
        userInfoUrl: 'https://graph.instagram.com/me',
        scope: 'user_profile,user_media',
        responseType: 'code',
        grantType: 'authorization_code',
        fields: 'id,username'
    }
};

export function getOAuthConfig(provider, env) {
    const config = OAUTH_PROVIDERS[provider];
    if (!config) {
        throw new Error(`Provedor OAuth desconhecido: ${provider}`);
    }

    const clientId = env[`${provider.toUpperCase()}_CLIENT_ID`];
    const clientSecret = env[`${provider.toUpperCase()}_CLIENT_SECRET`];
    const redirectUri = `${env.BASE_URL}/api/api_auth/oauth/${provider}/callback`;

    if (!clientId || !clientSecret) {
        throw new Error(`Configuração OAuth incompleta para ${provider}`);
    }

    return {
        ...config,
        clientId,
        clientSecret,
        redirectUri
    };
}

export function generateState() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}