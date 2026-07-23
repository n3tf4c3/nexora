import { describe, expect, it } from "vitest";
import { calcularRentabilidade } from "./investimentos";

describe("calcularRentabilidade", () => {
  it("calcula o ganho nominal em centavos e a porcentagem de valorização", () => {
    const res = calcularRentabilidade({
      valorInvestidoCentavos: 1000000, // R$ 10.000,00
      valorAtualCentavos: 1052500, // R$ 10.525,00 (+ R$ 525,00)
    });

    expect(res.ganhoCentavos).toBe(52500);
    expect(res.percentualRendimento).toBe(5.25);
  });

  it("calcula desvalorização/perda nominal e porcentagem negativa", () => {
    const res = calcularRentabilidade({
      valorInvestidoCentavos: 1000000, // R$ 10.000,00
      valorAtualCentavos: 950000, // R$ 9.500,00 (- R$ 500,00)
    });

    expect(res.ganhoCentavos).toBe(-50000);
    expect(res.percentualRendimento).toBe(-5.0);
  });
});
