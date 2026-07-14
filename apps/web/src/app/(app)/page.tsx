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
        entradas: sql<string>`coalesce(sum(${transacoes.valorCentavos}) filter (where ${transacoes.tipo} = 'entrada'), 0)`,
        saidas: sql<string>`coalesce(sum(${transacoes.valorCentavos}) filter (where ${transacoes.tipo} = 'saida'), 0)`,
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
      corIcone: "var(--color-income)",
      fundoIcone: "var(--color-income-bg)",
      delta: delta(entradas, entradasAnterior, false, comparacao),
    },
    {
      rotulo: "Saídas",
      descricao: "Gastos no período",
      valor: formatarCentavos(saidas),
      icone: <IconeSaidas tamanho={20} traco={2.2} />,
      corIcone: "var(--color-expense)",
      fundoIcone: "var(--color-expense-bg)",
      delta: delta(saidas, saidasAnterior, true, comparacao),
    },
    {
      rotulo: "Saldo",
      descricao: "Entradas menos saídas",
      valor: formatarCentavos(saldo),
      icone: <IconeSaldo tamanho={20} traco={2.2} />,
      corIcone: "var(--color-accent)",
      fundoIcone: "var(--color-accent-100)",
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
        <div className="flex items-center gap-1 rounded-full border border-(--color-divider) bg-(--color-neutral-100) px-1.5 py-1">
          <Link
            href={`/?mes=${mesAnterior(mes)}`}
            aria-label="Mês anterior"
            className="btn btn-icon h-7 w-7"
          >
            <IconeSetaEsquerda tamanho={15} />
          </Link>
          <span className="min-w-[112px] text-center text-[13px] font-bold whitespace-nowrap capitalize">
            {nomeDoMes(mes)}
          </span>
          <Link
            href={`/?mes=${mesSeguinte(mes)}`}
            aria-label="Mês seguinte"
            className="btn btn-icon h-7 w-7"
          >
            <IconeSetaDireita tamanho={15} />
          </Link>
        </div>
      </Topo>

      <div className="mx-auto w-full max-w-[1160px] p-4 sm:p-6">
        {pendencias.total > 0 && (
          <aside className="mb-5 flex flex-col gap-3 rounded-xl border border-(--color-accent-200) bg-(--color-accent-100) p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-surface) text-(--color-accent) shadow-sm">
                <IconeFila tamanho={19} />
              </span>
              <div>
                <strong className="block text-[14px]">
                  {pendencias.total} {pendencias.total === 1 ? "SMS aguarda" : "SMS aguardam"} sua
                  confirmação
                </strong>
                <span className="text-[12px] text-(--color-neutral-600)">
                  Revise a captura antes de ela virar uma transação.
                </span>
              </div>
            </div>
            <Link href="/fila" className="btn btn-primary shrink-0 self-start sm:self-auto">
              Revisar pendências
              <IconeSetaDireita tamanho={14} />
            </Link>
          </aside>
        )}

        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {cartoes.map((cartao) => (
            <article key={cartao.rotulo} className="card min-h-[168px] justify-between p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="card-kicker">{cartao.rotulo}</span>
                  <span className="mt-0.5 block text-[11px] text-(--color-neutral-500)">
                    {cartao.descricao}
                  </span>
                </div>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: cartao.fundoIcone, color: cartao.corIcone }}
                >
                  {cartao.icone}
                </span>
              </div>
              <strong className="my-2 block text-[clamp(24px,3vw,30px)] leading-none tracking-[-0.03em]">
                {cartao.valor}
              </strong>
              {cartao.delta ? (
                <span
                  className="w-fit rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={{ background: cartao.delta.fundo, color: cartao.delta.cor }}
                >
                  {cartao.delta.rotulo}
                </span>
              ) : (
                <span className="text-[10px] text-(--color-neutral-500)">
                  Sem base comparável no período anterior
                </span>
              )}
            </article>
          ))}
        </div>

        <div className="mb-5 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
          <DashboardGrafico
            transacoes={transacoesGrafico}
            categorias={categoriasGrafico}
            diasNoPeriodo={diasNoPeriodo}
            rotuloPeriodo={rotuloPeriodo}
          />
          <DashboardDonut gastos={gastosPorCategoria} />
        </div>

        <section className="card gap-0 p-4 sm:p-5" aria-labelledby="transacoes-recentes-titulo">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="card-kicker">Atividade</span>
              <h2 id="transacoes-recentes-titulo" className="card-title mt-1">
                Transações recentes
              </h2>
              {doMes.length > 0 && (
                <p className="mt-1 mb-0 text-[11px] text-(--color-neutral-500)">
                  {doMes.length === 1
                    ? "1 transação no período"
                    : `${doMes.length} transações no período`}
                </p>
              )}
            </div>
            <Link href="/transacoes" className="link text-[13px] font-semibold">
              Ver todas <span aria-hidden>→</span>
            </Link>
          </div>

          {recentes.length === 0 ? (
            <div className="estado-vazio">
              <p className="m-0 mb-2">Nenhuma transação neste período.</p>
              <Link href="/transacoes" className="link">
                Adicionar transação <span aria-hidden>→</span>
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Conta</th>
                      <th className="text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentes.map((transacao) => (
                      <tr key={transacao.id}>
                        <td className="whitespace-nowrap">{formatarData(transacao.data)}</td>
                        <td className="font-medium">{transacao.descricao ?? "Sem descrição"}</td>
                        <td>
                          <span className="flex items-center gap-2 whitespace-nowrap">
                            <IconeCategoria nome={transacao.categoria} tamanho={28} />
                            {transacao.categoria ?? "Sem categoria"}
                          </span>
                        </td>
                        <td>{transacao.conta}</td>
                        <td
                          className="text-right font-semibold whitespace-nowrap"
                          style={{
                            color:
                              transacao.tipo === "entrada"
                                ? "var(--color-income)"
                                : "var(--color-expense)",
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
              <div className="divide-y divide-(--color-divider) lg:hidden">
                {recentes.map((transacao) => (
                  <article key={transacao.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <IconeCategoria nome={transacao.categoria} tamanho={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <strong className="truncate text-[13px]">
                          {transacao.descricao ?? "Sem descrição"}
                        </strong>
                        <span
                          className="shrink-0 text-[13px] font-semibold whitespace-nowrap"
                          style={{
                            color:
                              transacao.tipo === "entrada"
                                ? "var(--color-income)"
                                : "var(--color-expense)",
                          }}
                        >
                          {transacao.tipo === "entrada" ? "+" : "−"}{" "}
                          {formatarCentavos(transacao.valorCentavos)}
                        </span>
                      </div>
                      <p className="mt-0.5 mb-0 truncate text-[11px] text-(--color-neutral-500)">
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
