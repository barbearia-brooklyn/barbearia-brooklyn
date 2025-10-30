-- Tabela de barbeiros
CREATE TABLE IF NOT EXISTS barbeiros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    especialidades TEXT NOT NULL,
    avatar TEXT,
    ativo INTEGER DEFAULT 1
);

-- Tabela de serviços
CREATE TABLE IF NOT EXISTS servicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    preco REAL,
    duracao INTEGER DEFAULT 60
);

-- Tabela de reservas
CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_cliente TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    barbeiro_id INTEGER NOT NULL,
    servico_id INTEGER NOT NULL,
    data_hora TEXT NOT NULL,
    comentario TEXT,
    nota_privada TEXT,
    status TEXT DEFAULT 'confirmada',
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (barbeiro_id) REFERENCES barbeiros(id),
    FOREIGN KEY (servico_id) REFERENCES servicos(id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_reservas_email ON reservas(email);
CREATE INDEX IF NOT EXISTS idx_reservas_data ON reservas(data_hora);
CREATE INDEX IF NOT EXISTS idx_reservas_barbeiro ON reservas(barbeiro_id);

-- Inserir dados dos barbeiros
INSERT INTO barbeiros (nome, especialidades) VALUES 
('Gui Pereira', 'Cortes à Tesoura e Máquina, Barboterapia'),
('Johtta Barros', 'Cortes clássicos, Degrade, Barboterapia'),
('Weslley Santos', 'Degrade, Cortes à Máquina, Barboterapia'),
('Marco Bonucci', 'Cortes Clássicos, Degrade, Barboterapia'),
('Ricardo Graça', 'Cortes à tesoura e Máquina, Barboterapia');

-- Inserir serviços
INSERT INTO servicos (nome, duracao) VALUES 
('Corte', 60),
('Corte e Barba', 90),
('Corte até 12 anos', 45),
('Corte na máquina', 45),
('Sobrancelha', 15),
('Barba', 30),
('Barbaterapia', 45),
('Corte Estudante', 60),
('Corte+Barba Estudante', 90);
