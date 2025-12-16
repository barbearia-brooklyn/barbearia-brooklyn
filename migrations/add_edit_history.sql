-- Migração: Adicionar campos para histórico de edições e fidelização
-- Data: 2025-12-16
-- Autor: Tiago Oliveira

-- ===== PARTE 1: SISTEMA DE FIDELIZAÇÃO =====
-- Adicionar contador de reservas concluídas na tabela clientes
ALTER TABLE clientes ADD COLUMN reservas_concluidas INTEGER DEFAULT 0;

-- Atualizar contador com dados existentes
UPDATE clientes SET reservas_concluidas = (
    SELECT COUNT(*) FROM reservas 
    WHERE cliente_id = clientes.id AND status = 'concluida'
);

-- ===== PARTE 2: HISTÓRICO DE EDIÇÕES =====
-- Adicionar campo JSON para histórico de edições na tabela reservas
ALTER TABLE reservas ADD COLUMN historico_edicoes TEXT DEFAULT '[]';

-- Adicionar campo atualizado_em se ainda não existir
-- (verifica se já existe antes de adicionar)
ALTER TABLE reservas ADD COLUMN atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP;

-- ===== NOTAS DE UTILIZAÇÃO =====
-- 
-- Campo reservas_concluidas:
--   - Incrementar quando uma reserva mudar para status 'concluida'
--   - Usado para sistema de fidelização futuro
--
-- Campo historico_edicoes:
--   - Array JSON com histórico de alterações
--   - Formato: [{"tipo": "alteracao", "campos_alterados": {...}, "data": "ISO8601"}]
--   - Vazio ([]) quando nunca foi editada
--   - Só popula quando há alteração (economia de recursos)
--
-- Exemplos de tipos no histórico:
--   - "alteracao" - Cliente alterou data/hora/barbeiro
--   - "cancelamento" - Reserva foi cancelada
--   - "admin_edit" - Admin alterou dados da reserva