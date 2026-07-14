import { parsearSms, type EventoSmsReconhecido } from "@nexora/core";
import { interpretacoesSms } from "@/db/schema";

type Banco = typeof import("@/db").db;

export type MensagemPersistidaParaInterpretar = {
  id: string;
  remetente: string;
  corpo: string;
};

type NovaInterpretacao = typeof interpretacoesSms.$inferInsert;

export function prepararInterpretacoesSms(
  mensagens: readonly MensagemPersistidaParaInterpretar[],
): NovaInterpretacao[] {
  return mensagens.flatMap((mensagem) => {
    const resultado = parsearSms(mensagem);
    if (!resultado.reconhecido) return [];

    return [
      {
        mensagemId: mensagem.id,
        parserId: resultado.parserId,
        parserVersao: resultado.parserVersao,
        evento: resultado.evento,
        confianca: resultado.confianca,
        transacional: resultado.transacional,
        resultado: resultado satisfies EventoSmsReconhecido,
      },
    ];
  });
}

/** Idempotente por mensagem + parser + versão; uma versão nova preserva o histórico. */
export async function persistirInterpretacoesSms(
  database: Banco,
  mensagens: readonly MensagemPersistidaParaInterpretar[],
): Promise<number> {
  const valores = prepararInterpretacoesSms(mensagens);
  if (valores.length === 0) return 0;

  const inseridas = await database
    .insert(interpretacoesSms)
    .values(valores)
    .onConflictDoNothing({
      target: [
        interpretacoesSms.mensagemId,
        interpretacoesSms.parserId,
        interpretacoesSms.parserVersao,
      ],
    })
    .returning({ id: interpretacoesSms.id });

  return inseridas.length;
}
