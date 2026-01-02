-- Migration 007: Adicionar duracao_minutos e created_by à tabela reservas
-- Data: 2026-01-02
-- Descrição: Permite customizar a duração de cada reserva e rastrear quem a criou

-- 1. Adicionar coluna duracao_minutos (INTEGER, NULL permitido)
-- Esta coluna armazena a duração customizada de cada reserva
-- Se NULL, o sistema usa a duração padrão do serviço
ALTER TABLE reservas ADD COLUMN duracao_minutos INTEGER DEFAULT NULL;

-- 2. Popular valores existentes com a duração do serviço correspondente (opcional)
-- Isto garante que reservas antigas mantêm a duração que tinham no momento da criação
UPDATE reservas 
SET duracao_minutos = (
    SELECT s.duracao 
    FROM servicos s 
    WHERE s.id = reservas.servico_id
)
WHERE duracao_minutos IS NULL;

-- 3. Adicionar coluna created_by para rastrear origem da reserva
-- Valores permitidos: 'online', 'admin', 'barbeiro'
ALTER TABLE reservas ADD COLUMN created_by TEXT DEFAULT 'admin' CHECK(created_by IN ('online', 'admin', 'barbeiro'));

-- 4. Tentar determinar origem das reservas existentes
-- Assumir que reservas antigas foram criadas por admin
UPDATE reservas 
SET created_by = 'admin'
WHERE created_by IS NULL;

-- Verificação final
SELECT 
    'Colunas adicionadas com sucesso!' as status,
    COUNT(*) as total_reservas,
    COUNT(duracao_minutos) as com_duracao,
    COUNT(created_by) as com_created_by
FROM reservas;
