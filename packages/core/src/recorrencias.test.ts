import { describe, expect, it } from "vitest";
import { gerarOcorrenciasParaRegra, type RegraRecorrencia } from "./recorrencias";

describe("gerarOcorrenciasParaRegra", () => {
  const regraPadrao: RegraRecorrencia = {
    id: "rec-1",
    usuarioId: "usr-1",
    contaId: "cta-1",
    categoriaId: "cat-1",
    tipo: "saida",
    natureza: "competencia",
    descricao: "Aluguel",
    valorCentavos: 150000,
    frequencia: "mensal",
    diaVencimento: 10,
    dataInicio: "2026-01-01",
    ativa: true,
  };

  it("gera ocorrências mensais dentro da janela de datas", () => {
    const ocorrencias = gerarOcorrenciasParaRegra({
      regra: regraPadrao,
      inicioPeriodo: "2026-05-01",
      fimPeriodo: "2026-07-31",
    });

    expect(ocorrencias).toHaveLength(3);
    expect(ocorrencias[0]?.data).toBe("2026-05-10");
    expect(ocorrencias[1]?.data).toBe("2026-06-10");
    expect(ocorrencias[2]?.data).toBe("2026-07-10");
  });

  it("respeita data de fim da recorrência quando configurada", () => {
    const ocorrencias = gerarOcorrenciasParaRegra({
      regra: { ...regraPadrao, dataFim: "2026-05-31" },
      inicioPeriodo: "2026-01-01",
      fimPeriodo: "2026-12-31",
    });

    expect(ocorrencias).toHaveLength(5); // Jan a Maio
    expect(ocorrencias[ocorrencias.length - 1]?.data).toBe("2026-05-10");
  });

  it("não gera ocorrências para regras inativas", () => {
    const ocorrencias = gerarOcorrenciasParaRegra({
      regra: { ...regraPadrao, ativa: false },
      inicioPeriodo: "2026-01-01",
      fimPeriodo: "2026-12-31",
    });

    expect(ocorrencias).toHaveLength(0);
  });

  it("ajusta automaticamente dia de vencimento 31 para meses curtos como fevereiro", () => {
    const ocorrencias = gerarOcorrenciasParaRegra({
      regra: { ...regraPadrao, diaVencimento: 31 },
      inicioPeriodo: "2026-02-01",
      fimPeriodo: "2026-02-28",
    });

    expect(ocorrencias).toHaveLength(1);
    expect(ocorrencias[0]?.data).toBe("2026-02-28");
  });
});
