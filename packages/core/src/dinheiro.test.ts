import { describe, expect, it } from "vitest";
import { formatarCentavos, parsearValorBRL } from "./dinheiro";

describe("parsearValorBRL", () => {
  it("converte formatos brasileiros para centavos", () => {
    expect(parsearValorBRL("1.234,56")).toBe(123456);
    expect(parsearValorBRL("R$ 12,00")).toBe(1200);
    expect(parsearValorBRL("12")).toBe(1200);
    expect(parsearValorBRL("0,5")).toBe(50);
  });

  it("retorna null para texto não reconhecível", () => {
    expect(parsearValorBRL("abc")).toBeNull();
    expect(parsearValorBRL("12.34")).toBeNull();
    expect(parsearValorBRL("")).toBeNull();
  });
});

describe("formatarCentavos", () => {
  it("formata centavos como BRL", () => {
    expect(formatarCentavos(123456)).toMatch(/R\$\s?1\.234,56/);
  });
});
