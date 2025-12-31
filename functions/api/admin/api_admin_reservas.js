/**
 * API Admin - Reservas com Filtro por Role
 * Admin: vê todas as reservas
 * Barbeiro: vê apenas suas próprias reservas
 */

import { authenticate, hasPermission } from './auth.js';

export async function onRequestGet({ request, env }) {
    try {
        console.log('✅ GET Reservas - Iniciando...');

        // AUTENTICAÇÃO
        const authResult = await authenticate(request, env);
        if (authResult instanceof Response) return authResult;
        const user = authResult;

        console.log('👤 User autenticado:', user.username, 'Role:', user.role);

        const url = new URL(request.url);
        const dataInicio = url.searchParams.get('data_inicio');
        const dataFim = url.searchParams.get('data_fim');
        const barbeiroId = url.searchParams.get('barbeiro_id');
        const status = url.searchParams.get('status');

        let query = `
            SELECT 
                r.*,
                c.nome as cliente_nome,
                c.telefone as cliente_telefone,
                c.email as cliente_email,
                b.nome as barbeiro_nome,
                s.nome as servico_nome,
                s.preco as servico_preco,
                s.duracao as servico_duracao
            FROM reservas r
            INNER JOIN clientes c ON r.cliente_id = c.id
            INNER JOIN barbeiros b ON r.barbeiro_id = b.id
            INNER JOIN servicos s ON r.servico_id = s.id
            WHERE 1=1
        `;

        const params = [];

        // FILTRO POR ROLE: Barbeiro só vê suas reservas
        if (user.role === 'barbeiro' && user.barbeiro_id) {
            query += ` AND r.barbeiro_id = ?`;
            params.push(user.barbeiro_id);
            console.log('🔒 Filtro barbeiro aplicado:', user.barbeiro_id);
        }

        // Filtros opcionais
        if (dataInicio) {
            query += ` AND DATE(r.data_hora) >= DATE(?)`;
            params.push(dataInicio);
        }

        if (dataFim) {
            query += ` AND DATE(r.data_hora) <= DATE(?)`;
            params.push(dataFim);
        }

        // Se admin filtrar por barbeiro específico
        if (user.role === 'admin' && barbeiroId) {
            query += ` AND r.barbeiro_id = ?`;
            params.push(parseInt(barbeiroId));
        }

        if (status) {
            query += ` AND r.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY r.data_hora DESC`;

        console.log('Query:', query);
        console.log('Params:', params);

        const stmt = env.DB.prepare(query);
        const { results } = await stmt.bind(...params).all();

        console.log(`✅ ${results ? results.length : 0} reservas encontradas`);

        return new Response(JSON.stringify({
            reservas: results || [],
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
        console.error('❌ Erro ao buscar reservas:', error);
        return new Response(JSON.stringify({
            error: 'Erro ao buscar reservas',
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

// POST, PUT, DELETE mantidos iguais ao original...
// (Apenas adicionar authenticate no início de cada função)
