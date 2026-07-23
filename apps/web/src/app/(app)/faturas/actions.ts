"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { parsearValorBRL } from "@nexora/core";
import { db } from "@/db";
import { contas, faturas, transacoes } from "@/db/schema";
import { listarFaturasDoUsuario } from "@/server/faturas";
import { uuidValido } from "@/server/form";
import { usuarioLogadoId } from "@/server/posse";

function revalidarFaturas() {
  revalidatePath("/faturas");
  revalidatePath("/transacoes");
  revalidatePath("/contas");
  revalidatePath("/");
}

export async function atualizarValorInformadoFatura(
  faturaId: string,
  formData: FormData,
): Promise<void> {
  const usuarioId = await usuarioLogadoId();
  if (!uuidValido(faturaId)) return;

  const valorTexto = String(formData.get("valorTotalInformado") ?? "");
  const valorCentavos = parsearValorBRL(valorTexto);

  if (valorCentavos === null) return;

  const [atualizada] = await db
    .update(faturas)
    .set({ valorTotalInformadoCentavos: valorCentavos })
    .where(and(eq(faturas.id, faturaId), eq(faturas.usuarioId, usuarioId)))
    .returning({ id: faturas.id });

  if (!atualizada) return;

  revalidarFaturas();
}

export async function liquidarFatura(
  faturaId: string,
  formData: FormData,
): Promise<void> {
  const usuarioId = await usuarioLogadoId();
  if (!uuidValido(faturaId)) return;

  const contaOrigemId = String(formData.get("contaOrigemId") ?? "");
  if (!uuidValido(contaOrigemId)) return;

  const dataPagamento = String(formData.get("dataPagamento") ?? "");
  if (!dataPagamento) return;

  // Buscar fatura com dados da conta do cartão
  const listagem = await listarFaturasDoUsuario({ usuarioId });
  const fatura = listagem.find((f) => f.id === faturaId);
  if (!fatura) return;

  // Validar se a conta de origem pertence ao usuário
  const contaOrigem = await db.query.contas.findFirst({
    where: and(eq(contas.id, contaOrigemId), eq(contas.usuarioId, usuarioId)),
  });
  if (!contaOrigem) return;

  const valorTotalPagamento =
    fatura.valorTotalInformadoCentavos && fatura.valorTotalInformadoCentavos > 0
      ? fatura.valorTotalInformadoCentavos
      : fatura.reconciliacao.totalExplicadoCentavos;

  if (valorTotalPagamento <= 0) return;

  // Criar transação de liquidação de passivo debitando da conta corrente
  await db.batch([
    db.insert(transacoes).values({
      usuarioId,
      contaId: contaOrigemId,
      tipo: "saida",
      natureza: "liquidacao_passivo",
      estado: "efetivada",
      valorCentavos: valorTotalPagamento,
      data: dataPagamento,
      faturaId: fatura.id,
      descricao: `Pagamento de Fatura ${fatura.nomeConta} (${fatura.mesReferencia})`,
    }),
    db
      .update(faturas)
      .set({ status: "paga" })
      .where(and(eq(faturas.id, fatura.id), eq(faturas.usuarioId, usuarioId))),
  ]);

  revalidarFaturas();
}
