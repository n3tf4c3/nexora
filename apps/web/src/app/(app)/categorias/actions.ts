"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { categoriaInputSchema } from "@nexora/core";
import { db } from "@/db";
import { categorias } from "@/db/schema";
import { codigoSql, primeiroErro, uuidValido, type EstadoForm } from "@/server/form";
import { usuarioLogadoId } from "@/server/posse";

export async function criarCategoria(
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const usuarioId = await usuarioLogadoId();
  const parse = categoriaInputSchema.safeParse({ nome: formData.get("nome") });
  if (!parse.success) return { erro: primeiroErro(parse.error) };

  try {
    await db.insert(categorias).values({ usuarioId, nome: parse.data.nome });
  } catch (erro) {
    if (codigoSql(erro) === "23505") return { erro: "Já existe uma categoria com esse nome." };
    throw erro;
  }
  revalidatePath("/contas");
  return { ok: true };
}

export async function excluirCategoria(id: string): Promise<void> {
  const usuarioId = await usuarioLogadoId();
  if (!uuidValido(id)) return;
  try {
    await db
      .delete(categorias)
      .where(and(eq(categorias.id, id), eq(categorias.usuarioId, usuarioId)));
  } catch (erro) {
    if (codigoSql(erro) === "23503") {
      redirect(
        "/contas?erro=" + encodeURIComponent("Categoria em uso por transações não pode ser excluída."),
      );
    }
    throw erro;
  }
  revalidatePath("/contas");
}
