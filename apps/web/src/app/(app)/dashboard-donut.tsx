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
    <section className="card min-w-0 gap-0 p-4 sm:p-5" aria-labelledby="gastos-categoria-titulo">
      <span className="card-kicker">Composição das saídas</span>
      <h2 id="gastos-categoria-titulo" className="card-title mt-1">
        Gastos por categoria
      </h2>

      {gastos.length === 0 ? (
        <div className="estado-vazio mt-5 px-3 py-8">
          <p className="m-0 text-sm">Nenhum gasto no período.</p>
        </div>
      ) : (
        <>
          <div className="relative mx-auto mt-5 h-[172px] w-[172px]">
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
                stroke="var(--color-neutral-200)"
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
            <div className="pointer-events-none absolute inset-[28px] flex flex-col items-center justify-center rounded-full bg-(--color-surface) text-center">
              <span className="text-[10px] font-semibold tracking-[0.06em] text-(--color-neutral-500) uppercase">
                Total gasto
              </span>
              <strong className="mt-0.5 max-w-[100px] text-[14px] leading-tight">
                {formatarCentavos(total)}
              </strong>
            </div>
          </div>

          <ul className="mt-5 mb-0 list-none space-y-3 p-0">
            {gastos.map((gasto) => {
              const percentual = (gasto.valorCentavos / total) * 100;
              return (
                <li key={gasto.chave} className="flex min-w-0 items-center gap-2.5">
                  <IconeCategoria nome={gasto.nome} tamanho={30} />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold">{gasto.nome}</span>
                    <span className="block text-[11px] text-(--color-neutral-500)">
                      {percentuais.format(percentual)}% do total
                    </span>
                  </div>
                  <strong className="text-[12px] whitespace-nowrap">
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
