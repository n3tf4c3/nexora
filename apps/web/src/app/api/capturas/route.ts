import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { asc } from "drizzle-orm";
import { capturaLoteSchema } from "@nexora/core";
import { db } from "@/db";
import { mensagensSms, usuarios } from "@/db/schema";
import { env } from "@/env";
import { primeiroErro } from "@/server/form";

// Comparação em tempo constante; hash iguala os tamanhos exigidos pelo timingSafeEqual.
function tokenConfere(recebido: string, esperado: string): boolean {
  const a = createHash("sha256").update(recebido).digest();
  const b = createHash("sha256").update(esperado).digest();
  return timingSafeEqual(a, b);
}

/**
 * Recebe capturas de SMS do app Android (token estático — sem sessão).
 * Idempotente: reenvio do mesmo lote não duplica (hash único por mensagem).
 */
export async function POST(req: Request) {
  if (!env.CAPTURA_SMS_TOKEN) {
    return Response.json({ erro: "Captura desativada." }, { status: 503 });
  }

  const cabecalho = req.headers.get("authorization") ?? "";
  const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice("Bearer ".length) : "";
  if (!token || !tokenConfere(token, env.CAPTURA_SMS_TOKEN)) {
    return Response.json({ erro: "Não autorizado." }, { status: 401 });
  }

  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return Response.json({ erro: "JSON inválido." }, { status: 400 });
  }
  const parse = capturaLoteSchema.safeParse(corpo);
  if (!parse.success) {
    return Response.json({ erro: primeiroErro(parse.error) }, { status: 400 });
  }

  // Single user: todas as capturas pertencem ao (único) usuário do sistema.
  const usuario = await db.query.usuarios.findFirst({ orderBy: asc(usuarios.criadoEm) });
  if (!usuario) {
    return Response.json({ erro: "Nenhum usuário cadastrado." }, { status: 503 });
  }

  const valores = parse.data.mensagens.map((m) => ({
    usuarioId: usuario.id,
    remetente: m.remetente,
    corpo: m.corpo,
    recebidaEm: new Date(m.recebidaEm),
    hashDedup: createHash("sha256")
      .update(`${m.remetente}\n${new Date(m.recebidaEm).toISOString()}\n${m.corpo}`)
      .digest("hex"),
  }));

  const inseridas = await db
    .insert(mensagensSms)
    .values(valores)
    .onConflictDoNothing({ target: [mensagensSms.usuarioId, mensagensSms.hashDedup] })
    .returning({ id: mensagensSms.id });

  if (inseridas.length > 0) revalidatePath("/fila");
  return Response.json({ recebidas: valores.length, novas: inseridas.length });
}
