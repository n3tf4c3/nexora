import { describe, expect, it } from "vitest";
import { calcularReconciliacaoFatura } from "./nexora-fechado";

describe("calcularReconciliacaoFatura", () => {
  it("calcula total explicado e diferença exata quando a fatura bate 100%", () => {
    const res = calcularReconciliacaoFatura({
      valorTotalInformadoCentavos: 13579, // R$ 135,79 (da amostra do Cartão Amazon)
      lancamentos: [
        { valorCentavos: 10000, tipo: "saida", natureza: "competencia" },
        { valorCentavos: 3579, tipo: "saida", natureza: "competencia" },
      ],
      statusAtual: "fechada",
    });

    expect(res.totalExplicadoCentavos).toBe(13579);
    expect(res.diferencaCentavos).toBe(0);
    expect(res.percentualExplicado).toBe(100);
    expect(res.statusSugerido).toBe("reconciliada");
  });

  it("calcula percentual e diferença restante quando faltam compras a explicar", () => {
    const res = calcularReconciliacaoFatura({
      valorTotalInformadoCentavos: 10000, // R$ 100,00
      lancamentos: [{ valorCentavos: 9600, tipo: "saida", natureza: "competencia" }],
      statusAtual: "fechada",
    });

    expect(res.totalExplicadoCentavos).toBe(9600);
    expect(res.diferencaCentavos).toBe(400); // R$ 4,00 não explicados
    expect(res.percentualExplicado).toBe(96);
    expect(res.statusSugerido).toBe("fechada");
  });

  it("desconsidera pagamentos de fatura (liquidacao_passivo) no total explicado das compras da fatura", () => {
    const res = calcularReconciliacaoFatura({
      valorTotalInformadoCentavos: 5000,
      lancamentos: [
        { valorCentavos: 5000, tipo: "saida", natureza: "competencia" },
        // Pagamento da fatura em si
        { valorCentavos: 5000, tipo: "saida", natureza: "liquidacao_passivo" },
      ],
      statusAtual: "fechada",
    });

    expect(res.totalExplicadoCentavos).toBe(5000);
    expect(res.diferencaCentavos).toBe(0);
    expect(res.statusSugerido).toBe("reconciliada");
  });
});
