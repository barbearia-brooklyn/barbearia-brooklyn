-- =====================================================
-- Migração: Adicionar cores aos barbeiros
-- Data: 2026-01-06
-- Descrição: Adiciona coluna 'color' e define cores únicas
-- =====================================================

-- 1. Adicionar coluna color (se não existir)
ALTER TABLE barbeiros ADD COLUMN color TEXT DEFAULT '#0f7e44';

-- 2. Atualizar cores para barbeiros existentes
-- Paleta harmoniosa de cores para o calendário

UPDATE barbeiros SET color = '#0f7e44' WHERE id = 1;  -- Verde Brooklyn (marca)
UPDATE barbeiros SET color = '#e74c3c' WHERE id = 2;  -- Vermelho coral
UPDATE barbeiros SET color = '#3498db' WHERE id = 3;  -- Azul céu
UPDATE barbeiros SET color = '#f39c12' WHERE id = 4;  -- Laranja dourado
UPDATE barbeiros SET color = '#9b59b6' WHERE id = 5;  -- Roxo ametista
UPDATE barbeiros SET color = '#1abc9c' WHERE id = 6;  -- Turquesa
UPDATE barbeiros SET color = '#34495e' WHERE id = 7;  -- Cinza ardósia
UPDATE barbeiros SET color = '#e67e22' WHERE id = 8;  -- Laranja escuro

-- 3. Verificar resultado
SELECT id, nome, color FROM barbeiros ORDER BY id;
