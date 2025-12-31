/**
 * Brooklyn Barbearia - Authentication Middleware
 * Sistema de autenticação com JWT usando Web Crypto API nativa
 */

/**
 * Gera JWT token usando Web Crypto API
 * @param {Object} payload - Dados a incluir no token
 * @param {string} secret - Secret para assinar o token
 * @param {number} expiresIn - Tempo de expiração em segundos
 * @returns {Promise<string>} JWT token
 */
async function generateJWT(payload, secret, expiresIn = 86400) {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const claims = {
        ...payload,
        iat: now,
        exp: now + expiresIn
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(claims));
    const message = `${encodedHeader}.${encodedPayload}`;

    const signature = await sign(message, secret);
    return `${message}.${signature}`;
}

/**
 * Verifica JWT token
 * @param {string} token - JWT token
 * @param {string} secret - Secret para verificar a assinatura
 * @returns {Promise<Object|null>} Payload decodificado ou null se inválido
 */
async function verifyJWT(token, secret) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        const [encodedHeader, encodedPayload, signature] = parts;
        const message = `${encodedHeader}.${encodedPayload}`;

        // Verificar assinatura
        const expectedSignature = await sign(message, secret);
        if (signature !== expectedSignature) {
            console.log('❌ Assinatura inválida');
            return null;
        }

        // Decodificar payload
        const payload = JSON.parse(base64UrlDecode(encodedPayload));

        // Verificar expiração
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            console.log('❌ Token expirado');
            return null;
        }

        return payload;
    } catch (error) {
        console.error('❌ Erro ao verificar JWT:', error);
        return null;
    }
}

/**
 * Assina uma mensagem com HMAC-SHA256
 */
async function sign(message, secret) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        messageData
    );

    return base64UrlEncode(signature);
}

/**
 * Codifica para Base64URL
 */
function base64UrlEncode(data) {
    let base64;
    if (typeof data === 'string') {
        base64 = btoa(unescape(encodeURIComponent(data)));
    } else if (data instanceof ArrayBuffer) {
        const bytes = new Uint8Array(data);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        base64 = btoa(binary);
    } else {
        throw new Error('Tipo de dados não suportado');
    }
    
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Decodifica de Base64URL
 */
function base64UrlDecode(base64Url) {
    let base64 = base64Url
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    
    // Adicionar padding se necessário
    while (base64.length % 4) {
        base64 += '=';
    }
    
    return decodeURIComponent(escape(atob(base64)));
}

/**
 * Hash de password usando SHA-256 com salt
 * @param {string} password - Password em plain text
 * @param {string} salt - Salt (opcional, gera novo se não fornecido)
 * @returns {Promise<string>} Hash no formato salt:hash
 */
async function hashPassword(password, salt = null) {
    if (!salt) {
        // Gerar salt aleatório
        const saltBytes = crypto.getRandomValues(new Uint8Array(16));
        salt = Array.from(saltBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(salt + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return `${salt}:${hashHex}`;
}

/**
 * Verifica password contra hash
 * @param {string} password - Password em plain text
 * @param {string} storedHash - Hash armazenado (formato salt:hash)
 * @returns {Promise<boolean>} true se password corresponde
 */
async function verifyPassword(password, storedHash) {
    const [salt] = storedHash.split(':');
    const newHash = await hashPassword(password, salt);
    return newHash === storedHash;
}

/**
 * Middleware de autenticação
 * Verifica se o request tem um token JWT válido
 */
export async function authenticate(request, env) {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ Token não fornecido');
        return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    const secret = env.JWT_SECRET || 'brooklyn-secret-2025-CHANGE-THIS';

    const payload = await verifyJWT(token, secret);
    if (!payload) {
        return null;
    }

    console.log('✅ User autenticado:', payload.username, 'Role:', payload.role);
    return payload;
}

/**
 * Verifica se o utilizador tem uma permissão específica
 */
export function hasPermission(user, permission) {
    if (!user) return false;

    const permissions = {
        'admin': ['view_all_bookings', 'view_all_unavailability', 'view_clients', 'create_booking', 'manage_users'],
        'barbeiro': ['view_own_bookings', 'view_own_unavailability', 'create_unavailability']
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes(permission);
}

/**
 * Aplica filtros SQL baseados no role do utilizador
 */
export function applyRoleFilter(user, baseQuery, params = []) {
    if (!user) {
        throw new Error('Utilizador não autenticado');
    }

    let query = baseQuery;
    let newParams = [...params];

    // Se for barbeiro, filtrar apenas pelos seus dados
    if (user.role === 'barbeiro' && user.barbeiro_id) {
        // Assumindo que a query tem uma tabela com barbeiro_id
        if (query.includes('barbeiro_id')) {
            query += ` AND barbeiro_id = ?`;
            newParams.push(user.barbeiro_id);
            console.log('🔒 Filtro barbeiro aplicado:', user.barbeiro_id);
        }
    }

    return { query, params: newParams };
}

// Exportar funções de hash e JWT para uso em outras APIs
export { generateJWT, verifyJWT, hashPassword, verifyPassword };
