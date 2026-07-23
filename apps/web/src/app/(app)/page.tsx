import Link from "next/link";
import { and, asc, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import {
  ehMesValido,
  formatarCentavos,
  limitesDoMes,
  mesAnterior,
  mesSeguinte,
  nomeDoMes,
} from "@nexora/core";
import { IconeCategoria } from "@/components/icone-categoria";
import {
  IconeEntradas,
  IconeFila,
  IconeSaidas,
  IconeSaldo,
  IconeSetaDireita,
  IconeSetaEsquerda,
} from "@/components/icones";
import { Topo } from "@/components/topo";
import { db } from "@/db";
import { categorias, contas, mensagensSms, transacoes } from "@/db/schema";
import { hojeISO, mesAtual } from "@/lib/hoje";
import { usuarioLogadoId } from "@/server/posse";
import { DashboardDonut } from "./dashboard-donut";
import {
  DashboardGrafico,
  type CategoriaDoGrafico,
  type TransacaoDoGrafico,
} from "./dashboard-grafico";

type Delta = { rotulo: string; cor: string; fundo: string } | null;

function delta(atual: number, anterior: number, inverter: boolean, comparacao: string): Delta {
  if (!anterior) return null;
  const pct = ((atual - anterior) / Math.abs(anterior)) * 100;
  const arredondado = Math.round(pct);
  const bom = inverter ? pct <= 0 : pct >= 0;
  return {
    rotulo: `${arredondado > 0 ? "+" : arredondado < 0 ? "−" : ""}${Math.abs(arredondado)}% ${comparacao}`,
    cor: bom ? "var(--color-income)" : "var(--color-expense)",
    fundo: bom ? "var(--color-income-bg)" : "var(--color-expense-bg)",
  };
}

function formatarData(data: string): string {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const usuarioId = await usuarioLogadoId();
  const { mes: mesParam } = await searchParams;
  const mesCorrente = mesAtual();
  const hoje = hojeISO();
  const mes = mesParam && ehMesValido(mesParam) ? mesParam : mesCorrente;
  const { inicio, fim } = limitesDoMes(mes);
  const fimDoPeriodo = mes === mesCorrente ? hoje : fim;
  const diasNoPeriodo = Number(fimDoPeriodo.slice(8, 10));

  const filtroMes = and(
    eq(transacoes.usuarioId, usuarioId),
    gte(transacoes.data, inicio),
    lte(transacoes.data, fimDoPeriodo),
  );
  const totaisDoMes = (dataInicial: string, dataFinal: string) =>
    db
      .select({
        entradas: sql<string>`coalesce(sum(${transacoes.valorCentavos}) filter (where ${transacoes.tipo} = 'entrada' and ${transacoes.natureza} = 'competencia' and ${transacoes.estado} = 'efetivada'), 0)`,
        saidas: sql<string>`coalesce(sum(${transacoes.valorCentavos}) filter (where ${transacoes.tipo} = 'saida' and ${transacoes.natureza} = 'competencia' and ${transacoes.estado} = 'efetivada'), 0)`,
      })
      .from(transacoes)
      .where(
        and(
          eq(transacoes.usuarioId, usuarioId),
          gte(transacoes.data, dataInicial),
          lte(transacoes.data, dataFinal),
        ),
      );

  const mesAnteriorSelecionado = mesAnterior(mes);
  const limitesAnterior = limitesDoMes(mesAnteriorSelecionado);
  const diaComparavel = Math.min(
    diasNoPeriodo,
    Number(limitesAnterior.fim.slice(8, 10)),
  );
  const fimComparacao =
    mes === mesCorrente
      ? `${mesAnteriorSelecionado}-${String(diaComparavel).padStart(2, "0")}`
      : limitesAnterior.fim;

  const [[totais], [totaisAnterior], doMes, [pendencias], listaCategorias] = await Promise.all([
    totaisDoMes(inicio, fimDoPeriodo),
    totaisDoMes(limitesAnterior.inicio, fimComparacao),
    db
      .select({
        id: transacoes.id,
        data: transacoes.data,
        tipo: transacoes.tipo,
        valorCentavos: transacoes.valorCentavos,
        descricao: transacoes.descricao,
        conta: contas.nome,
        categoriaId: transacoes.categoriaId,
        categoria: categorias.nome,
      })
      .from(transacoes)
      .innerJoin(contas, eq(transacoes.contaId, contas.id))
      .leftJoin(categorias, eq(transacoes.categoriaId, categorias.id))
      .where(filtroMes)
      .orderBy(desc(transacoes.data), desc(transacoes.criadoEm)),
    db
      .select({ total: count() })
      .from(mensagensSms)
      .where(
        and(eq(mensagensSms.usuarioId, usuarioId), eq(mensagensSms.status, "pendente")),
      ),
    db
      .select({ id: categorias.id, nome: categorias.nome })
      .from(categorias)
      .where(eq(categorias.usuarioId, usuarioId))
      .orderBy(asc(categorias.nome)),
  ]);

  const entradas = Number(totais?.entradas ?? 0);
  const saidas = Number(totais?.saidas ?? 0);
  const saldo = entradas - saidas;
  const entradasAnterior = Number(totaisAnterior?.entradas ?? 0);
  const saidasAnterior = Number(totaisAnterior?.saidas ?? 0);
  const comparacao = mes === mesCorrente ? "vs mesmo período anterior" : "vs mês anterior";

  const cartoes = [
    {
      rotulo: "Entradas",
      descricao: "Receitas no período",
      valor: formatarCentavos(entradas),
      icone: <IconeEntradas tamanho={20} traco={2.2} />,
      corIcone: "#10b981",
      fundoIcone: "rgba(16, 185, 129, 0.15)",
      glowClass: "glow-emerald",
      delta: delta(entradas, entradasAnterior, false, comparacao),
    },
    {
      rotulo: "Saídas",
      descricao: "Gastos no período",
      valor: formatarCentavos(saidas),
      icone: <IconeSaidas tamanho={20} traco={2.2} />,
      corIcone: "#ef4444",
      fundoIcone: "rgba(239, 68, 68, 0.15)",
      glowClass: "glow-red",
      delta: delta(saidas, saidasAnterior, true, comparacao),
    },
    {
      rotulo: "Saldo",
      descricao: "Entradas menos saídas",
      valor: formatarCentavos(saldo),
      icone: <IconeSaldo tamanho={20} traco={2.2} />,
      corIcone: "#818cf8",
      fundoIcone: "rgba(99, 102, 241, 0.15)",
      glowClass: "glow-indigo",
      delta: delta(saldo, entradasAnterior - saidasAnterior, false, comparacao),
    },
  ];

  const porCategoria = new Map<string, { nome: string; valorCentavos: number }>();
  for (const transacao of doMes) {
    if (transacao.tipo !== "saida") continue;
    const chave = transacao.categoriaId ?? "sem-categoria";
    const gasto = porCategoria.get(chave);
    porCategoria.set(chave, {
      nome: transacao.categoria ?? "Sem categoria",
      valorCentavos: (gasto?.valorCentavos ?? 0) + transacao.valorCentavos,
    });
  }
  const gastosPorCategoria = [...porCategoria.entries()]
    .map(([chave, gasto]) => ({ chave, ...gasto }))
    .sort((a, b) => b.valorCentavos - a.valorCentavos);
  const categoriasGrafico: CategoriaDoGrafico[] = listaCategorias.map((categoria) => ({
    chave: categoria.id,
    nome: categoria.nome,
  }));
  if (porCategoria.has("sem-categoria")) {
    categoriasGrafico.push({ chave: "sem-categoria", nome: "Sem categoria" });
  }
  const transacoesGrafico: TransacaoDoGrafico[] = doMes.map((transacao) => ({
    dia: Number(transacao.data.slice(8, 10)),
    tipo: transacao.tipo,
    valorCentavos: transacao.valorCentavos,
    categoriaChave: transacao.categoriaId ?? "sem-categoria",
  }));
  const recentes = doMes.slice(0, 8);
  const rotuloPeriodo =
    mes === mesCorrente
      ? `${nomeDoMes(mes)}, do dia 1 até hoje`
      : `${nomeDoMes(mes)}, mês completo`;

  return (
    <>
      <Topo titulo="Dashboard" subtitulo="Visão geral do mês selecionado.">
        <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 px-2 py-1 shadow-sm">
          <Link
            href={`/?mes=${mesAnterior(mes)}`}
            aria-label="Mês anterior"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <IconeSetaEsquerda tamanho={15} />
          </Link>
          <span className="min-w-[110px] text-center text-xs font-bold text-slate-200 capitalize">
            {nomeDoMes(mes)}
          </span>
          <Link
            href={`/?mes=${mesSeguinte(mes)}`}
            aria-label="Mês seguinte"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <IconeSetaDireita tamanho={15} />
          </Link>
        </div>
      </Topo>

      <div className="mx-auto w-full max-w-[1160px] p-4 sm:p-6">
        {pendencias.total > 0 && (
          <aside className="mb-6 flex flex-col gap-4 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between shadow-lg glow-indigo">
            <div className="flex min-w-0 items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
                <IconeFila tamanho={20} />
              </span>
              <div>
                <strong className="block text-sm font-bold text-white">
                  {pendencias.total} {pendencias.total === 1 ? "SMS aguarda" : "SMS aguardam"} sua
                  confirmação
                </strong>
                <span className="text-xs text-slate-400">
                  Revise a captura automática antes de virar uma transação.
                </span>
              </div>
            </div>
            <Link
              href="/fila"
              className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all hover:bg-indigo-500"
            >
              Revisar pendências
              <IconeSetaDireita tamanho={14} />
            </Link>
          </aside>
        )}

        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {cartoes.map((cartao) => (
            <article
              key={cartao.rotulo}
              className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 shadow-lg backdrop-blur-xl transition-all hover:border-slate-700 hover:shadow-xl"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    {cartao.rotulo}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-slate-500">
                    {cartao.descricao}
                  </span>
                </div>
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 ${cartao.glowClass}`}
                  style={{ background: cartao.fundoIcone, color: cartao.corIcone }}
                >
                  {cartao.icone}
                </span>
              </div>
              <strong className="my-3 block text-3xl font-bold tracking-tight text-white font-heading">
                {cartao.valor}
              </strong>
              {cartao.delta ? (
                <span
                  className="w-fit rounded-full px-2.5 py-0.5 text-[11px] font-bold border border-slate-800"
                  style={{ background: cartao.delta.fundo, color: cartao.delta.cor }}
                >
                  {cartao.delta.rotulo}
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">
                  Sem base comparável no período anterior
                </span>
              )}
            </article>
          ))}
        </div>

        <div className="mb-6 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
          <DashboardGrafico
            transacoes={transacoesGrafico}
            categorias={categoriasGrafico}
            diasNoPeriodo={diasNoPeriodo}
            rotuloPeriodo={rotuloPeriodo}
          />
          <DashboardDonut gastos={gastosPorCategoria} />
        </div>

        <section
          className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 shadow-lg backdrop-blur-xl"
          aria-labelledby="transacoes-recentes-titulo"
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Atividade
              </span>
              <h2 id="transacoes-recentes-titulo" className="mt-0.5 text-lg font-bold tracking-tight text-white font-heading">
                Transações recentes
              </h2>
              {doMes.length > 0 && (
                <p className="mt-0.5 mb-0 text-xs text-slate-400">
                  {doMes.length === 1
                    ? "1 transação no período"
                    : `${doMes.length} transações no período`}
                </p>
              )}
            </div>
            <Link href="/transacoes" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              Ver todas <span aria-hidden>→</span>
            </Link>
          </div>

          {recentes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-400 bg-slate-950/40">
              <p className="m-0 mb-2 text-sm">Nenhuma transação neste período.</p>
              <Link href="/transacoes" className="text-xs font-semibold text-indigo-400 hover:underline">
                Adicionar transação <span aria-hidden>→</span>
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      <th className="py-3 px-3">Data</th>
                      <th className="py-3 px-3">Descrição</th>
                      <th className="py-3 px-3">Categoria</th>
                      <th className="py-3 px-3">Conta</th>
                      <th className="py-3 px-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recentes.map((transacao) => (
                      <tr key={transacao.id} className="transition-colors hover:bg-slate-800/40">
                        <td className="py-3 px-3 whitespace-nowrap text-slate-400">{formatarData(transacao.data)}</td>
                        <td className="py-3 px-3 font-semibold text-white">{transacao.descricao ?? "Sem descrição"}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-slate-800/60 px-2.5 py-1 border border-slate-700/50 text-slate-300">
                            <IconeCategoria nome={transacao.categoria} tamanho={20} />
                            {transacao.categoria ?? "Sem categoria"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{transacao.conta}</td>
                        <td
                          className="py-3 px-3 text-right font-bold whitespace-nowrap text-sm"
                          style={{
                            color:
                              transacao.tipo === "entrada"
                                ? "#10b981"
                                : "#ef4444",
                          }}
                        >
                          {transacao.tipo === "entrada" ? "+" : "−"}{" "}
                          {formatarCentavos(transacao.valorCentavos)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="divide-y divide-slate-800/80 lg:hidden">
                {recentes.map((transacao) => (
                  <article key={transacao.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                    <IconeCategoria nome={transacao.categoria} tamanho={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <strong className="truncate text-xs font-semibold text-white">
                          {transacao.descricao ?? "Sem descrição"}
                        </strong>
                        <span
                          className="shrink-0 text-xs font-bold whitespace-nowrap"
                          style={{
                            color:
                              transacao.tipo === "entrada"
                                ? "#10b981"
                                : "#ef4444",
                          }}
                        >
                          {transacao.tipo === "entrada" ? "+" : "−"}{" "}
                          {formatarCentavos(transacao.valorCentavos)}
                        </span>
                      </div>
                      <p className="mt-1 mb-0 truncate text-[11px] text-slate-400">
                        {formatarData(transacao.data)} · {transacao.categoria ?? "Sem categoria"} ·{" "}
                        {transacao.conta}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
