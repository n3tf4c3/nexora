"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { contaInputSchema } from "@nexora/core";
import { db } from "@/db";
import { contas } from "@/db/schema";
import { codigoSql, primeiroErro, uuidValido, type EstadoForm } from "@/server/form";
import { usuarioLogadoId } from "@/server/posse";

export async function criarConta(
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const usuarioId = await usuarioLogadoId();
  const parse = contaInputSchema.safeParse({
    nome: formData.get("nome"),
    tipo: formData.get("tipo"),
    diaFechamento: formData.get("diaFechamento") || undefined,
    diaVencimento: formData.get("diaVencimento") || undefined,
  });
  if (!parse.success) return { erro: primeiroErro(parse.error) };

  const { nome, tipo, diaFechamento, diaVencimento } = parse.data;
  try {
    await db.insert(contas).values({
      usuarioId,
      nome,
      tipo,
      diaFechamento: tipo === "cartao_credito" ? diaFechamento : null,
      diaVencimento: tipo === "cartao_credito" ? diaVencimento : null,
    });
  } catch (erro) {
    if (codigoSql(erro) === "23505") return { erro: "Já existe uma conta com esse nome." };
    throw erro;
  }
  revalidatePath("/contas");
  return { ok: true };
}

export async function excluirConta(id: string): Promise<void> {
  const usuarioId = await usuarioLogadoId();
  if (!uuidValido(id)) return;
  try {
    await db.delete(contas).where(and(eq(contas.id, id), eq(contas.usuarioId, usuarioId)));
  } catch (erro) {
    if (codigoSql(erro) === "23503") {
      redirect("/contas?erro=" + encodeURIComponent("Conta com transações não pode ser excluída."));
    }
    throw erro;
  }
  revalidatePath("/contas");
}
