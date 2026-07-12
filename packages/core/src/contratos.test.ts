import { describe, expect, it } from "vitest";
import {
  categoriaInputSchema,
  contaInputSchema,
  transacaoInputSchema,
} from "./contratos";

describe("contaInputSchema", () => {
  it("aceita conta corrente sem dias de cartão", () => {
    expect(contaInputSchema.safeParse({ nome: "Nubank", tipo: "corrente" }).success).toBe(true);
  });

  it("exige fechamento e vencimento para cartão de crédito", () => {
    expect(
      contaInputSchema.safeParse({ nome: "Cartão X", tipo: "cartao_credito" }).success,
    ).toBe(false);
    expect(
      contaInputSchema.safeParse({
        nome: "Cartão X",
        tipo: "cartao_credito",
        diaFechamento: 28,
        diaVencimento: 5,
      }).success,
    ).toBe(true);
  });

  it("rejeita nome vazio e dia fora do mês", () => {
    expect(contaInputSchema.safeParse({ nome: "  ", tipo: "carteira" }).success).toBe(false);
    expect(
      contaInputSchema.safeParse({
        nome: "C",
        tipo: "cartao_credito",
        diaFechamento: 32,
        diaVencimento: 5,
      }).success,
    ).toBe(false);
  });
});

describe("categoriaInputSchema", () => {
  it("apara espaços e rejeita vazio", () => {
    expect(categoriaInputSchema.parse({ nome: " Mercado " }).nome).toBe("Mercado");
    expect(categoriaInputSchema.safeParse({ nome: "" }).success).toBe(false);
  });
});

describe("transacaoInputSchema", () => {
  const base = {
    tipo: "saida",
    valorCentavos: 1234,
    data: "2026-07-12",
    contaId: "6e1b4c1a-9d0e-4f5a-8b3c-2a1d0e9f8b7c",
  };

  it("aceita transação válida sem categoria", () => {
    expect(transacaoInputSchema.safeParse(base).success).toBe(true);
  });

  it("rejeita valor zero, negativo ou fracionado", () => {
    expect(transacaoInputSchema.safeParse({ ...base, valorCentavos: 0 }).success).toBe(false);
    expect(transacaoInputSchema.safeParse({ ...base, valorCentavos: -5 }).success).toBe(false);
    expect(transacaoInputSchema.safeParse({ ...base, valorCentavos: 10.5 }).success).toBe(false);
  });

  it("rejeita data fora do formato ISO", () => {
    expect(transacaoInputSchema.safeParse({ ...base, data: "12/07/2026" }).success).toBe(false);
  });
});
