import { describe, expect, it } from "vitest";
import {
  capturaLoteSchema,
  capturaSmsSchema,
  categoriaInputSchema,
  contaInputSchema,
  transacaoInputSchema,
} from "./contratos";

describe("contaInputSchema", () => {
  it("aceita conta corrente sem dias de cartão", () => {
    expect(
      contaInputSchema.safeParse({ nome: "Nubank", tipo: "corrente", icone: "banco" }).success,
    ).toBe(true);
  });

  it("exige fechamento e vencimento para cartão de crédito", () => {
    expect(
      contaInputSchema.safeParse({ nome: "Cartão X", tipo: "cartao_credito", icone: "cartao" })
        .success,
    ).toBe(false);
    expect(
      contaInputSchema.safeParse({
        nome: "Cartão X",
        tipo: "cartao_credito",
        icone: "cartao",
        diaFechamento: 28,
        diaVencimento: 5,
      }).success,
    ).toBe(true);
  });

  it("rejeita dias de cartão em conta que não é cartão", () => {
    expect(
      contaInputSchema.safeParse({
        nome: "Corrente",
        tipo: "corrente",
        icone: "banco",
        diaFechamento: 10,
      }).success,
    ).toBe(false);
    expect(
      contaInputSchema.safeParse({
        nome: "Carteira",
        tipo: "carteira",
        icone: "dinheiro",
        diaFechamento: 5,
        diaVencimento: 10,
      }).success,
    ).toBe(false);
  });

  it("rejeita nome vazio e dia fora do mês", () => {
    expect(
      contaInputSchema.safeParse({ nome: "  ", tipo: "carteira", icone: "dinheiro" }).success,
    ).toBe(false);
    expect(
      contaInputSchema.safeParse({
        nome: "C",
        tipo: "cartao_credito",
        icone: "cartao",
        diaFechamento: 32,
        diaVencimento: 5,
      }).success,
    ).toBe(false);
  });

  it("rejeita modelo de ícone desconhecido", () => {
    expect(
      contaInputSchema.safeParse({ nome: "Conta", tipo: "corrente", icone: "logo-banco" })
        .success,
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

describe("capturaSmsSchema", () => {
  const base = {
    remetente: "Nubank",
    corpo: "Compra aprovada: R$ 42,90 em PADARIA XYZ.",
    recebidaEm: "2026-07-13T09:15:00-03:00",
  };

  it("aceita captura válida com offset ou Z", () => {
    expect(capturaSmsSchema.safeParse(base).success).toBe(true);
    expect(
      capturaSmsSchema.safeParse({ ...base, recebidaEm: "2026-07-13T12:15:00Z" }).success,
    ).toBe(true);
  });

  it("rejeita corpo vazio e instante sem hora", () => {
    expect(capturaSmsSchema.safeParse({ ...base, corpo: "  " }).success).toBe(false);
    expect(capturaSmsSchema.safeParse({ ...base, recebidaEm: "2026-07-13" }).success).toBe(false);
  });

  it("preserva o texto cru byte a byte (sem trim)", () => {
    const cru = "  Compra aprovada \n";
    expect(capturaSmsSchema.parse({ ...base, corpo: cru }).corpo).toBe(cru);
  });
});

describe("capturaLoteSchema", () => {
  it("exige ao menos uma mensagem", () => {
    expect(capturaLoteSchema.safeParse({ mensagens: [] }).success).toBe(false);
  });
});
