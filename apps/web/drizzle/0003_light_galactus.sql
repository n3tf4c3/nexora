ALTER TABLE "mensagens_sms" DROP CONSTRAINT "mensagens_sms_transacao_id_transacoes_id_fk";
--> statement-breakpoint
ALTER TABLE "mensagens_sms" ADD CONSTRAINT "mensagens_sms_transacao_id_transacoes_id_fk" FOREIGN KEY ("transacao_id") REFERENCES "public"."transacoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "mensagens_sms_transacao_unq" ON "mensagens_sms" USING btree ("transacao_id") WHERE "mensagens_sms"."transacao_id" is not null;--> statement-breakpoint
ALTER TABLE "mensagens_sms" ADD CONSTRAINT "mensagens_sms_status_vinculo_chk" CHECK (("mensagens_sms"."status" = 'confirmada') = ("mensagens_sms"."transacao_id" is not null));