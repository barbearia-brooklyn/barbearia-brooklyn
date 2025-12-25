/**
 * Authentication Utilities
 * Helper functions for admin authentication
 */

import { verifyJWT } from '../../utils/jwt.js';

/**
 * Verify admin token from request
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables
 * @returns {Promise<{valid: boolean, user?: Object, error?: string}>}
 */
export async function verifyAdminToken(request, env) {
    try {
        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { valid: false, error: 'Token não fornecido' };
        }

        const token = authHeader.substring(7); // Remove 'Bearer '
        
        if (!token) {
            return { valid: false, error: 'Token vazio' };
        }

        // Verify JWT
        const payload = await verifyJWT(token, env.JWT_SECRET);
        
        if (!payload || !payload.userId || !payload.isAdmin) {
            return { valid: false, error: 'Token inválido ou não é admin' };
        }

        // Optional: Verify user still exists and is admin
        const user = await env.DB.prepare(
            'SELECT id, username, is_admin FROM users WHERE id = ? AND is_admin = 1'
        ).bind(payload.userId).first();

        if (!user) {
            return { valid: false, error: 'Utilizador não encontrado ou não é admin' };
        }

        return { 
            valid: true, 
            user: {
                id: user.id,
                username: user.username,
                isAdmin: user.is_admin === 1
            }
        };

    } catch (error) {
        console.error('Error verifying admin token:', error);
        return { valid: false, error: error.message };
    }
}

/**
 * Verify admin token and return 401 response if invalid
 * Use this for cleaner code in endpoints
 */
export async function requireAdminAuth(request, env) {
    const result = await verifyAdminToken(request, env);
    
    if (!result.valid) {
        return {
            authorized: false,
            response: new Response(JSON.stringify({ 
                error: 'Não autorizado',
                details: result.error 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            })
        };
    }

    return {
        authorized: true,
        user: result.user
    };
}
