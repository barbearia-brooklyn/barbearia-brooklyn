/**
 * Auth Middleware - Autenticação e Autorização com Roles
 * Valida tokens JWT e verifica permissões baseadas em roles
 */

import jwt from '@tsndr/cloudflare-worker-jwt';

/**
 * Verifica se o token é válido e retorna o payload
 * @param {string} token - Token JWT
 * @param {string} secret - Secret para validar o JWT
 * @returns {Promise<Object|null>} - Payload do token ou null se inválido
 */
export async function verifyToken(token, secret) {
    try {
        const isValid = await jwt.verify(token, secret);
        if (!isValid) return null;
        
        const payload = jwt.decode(token);
        return payload.payload;
    } catch (error) {
        console.error('❌ Erro ao verificar token:', error);
        return null;
    }
}

/**
 * Middleware de autenticação - Valida token e adiciona user ao context
 * @param {Request} request
 * @param {Object} env
 * @returns {Promise<Object|Response>} - User data ou Response de erro
 */
export async function authenticate(request, env) {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ 
            error: 'Token de autenticação ausente ou inválido' 
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const token = authHeader.substring(7);
    const secret = env.JWT_SECRET || 'brooklyn-secret-2025';
    
    const payload = await verifyToken(token, secret);
    
    if (!payload) {
        return new Response(JSON.stringify({ 
            error: 'Token inválido ou expirado' 
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Verificar se o user ainda existe e está ativo
    const user = await env.DB.prepare(
        'SELECT id, username, nome, role, barbeiro_id, ativo FROM admin_users WHERE id = ?'
    ).bind(payload.userId).first();

    if (!user || !user.ativo) {
        return new Response(JSON.stringify({ 
            error: 'Utilizador não encontrado ou inativo' 
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return user;
}

/**
 * Verifica se o user tem permissão para uma determinada ação
 * @param {Object} user - User data do authenticate
 * @param {string} permission - Tipo de permissão (ex: 'view_clients', 'view_all_bookings')
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
    // Admin tem todas as permissões
    if (user.role === 'admin') return true;
    
    // Barbeiros têm permissões limitadas
    const barbeiroPermissions = [
        'view_own_bookings',      // Ver próprias reservas
        'edit_own_bookings',      // Editar próprias reservas
        'view_own_unavailable',   // Ver próprias indisponibilidades
        'edit_own_unavailable',   // Editar próprias indisponibilidades
        'view_calendar',          // Ver calendário (apenas próprio)
        'view_dashboard'          // Ver dashboard (apenas próprias stats)
    ];
    
    return barbeiroPermissions.includes(permission);
}

/**
 * Filtra query SQL baseado no role do user
 * @param {Object} user - User data
 * @param {string} baseQuery - Query SQL base
 * @param {Array} params - Parâmetros da query
 * @returns {Object} - { query, params }
 */
export function applyRoleFilter(user, baseQuery, params = []) {
    if (user.role === 'admin') {
        return { query: baseQuery, params };
    }
    
    // Barbeiro: filtrar por barbeiro_id
    if (user.role === 'barbeiro' && user.barbeiro_id) {
        // Adicionar filtro de barbeiro_id à query
        let filteredQuery = baseQuery;
        
        // Se a query já tem WHERE, adicionar AND
        if (baseQuery.includes('WHERE')) {
            filteredQuery = baseQuery.replace(
                'WHERE',
                'WHERE barbeiro_id = ? AND'
            );
        } else {
            // Se não tem WHERE, adicionar antes do ORDER BY ou no final
            if (baseQuery.includes('ORDER BY')) {
                filteredQuery = baseQuery.replace(
                    'ORDER BY',
                    'WHERE barbeiro_id = ? ORDER BY'
                );
            } else {
                filteredQuery += ' WHERE barbeiro_id = ?';
            }
        }
        
        // Adicionar barbeiro_id aos parâmetros (no início)
        return { 
            query: filteredQuery, 
            params: [user.barbeiro_id, ...params] 
        };
    }
    
    return { query: baseQuery, params };
}
