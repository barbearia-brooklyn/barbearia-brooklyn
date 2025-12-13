-- Migração segura OAuth - Apenas atualiza dados e índices
-- Use este ficheiro se as colunas já existirem

-- Atualizar registos existentes com password para incluir 'password' em auth_methods
UPDATE clientes 
SET auth_methods = 'password' 
WHERE password_hash IS NOT NULL 
  AND password_hash != 'cliente_nunca_iniciou_sessão'
  AND (auth_methods IS NULL OR auth_methods = '');

-- Criar índices para melhorar performance de queries OAuth (IF NOT EXISTS funciona aqui)
CREATE INDEX IF NOT EXISTS idx_google_id ON clientes(google_id);
CREATE INDEX IF NOT EXISTS idx_facebook_id ON clientes(facebook_id);
CREATE INDEX IF NOT EXISTS idx_instagram_id ON clientes(instagram_id);
CREATE INDEX IF NOT EXISTS idx_auth_methods ON clientes(auth_methods);