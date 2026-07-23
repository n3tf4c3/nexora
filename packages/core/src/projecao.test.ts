import { describe, expect, it } from "vitest";
import { calcularProjecaoFluxoCaixa } from "./projecao";
import type { RegraRecorrencia } from "./recorrencias";

describe("calcularProjecaoFluxoCaixa", () => {
  const regraSalario: RegraRecorrencia = {
    id: "rec-salario",
    usuarioId: "usr-1",
    contaId: "cta-1",
    tipo: "entrada",
    natureza: "competencia",
    descricao: "Salário",
    valorCentavos: 500000, // R$ 5.000,00
    frequencia: "mensal",
    diaVencimento: 5,
    dataInicio: "2026-01-01",
    ativa: true,
  };

  const regraAluguel: RegraRecorrencia = {
    id: "rec-aluguel",
    usuarioId: "usr-1",
    contaId: "cta-1",
    tipo: "saida",
    natureza: "competencia",
    descricao: "Aluguel",
    valorCentavos: 150000, // R$ 1.500,00
    frequencia: "mensal",
    diaVencimento: 10,
    dataInicio: "2026-01-01",
    ativa: true,
  };

  it("projeta 12 meses de fluxo de caixa corretamente", () => {
    const res = calcularProjecaoFluxoCaixa({
      saldoInicialConsolidadoCentavos: 200000, // R$ 2.000,00 saldo inicial
      transacoes: [],
      faturas: [],
      recorrencias: [regraSalario, regraAluguel],
      mesInicial: "2026-05",
      mesesProjecao: 12,
    });

    expect(res.meses).toHaveLength(12);
    expect(res.temAlertaNegativo).toBe(false);

    // Mês 1: Maio 2026
    const maio = res.meses[0];
    expect(maio?.mesReferencia).toBe("2026-05");
    expect(maio?.saldoInicialCentavos).toBe(200000);
    expect(maio?.entradasPrevistasCentavos).toBe(500000);
    expect(maio?.saidasPrevistasCentavos).toBe(150000);
    expect(maio?.saldoMesCentavos).toBe(350000); // + R$ 3.500,00
    expect(maio?.saldoAcumuladoCentavos).toBe(550000); // R$ 2.000 + R$ 3.500 = R$ 5.500

    // Mês 12: Abril 2027
    const abril27 = res.meses[11];
    expect(abril27?.mesReferencia).toBe("2027-04");
  });

  it("não duplica a projeção quando a recorrência já foi efetivada no mês", () => {
    const res = calcularProjecaoFluxoCaixa({
      saldoInicialConsolidadoCentavos: 0,
      transacoes: [
        {
          id: "tx-1",
          data: "2026-05-05",
          tipo: "entrada",
          natureza: "competencia",
          estado: "efetivada",
          valorCentavos: 500000,
          recorrenciaId: "rec-salario",
        },
      ],
      faturas: [],
      recorrencias: [regraSalario],
      mesInicial: "2026-05",
      mesesProjecao: 1,
    });

    const maio = res.meses[0];
    expect(maio?.entradasEfetivadasCentavos).toBe(500000);
    expect(maio?.entradasPrevistasCentavos).toBe(0); // Não duplicou!
    expect(maio?.saldoAcumuladoCentavos).toBe(500000);
  });

  it("alerta quando o saldo acumulado fica negativo", () => {
    const res = calcularProjecaoFluxoCaixa({
      saldoInicialConsolidadoCentavos: 1000, // R$ 10,00
      transacoes: [],
      faturas: [],
      recorrencias: [{ ...regraAluguel, valorCentavos: 200000 }], // Saída R$ 2.000,00
      mesInicial: "2026-05",
      mesesProjecao: 2,
    });

    expect(res.temAlertaNegativo).toBe(true);
    expect(res.meses[0]?.alertaSaldoNegativo).toBe(true);
  });
});
