"use server";

import { revalidatePath } from "next/cache";
import { metaInputSchema, parsearValorBRL } from "@nexora/core";
import { uuidValido } from "@/server/form";
import {
  criarMetaDB,
  excluirMetaDB,
  registrarAporteMetaDB,
} from "@/server/metas";
import { usuarioLogadoId } from "@/server/posse";

function revalidarTudo() {
  revalidatePath("/metas");
  revalidatePath("/projecao");
  revalidatePath("/transacoes");
  revalidatePath("/");
}

export async function criarMetaAction(formData: FormData): Promise<void> {
  const usuarioId = await usuarioLogadoId();

  const valorAlvoCentavos = parsearValorBRL(String(formData.get("valorAlvo") ?? ""));
  if (valorAlvoCentavos === null || valorAlvoCentavos === 0) return;

  const parse = metaInputSchema.safeParse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao") || undefined,
    valorAlvoCentavos,
    dataAlvo: formData.get("dataAlvo") || undefined,
    icone: formData.get("icone") || "alvo",
  });

  if (!parse.success) return;

  await criarMetaDB({
    usuarioId,
    dados: parse.data,
  });

  revalidarTudo();
}

export async function registrarAporteMetaAction(formData: FormData): Promise<void> {
  const usuarioId = await usuarioLogadoId();

  const metaId = String(formData.get("metaId") ?? "");
  const contaId = String(formData.get("contaId") ?? "");
  const data = String(formData.get("data") || "");
  const valorCentavos = parsearValorBRL(String(formData.get("valorAporte") ?? ""));

  if (!uuidValido(metaId) || !uuidValido(contaId) || valorCentavos === null || valorCentavos <= 0) {
    return;
  }

  await registrarAporteMetaDB({
    usuarioId,
    metaId,
    contaId,
    valorCentavos,
    data: data || undefined,
  });

  revalidarTudo();
}

export async function excluirMetaAction(id: string): Promise<void> {
  const usuarioId = await usuarioLogadoId();
  if (!uuidValido(id)) return;

  await excluirMetaDB({
    usuarioId,
    id,
  });

  revalidarTudo();
}
