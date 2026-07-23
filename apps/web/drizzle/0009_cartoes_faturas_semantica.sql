CREATE TYPE "natureza_transacao" AS ENUM('competencia', 'liquidacao_passivo', 'transferencia', 'aporte_investimento', 'ajuste_saldo');
CREATE TYPE "estado_transacao" AS ENUM('efetivada', 'prevista', 'cancelada');
CREATE TYPE "status_fatura" AS ENUM('aberta', 'fechada', 'paga', 'reconciliada');

CREATE TABLE IF NOT EXISTS "faturas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL REFERENCES "usuarios"("id"),
	"conta_id" uuid NOT NULL REFERENCES "contas"("id"),
	"mes_referencia" varchar(7) NOT NULL,
	"data_fechamento" date NOT NULL,
	"data_vencimento" date NOT NULL,
	"status" "status_fatura" DEFAULT 'aberta' NOT NULL,
	"valor_total_informado_centavos" integer,
	"valor_minimo_informado_centavos" integer,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "faturas_usuario_conta_mes_unq" ON "faturas" ("usuario_id", "conta_id", "mes_referencia");
CREATE INDEX IF NOT EXISTS "faturas_conta_idx" ON "faturas" ("conta_id");
CREATE INDEX IF NOT EXISTS "faturas_usuario_mes_idx" ON "faturas" ("usuario_id", "mes_referencia");

CREATE TABLE IF NOT EXISTS "parcelamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL REFERENCES "usuarios"("id"),
	"conta_id" uuid NOT NULL REFERENCES "contas"("id"),
	"categoria_id" uuid REFERENCES "categorias"("id"),
	"descricao" varchar(250) NOT NULL,
	"valor_total_centavos" integer NOT NULL,
	"numero_parcelas" integer NOT NULL,
	"data_primeira_parcela" date NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parcelamentos_valor_positivo_chk" CHECK ("valor_total_centavos" > 0),
	CONSTRAINT "parcelamentos_numero_parcelas_chk" CHECK ("numero_parcelas" >= 2)
);

CREATE INDEX IF NOT EXISTS "parcelamentos_usuario_idx" ON "parcelamentos" ("usuario_id");

ALTER TABLE "transacoes" ADD COLUMN IF NOT EXISTS "natureza" "natureza_transacao" DEFAULT 'competencia' NOT NULL;
ALTER TABLE "transacoes" ADD COLUMN IF NOT EXISTS "estado" "estado_transacao" DEFAULT 'efetivada' NOT NULL;
ALTER TABLE "transacoes" ADD COLUMN IF NOT EXISTS "conta_destino_id" uuid REFERENCES "contas"("id");
ALTER TABLE "transacoes" ADD COLUMN IF NOT EXISTS "fatura_id" uuid REFERENCES "faturas"("id");
ALTER TABLE "transacoes" ADD COLUMN IF NOT EXISTS "parcelamento_id" uuid REFERENCES "parcelamentos"("id");
ALTER TABLE "transacoes" ADD COLUMN IF NOT EXISTS "numero_parcela" integer;
ALTER TABLE "transacoes" ADD COLUMN IF NOT EXISTS "total_parcelas" integer;

CREATE INDEX IF NOT EXISTS "transacoes_fatura_idx" ON "transacoes" ("fatura_id");
CREATE INDEX IF NOT EXISTS "transacoes_parcelamento_idx" ON "transacoes" ("parcelamento_id");
