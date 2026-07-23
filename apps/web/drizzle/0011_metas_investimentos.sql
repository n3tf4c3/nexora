CREATE TYPE "tipo_ativo_investimento" AS ENUM('renda_fixa', 'fundo', 'acao', 'fii', 'outro');

CREATE TABLE IF NOT EXISTS "metas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL REFERENCES "usuarios"("id"),
	"nome" varchar(100) NOT NULL,
	"descricao" text,
	"valor_alvo_centavos" integer NOT NULL,
	"valor_atual_centavos" integer DEFAULT 0 NOT NULL,
	"data_alvo" date,
	"icone" varchar(30) DEFAULT 'alvo' NOT NULL,
	"concluida" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "metas_valor_alvo_positivo_chk" CHECK ("valor_alvo_centavos" > 0),
	CONSTRAINT "metas_valor_atual_nao_negativo_chk" CHECK ("valor_atual_centavos" >= 0)
);

CREATE INDEX IF NOT EXISTS "metas_usuario_idx" ON "metas" ("usuario_id");

CREATE TABLE IF NOT EXISTS "aportes_metas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metaId" uuid NOT NULL REFERENCES "metas"("id") ON DELETE CASCADE,
	"usuario_id" uuid NOT NULL REFERENCES "usuarios"("id"),
	"conta_id" uuid NOT NULL REFERENCES "contas"("id"),
	"valor_centavos" integer NOT NULL,
	"data" date NOT NULL,
	"transacao_id" uuid REFERENCES "transacoes"("id"),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "aportes_metas_valor_positivo_chk" CHECK ("valor_centavos" > 0)
);

CREATE INDEX IF NOT EXISTS "aportes_metas_meta_idx" ON "aportes_metas" ("metaId");
CREATE INDEX IF NOT EXISTS "aportes_metas_usuario_idx" ON "aportes_metas" ("usuario_id");

CREATE TABLE IF NOT EXISTS "investimentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL REFERENCES "usuarios"("id"),
	"conta_id" uuid NOT NULL REFERENCES "contas"("id"),
	"nome_ativo" varchar(100) NOT NULL,
	"tipo_ativo" "tipo_ativo_investimento" DEFAULT 'renda_fixa' NOT NULL,
	"valor_investido_centavos" integer DEFAULT 0 NOT NULL,
	"valor_atual_centavos" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "investimentos_valor_investido_nao_negativo_chk" CHECK ("valor_investido_centavos" >= 0),
	CONSTRAINT "investimentos_valor_atual_nao_negativo_chk" CHECK ("valor_atual_centavos" >= 0)
);

CREATE INDEX IF NOT EXISTS "investimentos_usuario_idx" ON "investimentos" ("usuario_id");
CREATE INDEX IF NOT EXISTS "investimentos_conta_idx" ON "investimentos" ("conta_id");
