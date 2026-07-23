"use server";

import { revalidatePath } from "next/cache";
import { parsearValorBRL, recorrenciaInputSchema } from "@nexora/core";
import { db } from "@/db";
import { transacoes } from "@/db/schema";
import { uuidValido } from "@/server/form";
import { usuarioLogadoId } from "@/server/posse";
import {
  alternarStatusRecorrenciaDB,
  criarRecorrenciaDB,
  excluirRecorrenciaDB,
} from "@/server/recorrencias";

function revalidarTudo() {
  revalidatePath("/recorrencias");
  revalidatePath("/projecao");
  revalidatePath("/transacoes");
  revalidatePath("/");
}

export async function criarRecorrenciaAction(formData: FormData): Promise<void> {
  const usuarioId = await usuarioLogadoId();

  const valorCentavos = parsearValorBRL(String(formData.get("valor") ?? ""));
  if (valorCentavos === null || valorCentavos === 0) return;

  const parse = recorrenciaInputSchema.safeParse({
    contaId: formData.get("contaId"),
    categoriaId: formData.get("categoriaId") || undefined,
    tipo: formData.get("tipo"),
    natureza: formData.get("natureza") || "competencia",
    descricao: formData.get("descricao"),
    valorCentavos,
    frequencia: formData.get("frequencia") || "mensal",
    diaVencimento: Number(formData.get("diaVencimento") || "1"),
    dataInicio: formData.get("dataInicio"),
    dataFim: formData.get("dataFim") || undefined,
    ativa: true,
  });

  if (!parse.success) return;

  await criarRecorrenciaDB({
    usuarioId,
    dados: parse.data,
  });

  revalidarTudo();
}

export async function alternarStatusRecorrenciaAction(
  id: string,
  ativa: boolean,
): Promise<void> {
  const usuarioId = await usuarioLogadoId();
  if (!uuidValido(id)) return;

  await alternarStatusRecorrenciaDB({
    usuarioId,
    id,
    ativa,
  });

  revalidarTudo();
}

export async function excluirRecorrenciaAction(id: string): Promise<void> {
  const usuarioId = await usuarioLogadoId();
  if (!uuidValido(id)) return;

  await excluirRecorrenciaDB({
    usuarioId,
    id,
  });

  revalidarTudo();
}

export async function efetivarOcorrenciaPrevistaAction(formData: FormData): Promise<void> {
  const usuarioId = await usuarioLogadoId();

  const recorrenciaId = String(formData.get("recorrenciaId") ?? "");
  const contaId = String(formData.get("contaId") ?? "");
  const categoriaId = String(formData.get("categoriaId") || "");
  const tipo = (formData.get("tipo") as "entrada" | "saida") || "saida";
  const natureza = (formData.get("natureza") as any) || "competencia";
  const descricao = String(formData.get("descricao") ?? "");
  const data = String(formData.get("data") ?? "");
  const valorCentavos = Number(formData.get("valorCentavos") ?? "0");

  if (!uuidValido(recorrenciaId) || !uuidValido(contaId) || !descricao || !data || valorCentavos <= 0) {
    return;
  }

  await db.insert(transacoes).values({
    usuarioId,
    contaId,
    categoriaId: uuidValido(categoriaId) ? categoriaId : null,
    tipo,
    natureza,
    estado: "efetivada",
    valorCentavos,
    descricao,
    data,
    recorrenciaId,
  });

  revalidarTudo();
}
