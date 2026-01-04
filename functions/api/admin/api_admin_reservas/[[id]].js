/**
 * Dynamic route handler para PUT/DELETE de reservas individuais
 * Cloudflare Pages precisa deste ficheiro para reconhecer rotas com ID
 * Ex: PUT /api/admin/api_admin_reservas/123
 */

import { onRequestPut as putHandler, onRequestDelete as deleteHandler } from '../api_admin_reservas.js';

// Delegar para os handlers principais
export const onRequestPut = putHandler;
export const onRequestDelete = deleteHandler;

// OPTIONS para CORS
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        }
    });
}
