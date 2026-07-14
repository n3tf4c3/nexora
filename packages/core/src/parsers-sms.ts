import { parsearValorBRL } from "./dinheiro";
import { DESCRICAO_TRANSACAO_MAX } from "./limites";

export const PARSER_ITAU_PIX_ID = "itau_pix" as const;
export const PARSER_ITAU_PIX_VERSAO = 1 as const;
export const PARSER_FATURA_AMAZON_ID = "cartao_amazon_fatura_fechada" as const;
export const PARSER_FATURA_AMAZON_VERSAO = 1 as const;

const VALOR_BRL = String.raw`(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}`;
const PIX_ITAU_RE = new RegExp(
  String.raw`^Itau: Pix (recebido) no valor de R\$ (${VALOR_BRL}) de ([^,\r\n]+), CPF (XXX\.\d{3}\.\d{3}-XX)\.$|^Itau: Pix (enviado) no valor de R\$ (${VALOR_BRL}) para ([^,\r\n]+), CPF (XXX\.\d{3}\.\d{3}-XX)\.$`,
);
const FATURA_AMAZON_RE = new RegExp(
  String.raw`^CARTAO AMAZON: FATURA VENCIMENTO DIA ([1-9]|[12]\d|3[01]): NO VALOR DE R\$ (${VALOR_BRL}) VALOR MINIMO DE R\$ (${VALOR_BRL})\. COD: \d{47}$`,
);

export type MensagemSmsParaParser = Readonly<{
  remetente: string;
  corpo: string;
}>;

type MetadadosParser<ParserId extends string, ParserVersao extends number, Confianca extends number> = {
  parserId: ParserId;
  parserVersao: ParserVersao;
  confianca: Confianca;
};

type PixItauBase = MetadadosParser<typeof PARSER_ITAU_PIX_ID, 1, 100> & {
  reconhecido: true;
  transacional: true;
  valorCentavos: number;
  contraparte: string;
  cpfMascarado: string;
  descricaoSugerida: string;
};

export type PixItauRecebido = PixItauBase & {
  evento: "pix_recebido";
  tipoTransacao: "entrada";
};

export type PixItauEnviado = PixItauBase & {
  evento: "pix_enviado";
  tipoTransacao: "saida";
};

export type ResultadoPixItauReconhecido = PixItauRecebido | PixItauEnviado;

/**
 * O remetente do Cartão Amazon ainda não consta no corpus. Até ele ser
 * confirmado, este evento depende exclusivamente da correspondência exata do corpo.
 */
export type FaturaFechadaCartaoAmazon = MetadadosParser<
  typeof PARSER_FATURA_AMAZON_ID,
  1,
  80
> & {
  reconhecido: true;
  evento: "fatura_fechada";
  transacional: false;
  diaVencimento: number;
  totalCentavos: number;
  minimoCentavos: number;
  remetenteConhecido: false;
  criterioReconhecimento: "corpo_exato_sem_remetente";
};

export type ResultadoSmsDesconhecido = {
  reconhecido: false;
  evento: "desconhecido";
};

export type ResultadoPixItau = ResultadoPixItauReconhecido | ResultadoSmsDesconhecido;
export type EventoSmsReconhecido = ResultadoPixItauReconhecido | FaturaFechadaCartaoAmazon;
export type ResultadoParserSms = EventoSmsReconhecido | ResultadoSmsDesconhecido;

function desconhecido(): ResultadoSmsDesconhecido {
  return { reconhecido: false, evento: "desconhecido" };
}

function limitarDescricao(descricao: string): string {
  return descricao.slice(0, DESCRICAO_TRANSACAO_MAX);
}

export function parsearPixItau(mensagem: MensagemSmsParaParser): ResultadoPixItau {
  if (mensagem.remetente !== "1482") return desconhecido();

  const correspondencia = PIX_ITAU_RE.exec(mensagem.corpo);
  if (!correspondencia) return desconhecido();

  const recebido = correspondencia[1] === "recebido";
  const valorTexto = recebido ? correspondencia[2] : correspondencia[6];
  const contraparte = recebido ? correspondencia[3] : correspondencia[7];
  const cpfMascarado = recebido ? correspondencia[4] : correspondencia[8];
  if (!valorTexto || !contraparte || !cpfMascarado || contraparte !== contraparte.trim()) {
    return desconhecido();
  }

  const valorCentavos = parsearValorBRL(valorTexto);
  if (valorCentavos === null || valorCentavos <= 0) return desconhecido();

  const metadados = {
    reconhecido: true,
    transacional: true,
    parserId: PARSER_ITAU_PIX_ID,
    parserVersao: PARSER_ITAU_PIX_VERSAO,
    confianca: 100,
    valorCentavos,
    contraparte,
    cpfMascarado,
  } as const;

  if (recebido) {
    return {
      ...metadados,
      evento: "pix_recebido",
      tipoTransacao: "entrada",
      descricaoSugerida: limitarDescricao(`Pix recebido de ${contraparte}`),
    };
  }

  return {
    ...metadados,
    evento: "pix_enviado",
    tipoTransacao: "saida",
    descricaoSugerida: limitarDescricao(`Pix enviado para ${contraparte}`),
  };
}

export function classificarFaturaFechadaCartaoAmazon(
  corpo: string,
): FaturaFechadaCartaoAmazon | ResultadoSmsDesconhecido {
  const correspondencia = FATURA_AMAZON_RE.exec(corpo);
  if (!correspondencia) return desconhecido();

  const diaVencimento = Number(correspondencia[1]);
  const totalCentavos = parsearValorBRL(correspondencia[2] ?? "");
  const minimoCentavos = parsearValorBRL(correspondencia[3] ?? "");
  if (totalCentavos === null || totalCentavos <= 0 || minimoCentavos === null || minimoCentavos <= 0) {
    return desconhecido();
  }

  return {
    reconhecido: true,
    evento: "fatura_fechada",
    transacional: false,
    parserId: PARSER_FATURA_AMAZON_ID,
    parserVersao: PARSER_FATURA_AMAZON_VERSAO,
    confianca: 80,
    diaVencimento,
    totalCentavos,
    minimoCentavos,
    remetenteConhecido: false,
    criterioReconhecimento: "corpo_exato_sem_remetente",
  };
}

export function parsearSms(mensagem: MensagemSmsParaParser): ResultadoParserSms {
  const pixItau = parsearPixItau(mensagem);
  if (pixItau.reconhecido) return pixItau;

  const faturaAmazon = classificarFaturaFechadaCartaoAmazon(mensagem.corpo);
  if (faturaAmazon.reconhecido) return faturaAmazon;

  return desconhecido();
}
