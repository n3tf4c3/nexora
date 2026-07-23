import { describe, expect, it } from "vitest";
import { calcularCicloFatura } from "./faturas";

describe("calcularCicloFatura", () => {
  it("aloca compra antes do fechamento na fatura do mesmo mês quando vencimento é posterior ao fechamento", () => {
    // Fechamento dia 5, Vencimento dia 15
    const ciclo = calcularCicloFatura({
      dataCompra: "2026-05-04",
      diaFechamento: 5,
      diaVencimento: 15,
    });

    expect(ciclo.dataFechamento).toBe("2026-05-05");
    expect(ciclo.dataVencimento).toBe("2026-05-15");
    expect(ciclo.mesReferencia).toBe("2026-05");
  });

  it("aloca compra após o fechamento na fatura do mês seguinte", () => {
    // Fechamento dia 5, Vencimento dia 15. Compra dia 6.
    const ciclo = calcularCicloFatura({
      dataCompra: "2026-05-06",
      diaFechamento: 5,
      diaVencimento: 15,
    });

    expect(ciclo.dataFechamento).toBe("2026-06-05");
    expect(ciclo.dataVencimento).toBe("2026-06-15");
    expect(ciclo.mesReferencia).toBe("2026-06");
  });

  it("trata corretamente quando o dia de vencimento é menor que o dia de fechamento (vence no mês seguinte ao fechamento)", () => {
    // Fechamento dia 25, Vencimento dia 5
    // Compra em 2026-05-20 (antes do fechamento de maio)
    const ciclo1 = calcularCicloFatura({
      dataCompra: "2026-05-20",
      diaFechamento: 25,
      diaVencimento: 5,
    });

    expect(ciclo1.dataFechamento).toBe("2026-05-25");
    expect(ciclo1.dataVencimento).toBe("2026-06-05");
    expect(ciclo1.mesReferencia).toBe("2026-06");

    // Compra em 2026-05-26 (após o fechamento de maio) -> fecha em junho, vence em julho
    const ciclo2 = calcularCicloFatura({
      dataCompra: "2026-05-26",
      diaFechamento: 25,
      diaVencimento: 5,
    });

    expect(ciclo2.dataFechamento).toBe("2026-06-25");
    expect(ciclo2.dataVencimento).toBe("2026-07-05");
    expect(ciclo2.mesReferencia).toBe("2026-07");
  });

  it("trata virada de ano no fechamento e vencimento", () => {
    const ciclo = calcularCicloFatura({
      dataCompra: "2026-12-28",
      diaFechamento: 25,
      diaVencimento: 5,
    });

    // Compra em 28/12/2026 -> após fechamento de 25/12/2026
    // Fecha em 25/01/2027, vence em 05/02/2027
    expect(ciclo.dataFechamento).toBe("2027-01-25");
    expect(ciclo.dataVencimento).toBe("2027-02-05");
    expect(ciclo.mesReferencia).toBe("2027-02");
  });

  it("ajusta dias 29-31 para meses mais curtos como fevereiro", () => {
    const ciclo = calcularCicloFatura({
      dataCompra: "2026-01-30",
      diaFechamento: 31,
      diaVencimento: 10,
    });

    // 2026 não é bissexto -> Fev tem 28 dias
    expect(ciclo.dataFechamento).toBe("2026-01-31");
    expect(ciclo.dataVencimento).toBe("2026-02-10");
  });
});
