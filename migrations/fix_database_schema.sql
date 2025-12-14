-- =====================================================
-- MIGRAÇÃO DA BASE DE DADOS - Brooklyn Barbearia
-- Execute este script no Cloudflare Dashboard > D1
-- =====================================================

-- 1. Adicionar campo token_verificacao_expira (se não existir)
ALTER TABLE clientes ADD COLUMN token_verificacao_expira TEXT;

-- 2. Criar índice UNIQUE para email (se ainda não existir)
-- Nota: Pode dar erro se já existir, mas é seguro ignorar
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_email_unique ON clientes(email);

-- 3. Criar índice UNIQUE para telefone (apenas para telefones não nulos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_telefone_unique ON clientes(telefone) 
WHERE telefone IS NOT NULL AND telefone != '';

-- 4. Atualizar dados existentes
-- Marcar clientes sem password como não verificados (se necessário)
UPDATE clientes 
SET email_verificado = 0 
WHERE password_hash = 'cliente_nunca_iniciou_sessão' 
  AND email_verificado = 1;

-- 5. Opcional: Limpar duplicados de telefone antes de criar o índice
-- AVISO: Isto apaga registos duplicados, mantendo apenas o mais antigo!
-- Descomente apenas se tiver certeza:
/*
DELETE FROM clientes 
WHERE telefone IS NOT NULL 
  AND telefone != '' 
  AND id NOT IN (
    SELECT MIN(id) 
    FROM clientes 
    WHERE telefone IS NOT NULL AND telefone != ''
    GROUP BY telefone
  );
*/

-- 6. Verificar integridade dos dados
-- Mostrar clientes com emails duplicados (se houver)
SELECT email, COUNT(*) as total 
FROM clientes 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Mostrar clientes com telefones duplicados (se houver)
SELECT telefone, COUNT(*) as total 
FROM clientes 
WHERE telefone IS NOT NULL AND telefone != ''
GROUP BY telefone 
HAVING COUNT(*) > 1;

-- =====================================================
-- SCHEMA FINAL ESPERADO
-- =====================================================
/*
CREATE TABLE clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT,
  password_hash TEXT,
  email_verificado BOOLEAN DEFAULT 0,  -- Alterado para 0
  token_verificacao TEXT,
  token_verificacao_expira TEXT,       -- NOVO CAMPO
  token_reset_password TEXT,
  token_reset_expira DATETIME,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  google_id TEXT,
  facebook_id TEXT,
  instagram_id TEXT,
  auth_methods TEXT DEFAULT 'email'
);

-- Índices
CREATE UNIQUE INDEX idx_clientes_email_unique ON clientes(email);
CREATE UNIQUE INDEX idx_clientes_telefone_unique ON clientes(telefone) WHERE telefone IS NOT NULL;
CREATE INDEX idx_clientes_token_verificacao ON clientes(token_verificacao);
CREATE INDEX idx_google_id ON clientes(google_id);
CREATE INDEX idx_facebook_id ON clientes(facebook_id);
CREATE INDEX idx_instagram_id ON clientes(instagram_id);
CREATE INDEX idx_auth_methods ON clientes(auth_methods);
*/