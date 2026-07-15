import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";

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

function requisicaoFragmentada(
  partes: Uint8Array[],
  cabecalhos: Record<string, string> = {},
): Request {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const parte of partes) controller.enqueue(parte);
      controller.close();
    },
  });
  const init: RequestInit & { duplex: "half" } = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...cabecalhos,
    },
    body: stream,
    duplex: "half",
  };
  return new Request("http://localhost/api/capturas", init);
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

  it("lê corpo fragmentado sem Content-Length", async () => {
    const encoder = new TextEncoder();
    const resposta = await POST(
      requisicaoFragmentada(
        [encoder.encode('{"mensagens":'), encoder.encode("[]}")],
        { authorization: `Bearer ${TOKEN}` },
      ),
    );

    expect(resposta.status).toBe(400);
    expect(await resposta.json()).not.toEqual({ erro: "JSON inválido." });
  });

  it("recusa o tamanho real acima do limite mesmo com header menor (413)", async () => {
    const resposta = await POST(
      requisicaoFragmentada(
        [new Uint8Array(200 * 1024), new Uint8Array(57 * 1024)],
        {
          authorization: `Bearer ${TOKEN}`,
          "content-length": "2",
        },
      ),
    );

    expect(resposta.status).toBe(413);
  });

  it("recusa JSON inválido e lote vazio com token válido (400)", async () => {
    const auth = { authorization: `Bearer ${TOKEN}` };
    expect((await POST(requisicao("nao-e-json", auth))).status).toBe(400);
    expect((await POST(requisicao('{"mensagens":[]}', auth))).status).toBe(400);
  });
});

describe("GET /api/capturas", () => {
  it("recusa o teste de conexão sem token válido", async () => {
    const semToken = new Request("http://localhost/api/capturas");
    const tokenErrado = new Request("http://localhost/api/capturas", {
      headers: { authorization: "Bearer errado" },
    });

    expect((await GET(semToken)).status).toBe(401);
    expect((await GET(tokenErrado)).status).toBe(401);
  });
});
