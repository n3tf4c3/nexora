import { describe, expect, it } from "vitest";
import {
  DESCRICAO_TRANSACAO_MAX,
  PARSER_FATURA_AMAZON_ID,
  PARSER_FATURA_AMAZON_VERSAO,
  PARSER_ITAU_PIX_ID,
  PARSER_ITAU_PIX_VERSAO,
  classificarFaturaFechadaCartaoAmazon,
  parsearPixItau,
  parsearSms,
  type EventoSmsReconhecido,
} from "./index";

const PIX_RECEBIDO = "Itau: Pix recebido no valor de R$ 98,74 de Maria, CPF XXX.123.456-XX.";
const PIX_ENVIADO = "Itau: Pix enviado no valor de R$ 2,00 para Maria, CPF XXX.123.456-XX.";
const FATURA_AMAZON =
  "CARTAO AMAZON: FATURA VENCIMENTO DIA 15: NO VALOR DE R$ 135,79 VALOR MINIMO DE R$ 13,00. COD: 12345678901234567890123456789012345678901234567";

function esperarMetadadosValidos(resultado: EventoSmsReconhecido): void {
  expect(resultado.parserId.length).toBeGreaterThan(0);
  expect(Number.isInteger(resultado.parserVersao)).toBe(true);
  expect(Number.isInteger(resultado.confianca)).toBe(true);
  expect(resultado.confianca).toBeGreaterThanOrEqual(0);
  expect(resultado.confianca).toBeLessThanOrEqual(100);
}

describe("parsearPixItau", () => {
  it("reconhece a amostra de Pix recebido como entrada", () => {
    const resultado = parsearPixItau({ remetente: "1482", corpo: PIX_RECEBIDO });

    expect(resultado).toEqual({
      reconhecido: true,
      evento: "pix_recebido",
      transacional: true,
      parserId: PARSER_ITAU_PIX_ID,
      parserVersao: PARSER_ITAU_PIX_VERSAO,
      confianca: 100,
      tipoTransacao: "entrada",
      valorCentavos: 9874,
      contraparte: "Maria",
      cpfMascarado: "XXX.123.456-XX",
      descricaoSugerida: "Pix recebido de Maria",
    });
    if (resultado.reconhecido) esperarMetadadosValidos(resultado);
  });

  it("reconhece a amostra de Pix enviado como saída", () => {
    const resultado = parsearPixItau({ remetente: "1482", corpo: PIX_ENVIADO });

    expect(resultado).toMatchObject({
      reconhecido: true,
      evento: "pix_enviado",
      tipoTransacao: "saida",
      valorCentavos: 200,
      contraparte: "Maria",
      cpfMascarado: "XXX.123.456-XX",
      descricaoSugerida: "Pix enviado para Maria",
    });
  });

  it("aceita valor com separador de milhar no mesmo formato do corpus", () => {
    const corpo =
      "Itau: Pix recebido no valor de R$ 1.234,56 de Maria, CPF XXX.123.456-XX.";

    expect(parsearPixItau({ remetente: "1482", corpo })).toMatchObject({
      reconhecido: true,
      valorCentavos: 123456,
    });
  });

  it("exige o remetente exato, sem normalização", () => {
    expect(parsearPixItau({ remetente: "1483", corpo: PIX_RECEBIDO })).toEqual({
      reconhecido: false,
      evento: "desconhecido",
    });
    expect(parsearPixItau({ remetente: "1482 ", corpo: PIX_RECEBIDO })).toEqual({
      reconhecido: false,
      evento: "desconhecido",
    });
  });

  it.each([
    "Itaú: Pix recebido no valor de R$ 98,74 de Maria, CPF XXX.123.456-XX.",
    "Itau: Pix recebido no valor de R$ 98.74 de Maria, CPF XXX.123.456-XX.",
    "Itau: Pix recebido no valor de R$ 98,74 de Maria, CPF 123.123.456-00.",
    "Itau: Pix recebido no valor de R$ 98,74 de Maria, CPF XXX.123.456-XX",
  ])("rejeita formato semelhante fora do corpus: %s", (corpo) => {
    expect(parsearPixItau({ remetente: "1482", corpo })).toEqual({
      reconhecido: false,
      evento: "desconhecido",
    });
  });

  it("limita a descrição sugerida ao limite canônico", () => {
    const contraparte = "M".repeat(DESCRICAO_TRANSACAO_MAX + 20);
    const corpo = `Itau: Pix enviado no valor de R$ 2,00 para ${contraparte}, CPF XXX.123.456-XX.`;
    const resultado = parsearPixItau({ remetente: "1482", corpo });

    expect(resultado.reconhecido).toBe(true);
    if (resultado.reconhecido && resultado.evento === "pix_enviado") {
      expect(resultado.descricaoSugerida).toHaveLength(DESCRICAO_TRANSACAO_MAX);
    }
  });
});

