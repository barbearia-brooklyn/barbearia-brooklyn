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
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
, google_id TEXT, facebook_id TEXT, instagram_id TEXT, auth_methods TEXT DEFAULT 'password', token_verificacao_expira TEXT, reservas_concluidas INTEGER DEFAULT 0, nif INT(9));
INSERT INTO "clientes" VALUES(1,'João Silva','joao.silva@email.com','+351910000001','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(2,'Maria Santos','maria.santos@email.com','+351910000002','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(3,'Pedro Costa','pedro.costa@email.com','+351910000003','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(4,'Ana Pereira','ana.pereira@email.com','+351910000004','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(5,'Carlos Mendes','carlos.mendes@email.com','+351910000005','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(6,'Rita Oliveira','rita.oliveira@email.com','+351910000006','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(7,'Luís Rodrigues','luis.rodrigues@email.com','+351910000007','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(8,'Sofia Ferreira','sofia.ferreira@email.com','+351910000008','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(9,'Miguel Alves','miguel.alves@email.com','+351910000009','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(10,'Beatriz Lopes','beatriz.lopes@email.com','+351910000010','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(11,'Francisco Sousa','francisco.sousa@email.com','+351910000011','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(12,'Inês Martins','ines.martins@email.com','+351910000012','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(13,'Tiago Carvalho','tiago.carvalho@email.com','+351910000013','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(14,'Carolina Reis','carolina.reis@email.com','+351910000014','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(15,'André Gomes','andre.gomes@email.com','+351910000015','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(16,'Mariana Dias','mariana.dias@email.com','+351910000016','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(17,'Gonçalo Pinto','goncalo.pinto@email.com','+351910000017','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(18,'Catarina Nunes','catarina.nunes@email.com','+351910000018','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(19,'Ricardo Fonseca','ricardo.fonseca@email.com','+351910000019','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(20,'Joana Correia','joana.correia@email.com','+351910000020','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(21,'Leonor Moreira','leonor.moreira@email.com','+351910000022','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(22,'Diogo Castro','diogo.castro@email.com','+351910000023','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(23,'Marta Ribeiro','marta.ribeiro@email.com','+351910000024','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(24,'Nuno Duarte','nuno.duarte@email.com','+351910000025','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(25,'Rui Cardoso','rui.cardoso@email.com','+351910000027','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(26,'Patrícia Barbosa','patricia.barbosa@email.com','+351910000028','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(27,'Vasco Cunha','vasco.cunha@email.com','+351910000029','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(28,'Filipa Macedo','filipa.macedo@email.com','+351910000030','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(29,'Hugo Simões','hugo.simoes@email.com','+351910000031','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(30,'Raquel Azevedo','raquel.azevedo@email.com','+351910000032','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(31,'Fábio Marques','fabio.marques@email.com','+351910000033','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(32,'Sara Coelho','sara.coelho@email.com','+351910000034','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(33,'Paulo Tavares','paulo.tavares@email.com','+351910000035','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(34,'Cláudia Baptista','claudia.baptista@email.com','+351910000036','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(35,'Marco Freitas','marco.freitas@email.com','+351910000037','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(36,'Teresa Antunes','teresa.antunes@email.com','+351910000038','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(37,'Alberto Campos','alberto.campos@email.com','+351910000039','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(38,'Sandra Matos','sandra.matos@email.com','+351910000040','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(39,'Eduardo Silva','eduardo.silva@email.com','+351910000041','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(40,'Vera Costa','vera.costa@email.com','+351910000042','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(41,'Sérgio Santos','sergio.santos@email.com','+351910000043','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(42,'Helena Pires','helena.pires@email.com','+351910000044','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(43,'Fernando Vieira','fernando.vieira@email.com','+351910000045','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(44,'Isabel Ramos','isabel.ramos@email.com','+351910000046','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(45,'José Lourenço','jose.lourenco@email.com','+351910000047','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(46,'Cristina Brito','cristina.brito@email.com','+351910000048','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(47,'António Rocha','antonio.rocha@email.com','+351910000049','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(48,'Paula Xavier','paula.xavier@email.com','+351910000050','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(49,'Vítor Leite','vitor.leite@email.com','+351910000051','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(50,'Susana Amaral','susana.amaral@email.com','+351910000052','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(51,'Armando Lima','armando.lima@email.com','+351910000053','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(52,'Mónica Pinto','monica.pinto@email.com','+351910000054','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(53,'Jorge Almeida','jorge.almeida@email.com','+351910000055','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(54,'Liliana Correia','liliana.correia@email.com','+351910000056','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(55,'Renato Soares','renato.soares@email.com','+351910000057','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(56,'Andreia Fernandes','andreia.fernandes@email.com','+351910000058','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(57,'Manuel Rodrigues','manuel.rodrigues@email.com','+351910000059','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(58,'Carla Neves','carla.neves@email.com','+351910000060','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(59,'Rafael Cruz','rafael.cruz@email.com','+351910000061','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(60,'Vanessa Lopes','vanessa.lopes@email.com','+351910000062','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(61,'Nelson Faria','nelson.faria@email.com','+351910000063','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(62,'Diana Miranda','diana.miranda@email.com','+351910000064','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(63,'Artur Peixoto','artur.peixoto@email.com','+351910000065','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(64,'Elisabete Silva','elisabete.silva@email.com','+351910000066','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(65,'Gustavo Pereira','gustavo.pereira@email.com','+351910000067','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(66,'Rosa Moura','rosa.moura@email.com','+351910000068','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(67,'David Gaspar','david.gaspar@email.com','+351910000069','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(68,'Anabela Valente','anabela.valente@email.com','+351910000070','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(69,'Joaquim Ferreira','joaquim.ferreira@email.com','+351910000071','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(70,'Sónia Henriques','sonia.henriques@email.com','+351910000072','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(71,'Hélder Maia','helder.maia@email.com','+351910000073','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(72,'Lúcia Mendes','lucia.mendes@email.com','+351910000074','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(73,'Rogério Santos','rogerio.santos@email.com','+351910000075','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(74,'Célia Rodrigues','celia.rodrigues@email.com','+351910000076','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(75,'Alfredo Costa','alfredo.costa@email.com','+351910000077','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(76,'Fátima Gonçalves','fatima.goncalves@email.com','+351910000078','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(77,'Luís Oliveira','luis.oliveira2@email.com','+351910000079','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(78,'Graça Martins','graca.martins@email.com','+351910000080','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(79,'Alexandre Alves','alexandre.alves@email.com','+351910000081','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(80,'Laura Teixeira','laura.teixeira@email.com','+351910000082','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(81,'Mário Reis','mario.reis@email.com','+351910000083','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(82,'Matilde Carvalho','matilde.carvalho@email.com','+351910000084','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(83,'Gabriel Ribeiro','gabriel.ribeiro@email.com','+351910000085','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(84,'Natália Gomes','natalia.gomes@email.com','+351910000086','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(85,'Samuel Dias','samuel.dias@email.com','+351910000087','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(86,'Margarida Pinto','margarida.pinto@email.com','+351910000088','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(87,'César Nunes','cesar.nunes@email.com','+351910000089','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(88,'Fernanda Fonseca','fernanda.fonseca@email.com','+351910000090','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(89,'Raul Correia','raul.correia@email.com','+351910000091','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(90,'Amélia Castro','amelia.castro@email.com','+351910000092','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(91,'Simão Moreira','simao.moreira@email.com','+351910000093','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(92,'Conceição Ribeiro','conceicao.ribeiro@email.com','+351910000094','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(93,'Tomás Duarte','tomas.duarte@email.com','+351910000095','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(94,'Perpétua Monteiro','perpetua.monteiro@email.com','+351910000096','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(95,'Dinis Cardoso','dinis.cardoso@email.com','+351910000097','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(96,'Adelaide Barbosa','adelaide.barbosa@email.com','+351910000098','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(97,'Bernardo Cunha','bernardo.cunha@email.com','+351910000099','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(98,'Glória Macedo','gloria.macedo@email.com','+351910000100','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(99,'Tiago Oliveira','tiagoalexneiva@gmail.com','+351962269569','cc534aea31ae1f66aac6d200c04ad704:c2c43070bb5c336a81cfd7904a62e9a0567d995f08426c3226ba82036bee7529',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01','107075604582623388440',NULL,NULL,'password,google',NULL,0,NULL);
INSERT INTO "clientes" VALUES(101,'Ana Paula','anapaula@teste.com','+351999999999','$2a$10$DummyHashQueNuncaSeraUsadoPorqueEmailJaVerificado123456789',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(105,'Sofia Pinto Freitas','sofiap.freitas506@gmail.com','+351915645053','c666436129e033989346413b33663e95:09adc48243ae753b399e97cdc139f41c983366fc3328bab93758919e9cf7e06e',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-11 15:20:01','106377829340178297872',NULL,NULL,'password,google',NULL,0,NULL);
INSERT INTO "clientes" VALUES(109,'João Oliveira','teste@brooklyn.teste','912345678','e9d3eb1498d579bf5e9327b13e8d02c7:7350252acbed0b79daa15838e62cfbd821858cb4330a5bd0d440eb1763218fdd',1,NULL,NULL,NULL,'2025-12-11 15:20:01','2025-12-14 11:57:39',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(122,'Tiago Oliveira','geral@tiagoanoliveira.pt','962269560','018770b848f945fd454d61eb6af49537:513b3e91e6340b11c919574ecc03eec8e6f815e3e9f822cdfc61aedb59a6aa64',1,NULL,NULL,NULL,'2025-12-14 12:19:15','2025-12-17 19:13:18','101491985618160923111','122103604731160935',NULL,'password,facebook,google',NULL,0,260676527);
INSERT INTO "clientes" VALUES(125,'Geral','geral@brooklynbarbearia.pt','954876249','eaa13f4cba17d1128f8619e6b2041920:f072c9dfb44aa8b30c17470297ca92c66bce2ed90f94459556d4df7dbbfc25a5',1,'83d4e5a702daef76282b4f0471ba137480505ca0ab8348925a6bb153632f877b',NULL,NULL,'2025-12-17 19:26:31','2025-12-17 19:26:31',NULL,NULL,NULL,'password','2025-12-18T19:26:31.399Z',0,NULL);
INSERT INTO "clientes" VALUES(126,'Marco Pereira','mpbonucci@gmail.com','918205012','7864fe5bb89bcf9950be7e63cbceeb51:22899c149a526a1454680b8888035332154f9d6a351235af45a758f60da13ed6',1,'',NULL,NULL,'2025-12-17 21:46:09','2025-12-17 21:46:09',NULL,NULL,NULL,'password','2025-12-18T21:46:09.513Z',0,NULL);
INSERT INTO "clientes" VALUES(131,'Toiag','tiago@easy-future.pt','954578621','e17304c2331ea4015b044ce9ded7263e:6c307f6986d288bbebd4dd68008bca3f180ae8625cce91266ddb7260666323c4',1,NULL,NULL,NULL,'2025-12-18 01:19:24','2025-12-18 01:19:24',NULL,NULL,NULL,'password',NULL,0,NULL);
INSERT INTO "clientes" VALUES(132,'asdrubal','cena@gmail.com','911111111','b14c71ef87e99c1fd8bdc47acef112ae:6221de704bca36b742876a0192658b90a037e4539b68aafab20e1af7621a3628',0,'b8ff1206b29c3c674fcad6e22c7ae1232484238fb7c51986a4e399bdc382aae0',NULL,NULL,'2025-12-19 11:31:45','2025-12-19 11:31:45',NULL,NULL,NULL,'password','2025-12-20T11:31:45.223Z',0,NULL);
INSERT INTO "clientes" VALUES(133,'João Rego Figueiredo','jregofigueiredo@gmail.com','924157112','111c1fbb4dfe994604e24fb4b07b9eb0:154523c53a031fd87cfb139f5380cc48898a5b63aea1f3867ef8a553403788b3',1,NULL,NULL,NULL,'2025-12-19 14:11:26','2025-12-19 14:12:52',NULL,NULL,NULL,'password',NULL,0,241815541);
INSERT INTO "clientes" VALUES(134,'Tiago Oliveira','up202007448@g.uporto.pt','845123984','cliente_nunca_iniciou_sessão',1,NULL,NULL,NULL,'2025-12-19 20:27:40','2025-12-19 20:27:40','112825830101043286922',NULL,NULL,',google',NULL,0,NULL);
INSERT INTO "clientes" VALUES(135,'NUNO MIGUEL OLIVEIRA','nunomgoliveira.1972@gmail.com','962098326','',1,NULL,NULL,NULL,'2025-12-20 10:50:03','2025-12-20 10:54:11','108327563093091373985',NULL,NULL,'google',NULL,0,197181740);
INSERT INTO "clientes" VALUES(136,'Ben Himowitz','bhimowitz@gmail.com',NULL,'',1,NULL,NULL,NULL,'2025-12-22 08:30:42','2025-12-22 08:30:42','108898460661487351217',NULL,NULL,'google',NULL,0,NULL);
INSERT INTO "clientes" VALUES(137,'Sofia Freitas','sofiapinto506@gmail.com','919965234','',1,NULL,NULL,NULL,'2025-12-23 10:23:11','2025-12-23 10:34:43','106856432036446912078',NULL,NULL,'google',NULL,0,666666666);
INSERT INTO "clientes" VALUES(138,'Helder Lima','helderlima75@gmail.com',NULL,'',1,NULL,NULL,NULL,'2025-12-23 21:13:57','2025-12-23 21:13:57','101924929713544715975',NULL,NULL,'google',NULL,0,NULL);
CREATE TABLE IF NOT EXISTS "barbeiros" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    especialidades TEXT NOT NULL,
    foto TEXT,
    ativo INTEGER DEFAULT 1
);
INSERT INTO "barbeiros" VALUES(1,'Gui Pereira','Cortes à Tesoura e Máquina, Barboterapia','Gui.jpg',1);
INSERT INTO "barbeiros" VALUES(2,'Johtta Barros','Cortes clássicos, Degrade, Barboterapia','Johtta.jpg',1);
INSERT INTO "barbeiros" VALUES(3,'Weslley Santos','Degrade, Cortes à Máquina, Barboterapia','Weslley.jpg',1);
INSERT INTO "barbeiros" VALUES(4,'Marco Bonucci','Cortes Clássicos, Degrade, Barboterapia','Bonucci.jpg',1);
INSERT INTO "barbeiros" VALUES(5,'Ricardo Graça','Cortes à tesoura e Máquina, Barboterapia','Ricardo.jpg',1);
CREATE TABLE IF NOT EXISTS "horarios_indisponiveis" (
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
INSERT INTO "horarios_indisponiveis" VALUES(486,2,'2025-12-13 10:00:00','2025-12-15 20:00:00','ferias',NULL,0,'none',NULL,'2025-11-04 22:26:52',NULL);
INSERT INTO "horarios_indisponiveis" VALUES(660,4,'2025-12-03 09:00:00','2025-12-03 20:00:00','ferias',NULL,1,'none',NULL,'2025-11-17 09:48:40',NULL);
INSERT INTO "horarios_indisponiveis" VALUES(661,1,'2025-12-03 13:00:00','2025-12-03 14:00:00','almoco',NULL,0,'none',NULL,'2025-11-17 09:49:40',NULL);
INSERT INTO "horarios_indisponiveis" VALUES(662,3,'2025-12-03 13:00:00','2025-12-03 14:00:00','almoco',NULL,0,'none',NULL,'2025-11-17 09:50:02',NULL);
INSERT INTO "horarios_indisponiveis" VALUES(663,5,'2025-12-03 14:00:00','2025-12-03 15:00:00','almoco',NULL,0,'none',NULL,'2025-11-17 09:50:21',NULL);
INSERT INTO "horarios_indisponiveis" VALUES(795,2,'2025-12-23T09:00:00','2025-12-23T20:00:00','outro',replace('Website em fase de testes\n\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:30','rec_1766489029878_l3xtuu6ae');
INSERT INTO "horarios_indisponiveis" VALUES(796,2,'2025-12-24T09:00:00','2025-12-24T20:00:00','outro',replace('Website em fase de testes\n\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:30','rec_1766489029878_l3xtuu6ae');
INSERT INTO "horarios_indisponiveis" VALUES(798,2,'2025-12-26T09:00:00','2025-12-26T20:00:00','outro',replace('Website em fase de testes\n\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:30','rec_1766489029878_l3xtuu6ae');
INSERT INTO "horarios_indisponiveis" VALUES(799,2,'2025-12-27T09:00:00','2025-12-27T20:00:00','outro',replace('Website em fase de testes\n\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:30','rec_1766489029878_l3xtuu6ae');
INSERT INTO "horarios_indisponiveis" VALUES(800,2,'2025-12-28T09:00:00','2025-12-28T20:00:00','outro',replace('Website em fase de testes\n\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:30','rec_1766489029878_l3xtuu6ae');
INSERT INTO "horarios_indisponiveis" VALUES(801,2,'2025-12-29T09:00:00','2025-12-29T20:00:00','outro',replace('Website em fase de testes\n\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:30','rec_1766489029878_l3xtuu6ae');
INSERT INTO "horarios_indisponiveis" VALUES(802,2,'2025-12-30T09:00:00','2025-12-30T20:00:00','outro',replace('Website em fase de testes\n\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:30','rec_1766489029878_l3xtuu6ae');
INSERT INTO "horarios_indisponiveis" VALUES(803,2,'2025-12-31T09:00:00','2025-12-31T20:00:00','outro',replace('Website em fase de testes\n\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:30','rec_1766489029878_l3xtuu6ae');
INSERT INTO "horarios_indisponiveis" VALUES(804,2,'2026-01-01T09:00:00','2026-01-01T20:00:00','outro',replace('Website em fase de testes\n\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:31','rec_1766489029878_l3xtuu6ae');
INSERT INTO "horarios_indisponiveis" VALUES(805,2,'2026-01-02T09:00:00','2026-01-02T20:00:00','outro',replace('Website em fase de testes\n\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:31','rec_1766489029878_l3xtuu6ae');
INSERT INTO "horarios_indisponiveis" VALUES(806,2,'2026-01-03T09:00:00','2026-01-03T20:00:00','outro',replace('Website em fase de testes\n\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:31','rec_1766489029878_l3xtuu6ae');
INSERT INTO "horarios_indisponiveis" VALUES(807,2,'2026-01-04T09:00:00','2026-01-04T20:00:00','outro',replace('Website em fase de testes\n\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:31','rec_1766489029878_l3xtuu6ae');
INSERT INTO "horarios_indisponiveis" VALUES(808,3,'2025-12-23T09:00:00','2025-12-23T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:39','rec_1766489077900_b9pg110b4');
INSERT INTO "horarios_indisponiveis" VALUES(809,3,'2025-12-24T09:00:00','2025-12-24T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:39','rec_1766489077900_b9pg110b4');
INSERT INTO "horarios_indisponiveis" VALUES(811,3,'2025-12-26T09:00:00','2025-12-26T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:39','rec_1766489077900_b9pg110b4');
INSERT INTO "horarios_indisponiveis" VALUES(812,3,'2025-12-27T09:00:00','2025-12-27T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:39','rec_1766489077900_b9pg110b4');
INSERT INTO "horarios_indisponiveis" VALUES(813,3,'2025-12-28T09:00:00','2025-12-28T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:39','rec_1766489077900_b9pg110b4');
INSERT INTO "horarios_indisponiveis" VALUES(814,3,'2025-12-29T09:00:00','2025-12-29T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:39','rec_1766489077900_b9pg110b4');
INSERT INTO "horarios_indisponiveis" VALUES(815,3,'2025-12-30T09:00:00','2025-12-30T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:39','rec_1766489077900_b9pg110b4');
INSERT INTO "horarios_indisponiveis" VALUES(816,3,'2025-12-31T09:00:00','2025-12-31T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:39','rec_1766489077900_b9pg110b4');
INSERT INTO "horarios_indisponiveis" VALUES(817,3,'2026-01-01T09:00:00','2026-01-01T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:39','rec_1766489077900_b9pg110b4');
INSERT INTO "horarios_indisponiveis" VALUES(818,3,'2026-01-02T09:00:00','2026-01-02T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:39','rec_1766489077900_b9pg110b4');
INSERT INTO "horarios_indisponiveis" VALUES(819,3,'2026-01-03T09:00:00','2026-01-03T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:39','rec_1766489077900_b9pg110b4');
INSERT INTO "horarios_indisponiveis" VALUES(820,3,'2026-01-04T09:00:00','2026-01-04T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:39','rec_1766489077900_b9pg110b4');
INSERT INTO "horarios_indisponiveis" VALUES(821,5,'2025-12-23T09:00:00','2025-12-23T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:46','rec_1766489157455_684beye12');
INSERT INTO "horarios_indisponiveis" VALUES(822,5,'2025-12-24T09:00:00','2025-12-24T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:46','rec_1766489157455_684beye12');
INSERT INTO "horarios_indisponiveis" VALUES(824,5,'2025-12-26T09:00:00','2025-12-26T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:46','rec_1766489157455_684beye12');
INSERT INTO "horarios_indisponiveis" VALUES(825,5,'2025-12-27T09:00:00','2025-12-27T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:46','rec_1766489157455_684beye12');
INSERT INTO "horarios_indisponiveis" VALUES(826,5,'2025-12-28T09:00:00','2025-12-28T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:46','rec_1766489157455_684beye12');
INSERT INTO "horarios_indisponiveis" VALUES(827,5,'2025-12-29T09:00:00','2025-12-29T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:47','rec_1766489157455_684beye12');
INSERT INTO "horarios_indisponiveis" VALUES(828,5,'2025-12-30T09:00:00','2025-12-30T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:47','rec_1766489157455_684beye12');
INSERT INTO "horarios_indisponiveis" VALUES(829,5,'2025-12-31T09:00:00','2025-12-31T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:47','rec_1766489157455_684beye12');
INSERT INTO "horarios_indisponiveis" VALUES(830,5,'2026-01-01T09:00:00','2026-01-01T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:47','rec_1766489157455_684beye12');
INSERT INTO "horarios_indisponiveis" VALUES(831,5,'2026-01-02T09:00:00','2026-01-02T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:47','rec_1766489157455_684beye12');
INSERT INTO "horarios_indisponiveis" VALUES(832,5,'2026-01-03T09:00:00','2026-01-03T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:47','rec_1766489157455_684beye12');
INSERT INTO "horarios_indisponiveis" VALUES(833,5,'2026-01-04T09:00:00','2026-01-04T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:47:47','rec_1766489157455_684beye12');
INSERT INTO "horarios_indisponiveis" VALUES(834,4,'2025-12-23T09:00:00','2025-12-23T20:00:00','outro',replace('Website em fase de testes\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:54','rec_1766489119569_fbrhntwur');
INSERT INTO "horarios_indisponiveis" VALUES(835,4,'2025-12-24T09:00:00','2025-12-24T20:00:00','outro',replace('Website em fase de testes\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:54','rec_1766489119569_fbrhntwur');
INSERT INTO "horarios_indisponiveis" VALUES(837,4,'2025-12-26T09:00:00','2025-12-26T20:00:00','outro',replace('Website em fase de testes\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:54','rec_1766489119569_fbrhntwur');
INSERT INTO "horarios_indisponiveis" VALUES(838,4,'2025-12-27T09:00:00','2025-12-27T20:00:00','outro',replace('Website em fase de testes\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:54','rec_1766489119569_fbrhntwur');
INSERT INTO "horarios_indisponiveis" VALUES(839,4,'2025-12-28T09:00:00','2025-12-28T20:00:00','outro',replace('Website em fase de testes\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:54','rec_1766489119569_fbrhntwur');
INSERT INTO "horarios_indisponiveis" VALUES(840,4,'2025-12-29T09:00:00','2025-12-29T20:00:00','outro',replace('Website em fase de testes\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:54','rec_1766489119569_fbrhntwur');
INSERT INTO "horarios_indisponiveis" VALUES(841,4,'2025-12-30T09:00:00','2025-12-30T20:00:00','outro',replace('Website em fase de testes\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:54','rec_1766489119569_fbrhntwur');
INSERT INTO "horarios_indisponiveis" VALUES(842,4,'2025-12-31T09:00:00','2025-12-31T20:00:00','outro',replace('Website em fase de testes\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:54','rec_1766489119569_fbrhntwur');
INSERT INTO "horarios_indisponiveis" VALUES(843,4,'2026-01-01T09:00:00','2026-01-01T20:00:00','outro',replace('Website em fase de testes\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:54','rec_1766489119569_fbrhntwur');
INSERT INTO "horarios_indisponiveis" VALUES(844,4,'2026-01-02T09:00:00','2026-01-02T20:00:00','outro',replace('Website em fase de testes\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:54','rec_1766489119569_fbrhntwur');
INSERT INTO "horarios_indisponiveis" VALUES(845,4,'2026-01-03T09:00:00','2026-01-03T20:00:00','outro',replace('Website em fase de testes\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:54','rec_1766489119569_fbrhntwur');
INSERT INTO "horarios_indisponiveis" VALUES(846,4,'2026-01-04T09:00:00','2026-01-04T20:00:00','outro',replace('Website em fase de testes\n','\n',char(10)),1,'daily','2026-01-04','2025-12-24 10:47:54','rec_1766489119569_fbrhntwur');
INSERT INTO "horarios_indisponiveis" VALUES(847,1,'2025-12-23T09:00:00','2025-12-23T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:48:01','rec_1766488796562_jy6r1fjf4');
INSERT INTO "horarios_indisponiveis" VALUES(848,1,'2025-12-24T09:00:00','2025-12-24T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:48:01','rec_1766488796562_jy6r1fjf4');
INSERT INTO "horarios_indisponiveis" VALUES(850,1,'2025-12-26T09:00:00','2025-12-26T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:48:01','rec_1766488796562_jy6r1fjf4');
INSERT INTO "horarios_indisponiveis" VALUES(851,1,'2025-12-27T09:00:00','2025-12-27T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:48:02','rec_1766488796562_jy6r1fjf4');
INSERT INTO "horarios_indisponiveis" VALUES(852,1,'2025-12-28T09:00:00','2025-12-28T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:48:02','rec_1766488796562_jy6r1fjf4');
INSERT INTO "horarios_indisponiveis" VALUES(853,1,'2025-12-29T09:00:00','2025-12-29T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:48:02','rec_1766488796562_jy6r1fjf4');
INSERT INTO "horarios_indisponiveis" VALUES(854,1,'2025-12-30T09:00:00','2025-12-30T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:48:02','rec_1766488796562_jy6r1fjf4');
INSERT INTO "horarios_indisponiveis" VALUES(855,1,'2025-12-31T09:00:00','2025-12-31T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:48:02','rec_1766488796562_jy6r1fjf4');
INSERT INTO "horarios_indisponiveis" VALUES(856,1,'2026-01-01T09:00:00','2026-01-01T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:48:02','rec_1766488796562_jy6r1fjf4');
INSERT INTO "horarios_indisponiveis" VALUES(857,1,'2026-01-02T09:00:00','2026-01-02T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:48:02','rec_1766488796562_jy6r1fjf4');
INSERT INTO "horarios_indisponiveis" VALUES(858,1,'2026-01-03T09:00:00','2026-01-03T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:48:02','rec_1766488796562_jy6r1fjf4');
INSERT INTO "horarios_indisponiveis" VALUES(859,1,'2026-01-04T09:00:00','2026-01-04T20:00:00','outro','Website em fase de testes',1,'daily','2026-01-04','2025-12-24 10:48:02','rec_1766488796562_jy6r1fjf4');
CREATE TABLE IF NOT EXISTS "servicos" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    preco INTEGER NOT NULL,
    duracao INTEGER DEFAULT 60,
    svg TEXT NOT NULL DEFAULT 'null'
, abreviacao TEXT);
INSERT INTO "servicos" VALUES(1,'Corte',20,30,'haircut.svg','Corte');
INSERT INTO "servicos" VALUES(2,'Corte e Barba',26,55,'beard.svg','Cut + B');
INSERT INTO "servicos" VALUES(3,'Corte Estudante',17,40,'student.svg','Cut E');
INSERT INTO "servicos" VALUES(4,'Corte e Barba Estudante',23,60,'student.svg','Cut + B E');
INSERT INTO "servicos" VALUES(5,'Corte na máquina',15,10,'hair-clipper.svg','Cut Maq');
INSERT INTO "servicos" VALUES(6,'Corte até 12 anos',17,20,'child.svg','Cut 12');
INSERT INTO "servicos" VALUES(7,'Barba',15,35,'beard-full.svg','Barba');
INSERT INTO "servicos" VALUES(8,'Barboterapia',30,40,'spa.svg','B.terap');
INSERT INTO "servicos" VALUES(9,'Sobrancelha',5,5,'eyebrow.svg','Sobr.');
CREATE TABLE IF NOT EXISTS "reservas" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    barbeiro_id INTEGER NOT NULL,
    servico_id INTEGER NOT NULL,
    data_hora DATETIME NOT NULL,
    comentario TEXT,
  	nota_privada TEXT,
    status TEXT DEFAULT 'confirmada',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP, historico_edicoes TEXT DEFAULT '[]',
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (barbeiro_id) REFERENCES "barbeiros"(id),
    FOREIGN KEY (servico_id) REFERENCES "servicos"(id)
);
INSERT INTO "reservas" VALUES(1,1,1,1,'2025-12-03 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(2,2,2,2,'2025-12-03 13:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(3,3,3,1,'2025-12-03 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(4,4,1,6,'2025-12-03 16:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(5,5,5,2,'2025-12-03 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(6,6,1,5,'2025-12-03 11:00:00','',NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(7,7,2,1,'2025-12-03 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(8,8,3,9,'2025-12-03 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(9,9,5,2,'2025-12-03 17:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(10,10,5,1,'2025-12-03 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(11,11,1,7,'2025-12-03 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(12,12,2,2,'2025-12-03 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(13,13,3,1,'2025-12-03 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(14,14,2,8,'2025-12-03 16:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(15,15,5,2,'2025-12-03 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(16,16,1,1,'2025-12-03 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(17,17,2,3,'2025-12-03 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(18,18,3,2,'2025-12-03 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(19,19,5,1,'2025-12-03 15:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(20,20,5,4,'2025-12-03 13:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(22,21,2,9,'2025-12-04 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(23,22,3,1,'2025-12-04 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(24,23,4,6,'2025-12-04 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(25,24,5,2,'2025-12-04 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(27,25,2,1,'2025-12-04 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(28,26,3,9,'2025-12-04 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(29,27,4,2,'2025-12-04 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(30,28,5,1,'2025-12-04 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(31,29,1,7,'2025-12-04 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(32,30,2,2,'2025-12-04 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(33,31,3,1,'2025-12-04 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(34,32,4,8,'2025-12-04 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(35,33,5,2,'2025-12-04 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(36,34,1,1,'2025-12-04 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(37,35,2,3,'2025-12-04 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(38,36,3,2,'2025-12-04 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(39,37,4,1,'2025-12-04 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(40,38,5,4,'2025-12-04 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(41,39,1,1,'2025-12-05 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(42,40,2,2,'2025-12-05 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(43,41,3,1,'2025-12-05 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(44,42,4,6,'2025-12-05 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(45,43,5,2,'2025-12-05 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(46,44,1,5,'2025-12-05 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(47,45,2,1,'2025-12-05 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(48,46,3,9,'2025-12-05 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(49,47,4,2,'2025-12-05 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(50,48,5,1,'2025-12-05 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(51,49,1,7,'2025-12-05 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(52,50,2,2,'2025-12-05 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(53,51,3,1,'2025-12-05 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(54,52,4,8,'2025-12-05 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(55,53,5,2,'2025-12-05 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(56,54,1,1,'2025-12-05 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(57,55,2,3,'2025-12-05 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(58,56,3,2,'2025-12-05 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(59,57,4,1,'2025-12-05 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(60,58,5,4,'2025-12-05 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(61,59,1,1,'2025-12-06 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(62,60,2,2,'2025-12-06 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(63,61,3,1,'2025-12-06 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(64,62,4,6,'2025-12-06 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(65,63,5,2,'2025-12-06 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(66,64,1,5,'2025-12-06 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(67,65,2,1,'2025-12-06 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(68,66,3,9,'2025-12-06 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(69,67,4,2,'2025-12-06 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(70,68,5,1,'2025-12-06 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(71,69,1,7,'2025-12-06 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(72,70,2,2,'2025-12-06 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(73,71,3,1,'2025-12-06 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(74,72,4,8,'2025-12-06 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(75,73,5,2,'2025-12-06 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(76,74,1,1,'2025-12-06 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(77,75,2,3,'2025-12-06 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(78,76,3,2,'2025-12-06 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(79,77,4,1,'2025-12-06 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(80,78,5,4,'2025-12-06 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(81,79,1,1,'2025-12-07 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(82,80,2,2,'2025-12-07 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(83,81,3,1,'2025-12-07 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(84,82,4,6,'2025-12-07 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(85,83,5,2,'2025-12-07 10:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(86,84,1,5,'2025-12-07 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(87,85,2,1,'2025-12-07 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(88,86,3,9,'2025-12-07 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(89,87,4,2,'2025-12-07 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(90,88,5,1,'2025-12-07 11:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(91,89,1,7,'2025-12-07 12:00:00',NULL,NULL,'cancelada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(92,90,2,2,'2025-12-07 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(93,91,3,1,'2025-12-07 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(94,92,4,8,'2025-12-07 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(95,93,5,2,'2025-12-07 12:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(96,94,1,1,'2025-12-07 14:00:00',NULL,NULL,'cancelada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(97,95,2,3,'2025-12-07 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(98,96,3,2,'2025-12-07 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(99,97,4,1,'2025-12-07 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(100,98,5,4,'2025-12-07 14:00:00',NULL,NULL,'confirmada','2025-10-30 11:55:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(101,99,1,1,'2025-12-01 12:00:00','Teste',NULL,'confirmada','2025-10-30 11:59:47','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(102,99,3,6,'2025-12-01 11:00:00','Estou com pressa',NULL,'confirmada','2025-10-30 12:06:14','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(103,101,1,9,'2025-12-03 10:50:00',NULL,NULL,'cancelada','2025-10-30 12:14:33','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(105,99,2,6,'2025-12-01 11:00:00','Teste email',NULL,'confirmada','2025-10-30 16:57:14','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(106,99,2,2,'2025-12-01 14:00:00',NULL,NULL,'confirmada','2025-10-30 17:23:54','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(107,99,2,2,'2025-12-01 15:00:00','a',NULL,'confirmada','2025-10-30 17:26:50','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(108,99,2,5,'2025-12-01 18:00:00',NULL,NULL,'confirmada','2025-10-30 17:33:12','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(109,99,3,2,'2025-12-01 17:00:00',NULL,NULL,'confirmada','2025-10-30 17:46:41','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(110,99,1,4,'2025-12-01 17:00:00',NULL,NULL,'confirmada','2025-10-30 18:25:04','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(112,99,2,3,'2025-12-01 12:00:00',NULL,NULL,'confirmada','2025-10-30 19:42:01','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(113,105,4,9,'2025-12-01 15:00:00',NULL,NULL,'cancelada','2025-10-30 21:42:44','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(114,105,4,7,'2025-12-01 16:00:00',NULL,NULL,'confirmada','2025-10-30 22:57:12','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(115,99,2,6,'2025-11-30 17:00:00',NULL,NULL,'confirmada','2025-10-30 23:07:33','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(119,99,1,7,'2025-12-01 18:00:00',NULL,NULL,'confirmada','2025-11-01 15:11:28','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(120,99,2,2,'2025-12-01 16:00:00',NULL,NULL,'confirmada','2025-11-01 17:09:08','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(121,99,2,6,'2025-12-01 10:00:00',NULL,NULL,'confirmada','2025-11-01 17:18:48','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(122,109,2,2,'2025-12-01 12:00:00',NULL,NULL,'confirmada','2025-11-01 18:02:16','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(123,99,2,6,'2025-12-01 14:00:00',NULL,NULL,'confirmada','2025-11-01 19:41:14','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(125,99,4,8,'2025-12-04 17:00:00','wtes',NULL,'confirmada','2025-11-03 08:55:01','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(127,109,3,5,'2025-12-11 16:00:00',NULL,NULL,'confirmada','2025-11-04 13:53:24','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(128,109,5,1,'2025-12-12 19:00:00',NULL,NULL,'confirmada','2025-11-04 13:54:11','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(130,109,3,3,'2025-12-08 14:00:00',NULL,NULL,'confirmada','2025-11-04 14:00:16','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(132,109,2,3,'2025-12-12 17:00:00',NULL,NULL,'confirmada','2025-11-04 15:59:03','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(133,109,4,2,'2025-12-23 18:20:00',NULL,NULL,'cancelada','2025-11-04 16:20:31','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(135,109,1,5,'2025-12-17 15:00:00',NULL,NULL,'confirmada','2025-11-06 10:51:18','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(137,109,2,2,'2025-12-18 15:00:00',NULL,NULL,'confirmada','2025-11-08 14:04:30','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(138,109,5,8,'2025-12-22 16:00:00',NULL,NULL,'confirmada','2025-11-08 14:41:06','2025-12-11 15:21:51','[]');
INSERT INTO "reservas" VALUES(139,122,5,6,'2025-12-15T17:00:00',NULL,NULL,'confirmada','2025-12-14 16:55:41','2025-12-14 16:55:41','[]');
INSERT INTO "reservas" VALUES(140,105,4,9,'2025-12-25T15:00:00','Depoid do almlco de natal ',NULL,'cancelada','2025-12-14 23:22:54','2025-12-14 23:22:54','[]');
INSERT INTO "reservas" VALUES(141,122,3,1,'2025-12-18T12:00:00',NULL,NULL,'confirmada','2025-12-15 12:17:16','2025-12-16 20:56:37','[{"tipo":"alteracao","campos_alterados":{"data_hora":{"anterior":"2025-12-18T14:00:00","novo":"2025-12-18T12:00:00"},"comentario":{"anterior":"","novo":""}},"data":"2025-12-16T20:56:37.433Z","usuario_tipo":"cliente"}]');
INSERT INTO "reservas" VALUES(142,122,4,1,'2025-12-17T11:00:00',NULL,NULL,'confirmada','2025-12-15 13:27:47','2025-12-15 13:27:47','[]');
INSERT INTO "reservas" VALUES(143,122,2,1,'2025-12-24T11:00:00',NULL,NULL,'cancelada','2025-12-15 13:34:06','2025-12-20 15:49:31','[{"tipo":"alteracao","campos_alterados":{"comentario":{"anterior":"","novo":""}},"data":"2025-12-20T15:49:31.791Z","usuario_tipo":"cliente"}]');
INSERT INTO "reservas" VALUES(144,122,1,1,'2025-12-15T16:00:00',NULL,NULL,'confirmada','2025-12-15 13:35:52','2025-12-15 13:35:52','[]');
INSERT INTO "reservas" VALUES(145,122,3,1,'2025-12-15T11:00:00',NULL,NULL,'confirmada','2025-12-15 13:45:52','2025-12-15 13:45:52','[]');
INSERT INTO "reservas" VALUES(146,122,4,4,'2025-12-15T16:00:00',NULL,NULL,'confirmada','2025-12-15 17:25:50','2025-12-15 17:25:50','[]');
INSERT INTO "reservas" VALUES(147,122,3,4,'2025-12-17T10:00:00',NULL,NULL,'confirmada','2025-12-15 17:45:47','2025-12-16 21:14:15','[{"tipo":"alteracao","campos_alterados":{"data_hora":{"anterior":"2025-12-17T11:00:00","novo":"2025-12-17T10:00:00"},"comentario":{"anterior":"","novo":""}},"data":"2025-12-16T21:14:15.886Z","usuario_tipo":"cliente"}]');
INSERT INTO "reservas" VALUES(148,122,1,1,'2025-12-15T14:00:00',NULL,NULL,'confirmada','2025-12-15 19:05:12','2025-12-15 19:05:12','[]');
INSERT INTO "reservas" VALUES(149,122,4,1,'2025-12-19T12:00:00','Especial',NULL,'confirmada','2025-12-15 19:11:19','2025-12-17 19:14:38','[{"tipo":"alteracao","campos_alterados":{"data_hora":{"anterior":"2025-12-19T12:00:00","novo":"2025-12-19T11:00:00"}},"data":"2025-12-16T20:52:00.095Z","usuario_tipo":"cliente"},{"tipo":"alteracao","campos_alterados":{"data_hora":{"anterior":"2025-12-19T11:00:00","novo":"2025-12-19T12:00:00"}},"data":"2025-12-16T21:13:40.549Z","usuario_tipo":"cliente"},{"tipo":"alteracao","campos_alterados":{"data_hora":{"anterior":"2025-12-19T12:00:00","novo":"2025-12-19T10:00:00"}},"data":"2025-12-17T02:35:22.753Z","usuario_tipo":"cliente"},{"tipo":"alteracao","campos_alterados":{"data_hora":{"anterior":"2025-12-19T10:00:00","novo":"2025-12-19T12:00:00"}},"data":"2025-12-17T19:14:38.086Z","usuario_tipo":"cliente"}]');
INSERT INTO "reservas" VALUES(150,122,1,1,'2025-12-16T11:00:00',NULL,NULL,'confirmada','2025-12-16 10:57:42','2025-12-16 10:57:42','[]');
INSERT INTO "reservas" VALUES(151,122,1,1,'2025-12-16T10:00:00',NULL,NULL,'confirmada','2025-12-16 20:42:04','2025-12-16 20:42:04','[]');
INSERT INTO "reservas" VALUES(153,122,2,8,'2025-12-17T14:00:00',NULL,NULL,'confirmada','2025-12-17 02:35:00','2025-12-17 02:35:00','[]');
INSERT INTO "reservas" VALUES(154,122,2,1,'2025-12-22T12:00:00',NULL,NULL,'confirmada','2025-12-17 19:20:14','2025-12-17 19:20:14','[]');
INSERT INTO "reservas" VALUES(155,125,2,2,'2025-12-23T12:00:00',NULL,NULL,'cancelada','2025-12-17 19:46:23','2025-12-17 19:46:23','[]');
INSERT INTO "reservas" VALUES(156,125,1,9,'2025-12-23T12:00:00',NULL,NULL,'cancelada','2025-12-17 19:47:15','2025-12-17 19:47:15','[]');
INSERT INTO "reservas" VALUES(157,125,3,8,'2025-12-23T12:00:00',NULL,NULL,'cancelada','2025-12-17 20:55:16','2025-12-17 20:55:37','[{"tipo":"alteracao","campos_alterados":{"data_hora":{"anterior":"2025-12-22T14:00:00","novo":"2025-12-23T12:00:00"},"barbeiro":{"anterior":"Johtta Barros (ID: 2)","novo":"Weslley Santos (ID: 3)"},"comentario":{"anterior":"","novo":""}},"data":"2025-12-17T20:55:37.656Z","usuario_tipo":"cliente"}]');
INSERT INTO "reservas" VALUES(158,122,3,9,'2025-12-31T17:00:00',NULL,NULL,'cancelada','2025-12-17 23:20:44','2025-12-17 23:20:44','[]');
INSERT INTO "reservas" VALUES(159,122,2,9,'2025-12-18T14:00:00',NULL,NULL,'confirmada','2025-12-18 10:28:30','2025-12-18 10:28:30','[]');
INSERT INTO "reservas" VALUES(160,133,5,2,'2025-12-19T18:00:00',NULL,NULL,'confirmada','2025-12-19 14:13:18','2025-12-19 14:13:18','[]');
INSERT INTO "reservas" VALUES(161,135,4,2,'2025-12-29T10:00:00','Quero um corte que me devolva o cabelo que perdi',NULL,'cancelada','2025-12-20 10:50:11','2025-12-20 10:50:11','[]');
INSERT INTO "reservas" VALUES(162,136,2,1,'2025-12-23T15:00:00','Esta reserva foi cancelada. As reservas devem ser efetuadas via Zappy Software (https://pt.zappysoftware.com/m/brooklynbarbeariaporto?&goback=1&lang=pt-PT&t=20251223#book) até 31/12',NULL,'cancelada','2025-12-22 08:30:45','2025-12-22 08:30:45','[]');
INSERT INTO "reservas" VALUES(163,137,5,1,'2025-12-24T15:00:00','Corte para outra pessoa',NULL,'cancelada','2025-12-23 10:23:47','2025-12-23 10:23:47','[]');
INSERT INTO "reservas" VALUES(164,137,2,8,'2025-12-30T14:00:00',NULL,NULL,'cancelada','2025-12-23 10:28:38','2025-12-23 10:28:38','[]');
INSERT INTO "reservas" VALUES(165,137,3,3,'2025-12-26T17:00:00',NULL,NULL,'cancelada','2025-12-23 10:32:32','2025-12-23 10:33:22','[{"tipo":"alteracao","campos_alterados":{"data_hora":{"anterior":"2025-12-26T15:00:00","novo":"2025-12-26T17:00:00"},"barbeiro":{"anterior":"Johtta Barros (ID: 2)","novo":"Weslley Santos (ID: 3)"},"comentario":{"anterior":"","novo":""}},"data":"2025-12-23T10:33:22.352Z","usuario_tipo":"cliente"}]');
INSERT INTO "reservas" VALUES(166,138,4,1,'2026-01-08T17:00:00',NULL,NULL,'confirmada','2025-12-23 21:14:05','2025-12-23 21:14:05','[]');
INSERT INTO "reservas" VALUES(167,122,4,2,'2025-12-26T18:00:00',NULL,NULL,'confirmada','2025-12-25 12:27:27','2025-12-25 12:27:27','[]');
INSERT INTO "reservas" VALUES(168,122,4,6,'2025-12-26T14:00:00',NULL,NULL,'confirmada','2025-12-25 12:27:43','2025-12-25 12:27:43','[]');
INSERT INTO "reservas" VALUES(169,122,3,2,'2025-12-26T16:00:00',NULL,NULL,'confirmada','2025-12-25 12:27:54','2025-12-25 12:27:54','[]');
INSERT INTO "reservas" VALUES(170,122,5,4,'2025-12-26T15:00:00',NULL,NULL,'confirmada','2025-12-25 12:28:16','2025-12-25 12:28:16','[]');
INSERT INTO "reservas" VALUES(171,109,3,2,'2026-01-07 12:15:00',NULL,NULL,'confirmada','2025-12-27 10:25:15','2025-12-27 10:25:15','[]');
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('clientes',138);
INSERT INTO "sqlite_sequence" VALUES('barbeiros',5);
INSERT INTO "sqlite_sequence" VALUES('horarios_indisponiveis',859);
INSERT INTO "sqlite_sequence" VALUES('servicos',9);
INSERT INTO "sqlite_sequence" VALUES('reservas',171);
CREATE INDEX idx_clientes_token_verificacao ON clientes(token_verificacao);
CREATE INDEX idx_google_id ON clientes(google_id);
CREATE INDEX idx_facebook_id ON clientes(facebook_id);
CREATE INDEX idx_instagram_id ON clientes(instagram_id);
CREATE INDEX idx_auth_methods ON clientes(auth_methods);
CREATE UNIQUE INDEX idx_clientes_email_unique 
ON clientes(email);
CREATE UNIQUE INDEX idx_clientes_telefone_unique 
ON clientes(telefone) WHERE telefone IS NOT NULL;
