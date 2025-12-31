-- Tabela de utilizadores admin com roles
CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nome TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'barbeiro')),
    barbeiro_id INTEGER,
    ativo INTEGER DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_login DATETIME,
    FOREIGN KEY (barbeiro_id) REFERENCES barbeiros(id) ON DELETE CASCADE
);

CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_barbeiro_id ON admin_users(barbeiro_id);

-- Inserir admin geral (usar a password das env variables)
-- Nota: Executar após criar a tabela no Cloudflare D1
-- wrangler d1 execute DB --command "INSERT INTO admin_users (username, password_hash, nome, role, ativo) VALUES ('admin', 'HASH_AQUI', 'Administrador', 'admin', 1)"

-- Criar contas para cada barbeiro (exemplos)
-- Nota: Substituir HASH_AQUI pelo hash bcrypt da password
-- wrangler d1 execute DB --command "INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo) VALUES ('gui', 'HASH_AQUI', 'Gui Pereira', 'barbeiro', 1, 1)"
-- wrangler d1 execute DB --command "INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo) VALUES ('johtta', 'HASH_AQUI', 'Johtta Barros', 'barbeiro', 2, 1)"
-- wrangler d1 execute DB --command "INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo) VALUES ('weslley', 'HASH_AQUI', 'Weslley Santos', 'barbeiro', 3, 1)"
-- wrangler d1 execute DB --command "INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo) VALUES ('marco', 'HASH_AQUI', 'Marco Bonucci', 'barbeiro', 4, 1)"
-- wrangler d1 execute DB --command "INSERT INTO admin_users (username, password_hash, nome, role, barbeiro_id, ativo) VALUES ('ricardo', 'HASH_AQUI', 'Ricardo Graça', 'barbeiro', 5, 1)"
