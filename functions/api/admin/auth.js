/**
 * Authentication Utilities
 * Helper functions for admin authentication
 */

import { verifyJWT } from '../../utils/jwt.js';

/**
 * Verify admin token from request
 * NOTE: This version does NOT require a 'users' table in the database.
 * It only verifies the JWT token signature and checks if isAdmin flag is present.
 * 
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

        // Verify JWT signature
        const payload = await verifyJWT(token, env.JWT_SECRET);
        
        if (!payload) {
            return { valid: false, error: 'Token inválido ou expirado' };
        }

        // Check if token has admin flag
        if (!payload.isAdmin) {
            return { valid: false, error: 'Token não é de administrador' };
        }

        // Token is valid and user is admin
        return { 
            valid: true, 
            user: {
                id: payload.userId || payload.sub,
                username: payload.username || 'admin',
                isAdmin: true
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
