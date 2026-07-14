CREATE TYPE "public"."tipo_icone_conta" AS ENUM('banco', 'cartao', 'dinheiro', 'poupanca', 'investimento');--> statement-breakpoint
ALTER TABLE "contas" ADD COLUMN "icone" "tipo_icone_conta" DEFAULT 'banco' NOT NULL;--> statement-breakpoint
UPDATE "contas"
SET "icone" = CASE
  WHEN "tipo" = 'cartao_credito' THEN 'cartao'::"tipo_icone_conta"
  WHEN "tipo" = 'carteira' THEN 'dinheiro'::"tipo_icone_conta"
  ELSE 'banco'::"tipo_icone_conta"
END;--> statement-breakpoint
INSERT INTO "categorias" ("usuario_id", "nome")
SELECT "usuarios"."id", "padroes"."nome"
FROM "usuarios"
CROSS JOIN (
  VALUES
    ('Alimentação'),
    ('Transporte'),
    ('Moradia'),
    ('Lazer'),
    ('Saúde'),
    ('Assinaturas')
) AS "padroes"("nome")
ON CONFLICT ("usuario_id", "nome") DO NOTHING;
