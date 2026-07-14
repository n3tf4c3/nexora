CREATE TABLE "interpretacoes_sms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mensagem_id" uuid NOT NULL,
	"parser_id" varchar(80) NOT NULL,
	"parser_versao" integer NOT NULL,
	"evento" varchar(40) NOT NULL,
	"confianca" integer NOT NULL,
	"transacional" boolean NOT NULL,
	"resultado" jsonb NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interpretacoes_sms_parser_versao_chk" CHECK ("interpretacoes_sms"."parser_versao" > 0),
	CONSTRAINT "interpretacoes_sms_confianca_chk" CHECK ("interpretacoes_sms"."confianca" between 0 and 100)
);
--> statement-breakpoint
ALTER TABLE "interpretacoes_sms" ADD CONSTRAINT "interpretacoes_sms_mensagem_id_mensagens_sms_id_fk" FOREIGN KEY ("mensagem_id") REFERENCES "public"."mensagens_sms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "interpretacoes_sms_mensagem_parser_versao_unq" ON "interpretacoes_sms" USING btree ("mensagem_id","parser_id","parser_versao");--> statement-breakpoint
CREATE INDEX "interpretacoes_sms_mensagem_criado_idx" ON "interpretacoes_sms" USING btree ("mensagem_id","criado_em");