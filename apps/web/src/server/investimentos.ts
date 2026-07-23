import { and, asc, eq } from "drizzle-orm";
import {
  calcularRentabilidade,
  type InvestimentoInput,
} from "@nexora/core";
import { db } from "@/db";
import { contas, investimentos, transacoes } from "@/db/schema";
import { hojeISO } from "@/lib/hoje";

export type DbClient = typeof db;

export async function listarInvestimentosDoUsuario({
  usuarioId,
  client = db,
}: {
  usuarioId: string;
  client?: DbClient;
}) {
  const lista = await client
    .select({
      id: investimentos.id,
      contaId: investimentos.contaId,
      nomeConta: contas.nome,
      nomeAtivo: investimentos.nomeAtivo,
      tipoAtivo: investimentos.tipoAtivo,
      valorInvestidoCentavos: investimentos.valorInvestidoCentavos,
      valorAtualCentavos: investimentos.valorAtualCentavos,
      criadoEm: investimentos.criadoEm,
    })
    .from(investimentos)
    .innerJoin(contas, eq(investimentos.contaId, contas.id))
    .where(eq(investimentos.usuarioId, usuarioId))
    .orderBy(asc(investimentos.tipoAtivo), asc(investimentos.nomeAtivo));

  let totalInvestidoCentavos = 0;
  let totalAtualCentavos = 0;

  const ativos = lista.map((inv) => {
    totalInvestidoCentavos += inv.valorInvestidoCentavos;
    totalAtualCentavos += inv.valorAtualCentavos;

    const rentabilidade = calcularRentabilidade({
      valorInvestidoCentavos: inv.valorInvestidoCentavos,
      valorAtualCentavos: inv.valorAtualCentavos,
    });

    return {
      ...inv,
      rentabilidade,
    };
  });

  const rentabilidadeTotal = calcularRentabilidade({
    valorInvestidoCentavos: totalInvestidoCentavos,
    valorAtualCentavos: totalAtualCentavos,
  });

  return {
    ativos,
    resumo: {
      totalInvestidoCentavos,
      totalAtualCentavos,
      rentabilidadeTotal,
    },
  };
}

export async function criarInvestimentoDB({
  usuarioId,
  dados,
  client = db,
}: {
  usuarioId: string;
  dados: InvestimentoInput;
  client?: DbClient;
}) {
  const [novo] = await client
    .insert(investimentos)
    .values({
      usuarioId,
      contaId: dados.contaId,
      nomeAtivo: dados.nomeAtivo,
      tipoAtivo: dados.tipoAtivo,
      valorInvestidoCentavos: dados.valorInvestidoCentavos,
      valorAtualCentavos: dados.valorAtualCentavos || dados.valorInvestidoCentavos,
    })
    .returning({ id: investimentos.id });

  return novo;
}

export async function atualizarPosicaoInvestimentoDB({
  usuarioId,
  id,
  novoValorAtualCentavos,
  client = db,
}: {
  usuarioId: string;
  id: string;
  novoValorAtualCentavos: number;
  client?: DbClient;
}) {
  const [atualizado] = await client
    .update(investimentos)
    .set({ valorAtualCentavos: novoValorAtualCentavos })
    .where(and(eq(investimentos.id, id), eq(investimentos.usuarioId, usuarioId)))
    .returning({ id: investimentos.id });

  return atualizado;
}

export async function registrarAporteInvestimentoDB({
  usuarioId,
  investimentoId,
  contaOrigemId,
  valorAporteCentavos,
  data = hojeISO(),
  client = db,
}: {
  usuarioId: string;
  investimentoId: string;
  contaOrigemId: string;
  valorAporteCentavos: number;
  data?: string;
  client?: DbClient;
}) {
  const inv = await client.query.investimentos.findFirst({
    where: (t, { and, eq }) => and(eq(t.id, investimentoId), eq(t.usuarioId, usuarioId)),
  });

  if (!inv) throw new Error("Ativo de investimento não encontrado.");

  // 1. Criar transação de saída da conta de origem (natureza = 'aporte_investimento')
  await client.insert(transacoes).values({
    usuarioId,
    contaId: contaOrigemId,
    tipo: "saida",
    natureza: "aporte_investimento",
    estado: "efetivada",
    valorCentavos: valorAporteCentavos,
    descricao: `Aporte no ativo: ${inv.nomeAtivo}`,
    data,
  });

  // 2. Incrementar o valor investido e valor atual do ativo
  await client
    .update(investimentos)
    .set({
      valorInvestidoCentavos: inv.valorInvestidoCentavos + valorAporteCentavos,
      valorAtualCentavos: inv.valorAtualCentavos + valorAporteCentavos,
    })
    .where(eq(investimentos.id, investimentoId));
}
