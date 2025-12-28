-- Adicionar campo NIF (Número de Identificação Fiscal) à tabela clientes
-- Este campo é opcional mas necessário para emitir faturas com contribuinte

ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS nif VARCHAR(20) NULL;

-- Criar índice para pesquisas por NIF
CREATE INDEX IF NOT EXISTS idx_clientes_nif ON clientes(nif);

-- Comentário no campo
COMMENT ON COLUMN clientes.nif IS 'Número de Identificação Fiscal do cliente para faturação';
