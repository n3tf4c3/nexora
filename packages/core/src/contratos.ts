import { z } from "zod";
import {
  CORPO_SMS_MAX,
  DESCRICAO_TRANSACAO_MAX,
  LOTE_CAPTURA_MAX,
  NOME_CATEGORIA_MAX,
  NOME_CONTA_MAX,
  REMETENTE_SMS_MAX,
} from "./limites";

export const TIPOS_CONTA = ["corrente", "carteira", "cartao_credito"] as const;
export type TipoConta = (typeof TIPOS_CONTA)[number];

export const TIPOS_TRANSACAO = ["entrada", "saida"] as const;
export type TipoTransacao = (typeof TIPOS_TRANSACAO)[number];

const diaDoMes = z.coerce.number().int().min(1).max(31);

export const contaInputSchema = z
  .object({
    nome: z.string().trim().min(1).max(NOME_CONTA_MAX),
    tipo: z.enum(TIPOS_CONTA),
    diaFechamento: diaDoMes.optional(),
    diaVencimento: diaDoMes.optional(),
  })
  .refine(
    (c) =>
      c.tipo !== "cartao_credito" ||
      (c.diaFechamento !== undefined && c.diaVencimento !== undefined),
    { message: "Cartão de crédito exige dia de fechamento e de vencimento." },
  );
export type ContaInput = z.infer<typeof contaInputSchema>;

export const categoriaInputSchema = z.object({
  nome: z.string().trim().min(1).max(NOME_CATEGORIA_MAX),
});
export type CategoriaInput = z.infer<typeof categoriaInputSchema>;

// Ciclo de vida de um SMS capturado: chega pendente; a revisão na fila
// o confirma (vira transação) ou ignora. "parseada" (parser automático)
// entra quando os parsers por banco existirem.
export const STATUS_MENSAGEM_SMS = ["pendente", "confirmada", "ignorada"] as const;
export type StatusMensagemSms = (typeof STATUS_MENSAGEM_SMS)[number];

export const capturaSmsSchema = z.object({
  remetente: z.string().trim().min(1).max(REMETENTE_SMS_MAX),
  corpo: z.string().trim().min(1).max(CORPO_SMS_MAX),
  // Instante em que o SMS chegou no aparelho (ISO com offset ou Z).
  recebidaEm: z.iso.datetime({ offset: true }),
});
export type CapturaSms = z.infer<typeof capturaSmsSchema>;

export const capturaLoteSchema = z.object({
  mensagens: z.array(capturaSmsSchema).min(1).max(LOTE_CAPTURA_MAX),
});
export type CapturaLote = z.infer<typeof capturaLoteSchema>;

export const transacaoInputSchema = z.object({
  tipo: z.enum(TIPOS_TRANSACAO),
  valorCentavos: z.number().int().positive(),
  descricao: z.string().trim().max(DESCRICAO_TRANSACAO_MAX).optional(),
  data: z.iso.date(),
  contaId: z.uuid(),
  categoriaId: z.uuid().optional(),
});
export type TransacaoInput = z.infer<typeof transacaoInputSchema>;
