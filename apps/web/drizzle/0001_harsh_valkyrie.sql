CREATE TYPE "public"."tipo_conta" AS ENUM('corrente', 'carteira', 'cartao_credito');--> statement-breakpoint
CREATE TYPE "public"."tipo_transacao" AS ENUM('entrada', 'saida');--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nome" varchar(40) NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nome" varchar(60) NOT NULL,
	"tipo" "tipo_conta" NOT NULL,
	"dia_fechamento" integer,
	"dia_vencimento" integer,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contas_dias_cartao_chk" CHECK (("contas"."tipo" <> 'cartao_credito') or ("contas"."dia_fechamento" between 1 and 31 and "contas"."dia_vencimento" between 1 and 31))
);
--> statement-breakpoint
CREATE TABLE "transacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"conta_id" uuid NOT NULL,
	"categoria_id" uuid,
	"tipo" "tipo_transacao" NOT NULL,
	"valor_centavos" integer NOT NULL,
	"descricao" varchar(200),
	"data" date NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transacoes_valor_positivo_chk" CHECK ("transacoes"."valor_centavos" > 0)
);
--> statement-breakpoint
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contas" ADD CONSTRAINT "contas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_conta_id_contas_id_fk" FOREIGN KEY ("conta_id") REFERENCES "public"."contas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categorias_usuario_nome_unq" ON "categorias" USING btree ("usuario_id","nome");--> statement-breakpoint
CREATE UNIQUE INDEX "contas_usuario_nome_unq" ON "contas" USING btree ("usuario_id","nome");