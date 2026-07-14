ALTER TABLE "mensagens_sms" ADD COLUMN "revisada_em" timestamp with time zone;--> statement-breakpoint
UPDATE "mensagens_sms" AS m
SET "revisada_em" = t."criado_em"
FROM "transacoes" AS t
WHERE m."status" = 'confirmada' AND m."transacao_id" = t."id";--> statement-breakpoint
UPDATE "mensagens_sms"
SET "revisada_em" = "criado_em"
WHERE "status" = 'ignorada';--> statement-breakpoint
ALTER TABLE "mensagens_sms" ADD CONSTRAINT "mensagens_sms_status_revisao_chk" CHECK (("mensagens_sms"."status" = 'pendente') = ("mensagens_sms"."revisada_em" is null));
