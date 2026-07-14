"use client";

import { useId, useState } from "react";
import { formatarCentavos } from "@nexora/core";
import { corDaCategoria } from "./dashboard-cores";

export type TransacaoDoGrafico = {
  dia: number;
  tipo: "entrada" | "saida";
  valorCentavos: number;
  categoriaChave: string;
};

export type CategoriaDoGrafico = {
  chave: string;
  nome: string;
};

type Props = {
  transacoes: TransacaoDoGrafico[];
  categorias: CategoriaDoGrafico[];
  diasNoPeriodo: number;
  rotuloPeriodo: string;
};

const ESQUERDA = 18;
const DIREITA = 382;
const TOPO_LINHA = 10;
const BASE_LINHA = 92;
const BASE_BARRAS = 132;
const TOPO_BARRAS = 108;
const BASE_SAIDAS = 155;

function caminhoDosPontos(pontos: { x: number; y: number }[]): string {
  return pontos
    .map((ponto, indice) => `${indice === 0 ? "M" : "L"}${ponto.x.toFixed(2)},${ponto.y.toFixed(2)}`)
    .join(" ");
}

export function DashboardGrafico({
  transacoes,
  categorias,
  diasNoPeriodo,
  rotuloPeriodo,
}: Props) {
  const [categoriaChave, setCategoriaChave] = useState("");
  const idBase = useId().replace(/:/g, "");
  const categoria = categorias.find((item) => item.chave === categoriaChave);
  const porCategoria = categoria !== undefined;
  const corLinha = categoria ? corDaCategoria(categoria.nome) : "var(--color-accent)";
  const dias = Array.from({ length: diasNoPeriodo }, (_, indice) => ({
    dia: indice + 1,
    entradas: 0,
    saidas: 0,
    quantidade: 0,
  }));

  for (const transacao of transacoes) {
    const dia = dias[transacao.dia - 1];
    if (!dia) continue;

    if (porCategoria) {
      if (transacao.tipo !== "saida" || transacao.categoriaChave !== categoriaChave) continue;
      dia.saidas += transacao.valorCentavos;
      dia.quantidade += 1;
      continue;
    }

    dia[transacao.tipo === "entrada" ? "entradas" : "saidas"] += transacao.valorCentavos;
    dia.quantidade += 1;
  }

  let acumulado = 0;
  const serie = dias.map((dia) => {
    acumulado += porCategoria ? dia.saidas : dia.entradas - dia.saidas;
    return { dia: dia.dia, valor: acumulado };
  });
  const totalEntradas = dias.reduce((total, dia) => total + dia.entradas, 0);
  const totalSaidas = dias.reduce((total, dia) => total + dia.saidas, 0);
  const quantidade = dias.reduce((total, dia) => total + dia.quantidade, 0);
  const valorFinal = serie.at(-1)?.valor ?? 0;

  const valores = serie.map((ponto) => ponto.valor);
  const minimoReal = Math.min(...valores);
  const maximoReal = Math.max(...valores);
  let minimo = Math.min(0, minimoReal);
  let maximo = Math.max(0, maximoReal);
  if (minimo === maximo) maximo = minimo + 1;
  if (minimo < 0 && maximo > 0) {
    const margem = (maximo - minimo) * 0.08;
    minimo -= margem;
    maximo += margem;
  } else if (maximo > 0) {
    maximo *= 1.08;
  } else if (minimo < 0) {
    minimo *= 1.08;
  }

  const alcance = maximo - minimo || 1;
  const xDoDia = (dia: number) =>
    ESQUERDA + ((dia - 1) / Math.max(diasNoPeriodo - 1, 1)) * (DIREITA - ESQUERDA);
  const yDoValor = (valor: number) =>
    BASE_LINHA - ((valor - minimo) / alcance) * (BASE_LINHA - TOPO_LINHA);
  const pontos = serie.map((ponto) => ({
    x: xDoDia(ponto.dia),
    y: yDoValor(ponto.valor),
  }));
  const linha = caminhoDosPontos(pontos);
  const zeroY = yDoValor(0);
  const primeiro = pontos[0];
  const ultimo = pontos.at(-1) ?? primeiro;
  const area = `${linha} L${ultimo.x.toFixed(2)},${zeroY.toFixed(2)} L${primeiro.x.toFixed(2)},${zeroY.toFixed(2)} Z`;
  const cruzaZero = minimoReal < 0 && maximoReal > 0;

  const maiorMovimento = Math.max(
    1,
    ...dias.map((dia) =>
      porCategoria ? dia.saidas : Math.abs(dia.entradas - dia.saidas),
    ),
  );
  const espacoPorDia = (DIREITA - ESQUERDA) / diasNoPeriodo;
  const larguraBarra = Math.min(6, Math.max(1.5, espacoPorDia * 0.28));
  const resumo = porCategoria
    ? quantidade === 0
      ? `Nenhum gasto em ${categoria.nome} no período.`
      : `${categoria.nome}: ${formatarCentavos(totalSaidas)} em ${quantidade} ${quantidade === 1 ? "lançamento" : "lançamentos"} no período.`
    : quantidade === 0
      ? "Nenhuma movimentação no período."
      : `Entradas de ${formatarCentavos(totalEntradas)}, saídas de ${formatarCentavos(totalSaidas)} e saldo acumulado de ${formatarCentavos(valorFinal)} no período.`;

  return (
    <section className="card min-w-0 gap-0 p-4 sm:p-5" aria-labelledby={`${idBase}-titulo`}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <span className="card-kicker">Evolução diária</span>
          <h2 id={`${idBase}-titulo`} className="card-title mt-1">
            {porCategoria ? `Gasto acumulado · ${categoria.nome}` : "Saldo acumulado"}
          </h2>
          <p className="mt-1 mb-0 text-[12px] text-(--color-neutral-500)">{rotuloPeriodo}</p>
        </div>
        <label className="flex shrink-0 flex-col gap-1 text-[11px] font-semibold text-(--color-neutral-600)">
          Categoria
          <span className="relative">
            <select
              className="input min-w-[190px] appearance-none pr-8 text-[13px]"
              value={categoriaChave}
              onChange={(evento) => setCategoriaChave(evento.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categorias.map((item) => (
                <option key={item.chave} value={item.chave}>
                  {item.nome}
                </option>
              ))}
            </select>
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-(--color-neutral-500)"
            >
              ▼
            </span>
          </span>
        </label>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <span className="block text-[10px] font-semibold tracking-[0.08em] text-(--color-neutral-500) uppercase">
            {porCategoria ? "Total gasto" : "Saldo no período"}
          </span>
          <strong
            className="text-[20px] leading-tight"
            style={{
              color: porCategoria
                ? corLinha
                : valorFinal >= 0
                  ? "var(--color-income)"
                  : "var(--color-expense)",
            }}
          >
            {formatarCentavos(porCategoria ? totalSaidas : valorFinal)}
          </strong>
        </div>
        <span className="text-right text-[10px] leading-tight text-(--color-neutral-500)">
          Linha acumulada
          <br />
          Barras por dia
        </span>
      </div>

      <svg
        viewBox="0 0 400 160"
        className="mt-2 block h-auto w-full"
        role="img"
        aria-labelledby={`${idBase}-grafico-titulo`}
        aria-describedby={`${idBase}-resumo`}
      >
        <title id={`${idBase}-grafico-titulo`}>
          {porCategoria ? `Gastos acumulados em ${categoria.nome}` : "Saldo acumulado e fluxo diário"}
        </title>
        <defs>
          <linearGradient id={`${idBase}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={corLinha} stopOpacity="0.22" />
            <stop offset="1" stopColor={corLinha} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <line
          x1={ESQUERDA}
          x2={DIREITA}
          y1={TOPO_LINHA}
          y2={TOPO_LINHA}
          stroke="var(--color-divider)"
          strokeWidth="0.8"
        />
        <line
          x1={ESQUERDA}
          x2={DIREITA}
          y1={BASE_LINHA}
          y2={BASE_LINHA}
          stroke="var(--color-divider)"
          strokeWidth="0.8"
        />
        {cruzaZero && (
          <line
            x1={ESQUERDA}
            x2={DIREITA}
            y1={zeroY}
            y2={zeroY}
            stroke="var(--color-neutral-400)"
            strokeWidth="0.9"
            strokeDasharray="3 3"
          />
        )}
        <path d={area} fill={`url(#${idBase}-area)`} />
        <path
          d={linha}
          fill="none"
          stroke={corLinha}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {dias.map((dia, indice) =>
          dia.quantidade > 0 && dia.dia !== diasNoPeriodo ? (
            <circle
              key={`ponto-${dia.dia}`}
              cx={pontos[indice].x}
              cy={pontos[indice].y}
              r="2"
              fill="var(--color-surface)"
              stroke={corLinha}
              strokeWidth="1.4"
            >
              <title>
                Dia {dia.dia}: {formatarCentavos(serie[indice].valor)} acumulados
              </title>
            </circle>
          ) : null,
        )}
        <circle cx={ultimo.x} cy={ultimo.y} r="5" fill={corLinha} opacity="0.16" />
        <circle
          cx={ultimo.x}
          cy={ultimo.y}
          r="2.7"
          fill="var(--color-surface)"
          stroke={corLinha}
          strokeWidth="2"
        >
          <title>Valor final: {formatarCentavos(valorFinal)}</title>
        </circle>

        <line
          x1={ESQUERDA}
          x2={DIREITA}
          y1="101"
          y2="101"
          stroke="var(--color-divider)"
          strokeWidth="0.8"
        />
        <line
          x1={ESQUERDA}
          x2={DIREITA}
          y1={porCategoria ? BASE_SAIDAS : BASE_BARRAS}
          y2={porCategoria ? BASE_SAIDAS : BASE_BARRAS}
          stroke="var(--color-neutral-300)"
          strokeWidth="0.8"
        />
        {dias.map((dia) => {
          const centro = xDoDia(dia.dia);
          const saldoDoDia = dia.entradas - dia.saidas;
          const movimento = porCategoria ? dia.saidas : Math.abs(saldoDoDia);
          const altura = porCategoria
            ? (movimento / maiorMovimento) * (BASE_SAIDAS - TOPO_BARRAS)
            : saldoDoDia >= 0
              ? (movimento / maiorMovimento) * (BASE_BARRAS - TOPO_BARRAS)
              : (movimento / maiorMovimento) * (BASE_SAIDAS - BASE_BARRAS);
          const baseline = porCategoria || saldoDoDia < 0 ? BASE_SAIDAS : BASE_BARRAS;
          const y = porCategoria || saldoDoDia >= 0 ? baseline - altura : BASE_BARRAS;

          if (movimento === 0) return null;
          return (
            <rect
              key={`barra-${dia.dia}`}
              x={centro - larguraBarra / 2}
              y={y}
              width={larguraBarra}
              height={Math.max(altura, 1)}
              rx={Math.min(1.5, larguraBarra / 3)}
              fill={
                porCategoria
                  ? corLinha
                  : saldoDoDia >= 0
                    ? "var(--color-income)"
                    : "var(--color-expense)"
              }
            >
              <title>
                Dia {dia.dia}: {porCategoria ? "gasto" : "saldo"} de {formatarCentavos(movimento)}
              </title>
            </rect>
          );
        })}
      </svg>

      <div className="mt-1 flex justify-between text-[10px] text-(--color-neutral-500)">
        {diasNoPeriodo === 1 ? (
          <span>Dia 1</span>
        ) : (
          <>
            <span>Dia 1</span>
            <span>Movimento diário</span>
            <span>Dia {diasNoPeriodo}</span>
          </>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-(--color-neutral-600)">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full" style={{ background: corLinha }} />
          {porCategoria ? `Acumulado · ${categoria.nome}` : "Saldo acumulado"}
        </span>
        {!porCategoria && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px] bg-(--color-income)" /> Dia positivo
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-[2px]"
            style={{ background: porCategoria ? corLinha : "var(--color-expense)" }}
          />
          {porCategoria ? "Gasto diário" : "Dia negativo"}
        </span>
      </div>
      <p
        id={`${idBase}-resumo`}
        aria-live="polite"
        className="mt-3 mb-0 rounded-lg bg-(--color-neutral-100) px-3 py-2 text-[12px] text-(--color-neutral-600)"
      >
        {resumo}
      </p>
    </section>
  );
}
