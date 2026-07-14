import { describe, expect, it } from "vitest";
import { prepararInterpretacoesSms } from "./interpretacoes-sms";

describe("prepararInterpretacoesSms", () => {
  it("transforma apenas mensagens reconhecidas em registros versionados", () => {
    const resultado = prepararInterpretacoesSms([
      {
        id: "11111111-1111-4111-8111-111111111111",
        remetente: "1482",
        corpo: "Itau: Pix recebido no valor de R$ 98,74 de Maria, CPF XXX.123.456-XX.",
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        remetente: "1482",
        corpo: "Mensagem não suportada",
      },
    ]);

    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({
      mensagemId: "11111111-1111-4111-8111-111111111111",
      parserId: "itau_pix",
      parserVersao: 1,
      evento: "pix_recebido",
      confianca: 100,
      transacional: true,
    });
  });
});
