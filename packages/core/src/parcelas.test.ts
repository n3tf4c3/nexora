import { describe, expect, it } from "vitest";
import { distribuirParcelas } from "./parcelas";

describe("distribuirParcelas", () => {
  it("distribui igualmente quando o valor é divisível pelo número de parcelas", () => {
    const parcelas = distribuirParcelas({
      valorTotalCentavos: 30000, // R$ 300,00 em 3x
      numeroParcelas: 3,
      dataPrimeiraParcela: "2026-05-10",
    });

    expect(parcelas).toHaveLength(3);
    expect(parcelas[0]).toEqual({
      numeroParcela: 1,
      totalParcelas: 3,
      valorCentavos: 10000,
      data: "2026-05-10",
      cicloFatura: undefined,
    });
    expect(parcelas[1]).toEqual({
      numeroParcela: 2,
      totalParcelas: 3,
      valorCentavos: 10000,
      data: "2026-06-10",
      cicloFatura: undefined,
    });
    expect(parcelas[2]).toEqual({
      numeroParcela: 3,
      totalParcelas: 3,
      valorCentavos: 10000,
      data: "2026-07-10",
      cicloFatura: undefined,
    });

    const soma = parcelas.reduce((acc, p) => acc + p.valorCentavos, 0);
    expect(soma).toBe(30000);
  });

  it("atribui resto de centavos na primeira parcela de forma exata", () => {
    const parcelas = distribuirParcelas({
      valorTotalCentavos: 10000, // R$ 100,00 em 3x
      numeroParcelas: 3,
      dataPrimeiraParcela: "2026-05-10",
    });

    expect(parcelas[0]?.valorCentavos).toBe(3334);
    expect(parcelas[1]?.valorCentavos).toBe(3333);
    expect(parcelas[2]?.valorCentavos).toBe(3333);

    const soma = parcelas.reduce((acc, p) => acc + p.valorCentavos, 0);
    expect(soma).toBe(10000);
  });

  it("calcula ciclos de fatura para cada parcela quando informado dia de fechamento e vencimento", () => {
    const parcelas = distribuirParcelas({
      valorTotalCentavos: 12000,
      numeroParcelas: 2,
      dataPrimeiraParcela: "2026-05-04",
      diaFechamento: 5,
      diaVencimento: 15,
    });

    expect(parcelas[0]?.cicloFatura).toEqual({
      dataFechamento: "2026-05-05",
      dataVencimento: "2026-05-15",
      mesReferencia: "2026-05",
    });

    expect(parcelas[1]?.cicloFatura).toEqual({
      dataFechamento: "2026-06-05",
      dataVencimento: "2026-06-15",
      mesReferencia: "2026-06",
    });
  });

  it("lança erro em argumentos inválidos", () => {
    expect(() =>
      distribuirParcelas({
        valorTotalCentavos: 100,
        numeroParcelas: 1,
        dataPrimeiraParcela: "2026-05-10",
      }),
    ).toThrow("Número de parcelas inválido");

    expect(() =>
      distribuirParcelas({
        valorTotalCentavos: 0,
        numeroParcelas: 2,
        dataPrimeiraParcela: "2026-05-10",
      }),
    ).toThrow("Valor total em centavos inválido");
  });
});
