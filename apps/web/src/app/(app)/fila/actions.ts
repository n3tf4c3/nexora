"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { parsearValorBRL, transacaoInputSchema } from "@nexora/core";
import { db } from "@/db";
import { categorias, contas, mensagensSms, transacoes } from "@/db/schema";
import { primeiroErro, type EstadoForm } from "@/server/form";
import { usuarioLogadoId } from "@/server/posse";

function revalidarFila() {
  revalidatePath("/fila");
  revalidatePath("/transacoes");
  revalidatePath("/");
}

export async function confirmarSms(
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const usuarioId = await usuarioLogadoId();

  const mensagemId = String(formData.get("mensagemId") ?? "");
  if (!z.uuid().safeParse(mensagemId).success) return { erro: "Mensagem inválida." };

  const valorCentavos = parsearValorBRL(String(formData.get("valor") ?? ""));
  if (valorCentavos === null || valorCentavos === 0) {
    return { erro: "Valor inválido — use o formato 1.234,56." };
  }

  const parse = transacaoInputSchema.safeParse({
    tipo: formData.get("tipo"),
    valorCentavos,
    descricao: formData.get("descricao") || undefined,
    data: formData.get("data"),
    contaId: formData.get("contaId"),
    categoriaId: formData.get("categoriaId") || undefined,
  });
  if (!parse.success) return { erro: primeiroErro(parse.error) };

  // Posse: mensagem, conta e categoria precisam ser do usuário.
  const mensagem = await db.query.mensagensSms.findFirst({
    where: and(eq(mensagensSms.id, mensagemId), eq(mensagensSms.usuarioId, usuarioId)),
  });
  if (!mensagem) return { erro: "Mensagem inválida." };
  if (mensagem.status !== "pendente") return { erro: "Mensagem já revisada." };

  const conta = await db.query.contas.findFirst({
    where: and(eq(contas.id, parse.data.contaId), eq(contas.usuarioId, usuarioId)),
  });
  if (!conta) return { erro: "Conta inválida." };

  if (parse.data.categoriaId) {
    const categoria = await db.query.categorias.findFirst({
      where: and(
        eq(categorias.id, parse.data.categoriaId),
        eq(categorias.usuarioId, usuarioId),
      ),
    });
    if (!categoria) return { erro: "Categoria inválida." };
  }

  // Sem transação interativa (neon-http): insere e marca com UPDATE condicional;
  // se outra revisão chegou antes, desfaz a transação criada.
  const [transacao] = await db
    .insert(transacoes)
    .values({ usuarioId, ...parse.data })
    .returning({ id: transacoes.id });

  const marcadas = await db
    .update(mensagensSms)
    .set({ status: "confirmada", transacaoId: transacao.id })
    .where(
      and(
        eq(mensagensSms.id, mensagemId),
        eq(mensagensSms.usuarioId, usuarioId),
        eq(mensagensSms.status, "pendente"),
      ),
    )
    .returning({ id: mensagensSms.id });

  if (marcadas.length === 0) {
    await db.delete(transacoes).where(eq(transacoes.id, transacao.id));
    return { erro: "Mensagem já revisada." };
  }

  revalidarFila();
  return { ok: true };
}

export async function ignorarSms(id: string): Promise<void> {
  const usuarioId = await usuarioLogadoId();
  await db
    .update(mensagensSms)
    .set({ status: "ignorada" })
    .where(
      and(
        eq(mensagensSms.id, id),
        eq(mensagensSms.usuarioId, usuarioId),
        eq(mensagensSms.status, "pendente"),
      ),
    );
  revalidarFila();
}
