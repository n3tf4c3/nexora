CREATE INDEX "mensagens_sms_usuario_status_recebida_idx" ON "mensagens_sms" USING btree ("usuario_id","status","recebida_em");--> statement-breakpoint
CREATE INDEX "transacoes_usuario_data_idx" ON "transacoes" USING btree ("usuario_id","data","criado_em");--> statement-breakpoint
CREATE INDEX "transacoes_conta_idx" ON "transacoes" USING btree ("conta_id");--> statement-breakpoint
CREATE INDEX "transacoes_categoria_idx" ON "transacoes" USING btree ("categoria_id");