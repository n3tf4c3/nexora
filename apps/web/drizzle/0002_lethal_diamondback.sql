CREATE TYPE "public"."status_mensagem_sms" AS ENUM('pendente', 'confirmada', 'ignorada');--> statement-breakpoint
CREATE TABLE "mensagens_sms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"remetente" varchar(40) NOT NULL,
	"corpo" varchar(2000) NOT NULL,
	"recebida_em" timestamp with time zone NOT NULL,
	"hash_dedup" varchar(64) NOT NULL,
	"status" "status_mensagem_sms" DEFAULT 'pendente' NOT NULL,
	"transacao_id" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mensagens_sms" ADD CONSTRAINT "mensagens_sms_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensagens_sms" ADD CONSTRAINT "mensagens_sms_transacao_id_transacoes_id_fk" FOREIGN KEY ("transacao_id") REFERENCES "public"."transacoes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "mensagens_sms_usuario_hash_unq" ON "mensagens_sms" USING btree ("usuario_id","hash_dedup");