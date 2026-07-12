import Link from "next/link";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import {
  ehMesValido,
  formatarCentavos,
  limitesDoMes,
  mesAnterior,
  mesSeguinte,
  nomeDoMes,
} from "@nexora/core";
import { db } from "@/db";
import { categorias, contas, transacoes } from "@/db/schema";
import {
  IconeEntradas,
  IconeSaidas,
  IconeSaldo,
  IconeSetaDireita,
  IconeSetaEsquerda,
} from "@/components/icones";
import { Topo } from "@/components/topo";
import { mesAtual } from "@/lib/hoje";
import { usuarioLogadoId } from "@/server/posse";

type Delta = { rotulo: string; cor: string; fundo: string } | null;

/** Variação percentual vs mês anterior; para saídas, cair é bom (inverter). */
function delta(atual: number, anterior: number, inverter: boolean): Delta {
  if (!anterior) return null;
  const pct = ((atual - anterior) / Math.abs(anterior)) * 100;
  const bom = inverter ? pct <= 0 : pct >= 0;
  return {
    rotulo: `${pct >= 0 ? "+" : "−"}${Math.abs(Math.round(pct))}% vs mês anterior`,
    cor: bom ? "var(--color-income)" : "var(--color-expense)",
    fundo: bom ? "var(--color-income-bg)" : "var(--color-expense-bg)",
  };
}

