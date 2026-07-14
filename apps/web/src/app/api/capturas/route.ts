import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { capturaLoteSchema } from "@nexora/core";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { mensagensSms, usuarios } from "@/db/schema";
import { env } from "@/env";
import { primeiroErro } from "@/server/form";
import { persistirInterpretacoesSms } from "@/server/interpretacoes-sms";
import { capturaPermitida, ipDaRequisicao } from "@/server/rate-limit";

// Teto folgado para um lote de 50 SMS de 2000 chars (JSON com escapes).
const CORPO_MAX_BYTES = 256 * 1024;

// Comparação em tempo constante; hash iguala os tamanhos exigidos pelo timingSafeEqual.
function tokenConfere(recebido: string, esperado: string): boolean {
  const a = createHash("sha256").update(recebido).digest();
  const b = createHash("sha256").update(esperado).digest();
  return timingSafeEqual(a, b);
}

async function validarAcesso(req: Request): Promise<Response | null> {
  if (!env.CAPTURA_SMS_TOKEN) {
    return Response.json({ erro: "Captura desativada." }, { status: 503 });
  }

  if (!(await capturaPermitida(ipDaRequisicao(req.headers)))) {
    return Response.json({ erro: "Muitas requisições; aguarde." }, { status: 429 });
  }

  const cabecalho = req.headers.get("authorization") ?? "";
  const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice("Bearer ".length) : "";
  if (!token || !tokenConfere(token, env.CAPTURA_SMS_TOKEN)) {
    return Response.json({ erro: "Não autorizado." }, { status: 401 });
  }

  return null;
}

async function usuarioUnico() {
  const listaUsuarios = await db.select({ id: usuarios.id }).from(usuarios).limit(2);
  return listaUsuarios.length === 1 ? listaUsuarios[0] : null;
}

/** Diagnóstico autenticado usado pelo app Android para testar a configuração. */
export async function GET(req: Request) {
  const erroAcesso = await validarAcesso(req);
  if (erroAcesso) return erroAcesso;

  if (!(await usuarioUnico())) {
    return Response.json(
      { erro: "Captura exige exatamente um usuário cadastrado." },
      { status: 503 },
    );
  }

  return Response.json({ ok: true });
}

/**
 * Recebe capturas de SMS do app Android (token estático — sem sessão).
 * Idempotente: reenvio do mesmo lote não duplica (hash único por mensagem).
 */
export async function POST(req: Request) {
  const tamanho = Number(req.headers.get("content-length") ?? 0);
  if (!Number.isFinite(tamanho) || tamanho <= 0 || tamanho > CORPO_MAX_BYTES) {
    return Response.json({ erro: "Corpo ausente ou grande demais." }, { status: 413 });
  }

  const erroAcesso = await validarAcesso(req);
  if (erroAcesso) return erroAcesso;

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

  // Invariante single-user: com 0 ou 2+ usuários a captura recusa em vez de
  // associar dados silenciosamente ao usuário mais antigo (achado 7).
  const usuario = await usuarioUnico();
  if (!usuario) {
    return Response.json(
      { erro: "Captura exige exatamente um usuário cadastrado." },
      { status: 503 },
    );
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

  // Consulta também mensagens deduplicadas: se uma falha ocorrer depois de
  // persistir o bruto, o retry consegue completar a interpretação ausente.
  const mensagensAlvo = await db
    .select({
      id: mensagensSms.id,
      remetente: mensagensSms.remetente,
      corpo: mensagensSms.corpo,
    })
    .from(mensagensSms)
    .where(
      and(
        eq(mensagensSms.usuarioId, usuario.id),
        inArray(
          mensagensSms.hashDedup,
          valores.map((valor) => valor.hashDedup),
        ),
      ),
    );
  const interpretadas = await persistirInterpretacoesSms(db, mensagensAlvo);

  if (inseridas.length > 0 || interpretadas > 0) revalidatePath("/fila");
  return Response.json({
    recebidas: valores.length,
    novas: inseridas.length,
    interpretadas,
  });
}
