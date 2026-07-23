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

export const ICONES_CONTA = ["banco", "cartao", "dinheiro", "poupanca", "investimento"] as const;
export type TipoIconeConta = (typeof ICONES_CONTA)[number];

export const CATEGORIAS_PADRAO = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saúde",
  "Assinaturas",
] as const;

export const TIPOS_TRANSACAO = ["entrada", "saida"] as const;
export type TipoTransacao = (typeof TIPOS_TRANSACAO)[number];

export const NATUREZAS_TRANSACAO = [
  "competencia",
  "liquidacao_passivo",
  "transferencia",
  "aporte_investimento",
  "ajuste_saldo",
] as const;
export type NaturezaTransacao = (typeof NATUREZAS_TRANSACAO)[number];

export const ESTADOS_TRANSACAO = ["efetivada", "prevista", "cancelada"] as const;
export type EstadoTransacao = (typeof ESTADOS_TRANSACAO)[number];

export const STATUS_FATURA = ["aberta", "fechada", "paga", "reconciliada"] as const;
export type StatusFatura = (typeof STATUS_FATURA)[number];

export const FREQUENCIAS_RECORRENCIA = ["mensal", "anual", "semanal"] as const;
export type FrequenciaRecorrencia = (typeof FREQUENCIAS_RECORRENCIA)[number];

export const TIPOS_ATIVO_INVESTIMENTO = [
  "renda_fixa",
  "fundo",
  "acao",
  "fii",
  "outro",
] as const;
export type TipoAtivoInvestimento = (typeof TIPOS_ATIVO_INVESTIMENTO)[number];

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
    icone: z.enum(ICONES_CONTA),
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

export const transacaoInputSchema = z
  .object({
    tipo: z.enum(TIPOS_TRANSACAO),
    natureza: z.enum(NATUREZAS_TRANSACAO).default("competencia"),
    estado: z.enum(ESTADOS_TRANSACAO).default("efetivada"),
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
    contaDestinoId: z.uuid("Conta de destino inválida.").optional(),
    faturaId: z.uuid("Fatura inválida.").optional(),
    parcelamentoId: z.uuid("Parcelamento inválido.").optional(),
    numeroParcela: z.number().int().min(1).optional(),
    totalParcelas: z.number().int().min(1).optional(),
  })
  .refine(
    (t) => t.natureza !== "transferencia" || t.contaDestinoId !== undefined,
    { message: "Transferências exigem conta de destino." },
  )
  .refine(
    (t) => t.contaDestinoId === undefined || t.contaDestinoId !== t.contaId,
    { message: "A conta de destino deve ser diferente da conta de origem." },
  );
export type TransacaoInput = z.infer<typeof transacaoInputSchema>;

export const parcelamentoInputSchema = z.object({
  contaId: z.uuid("Conta inválida."),
  categoriaId: z.uuid("Categoria inválida.").optional(),
  descricao: z
    .string()
    .trim()
    .min(1, "Informe a descrição do parcelamento.")
    .max(DESCRICAO_TRANSACAO_MAX, `Descrição muito longa (máx. ${DESCRICAO_TRANSACAO_MAX}).`),
  valorTotalCentavos: z
    .number()
    .int()
    .positive()
    .max(VALOR_CENTAVOS_MAX, "Valor acima do máximo suportado."),
  numeroParcelas: z.number().int().min(2).max(72, "Número de parcelas inválido (máx. 72)."),
  dataPrimeiraParcela: z.iso.date("Data da primeira parcela inválida."),
});
export type ParcelamentoInput = z.infer<typeof parcelamentoInputSchema>;

export const faturaInputSchema = z.object({
  contaId: z.uuid("Conta inválida."),
  mesReferencia: z.string().regex(/^((?:19|20|21)\d{2})-(0[1-9]|1[0-2])$/, "Mês de referência inválido."),
  dataFechamento: z.iso.date("Data de fechamento inválida."),
  dataVencimento: z.iso.date("Data de vencimento inválida."),
  status: z.enum(STATUS_FATURA).default("aberta"),
  valorTotalInformadoCentavos: z.number().int().nonnegative().optional(),
  valorMinimoInformadoCentavos: z.number().int().nonnegative().optional(),
});
export type FaturaInput = z.infer<typeof faturaInputSchema>;

export const recorrenciaInputSchema = z.object({
  contaId: z.uuid("Conta inválida."),
  categoriaId: z.uuid("Categoria inválida.").optional(),
  tipo: z.enum(TIPOS_TRANSACAO),
  natureza: z.enum(NATUREZAS_TRANSACAO).default("competencia"),
  descricao: z
    .string()
    .trim()
    .min(1, "Informe a descrição da recorrência.")
    .max(DESCRICAO_TRANSACAO_MAX, `Descrição muito longa (máx. ${DESCRICAO_TRANSACAO_MAX}).`),
  valorCentavos: z
    .number()
    .int()
    .positive()
    .max(VALOR_CENTAVOS_MAX, "Valor acima do máximo suportado."),
  frequencia: z.enum(FREQUENCIAS_RECORRENCIA).default("mensal"),
  diaVencimento: z.number().int().min(1).max(31, "Dia de vencimento inválido."),
  dataInicio: z.iso.date("Data de início inválida."),
  dataFim: z.iso.date("Data de fim inválida.").optional(),
  ativa: z.boolean().default(true),
});
export type RecorrenciaInput = z.infer<typeof recorrenciaInputSchema>;

export const metaInputSchema = z.object({
  nome: nomeSchema(100),
  descricao: z.string().trim().max(500).optional(),
  valorAlvoCentavos: z
    .number()
    .int()
    .positive()
    .max(VALOR_CENTAVOS_MAX, "Valor alvo acima do máximo suportado."),
  dataAlvo: z.iso.date("Data alvo inválida.").optional(),
  icone: z.string().trim().max(30).default("alvo"),
});
export type MetaInput = z.infer<typeof metaInputSchema>;

export const aporteMetaInputSchema = z.object({
  metaId: z.uuid("Meta inválida."),
  contaId: z.uuid("Conta de origem inválida."),
  valorCentavos: z
    .number()
    .int()
    .positive()
    .max(VALOR_CENTAVOS_MAX, "Valor do aporte inválido."),
  data: z.iso.date("Data do aporte inválida."),
});
export type AporteMetaInput = z.infer<typeof aporteMetaInputSchema>;

export const investimentoInputSchema = z.object({
  contaId: z.uuid("Conta de investimento inválida."),
  nomeAtivo: nomeSchema(100),
  tipoAtivo: z.enum(TIPOS_ATIVO_INVESTIMENTO).default("renda_fixa"),
  valorInvestidoCentavos: z.number().int().nonnegative().default(0),
  valorAtualCentavos: z.number().int().nonnegative().default(0),
});
export type InvestimentoInput = z.infer<typeof investimentoInputSchema>;

