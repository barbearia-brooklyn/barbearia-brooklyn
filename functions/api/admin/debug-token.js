/**
 * Debug Token Endpoint
 * Helps diagnose authentication issues
 */

import { verifyJWT } from '../../utils/jwt.js';

export async function onRequestGet({ request, env }) {
    try {
        const authHeader = request.headers.get('Authorization');
        
        const debug = {
            timestamp: new Date().toISOString(),
            authHeader: {
                present: !!authHeader,
                format: authHeader?.substring(0, 20) + '...'
            },
            jwt: {},
            database: {},
            environment: {
                JWT_SECRET_exists: !!env.JWT_SECRET,
                DB_exists: !!env.DB
            }
        };

        // Check token
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            debug.jwt.error = 'Token não fornecido ou formato incorreto';
        } else {
            const token = authHeader.substring(7);
            
            // Try to decode without verifying
            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    debug.jwt.payload = payload;
                    debug.jwt.expired = payload.exp ? (payload.exp * 1000 < Date.now()) : 'no_expiry';
                }
            } catch (e) {
                debug.jwt.decode_error = e.message;
            }

            // Try to verify
            if (env.JWT_SECRET) {
                try {
                    const verified = await verifyJWT(token, env.JWT_SECRET);
                    debug.jwt.verified = !!verified;
                    debug.jwt.verified_payload = verified;
                } catch (e) {
                    debug.jwt.verify_error = e.message;
                }
            } else {
                debug.jwt.verify_error = 'JWT_SECRET not configured';
            }
        }

        // Check database
        if (env.DB) {
            try {
                // Check if users table exists
                const usersTable = await env.DB.prepare(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
                ).first();
                
                debug.database.users_table_exists = !!usersTable;

                if (usersTable) {
                    // Count users
                    const count = await env.DB.prepare(
                        'SELECT COUNT(*) as count FROM users'
                    ).first();
                    debug.database.users_count = count?.count || 0;

                    // Count admins
                    const adminCount = await env.DB.prepare(
                        'SELECT COUNT(*) as count FROM users WHERE is_admin = 1'
                    ).first();
                    debug.database.admin_count = adminCount?.count || 0;

                    // If we have a verified token, check if user exists
                    if (debug.jwt.verified_payload?.userId) {
                        const user = await env.DB.prepare(
                            'SELECT id, username, is_admin FROM users WHERE id = ?'
                        ).bind(debug.jwt.verified_payload.userId).first();
                        
                        debug.database.token_user_exists = !!user;
                        if (user) {
                            debug.database.token_user = {
                                id: user.id,
                                username: user.username,
                                is_admin: user.is_admin
                            };
                        }
                    }
                } else {
                    debug.database.error = 'Tabela users não existe! Sistema de auth antigo ainda em uso.';
                    debug.database.solution = 'Executar migration para criar tabela users ou usar verificação de token antiga';
                }

                // Check other tables
                const tables = await env.DB.prepare(
                    "SELECT name FROM sqlite_master WHERE type='table'"
                ).all();
                debug.database.tables = tables.results?.map(t => t.name) || [];

            } catch (e) {
                debug.database.error = e.message;
            }
        } else {
            debug.database.error = 'DB binding not configured';
        }

        return new Response(JSON.stringify(debug, null, 2), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack
        }, null, 2), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}