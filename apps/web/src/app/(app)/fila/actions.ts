"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { parsearValorBRL, transacaoInputSchema } from "@nexora/core";
import { db } from "@/db";
import { categorias, contas, mensagensSms } from "@/db/schema";
import { obterOuCriarFaturaParaTransacao } from "@/server/faturas";
import { primeiroErro, uuidValido, type EstadoForm } from "@/server/form";
import { usuarioLogadoId } from "@/server/posse";

function revalidarFila() {
  revalidatePath("/fila");
  revalidatePath("/transacoes");
  revalidatePath("/faturas");
  revalidatePath("/");
}

export async function confirmarSms(
  _estado: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const usuarioId = await usuarioLogadoId();

  const mensagemId = String(formData.get("mensagemId") ?? "");
  if (!uuidValido(mensagemId)) return { erro: "Mensagem inválida." };

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

  // Posse: conta e categoria precisam ser do usuário (mensagem é checada
  // no statement atômico abaixo).
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

  const { data } = parse;
  const faturaId = await obterOuCriarFaturaParaTransacao({
    usuarioId,
    contaId: data.contaId,
    dataCompra: data.data,
  });

  // Sem transação interativa (neon-http): um único statement CTE cria a
  // transação e marca a mensagem atomicamente. O FOR UPDATE serializa
  // revisões concorrentes; quem perde a corrida não afeta nenhuma linha.
  const resultado = await db.execute(sql`
    with pendente as (
      select id from mensagens_sms
      where id = ${mensagemId} and usuario_id = ${usuarioId} and status = 'pendente'
      for update
    ),
    nova as (
      insert into transacoes (id, usuario_id, conta_id, categoria_id, tipo, natureza, estado, valor_centavos, descricao, data, fatura_id)
      select ${randomUUID()}, ${usuarioId}, ${data.contaId}, ${data.categoriaId ?? null},
             ${data.tipo}, 'competencia', 'efetivada', ${data.valorCentavos}, ${data.descricao ?? null}, ${data.data}, ${faturaId ?? null}
      from pendente
      returning id
    )
    update mensagens_sms m
    set status = 'confirmada', transacao_id = nova.id, revisada_em = now()
    from nova
    where m.id = ${mensagemId}
    returning m.id
  `);
  if (resultado.rows.length === 0) return { erro: "Mensagem já revisada." };

  revalidarFila();
  return { ok: true };
}

export async function ignorarSms(id: string): Promise<void> {
  const usuarioId = await usuarioLogadoId();
  if (!uuidValido(id)) return;
  await db
    .update(mensagensSms)
    .set({ status: "ignorada", revisadaEm: sql`now()` })
    .where(
      and(
        eq(mensagensSms.id, id),
        eq(mensagensSms.usuarioId, usuarioId),
        eq(mensagensSms.status, "pendente"),
      ),
    );
  revalidarFila();
}
