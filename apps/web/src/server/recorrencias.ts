import { and, asc, eq } from "drizzle-orm";
import type { RecorrenciaInput } from "@nexora/core";
import { db } from "@/db";
import { categorias, contas, recorrencias } from "@/db/schema";

export type DbClient = typeof db;

export async function listarRecorrenciasDoUsuario({
  usuarioId,
  client = db,
}: {
  usuarioId: string;
  client?: DbClient;
}) {
  return client
    .select({
      id: recorrencias.id,
      tipo: recorrencias.tipo,
      natureza: recorrencias.natureza,
      descricao: recorrencias.descricao,
      valorCentavos: recorrencias.valorCentavos,
      frequencia: recorrencias.frequencia,
      diaVencimento: recorrencias.diaVencimento,
      dataInicio: recorrencias.dataInicio,
      dataFim: recorrencias.dataFim,
      ativa: recorrencias.ativa,
      contaId: recorrencias.contaId,
      nomeConta: contas.nome,
      categoriaId: recorrencias.categoriaId,
      nomeCategoria: categorias.nome,
      criadoEm: recorrencias.criadoEm,
    })
    .from(recorrencias)
    .innerJoin(contas, eq(recorrencias.contaId, contas.id))
    .leftJoin(categorias, eq(recorrencias.categoriaId, categorias.id))
    .where(eq(recorrencias.usuarioId, usuarioId))
    .orderBy(asc(recorrencias.diaVencimento), asc(recorrencias.descricao));
}

export async function criarRecorrenciaDB({
  usuarioId,
  dados,
  client = db,
}: {
  usuarioId: string;
  dados: RecorrenciaInput;
  client?: DbClient;
}) {
  const [nova] = await client
    .insert(recorrencias)
    .values({
      usuarioId,
      ...dados,
      categoriaId: dados.categoriaId ?? null,
      dataFim: dados.dataFim ?? null,
    })
    .returning({ id: recorrencias.id });

  return nova;
}

export async function alternarStatusRecorrenciaDB({
  usuarioId,
  id,
  ativa,
  client = db,
}: {
  usuarioId: string;
  id: string;
  ativa: boolean;
  client?: DbClient;
}) {
  const [atualizada] = await client
    .update(recorrencias)
    .set({ ativa })
    .where(and(eq(recorrencias.id, id), eq(recorrencias.usuarioId, usuarioId)))
    .returning({ id: recorrencias.id });

  return atualizada;
}

export async function excluirRecorrenciaDB({
  usuarioId,
  id,
  client = db,
}: {
  usuarioId: string;
  id: string;
  client?: DbClient;
}) {
  await client
    .delete(recorrencias)
    .where(and(eq(recorrencias.id, id), eq(recorrencias.usuarioId, usuarioId)));
}
