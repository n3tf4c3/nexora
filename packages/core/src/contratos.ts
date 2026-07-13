import { z } from "zod";
import {
  CORPO_SMS_MAX,
  DESCRICAO_TRANSACAO_MAX,
  LOTE_CAPTURA_MAX,
  NOME_CATEGORIA_MAX,
  NOME_CONTA_MAX,
  REMETENTE_SMS_MAX,
  VALOR_CENTAVOS_MAX,
} from "./limites";

export const TIPOS_CONTA = ["corrente", "carteira", "cartao_credito"] as const;
export type TipoConta = (typeof TIPOS_CONTA)[number];

export const TIPOS_TRANSACAO = ["entrada", "saida"] as const;
export type TipoTransacao = (typeof TIPOS_TRANSACAO)[number];

const diaDoMes = z.coerce.number().int().min(1).max(31);

const nomeSchema = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(max, `Nome muito longo (máx. ${max} caracteres).`);

export const contaInputSchema = z
  .object({
    nome: nomeSchema(NOME_CONTA_MAX),
    tipo: z.enum(TIPOS_CONTA),
    diaFechamento: diaDoMes.optional(),
    diaVencimento: diaDoMes.optional(),
  })
  .refine(
    (c) =>
      c.tipo !== "cartao_credito" ||
      (c.diaFechamento !== undefined && c.diaVencimento !== undefined),
    { message: "Cartão de crédito exige dia de fechamento e de vencimento." },
  )
  .refine(
    (c) =>
      c.tipo === "cartao_credito" ||
      (c.diaFechamento === undefined && c.diaVencimento === undefined),
    { message: "Dias de fechamento e vencimento são exclusivos de cartão de crédito." },
  );
export type ContaInput = z.infer<typeof contaInputSchema>;

export const categoriaInputSchema = z.object({
  nome: nomeSchema(NOME_CATEGORIA_MAX),
});
export type CategoriaInput = z.infer<typeof categoriaInputSchema>;

// Ciclo de vida de um SMS capturado: chega pendente; a revisão na fila
// o confirma (vira transação) ou ignora. "parseada" (parser automático)
// entra quando os parsers por banco existirem.
export const STATUS_MENSAGEM_SMS = ["pendente", "confirmada", "ignorada"] as const;
export type StatusMensagemSms = (typeof STATUS_MENSAGEM_SMS)[number];

// SMS cru é persistido byte a byte (sem trim/normalização — achado 10);
// a validação só garante que não é vazio nem estoura o limite.
const textoSmsCru = (max: number) =>
  z
    .string()
    .max(max)
    .refine((s) => s.trim().length > 0, { message: "Não pode ser vazio." });

export const capturaSmsSchema = z.object({
  remetente: textoSmsCru(REMETENTE_SMS_MAX),
  corpo: textoSmsCru(CORPO_SMS_MAX),
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
  valorCentavos: z
    .number()
    .int()
    .positive()
    .max(VALOR_CENTAVOS_MAX, "Valor acima do máximo suportado."),
  // Descrição só de espaços vira ausência, não string vazia persistida.
  descricao: z
    .string()
    .trim()
    .max(DESCRICAO_TRANSACAO_MAX, `Descrição muito longa (máx. ${DESCRICAO_TRANSACAO_MAX}).`)
    .transform((s) => s || undefined)
    .optional(),
  data: z.iso.date("Data inválida."),
  contaId: z.uuid("Conta inválida."),
  categoriaId: z.uuid("Categoria inválida.").optional(),
});
export type TransacaoInput = z.infer<typeof transacaoInputSchema>;