/** Paths SVG (400×150) do saldo acumulado do mês, dia a dia. */
function graficoSaldo(mes: string, tx: { data: string; tipo: string; valorCentavos: number }[]) {
  const diasNoMes = Number(limitesDoMes(mes).fim.slice(8, 10));
  const ordenadas = [...tx].sort((a, b) => a.data.localeCompare(b.data));
  let acumulado = 0;
  const pontos = [{ dia: 1, valor: 0 }];
  for (const t of ordenadas) {
    acumulado += t.tipo === "entrada" ? t.valorCentavos : -t.valorCentavos;
    pontos.push({ dia: Number(t.data.slice(8, 10)), valor: acumulado });
  }
  pontos.push({ dia: diasNoMes, valor: acumulado });

  const valores = pontos.map((p) => p.valor).concat([0]);
  const minimo = Math.min(...valores);
  const alcance = Math.max(...valores) - minimo || 1;
  const W = 400;
  const H = 150;
  const pad = 6;
  const coords = pontos.map((p) => [
    pad + ((p.dia - 1) / Math.max(diasNoMes - 1, 1)) * (W - 2 * pad),
    H - pad - ((p.valor - minimo) / alcance) * (H - 2 * pad),
  ]);
  const linha = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c[0].toFixed(1)},${c[1].toFixed(1)}`)
    .join(" ");
  const ultimo = coords[coords.length - 1];
  const primeiro = coords[0];
  const area = `${linha} L${ultimo[0].toFixed(1)},${H - pad} L${primeiro[0].toFixed(1)},${H - pad} Z`;
  return { linha, area, diasNoMes, final: acumulado };
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const usuarioId = await usuarioLogadoId();
  const { mes: mesParam } = await searchParams;
  const mes = mesParam && ehMesValido(mesParam) ? mesParam : mesAtual();
  const { inicio, fim } = limitesDoMes(mes);

  const filtroMes = and(
    eq(transacoes.usuarioId, usuarioId),
    gte(transacoes.data, inicio),
    lte(transacoes.data, fim),
  );

  const totaisDoMes = (i: string, f: string) =>
    db
      .select({
        entradas: sql<string>`coalesce(sum(${transacoes.valorCentavos}) filter (where ${transacoes.tipo} = 'entrada'), 0)`,
        saidas: sql<string>`coalesce(sum(${transacoes.valorCentavos}) filter (where ${transacoes.tipo} = 'saida'), 0)`,
      })
      .from(transacoes)
      .where(
        and(
          eq(transacoes.usuarioId, usuarioId),
          gte(transacoes.data, i),
          lte(transacoes.data, f),
        ),
      );

  const limitesAnterior = limitesDoMes(mesAnterior(mes));
  const [[totais], [totaisAnterior], doMes] = await Promise.all([
    totaisDoMes(inicio, fim),
    totaisDoMes(limitesAnterior.inicio, limitesAnterior.fim),
    db
      .select({
        id: transacoes.id,
        data: transacoes.data,
        tipo: transacoes.tipo,
        valorCentavos: transacoes.valorCentavos,
        descricao: transacoes.descricao,
        conta: contas.nome,
        categoria: categorias.nome,
      })
      .from(transacoes)
      .innerJoin(contas, eq(transacoes.contaId, contas.id))
      .leftJoin(categorias, eq(transacoes.categoriaId, categorias.id))
      .where(filtroMes)
      .orderBy(desc(transacoes.data), desc(transacoes.criadoEm)),
  ]);

  const entradas = Number(totais?.entradas ?? 0);
  const saidas = Number(totais?.saidas ?? 0);
  const saldo = entradas - saidas;
  const entradasAnterior = Number(totaisAnterior?.entradas ?? 0);
  const saidasAnterior = Number(totaisAnterior?.saidas ?? 0);

  const cartoes = [
    {
      rotulo: "Entradas",
      valor: formatarCentavos(entradas),
      icone: <IconeEntradas />,
      corIcone: "var(--color-income)",
      fundoIcone: "var(--color-income-bg)",
      delta: delta(entradas, entradasAnterior, false),
    },
    {
      rotulo: "Saídas",
      valor: formatarCentavos(saidas),
      icone: <IconeSaidas />,
      corIcone: "var(--color-expense)",
      fundoIcone: "var(--color-expense-bg)",
      delta: delta(saidas, saidasAnterior, true),
    },
    {
      rotulo: "Saldo",
      valor: formatarCentavos(saldo),
      icone: <IconeSaldo />,
      corIcone: "var(--color-accent-300)",
      fundoIcone: "var(--marca-escuro-suave)",
      delta: delta(saldo, entradasAnterior - saidasAnterior, false),
      escuro: true,
    },
  ];

  const porCategoria = new Map<string, number>();
  for (const t of doMes) {
    if (t.tipo !== "saida") continue;
    const nome = t.categoria ?? "Sem categoria";
    porCategoria.set(nome, (porCategoria.get(nome) ?? 0) + t.valorCentavos);
  }
  const totalCategorizado = [...porCategoria.values()].reduce((a, v) => a + v, 0) || 1;
  const gastosPorCategoria = [...porCategoria.entries()]
    .map(([nome, valor]) => ({ nome, pct: Math.round((valor / totalCategorizado) * 100) }))
    .sort((a, b) => b.pct - a.pct);

  const grafico = graficoSaldo(mes, doMes);

  return (
    <>
      <Topo titulo="Dashboard" subtitulo="Visão geral do mês selecionado.">
        <div className="flex items-center gap-1 rounded-full border border-(--color-divider) bg-(--color-neutral-100) px-1.5 py-1">
          <Link href={`/?mes=${mesAnterior(mes)}`} className="btn btn-icon h-7 w-7">
            <IconeSetaEsquerda tamanho={15} />
          </Link>
          <span className="min-w-[104px] text-center text-[13px] font-bold whitespace-nowrap capitalize">
            {nomeDoMes(mes)}
          </span>
          <Link href={`/?mes=${mesSeguinte(mes)}`} className="btn btn-icon h-7 w-7">
            <IconeSetaDireita tamanho={15} />
          </Link>
        </div>
      </Topo>

      <div className="mx-auto w-full max-w-[1160px] p-6">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {cartoes.map((c) => (
            <div key={c.rotulo} className={`card${c.escuro ? " card-marca" : ""}`}>
              <div
                className="flex h-[34px] w-[34px] items-center justify-center rounded-(--radius-sm)"
                style={{ background: c.fundoIcone, color: c.corIcone }}
              >
                {c.icone}
              </div>
              <span className="card-kicker">{c.rotulo}</span>
              <span className="text-[26px] font-extrabold">{c.valor}</span>
              {c.delta && (
                <span
                  className="w-fit rounded-full px-[9px] py-[3px] text-[11px] font-bold"
                  style={{ background: c.delta.fundo, color: c.delta.cor }}
                >
                  {c.delta.rotulo}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mb-6 grid grid-cols-1 items-stretch gap-4 md:grid-cols-[2fr_1fr]">
          <div className="card">
            <div className="mb-2 flex items-baseline justify-between">
              <h4 className="card-title">Saldo acumulado</h4>
              <span
                className="text-[13px] font-bold"
                style={{
                  color: grafico.final >= 0 ? "var(--color-income)" : "var(--color-expense)",
                }}
              >
                {formatarCentavos(grafico.final)}
              </span>
            </div>
            <svg
              viewBox="0 0 400 150"
              className="block h-[150px] w-full"
              preserveAspectRatio="none"
            >
              <path d={grafico.area} fill="var(--color-accent)" opacity="0.12" />
              <path
                d={grafico.linha}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-1 flex justify-between text-[11px] text-(--color-neutral-500)">
              <span>Dia 1</span>
              <span className="capitalize">{nomeDoMes(mes)}</span>
              <span>Dia {grafico.diasNoMes}</span>
            </div>
          </div>

          <div className="card">
            <h4 className="card-title mb-3">Gastos por categoria</h4>
            {gastosPorCategoria.length === 0 ? (
              <p className="text-muted m-0">Nenhum gasto categorizado neste mês.</p>
            ) : (
              <div>
                {gastosPorCategoria.map((cat) => (
                  <div key={cat.nome} className="mb-3">
                    <div className="mb-[5px] flex justify-between text-[13px]">
                      <span>{cat.nome}</span>
                      <span className="font-bold">{cat.pct}%</span>
                    </div>
                    <div className="h-[6px] rounded-full bg-(--color-neutral-200)">
                      <div
                        className="h-full rounded-full bg-(--color-accent)"
                        style={{ width: `${cat.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="card-title">Transações do mês</h4>
            <Link href="/transacoes" className="link text-[13px]">
              Ver tudo →
            </Link>
          </div>

          {doMes.length === 0 ? (
            <div className="estado-vazio">
              <p className="m-0 mb-2">Nenhuma transação neste mês.</p>
              <Link href="/transacoes" className="link">
                Adicionar transação →
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
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
                    {doMes.map((t) => (
                      <tr key={t.id}>
                        <td className="whitespace-nowrap">
                          {t.data.slice(8, 10)}/{t.data.slice(5, 7)}/{t.data.slice(0, 4)}
                        </td>
                        <td>{t.descricao ?? "—"}</td>
                        <td>{t.categoria ?? "—"}</td>
                        <td>{t.conta}</td>
                        <td
                          className="text-right font-semibold whitespace-nowrap"
                          style={{
                            color:
                              t.tipo === "entrada"
                                ? "var(--color-income)"
                                : "var(--color-expense)",
                          }}
                        >
                          {t.tipo === "entrada" ? "+" : "−"} {formatarCentavos(t.valorCentavos)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden">
                {doMes.map((t) => (
                  <div key={t.id} className="border-b border-(--color-divider) py-[10px]">
                    <div className="flex justify-between gap-2">
                      <strong className="text-[14px]">{t.descricao ?? "—"}</strong>
                      <span
                        className="font-semibold whitespace-nowrap"
                        style={{
                          color:
                            t.tipo === "entrada"
                              ? "var(--color-income)"
                              : "var(--color-expense)",
                        }}
                      >
                        {t.tipo === "entrada" ? "+" : "−"} {formatarCentavos(t.valorCentavos)}
                      </span>
                    </div>
                    <div className="text-[12px] text-(--color-neutral-600)">
                      {t.data.slice(8, 10)}/{t.data.slice(5, 7)}/{t.data.slice(0, 4)} ·{" "}
                      {t.categoria ?? "—"} · {t.conta}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
