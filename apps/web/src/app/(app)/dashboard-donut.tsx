import { formatarCentavos } from "@nexora/core";
import { IconeCategoria } from "@/components/icone-categoria";
import { corDaCategoria } from "./dashboard-cores";

type GastoPorCategoria = {
  chave: string;
  nome: string;
  valorCentavos: number;
};

export function DashboardDonut({ gastos }: { gastos: GastoPorCategoria[] }) {
  const total = gastos.reduce((soma, gasto) => soma + gasto.valorCentavos, 0);
  const percentuais = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  const segmentos = gastos.map((gasto, indice) => {
    const fracao = gasto.valorCentavos / total;
    const inicio = gastos
      .slice(0, indice)
      .reduce((soma, item) => soma + item.valorCentavos / total, 0);
    return {
      gasto,
      fracao,
      tamanho: Math.max(fracao * 0.72, fracao - 0.008),
      deslocamento: -inicio,
    };
  });

  return (
    <section className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 shadow-lg backdrop-blur-xl flex min-w-0 flex-col justify-between" aria-labelledby="gastos-categoria-titulo">
      <div>
        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Composição das saídas</span>
        <h2 id="gastos-categoria-titulo" className="mt-0.5 text-lg font-bold tracking-tight text-white font-heading">
          Gastos por categoria
        </h2>
      </div>

      {gastos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-400 bg-slate-950/40 my-auto">
          <p className="m-0 text-sm">Nenhum gasto no período.</p>
        </div>
      ) : (
        <>
          <div className="relative mx-auto mt-4 h-[172px] w-[172px]">
            <svg
              viewBox="0 0 120 120"
              className="h-full w-full -rotate-90"
              role="img"
              aria-label={`Distribuição de ${formatarCentavos(total)} em gastos por categoria`}
            >
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="#1e293b"
                strokeWidth="13"
              />
              {segmentos.map(({ gasto, fracao, tamanho, deslocamento }) => {
                return (
                  <circle
                    key={gasto.chave}
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke={corDaCategoria(gasto.nome)}
                    strokeWidth="13"
                    pathLength="1"
                    strokeDasharray={`${tamanho} ${1 - tamanho}`}
                    strokeDashoffset={deslocamento}
                  >
                    <title>
                      {gasto.nome}: {formatarCentavos(gasto.valorCentavos)} (
                      {percentuais.format(fracao * 100)}%)
                    </title>
                  </circle>
                );
              })}
            </svg>
            <div className="pointer-events-none absolute inset-[28px] flex flex-col items-center justify-center rounded-full bg-slate-950 text-center border border-slate-800">
              <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                Total gasto
              </span>
              <strong className="mt-0.5 max-w-[100px] text-xs font-bold leading-tight text-white font-heading">
                {formatarCentavos(total)}
              </strong>
            </div>
          </div>

          <ul className="mt-4 mb-0 list-none space-y-2.5 p-0">
            {gastos.map((gasto) => {
              const percentual = (gasto.valorCentavos / total) * 100;
              return (
                <li key={gasto.chave} className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-800/40 bg-slate-950/40 px-3 py-2">
                  <IconeCategoria nome={gasto.nome} tamanho={24} />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-slate-200">{gasto.nome}</span>
                    <span className="block text-[10px] text-slate-400">
                      {percentuais.format(percentual)}% do total
                    </span>
                  </div>
                  <strong className="text-xs font-bold text-white whitespace-nowrap">
                    {formatarCentavos(gasto.valorCentavos)}
                  </strong>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
