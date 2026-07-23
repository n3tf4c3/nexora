"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import {
  distribuirParcelas,
  parsearValorBRL,
  transacaoInputSchema,
  type NaturezaTransacao,
  type TransacaoInput,
} from "@nexora/core";
import { db } from "@/db";
import { categorias, contas, mensagensSms, parcelamentos, transacoes } from "@/db/schema";
import { obterOuCriarFaturaParaTransacao } from "@/server/faturas";
import { primeiroErro, uuidValido, type EstadoForm } from "@/server/form";
import { usuarioLogadoId } from "@/server/posse";

function revalidarTudo() {
  revalidatePath("/transacoes");
  revalidatePath("/faturas");
  revalidatePath("/");
}

// Validação comum de criar/atualizar: valor BRL, schema do core e posse
// da conta/categoria escolhidas.
async function validarTransacao(
  usuarioId: string,
  formData: FormData,
): Promise<{ erro: string } | { dados: TransacaoInput }> {
  const valorCentavos = parsearValorBRL(String(formData.get("valor") ?? ""));
  if (valorCentavos === null || valorCentavos === 0) {
    return { erro: "Valor inválido — use o formato 1.234,56." };
  }

  const natureza = (formData.get("natureza") as NaturezaTransacao) || "competencia";
  const contaDestinoId = formData.get("contaDestinoId") || undefined;

  const parse = transacaoInputSchema.safeParse({
    tipo: formData.get("tipo"),
    natureza,
    estado: formData.get("estado") || "efetivada",
    valorCentavos,
    descricao: formData.get("descricao") || undefined,
    data: formData.get("data"),
    contaId: formData.get("contaId"),
    categoriaId: formData.get("categoriaId") || undefined,
    contaDestinoId,
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

  if (parse.data.contaDestinoId) {
    const contaDestino = await db.query.contas.findFirst({
      where: and(eq(contas.id, parse.data.contaDestinoId), eq(contas.usuarioId, usuarioId)),
    });
    if (!contaDestino) return { erro: "Conta de destino inválida." };
  }

  return { dados: parse.data };
}

export async function criarTransacao(
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const usuarioId = await usuarioLogadoId();
  const numeroParcelasRaw = Number(formData.get("numeroParcelas") || "1");

  // Se for compra parcelada em N vezes
  if (numeroParcelasRaw >= 2) {
    const valorCentavos = parsearValorBRL(String(formData.get("valor") ?? ""));
    if (valorCentavos === null || valorCentavos === 0) {
      return { erro: "Valor inválido — use o formato 1.234,56." };
    }
    const contaId = String(formData.get("contaId") ?? "");
    const categoriaId = String(formData.get("categoriaId") || "");
    const descricao = String(formData.get("descricao") ?? "").trim();
    const dataPrimeiraParcela = String(formData.get("data") ?? "");

    if (!uuidValido(contaId)) return { erro: "Conta inválida." };
    if (!descricao) return { erro: "Informe a descrição do parcelamento." };
    if (!dataPrimeiraParcela) return { erro: "Informe a data da primeira parcela." };

    const conta = await db.query.contas.findFirst({
      where: and(eq(contas.id, contaId), eq(contas.usuarioId, usuarioId)),
    });
    if (!conta) return { erro: "Conta inválida." };

    const parcelas = distribuirParcelas({
      valorTotalCentavos: valorCentavos,
      numeroParcelas: numeroParcelasRaw,
      dataPrimeiraParcela,
      diaFechamento: conta.diaFechamento ?? undefined,
      diaVencimento: conta.diaVencimento ?? undefined,
    });

    // Inserir registro do parcelamento
    const [parcelamento] = await db
      .insert(parcelamentos)
      .values({
        usuarioId,
        contaId,
        categoriaId: uuidValido(categoriaId) ? categoriaId : null,
        descricao,
        valorTotalCentavos: valorCentavos,
        numeroParcelas: numeroParcelasRaw,
        dataPrimeiraParcela,
      })
      .returning({ id: parcelamentos.id });

    // Inserir cada parcela como uma transação
    for (const item of parcelas) {
      let faturaId: string | null = null;
      if (conta.tipo === "cartao_credito") {
        faturaId = await obterOuCriarFaturaParaTransacao({
          usuarioId,
          contaId,
          dataCompra: item.data,
        });
      }

      await db.insert(transacoes).values({
        usuarioId,
        contaId,
        categoriaId: uuidValido(categoriaId) ? categoriaId : null,
        tipo: "saida",
        natureza: "competencia",
        estado: "efetivada",
        valorCentavos: item.valorCentavos,
        descricao: `${descricao} (${item.numeroParcela}/${item.totalParcelas})`,
        data: item.data,
        faturaId,
        parcelamentoId: parcelamento.id,
        numeroParcela: item.numeroParcela,
        totalParcelas: item.totalParcelas,
      });
    }

    revalidarTudo();
    return { ok: true };
  }

  // Transação individual normal
  const resultado = await validarTransacao(usuarioId, formData);
  if ("erro" in resultado) return resultado;

  const dados = resultado.dados;
  let faturaId: string | null = null;

  // Vincular à fatura caso seja conta cartão de crédito
  faturaId = await obterOuCriarFaturaParaTransacao({
    usuarioId,
    contaId: dados.contaId,
    dataCompra: dados.data,
  });

  await db.insert(transacoes).values({
    usuarioId,
    ...dados,
    faturaId,
  });

  revalidarTudo();
  return { ok: true };
}

export async function atualizarTransacao(
  id: string,
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const usuarioId = await usuarioLogadoId();
  if (!uuidValido(id)) return { erro: "Transação inválida." };

  const resultado = await validarTransacao(usuarioId, formData);
  if ("erro" in resultado) return resultado;

  const dados = resultado.dados;
  const faturaId = await obterOuCriarFaturaParaTransacao({
    usuarioId,
    contaId: dados.contaId,
    dataCompra: dados.data,
  });

  // Campos opcionais limpos viram null explícito — undefined não sobrescreve no UPDATE.
  const atualizadas = await db
    .update(transacoes)
    .set({
      ...dados,
      descricao: dados.descricao ?? null,
      categoriaId: dados.categoriaId ?? null,
      contaDestinoId: dados.contaDestinoId ?? null,
      faturaId,
    })
    .where(and(eq(transacoes.id, id), eq(transacoes.usuarioId, usuarioId)))
    .returning({ id: transacoes.id });

  if (atualizadas.length === 0) return { erro: "Transação não encontrada." };

  revalidarTudo();
  redirect("/transacoes");
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
      .set({ status: "pendente", transacaoId: null, revisadaEm: null })
      .where(and(eq(mensagensSms.transacaoId, id), eq(mensagensSms.usuarioId, usuarioId))),
    db
      .delete(transacoes)
      .where(and(eq(transacoes.id, id), eq(transacoes.usuarioId, usuarioId))),
  ]);
  revalidarTudo();
  revalidatePath("/fila");
}
