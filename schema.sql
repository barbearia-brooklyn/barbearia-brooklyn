PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT,
  password_hash TEXT NOT NULL,
  email_verificado BOOLEAN DEFAULT 1,  -- DEFAULT 1 para dados migrados
  token_verificacao TEXT,
  token_reset_password TEXT,
  token_reset_expira DATETIME,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  google_id TEXT, facebook_id TEXT,
  instagram_id TEXT,
  auth_methods TEXT DEFAULT 'password',
  token_verificacao_expira TEXT,
  reservas_concluidas INTEGER DEFAULT 0
);
CREATE TABLE "barbeiros" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    especialidades TEXT NOT NULL,
    foto TEXT,
    ativo INTEGER DEFAULT 1
);
INSERT INTO "barbeiros" VALUES(1,'Gui Pereira','Cortes à Tesoura e Máquina, Barboterapia','images/barbers/Gui.png',1);
INSERT INTO "barbeiros" VALUES(2,'Johtta Barros','Cortes clássicos, Degrade, Barboterapia','images/barbers/Johtta.png',1);
INSERT INTO "barbeiros" VALUES(3,'Weslley Santos','Degrade, Cortes à Máquina, Barboterapia','images/barbers/Weslley.png',1);
INSERT INTO "barbeiros" VALUES(4,'Marco Bonucci','Cortes Clássicos, Degrade, Barboterapia','images/barbers/Marco.png',1);
INSERT INTO "barbeiros" VALUES(5,'Ricardo Graça','Cortes à tesoura e Máquina, Barboterapia','images/barbers/Ricardo.png',1);

CREATE TABLE "servicos" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    preco INTEGER NOT NULL,
    duracao INTEGER DEFAULT 60,
    svg TEXT NOT NULL DEFAULT 'null'
);
INSERT INTO "servicos" VALUES(1,'Corte',20,30,'haircut.svg');
INSERT INTO "servicos" VALUES(2,'Corte e Barba',26,55,'beard.svg');
INSERT INTO "servicos" VALUES(3,'Corte até 12 anos',17,20,'child.svg');
INSERT INTO "servicos" VALUES(4,'Corte na máquina',15,10,'hair-clipper.svg');
INSERT INTO "servicos" VALUES(5,'Sobrancelha',5,5,'eyebrow.svg');
INSERT INTO "servicos" VALUES(6,'Barba',15,35,'beard-full.svg');
INSERT INTO "servicos" VALUES(7,'Barbaterapia',30,40,'spa.svg');
INSERT INTO "servicos" VALUES(8,'Corte Estudante',17,40,'student.svg');
INSERT INTO "servicos" VALUES(9,'Corte+Barba Estudante',23,60,'student.svg');

CREATE TABLE "reservas" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    barbeiro_id INTEGER NOT NULL,
    servico_id INTEGER NOT NULL,
    data_hora DATETIME NOT NULL,
    comentario TEXT,
  	nota_privada TEXT,
    status TEXT DEFAULT 'confirmada',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    historico_edicoes TEXT DEFAULT '[]',
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (barbeiro_id) REFERENCES "barbeiros"(id),
    FOREIGN KEY (servico_id) REFERENCES "servicos"(id)
);
CREATE TABLE "horarios_indisponiveis" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barbeiro_id INTEGER NOT NULL,
    data_hora_inicio TEXT NOT NULL,
    data_hora_fim TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('folga', 'almoco', 'ferias', 'ausencia', 'outro')),
    motivo TEXT,
    is_all_day INTEGER DEFAULT 0,
    recurrence_type TEXT DEFAULT 'none' CHECK(recurrence_type IN ('none', 'daily', 'weekly')),
    recurrence_end_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    recurrence_group_id TEXT,
    FOREIGN KEY (barbeiro_id) REFERENCES "barbeiros"(id)
);

DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('clientes',122);
INSERT INTO "sqlite_sequence" VALUES('barbeiros',5);
INSERT INTO "sqlite_sequence" VALUES('servicos',9);
INSERT INTO "sqlite_sequence" VALUES('reservas',140);
INSERT INTO "sqlite_sequence" VALUES('horarios_indisponiveis',664);
CREATE INDEX idx_clientes_token_verificacao ON clientes(token_verificacao);
CREATE INDEX idx_google_id ON clientes(google_id);
CREATE INDEX idx_facebook_id ON clientes(facebook_id);
CREATE INDEX idx_instagram_id ON clientes(instagram_id);
CREATE INDEX idx_auth_methods ON clientes(auth_methods);
CREATE UNIQUE INDEX idx_clientes_email_unique 
ON clientes(email);
CREATE UNIQUE INDEX idx_clientes_telefone_unique 
ON clientes(telefone) WHERE telefone IS NOT NULL;
