/**
 * API Admin - Horários Indisponíveis com Filtro por Role
 * Admin: vê todas as indisponibilidades
 * Barbeiro: vê apenas suas próprias indisponibilidades
 */

import { authenticate, hasPermission } from './auth.js';

export async function onRequestGet({ request, env }) {
    try {
        console.log('✅ GET Indisponibilidades - Iniciando...');

        // AUTENTICAÇÃO
        const authResult = await authenticate(request, env);
        if (authResult instanceof Response) return authResult;
        const user = authResult;

        console.log('👤 User autenticado:', user.username, 'Role:', user.role);

        const url = new URL(request.url);
        const barbeiroId = url.searchParams.get('barbeiro_id');
        const dataInicio = url.searchParams.get('data_inicio');
        const dataFim = url.searchParams.get('data_fim');
        const tipo = url.searchParams.get('tipo');

        let query = `
            SELECT 
                h.*,
                b.nome as barbeiro_nome
            FROM horarios_indisponiveis h
            INNER JOIN barbeiros b ON h.barbeiro_id = b.id
            WHERE 1=1
        `;

        const params = [];

        // FILTRO POR ROLE: Barbeiro só vê suas indisponibilidades
        if (user.role === 'barbeiro' && user.barbeiro_id) {
            query += ` AND h.barbeiro_id = ?`;
            params.push(user.barbeiro_id);
            console.log('🔒 Filtro barbeiro aplicado:', user.barbeiro_id);
        }

        // Filtros opcionais
        if (user.role === 'admin' && barbeiroId) {
            query += ` AND h.barbeiro_id = ?`;
            params.push(parseInt(barbeiroId));
        }

        if (dataInicio) {
            query += ` AND DATE(h.data_hora_inicio) >= DATE(?)`;
            params.push(dataInicio);
        }

        if (dataFim) {
            query += ` AND DATE(h.data_hora_fim) <= DATE(?)`;
            params.push(dataFim);
        }

        if (tipo) {
            query += ` AND h.tipo = ?`;
            params.push(tipo);
        }

        query += ` ORDER BY h.data_hora_inicio DESC`;

        console.log('Query:', query);
        console.log('Params:', params);

        const stmt = env.DB.prepare(query);
        const { results } = await stmt.bind(...params).all();

        console.log(`✅ ${results ? results.length : 0} indisponibilidades encontradas`);

        return new Response(JSON.stringify({
            horarios: results || [],
            user: {
                role: user.role,
                barbeiro_id: user.barbeiro_id
            }
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar indisponibilidades:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao buscar indisponibilidades',
            details: error.message
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// POST, PUT, DELETE: adicionar verificação de permissões
// Barbeiro só pode criar/editar/deletar suas próprias indisponibilidades
