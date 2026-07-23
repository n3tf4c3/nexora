CREATE TYPE "frequencia_recorrencia" AS ENUM('mensal', 'anual', 'semanal');

CREATE TABLE IF NOT EXISTS "recorrencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL REFERENCES "usuarios"("id"),
	"conta_id" uuid NOT NULL REFERENCES "contas"("id"),
	"categoria_id" uuid REFERENCES "categorias"("id"),
	"tipo" "tipo_transacao" NOT NULL,
	"natureza" "natureza_transacao" DEFAULT 'competencia' NOT NULL,
	"descricao" varchar(250) NOT NULL,
	"valor_centavos" integer NOT NULL,
	"frequencia" "frequencia_recorrencia" DEFAULT 'mensal' NOT NULL,
	"dia_vencimento" integer NOT NULL,
	"data_inicio" date NOT NULL,
	"data_fim" date,
	"ativa" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recorrencias_valor_positivo_chk" CHECK ("valor_centavos" > 0),
	CONSTRAINT "recorrencias_dia_vencimento_chk" CHECK ("dia_vencimento" between 1 and 31)
);

CREATE INDEX IF NOT EXISTS "recorrencias_usuario_idx" ON "recorrencias" ("usuario_id");

ALTER TABLE "transacoes" ADD COLUMN IF NOT EXISTS "recorrencia_id" uuid REFERENCES "recorrencias"("id");

CREATE INDEX IF NOT EXISTS "transacoes_recorrencia_idx" ON "transacoes" ("recorrencia_id");
