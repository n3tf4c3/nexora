import { z } from "zod";
import {
  DESCRICAO_TRANSACAO_MAX,
  NOME_CATEGORIA_MAX,
  NOME_CONTA_MAX,
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

export const transacaoInputSchema = z.object({
  tipo: z.enum(TIPOS_TRANSACAO),
  valorCentavos: z.number().int().positive(),
  descricao: z.string().trim().max(DESCRICAO_TRANSACAO_MAX).optional(),
  data: z.iso.date(),
  contaId: z.uuid(),
  categoriaId: z.uuid().optional(),
});
export type TransacaoInput = z.infer<typeof transacaoInputSchema>;
