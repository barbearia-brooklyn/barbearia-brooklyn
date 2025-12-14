-- Adicionar constraints UNIQUE ao email e telefone
-- IMPORTANTE: Execute este script na sua base de dados D1

-- Primeiro, verificar se há duplicados e limpá-los se necessário
-- DELETE FROM clientes WHERE id NOT IN (SELECT MIN(id) FROM clientes GROUP BY email);
-- DELETE FROM clientes WHERE telefone IS NOT NULL AND id NOT IN (SELECT MIN(id) FROM clientes WHERE telefone IS NOT NULL GROUP BY telefone);

-- Adicionar índices UNIQUE
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_email_unique ON clientes(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_telefone_unique ON clientes(telefone) WHERE telefone IS NOT NULL;

-- Adicionar campo para expiração do token (se não existir)
ALTER TABLE clientes ADD COLUMN token_verificacao_expira TEXT;

-- Adicionar campo auth_methods (se não existir)
ALTER TABLE clientes ADD COLUMN auth_methods TEXT DEFAULT 'email';