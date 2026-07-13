ALTER TABLE "contas" DROP CONSTRAINT "contas_dias_cartao_chk";--> statement-breakpoint
ALTER TABLE "contas" ADD CONSTRAINT "contas_dias_cartao_chk" CHECK (("contas"."tipo" = 'cartao_credito'
        and "contas"."dia_fechamento" is not null and "contas"."dia_fechamento" between 1 and 31
        and "contas"."dia_vencimento" is not null and "contas"."dia_vencimento" between 1 and 31)
      or ("contas"."tipo" <> 'cartao_credito' and "contas"."dia_fechamento" is null and "contas"."dia_vencimento" is null));