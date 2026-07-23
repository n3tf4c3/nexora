"use server";

import { revalidatePath } from "next/cache";
import { investimentoInputSchema, parsearValorBRL } from "@nexora/core";
import {
  atualizarPosicaoInvestimentoDB,
  criarInvestimentoDB,
  registrarAporteInvestimentoDB,
} from "@/server/investimentos";
import { uuidValido } from "@/server/form";
import { usuarioLogadoId } from "@/server/posse";

function revalidarTudo() {
  revalidatePath("/investimentos");
  revalidatePath("/projecao");
  revalidatePath("/transacoes");
  revalidatePath("/");
}

export async function criarInvestimentoAction(formData: FormData): Promise<void> {
  const usuarioId = await usuarioLogadoId();

  const valorInvestidoCentavos = parsearValorBRL(String(formData.get("valorInvestido") ?? "")) ?? 0;

  const parse = investimentoInputSchema.safeParse({
    contaId: formData.get("contaId"),
    nomeAtivo: formData.get("nomeAtivo"),
    tipoAtivo: formData.get("tipoAtivo") || "renda_fixa",
    valorInvestidoCentavos,
    valorAtualCentavos: valorInvestidoCentavos,
  });

  if (!parse.success) return;

  await criarInvestimentoDB({
    usuarioId,
    dados: parse.data,
  });

  revalidarTudo();
}

export async function atualizarPosicaoAction(formData: FormData): Promise<void> {
  const usuarioId = await usuarioLogadoId();

  const id = String(formData.get("id") ?? "");
  const novoValorAtualCentavos = parsearValorBRL(String(formData.get("novoValorAtual") ?? ""));

  if (!uuidValido(id) || novoValorAtualCentavos === null || novoValorAtualCentavos < 0) return;

  await atualizarPosicaoInvestimentoDB({
    usuarioId,
    id,
    novoValorAtualCentavos,
  });

  revalidarTudo();
}

export async function registrarAporteInvestimentoAction(formData: FormData): Promise<void> {
  const usuarioId = await usuarioLogadoId();

  const investimentoId = String(formData.get("investimentoId") ?? "");
  const contaOrigemId = String(formData.get("contaOrigemId") ?? "");
  const data = String(formData.get("data") || "");
  const valorAporteCentavos = parsearValorBRL(String(formData.get("valorAporte") ?? ""));

  if (!uuidValido(investimentoId) || !uuidValido(contaOrigemId) || valorAporteCentavos === null || valorAporteCentavos <= 0) {
    return;
  }

  await registrarAporteInvestimentoDB({
    usuarioId,
    investimentoId,
    contaOrigemId,
    valorAporteCentavos,
    data: data || undefined,
  });

  revalidarTudo();
}
