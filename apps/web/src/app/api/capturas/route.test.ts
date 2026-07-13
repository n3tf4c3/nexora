import { describe, expect, it } from "vitest";
import { POST } from "./route";

// Testes dos caminhos de recusa (nenhum toca o banco): autorização,
// limite de corpo e validação — as classes que não podem regredir.
const TOKEN = "token-dummy-para-vitest-000000000000000000";

function requisicao(corpo: string, cabecalhos: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/capturas", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": String(Buffer.byteLength(corpo)),
      ...cabecalhos,
    },
    body: corpo,
  });
}

describe("POST /api/capturas", () => {
  it("recusa sem token e com token errado (401)", async () => {
    expect((await POST(requisicao("{}"))).status).toBe(401);
    expect(
      (await POST(requisicao("{}", { authorization: "Bearer errado" }))).status,
    ).toBe(401);
  });

  it("recusa corpo declarado grande demais antes de ler (413)", async () => {
    const resposta = await POST(
      requisicao("{}", { "content-length": String(1024 * 1024) }),
    );
    expect(resposta.status).toBe(413);
  });

  it("recusa JSON inválido e lote vazio com token válido (400)", async () => {
    const auth = { authorization: `Bearer ${TOKEN}` };
    expect((await POST(requisicao("nao-e-json", auth))).status).toBe(400);
    expect((await POST(requisicao('{"mensagens":[]}', auth))).status).toBe(400);
  });
});
