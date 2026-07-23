import { and, asc, desc, eq } from "drizzle-orm";
import {
  calcularCicloFatura,
  calcularReconciliacaoFatura,
} from "@nexora/core";
import { db } from "@/db";
import { contas, faturas, transacoes } from "@/db/schema";

export type DbClient = typeof db;

export async function obterOuCriarFaturaParaTransacao({
  usuarioId,
  contaId,
  dataCompra,
  client = db,
}: {
  usuarioId: string;
  contaId: string;
  dataCompra: string;
  client?: DbClient;
}): Promise<string | null> {
  const [conta] = await client
    .select({
      tipo: contas.tipo,
      diaFechamento: contas.diaFechamento,
      diaVencimento: contas.diaVencimento,
    })
    .from(contas)
    .where(and(eq(contas.id, contaId), eq(contas.usuarioId, usuarioId)))
    .limit(1);

  if (
    !conta ||
    conta.tipo !== "cartao_credito" ||
    conta.diaFechamento === null ||
    conta.diaVencimento === null
  ) {
    return null;
  }

  const ciclo = calcularCicloFatura({
    dataCompra,
    diaFechamento: conta.diaFechamento,
    diaVencimento: conta.diaVencimento,
  });

  const [faturaExistente] = await client
    .select({ id: faturas.id })
    .from(faturas)
    .where(
      and(
        eq(faturas.usuarioId, usuarioId),
        eq(faturas.contaId, contaId),
        eq(faturas.mesReferencia, ciclo.mesReferencia),
      ),
    )
    .limit(1);

  if (faturaExistente) {
    return faturaExistente.id;
  }

  const [novaFatura] = await client
    .insert(faturas)
    .values({
      usuarioId,
      contaId,
      mesReferencia: ciclo.mesReferencia,
      dataFechamento: ciclo.dataFechamento,
      dataVencimento: ciclo.dataVencimento,
      status: "aberta",
    })
    .returning({ id: faturas.id });

  return novaFatura.id;
}

export async function listarFaturasDoUsuario({
  usuarioId,
  contaId,
  client = db,
}: {
  usuarioId: string;
  contaId?: string;
  client?: DbClient;
}) {
  const filtro = contaId
    ? and(eq(faturas.usuarioId, usuarioId), eq(faturas.contaId, contaId))
    : eq(faturas.usuarioId, usuarioId);

  const listaFaturas = await client
    .select({
      id: faturas.id,
      contaId: faturas.contaId,
      nomeConta: contas.nome,
      mesReferencia: faturas.mesReferencia,
      dataFechamento: faturas.dataFechamento,
      dataVencimento: faturas.dataVencimento,
      status: faturas.status,
      valorTotalInformadoCentavos: faturas.valorTotalInformadoCentavos,
      valorMinimoInformadoCentavos: faturas.valorMinimoInformadoCentavos,
      criadoEm: faturas.criadoEm,
    })
    .from(faturas)
    .innerJoin(contas, eq(faturas.contaId, contas.id))
    .where(filtro)
    .orderBy(desc(faturas.mesReferencia), asc(contas.nome));

  const faturasComReconciliacao = await Promise.all(
    listaFaturas.map(async (f) => {
      const lancamentos = await client
        .select({
          valorCentavos: transacoes.valorCentavos,
          tipo: transacoes.tipo,
          natureza: transacoes.natureza,
        })
        .from(transacoes)
        .where(
          and(
            eq(transacoes.usuarioId, usuarioId),
            eq(transacoes.faturaId, f.id),
            eq(transacoes.estado, "efetivada"),
          ),
        );

      const reconciliacao = calcularReconciliacaoFatura({
        valorTotalInformadoCentavos: f.valorTotalInformadoCentavos,
        lancamentos,
        statusAtual: f.status,
      });

      return {
        ...f,
        reconciliacao,
      };
    }),
  );

  return faturasComReconciliacao;
}