describe("classificarFaturaFechadaCartaoAmazon", () => {
  it("classifica a amostra como evento não transacional", () => {
    const resultado = classificarFaturaFechadaCartaoAmazon(FATURA_AMAZON);

    expect(resultado).toEqual({
      reconhecido: true,
      evento: "fatura_fechada",
      transacional: false,
      parserId: PARSER_FATURA_AMAZON_ID,
      parserVersao: PARSER_FATURA_AMAZON_VERSAO,
      confianca: 80,
      diaVencimento: 15,
      totalCentavos: 13579,
      minimoCentavos: 1300,
      remetenteConhecido: false,
      criterioReconhecimento: "corpo_exato_sem_remetente",
    });
    expect(resultado).not.toHaveProperty("tipoTransacao");
    if (resultado.reconhecido) esperarMetadadosValidos(resultado);
  });

  it("extrai valores com separador de milhar", () => {
    const corpo =
      "CARTAO AMAZON: FATURA VENCIMENTO DIA 15: NO VALOR DE R$ 1.235,79 VALOR MINIMO DE R$ 123,00. COD: 12345678901234567890123456789012345678901234567";

    expect(classificarFaturaFechadaCartaoAmazon(corpo)).toMatchObject({
      reconhecido: true,
      totalCentavos: 123579,
      minimoCentavos: 12300,
    });
  });

  it.each([
    "CARTAO AMAZON: FATURA VENCIMENTO DIA 32: NO VALOR DE R$ 135,79 VALOR MINIMO DE R$ 13,00. COD: 12345678901234567890123456789012345678901234567",
    "CARTAO AMAZON: FATURA VENCIMENTO DIA 15: NO VALOR DE R$ 135.79 VALOR MINIMO DE R$ 13,00. COD: 12345678901234567890123456789012345678901234567",
    "Cartao Amazon: FATURA VENCIMENTO DIA 15: NO VALOR DE R$ 135,79 VALOR MINIMO DE R$ 13,00. COD: 12345678901234567890123456789012345678901234567",
    "CARTAO AMAZON: FATURA VENCIMENTO DIA 15: NO VALOR DE R$ 135,79 VALOR MINIMO DE R$ 13,00. COD: 1234567890123456789012345678901234567890123456",
  ])("rejeita corpo semelhante que não segue exatamente o formato: %s", (corpo) => {
    expect(classificarFaturaFechadaCartaoAmazon(corpo)).toEqual({
      reconhecido: false,
      evento: "desconhecido",
    });
  });

  it("preserva a incerteza do remetente no resultado", () => {
    const resultado = parsearSms({ remetente: "REMETENTE AINDA DESCONHECIDO", corpo: FATURA_AMAZON });

    expect(resultado).toMatchObject({
      reconhecido: true,
      evento: "fatura_fechada",
      remetenteConhecido: false,
      criterioReconhecimento: "corpo_exato_sem_remetente",
      confianca: 80,
    });
  });
});

describe("parsearSms", () => {
  it("retorna desconhecido explicitamente, sem fallback", () => {
    expect(parsearSms({ remetente: "1482", corpo: "Itau: mensagem sem formato conhecido." })).toEqual({
      reconhecido: false,
      evento: "desconhecido",
    });
  });
});
