import { describe, expect, it } from "vitest";
import {
  ehMesValido,
  limitesDoMes,
  mesAnterior,
  mesSeguinte,
  nomeDoMes,
} from "./datas";

describe("limitesDoMes", () => {
  it("calcula o último dia certo, inclusive fevereiro bissexto", () => {
    expect(limitesDoMes("2026-07")).toEqual({ inicio: "2026-07-01", fim: "2026-07-31" });
    expect(limitesDoMes("2026-02").fim).toBe("2026-02-28");
    expect(limitesDoMes("2028-02").fim).toBe("2028-02-29");
    expect(limitesDoMes("2026-04").fim).toBe("2026-04-30");
  });

  it("rejeita formato inválido", () => {
    expect(() => limitesDoMes("2026-13")).toThrow();
    expect(() => limitesDoMes("07/2026")).toThrow();
    expect(ehMesValido("2026-00")).toBe(false);
  });
});

describe("navegação entre meses", () => {
  it("atravessa a virada do ano", () => {
    expect(mesAnterior("2026-01")).toBe("2025-12");
    expect(mesSeguinte("2025-12")).toBe("2026-01");
    expect(mesSeguinte("2026-07")).toBe("2026-08");
  });
});

describe("nomeDoMes", () => {
  it("formata em pt-BR", () => {
    expect(nomeDoMes("2026-07")).toBe("julho de 2026");
  });
});
