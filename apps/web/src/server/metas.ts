import { and, asc, eq } from "drizzle-orm";
import {
  calcularProgressoMeta,
  calcularRitmoAporteSugerido,
  type MetaInput,
} from "@nexora/core";
import { db } from "@/db";
import { aportesMetas, metas, transacoes } from "@/db/schema";
import { hojeISO } from "@/lib/hoje";

export type DbClient = typeof db;

export async function listarMetasDoUsuario({
  usuarioId,
  client = db,
}: {
  usuarioId: string;
  client?: DbClient;
}) {
  const lista = await client
    .select()
    .from(metas)
    .where(eq(metas.usuarioId, usuarioId))
    .orderBy(asc(metas.concluida), asc(metas.dataAlvo), asc(metas.nome));

  const hoje = hojeISO();

  return lista.map((m) => {
    const progresso = calcularProgressoMeta({
      valorAtualCentavos: m.valorAtualCentavos,
      valorAlvoCentavos: m.valorAlvoCentavos,
    });

    const aporteSugeridoMensalCentavos = calcularRitmoAporteSugerido({
      valorRestanteCentavos: progresso.restanteCentavos,
      dataAlvo: m.dataAlvo,
      dataAtual: hoje,
    });

    return {
      ...m,
      progresso,
      aporteSugeridoMensalCentavos,
    };
  });
}

export async function criarMetaDB({
  usuarioId,
  dados,
  client = db,
}: {
  usuarioId: string;
  dados: MetaInput;
  client?: DbClient;
}) {
  const [nova] = await client
    .insert(metas)
    .values({
      usuarioId,
      nome: dados.nome,
      descricao: dados.descricao ?? null,
      valorAlvoCentavos: dados.valorAlvoCentavos,
      valorAtualCentavos: 0,
      dataAlvo: dados.dataAlvo ?? null,
      icone: dados.icone ?? "alvo",
      concluida: false,
    })
    .returning({ id: metas.id });

  return nova;
}

export async function registrarAporteMetaDB({
  usuarioId,
  metaId,
  contaId,
  valorCentavos,
  data = hojeISO(),
  client = db,
}: {
  usuarioId: string;
  metaId: string;
  contaId: string;
  valorCentavos: number;
  data?: string;
  client?: DbClient;
}) {

  const meta = await client.query.metas.findFirst({
    where: (t, { and, eq }) => and(eq(t.id, metaId), eq(t.usuarioId, usuarioId)),
  });

  if (!meta) throw new Error("Meta não encontrada.");

  // 1. Criar transação de saída por aporte (natureza = 'aporte_investimento')
  const [tx] = await client
    .insert(transacoes)
    .values({
      usuarioId,
      contaId,
      tipo: "saida",
      natureza: "aporte_investimento",
      estado: "efetivada",
      valorCentavos,
      descricao: `Aporte na meta: ${meta.nome}`,
      data,
    })
    .returning({ id: transacoes.id });

  // 2. Registrar o aporte
  await client.insert(aportesMetas).values({
    metaId,
    usuarioId,
    contaId,
    valorCentavos,
    data,
    transacaoId: tx.id,
  });

  // 3. Atualizar valor acumulado na meta
  const novoValor = meta.valorAtualCentavos + valorCentavos;
  const concluida = novoValor >= meta.valorAlvoCentavos;

  await client
    .update(metas)
    .set({
      valorAtualCentavos: novoValor,
      concluida,
    })
    .where(eq(metas.id, metaId));
}

export async function excluirMetaDB({
  usuarioId,
  id,
  client = db,
}: {
  usuarioId: string;
  id: string;
  client?: DbClient;
}) {
  await client
    .delete(metas)
    .where(and(eq(metas.id, id), eq(metas.usuarioId, usuarioId)));
}
