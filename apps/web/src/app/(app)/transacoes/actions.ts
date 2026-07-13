"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { parsearValorBRL, transacaoInputSchema } from "@nexora/core";
import { db } from "@/db";
import { categorias, contas, mensagensSms, transacoes } from "@/db/schema";
import { primeiroErro, uuidValido, type EstadoForm } from "@/server/form";
import { usuarioLogadoId } from "@/server/posse";

export async function criarTransacao(
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const usuarioId = await usuarioLogadoId();

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

  // Posse: a conta escolhida precisa ser do usuário.
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

  await db.insert(transacoes).values({ usuarioId, ...parse.data });
  revalidatePath("/transacoes");
  revalidatePath("/");
  return { ok: true };
}

export async function excluirTransacao(id: string): Promise<void> {
  const usuarioId = await usuarioLogadoId();
  if (!uuidValido(id)) return;
  // Batch atômico (transação implícita no neon-http): se a transação veio de
  // um SMS confirmado, a mensagem volta a pendente (reaparece na fila) antes
  // do delete — a FK e o CHECK de vínculo exigem essa ordem.
  await db.batch([
    db
      .update(mensagensSms)
      .set({ status: "pendente", transacaoId: null })
      .where(and(eq(mensagensSms.transacaoId, id), eq(mensagensSms.usuarioId, usuarioId))),
    db
      .delete(transacoes)
      .where(and(eq(transacoes.id, id), eq(transacoes.usuarioId, usuarioId))),
  ]);
  revalidatePath("/transacoes");
  revalidatePath("/fila");
  revalidatePath("/");
}
