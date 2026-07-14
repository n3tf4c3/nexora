import { describe, expect, it } from "vitest";
import type { EventoSmsReconhecido } from "@nexora/core";
import { calcularMetricasAutomacao, sugerirClassificacaoSms } from "./automacao-sms";

const pixRecebido = {
  reconhecido: true,
  evento: "pix_recebido",
  transacional: true,
  parserId: "itau_pix",
  parserVersao: 1,
  confianca: 100,
  tipoTransacao: "entrada",
  valorCentavos: 200,
  contraparte: "Paulo",
  cpfMascarado: "XXX.981.181-XX",
  descricaoSugerida: "Pix recebido de Paulo",
} satisfies EventoSmsReconhecido;

const pixEnviado = {
  ...pixRecebido,
  evento: "pix_enviado",
  tipoTransacao: "saida",
  descricaoSugerida: "Pix enviado para Paulo",
} satisfies EventoSmsReconhecido;

describe("sugerirClassificacaoSms", () => {
  it("aprende conta pelo parser e categoria somente pela mesma contraparte e evento", () => {
    const sugestao = sugerirClassificacaoSms(
      { remetente: "1482", resultado: pixRecebido },
      [
        {
          remetente: "1482",
          resultado: pixEnviado,
          contaId: "conta-itau",
          categoriaId: "categoria-transferencia",
        },
        {
          remetente: "1482",
          resultado: pixRecebido,
          contaId: "conta-antiga",
          categoriaId: "categoria-renda",
        },
      ],
    );

    expect(sugestao).toEqual({
      contaId: "conta-itau",
      categoriaId: "categoria-renda",
    });
  });

  it("não sugere categoria de outra contraparte", () => {
    const outraContraparte = { ...pixRecebido, contraparte: "Maria" };
    expect(
      sugerirClassificacaoSms(
        { remetente: "1482", resultado: outraContraparte },
        [
          {
            remetente: "1482",
            resultado: pixRecebido,
            contaId: "conta-itau",
            categoriaId: "categoria-renda",
          },
        ],
      ),
    ).toEqual({ contaId: "conta-itau", categoriaId: undefined });
  });
});

describe("calcularMetricasAutomacao", () => {
  it("mede cobertura, correções essenciais e mediana de revisão", () => {
    const inicio = new Date("2026-07-14T12:00:00Z");
    const metricas = calcularMetricasAutomacao([
      {
        status: "confirmada",
        criadaEm: inicio,
        revisadaEm: new Date("2026-07-14T12:10:00Z"),
        interpretacao: pixRecebido,
        transacao: { tipo: "entrada", valorCentavos: 200 },
      },
      {
        status: "confirmada",
        criadaEm: inicio,
        revisadaEm: new Date("2026-07-14T12:30:00Z"),
        interpretacao: pixEnviado,
        transacao: { tipo: "entrada", valorCentavos: 250 },
      },
      {
        status: "pendente",
        criadaEm: inicio,
        revisadaEm: null,
      },
    ]);

    expect(metricas).toMatchObject({
      capturadas: 3,
      reconhecidas: 2,
      pendentes: 1,
      confirmadas: 2,
      coberturaParserPct: 67,
      palpitesConfirmados: 2,
      acertosEssenciais: 1,
      precisaoEssencialPct: 50,
      correcoesTipo: 1,
      correcoesValor: 1,
      tempoMedianoRevisaoMin: 20,
    });
    expect(metricas.porParser).toEqual([
      {
        parserId: "itau_pix",
        parserVersao: 1,
        reconhecidas: 2,
        confirmadas: 2,
        acertosEssenciais: 1,
      },
    ]);
  });
});
