import { describe, expect, it } from "vitest";
import { encontrarOcorrenciaCorrespondente } from "./matching-recorrencias";
import type { OcorrenciaPrevista } from "./recorrencias";

describe("encontrarOcorrenciaCorrespondente", () => {
  const ocorrencias: OcorrenciaPrevista[] = [
    {
      recorrenciaId: "rec-aluguel",
      data: "2026-05-10",
      contaId: "cta-1",
      tipo: "saida",
      natureza: "competencia",
      descricao: "Aluguel",
      valorCentavos: 150000,
    },
    {
      recorrenciaId: "rec-internet",
      data: "2026-05-20",
      contaId: "cta-1",
      tipo: "saida",
      natureza: "competencia",
      descricao: "Internet",
      valorCentavos: 12000,
    },
  ];

  it("encontra a ocorrência prevista idêntica em tipo, conta, valor e mês", () => {
    const match = encontrarOcorrenciaCorrespondente({
      transacaoReal: {
        data: "2026-05-10",
        contaId: "cta-1",
        tipo: "saida",
        valorCentavos: 150000,
      },
      ocorrenciasPrevistas: ocorrencias,
    });

    expect(match?.recorrenciaId).toBe("rec-aluguel");
  });

  it("retorna null se não houver ocorrência correspondente", () => {
    const match = encontrarOcorrenciaCorrespondente({
      transacaoReal: {
        data: "2026-05-10",
        contaId: "cta-1",
        tipo: "saida",
        valorCentavos: 99900,
      },
      ocorrenciasPrevistas: ocorrencias,
    });

    expect(match).toBeNull();
  });
});
