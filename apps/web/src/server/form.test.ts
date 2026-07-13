import { describe, expect, it } from "vitest";
import { z } from "zod";
import { codigoSql, primeiroErro } from "./form";

describe("primeiroErro", () => {
  it("devolve a mensagem da primeira issue", () => {
    const parse = z.object({ nome: z.string().min(1, "Nome obrigatório.") }).safeParse({
      nome: "",
    });
    expect(parse.success).toBe(false);
    if (!parse.success) expect(primeiroErro(parse.error)).toBe("Nome obrigatório.");
  });
});

describe("codigoSql", () => {
  it("extrai o SQLSTATE de erros do driver", () => {
    expect(codigoSql({ code: "23505" })).toBe("23505");
    expect(codigoSql(new Error("qualquer"))).toBeUndefined();
    expect(codigoSql(null)).toBeUndefined();
  });
});
