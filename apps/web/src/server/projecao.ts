import { and, eq, ne, sql } from "drizzle-orm";
import { calcularProjecaoFluxoCaixa, type FaturaParaProjecao, type RegraRecorrencia } from "@nexora/core";
import { db } from "@/db";
import { contas, faturas, recorrencias, transacoes } from "@/db/schema";
import { mesAtual } from "@/lib/hoje";
import { listarFaturasDoUsuario } from "./faturas";

export async function obterProjecaoFluxoCaixaDoUsuario({
  usuarioId,
  mesInicial = mesAtual(),
  mesesProjecao = 12,
}: {
  usuarioId: string;
  mesInicial?: string;
  mesesProjecao?: number;
}) {
  // 1. Calcular o saldo inicial acumulado de todas as contas líquidas (não cartão)
  const [saldoContas] = await db
    .select({
      totalCentavos: sql<string>`coalesce(sum(
        case
          when ${transacoes.tipo} = 'entrada' then ${transacoes.valorCentavos}
          when ${transacoes.tipo} = 'saida' then -${transacoes.valorCentavos}
          else 0
        end
      ), 0)`,
    })
    .from(transacoes)
    .innerJoin(contas, eq(transacoes.contaId, contas.id))
    .where(
      and(
        eq(transacoes.usuarioId, usuarioId),
        eq(transacoes.estado, "efetivada"),
        ne(contas.tipo, "cartao_credito"),
      ),
    );

  const saldoInicialConsolidadoCentavos = Number(saldoContas?.totalCentavos ?? 0);

  // 2. Buscar todas as transações efetivadas do usuário
  const listaTransacoes = await db
    .select({
      id: transacoes.id,
      data: transacoes.data,
      tipo: transacoes.tipo,
      natureza: transacoes.natureza,
      estado: transacoes.estado,
      valorCentavos: transacoes.valorCentavos,
      recorrenciaId: transacoes.recorrenciaId,
      faturaId: transacoes.faturaId,
    })
    .from(transacoes)
    .where(and(eq(transacoes.usuarioId, usuarioId), eq(transacoes.estado, "efetivada")));

  // 3. Buscar faturas de cartão com reconciliação e mapear para o formato do core
  const listaFaturas = await listarFaturasDoUsuario({ usuarioId });
  const faturasMapeadas: FaturaParaProjecao[] = listaFaturas.map((f) => ({
    id: f.id,
    mesReferencia: f.mesReferencia,
    dataVencimento: f.dataVencimento,
    status: f.status,
    valorTotalInformadoCentavos: f.valorTotalInformadoCentavos,
    totalExplicadoCentavos: f.reconciliacao.totalExplicadoCentavos,
  }));

  // 4. Buscar regras de recorrencia do usuario
  const regrasDb = await db.query.recorrencias.findMany({
    where: (t, { and, eq }) => and(eq(t.usuarioId, usuarioId), eq(t.ativa, true)),
  });

  const regrasRecorrencia: RegraRecorrencia[] = regrasDb.map((r) => ({
    id: r.id,
    usuarioId: r.usuarioId,
    contaId: r.contaId,
    categoriaId: r.categoriaId,
    tipo: r.tipo,
    natureza: r.natureza,
    descricao: r.descricao,
    valorCentavos: r.valorCentavos,
    frequencia: r.frequencia,
    diaVencimento: r.diaVencimento,
    dataInicio: r.dataInicio,
    dataFim: r.dataFim,
    ativa: r.ativa,
  }));

  // 5. Calcular matriz de projeção via core
  return calcularProjecaoFluxoCaixa({
    saldoInicialConsolidadoCentavos,
    transacoes: listaTransacoes,
    faturas: faturasMapeadas,
    recorrencias: regrasRecorrencia,
    mesInicial,
    mesesProjecao,
  });
}
