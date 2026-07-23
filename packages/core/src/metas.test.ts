import { describe, expect, it } from "vitest";
import { calcularProgressoMeta, calcularRitmoAporteSugerido } from "./metas";

describe("calcularProgressoMeta", () => {
  it("calcula percentual e restante de uma meta parcialmente atingida", () => {
    const res = calcularProgressoMeta({
      valorAtualCentavos: 500000, // R$ 5.000,00 de R$ 10.000,00
      valorAlvoCentavos: 1000000,
    });

    expect(res.percentual).toBe(50);
    expect(res.restanteCentavos).toBe(500000);
    expect(res.concluida).toBe(false);
  });

  it("marca como concluída quando o valor atual atinge ou supera o alvo", () => {
    const res = calcularProgressoMeta({
      valorAtualCentavos: 1200000, // R$ 12.000,00 de R$ 10.000,00
      valorAlvoCentavos: 1000000,
    });

    expect(res.percentual).toBe(100);
    expect(res.restanteCentavos).toBe(0);
    expect(res.concluida).toBe(true);
  });
});

describe("calcularRitmoAporteSugerido", () => {
  it("calcula o aporte mensal recomendado com base no tempo restante até a data alvo", () => {
    const ritmo = calcularRitmoAporteSugerido({
      valorRestanteCentavos: 600000, // R$ 6.000,00 restantes em 6 meses (Maio a Outubro 2026)
      dataAtual: "2026-05-10",
      dataAlvo: "2026-10-31",
    });

    expect(ritmo).toBe(100000); // R$ 1.000,00 por mês
  });
});
