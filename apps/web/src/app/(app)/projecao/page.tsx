import Link from "next/link";
import { formatarCentavos, nomeDoMes } from "@nexora/core";
import { Topo } from "@/components/topo";
import { mesAtual } from "@/lib/hoje";
import { obterProjecaoFluxoCaixaDoUsuario } from "@/server/projecao";
import { usuarioLogadoId } from "@/server/posse";

export default async function ProjecaoPage() {
  const usuarioId = await usuarioLogadoId();
  const projecao = await obterProjecaoFluxoCaixaDoUsuario({ usuarioId, mesInicial: mesAtual(), mesesProjecao: 12 });

  return (
    <>
      <Topo
        titulo="Projeção de Caixa (12 Meses)"
        subtitulo="Visão futura consolidando saldos de contas, faturas de cartão e recorrências."
      />

      <div className="mx-auto w-full max-w-[1160px] p-4 sm:p-6 space-y-6">
        {/* Banner de Alerta de Saúde Financeira */}
        {projecao.temAlertaNegativo ? (
          <aside className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-5 text-slate-200 shadow-lg glow-red flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              ⚠️
            </span>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Alerta de Saldo Projetado Negativo
              </h3>
              <p className="text-xs text-slate-300 mt-1 m-0">
                A projeção identifica um ou mais meses nos próximos 12 meses com saldo acumulado no vermelho. Revise suas despesas recorrentes ou planeje aportes para manter o caixa saudável.
              </p>
            </div>
          </aside>
        ) : (
          <aside className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-slate-200 shadow-lg glow-emerald flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ✓
            </span>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Caixa Projetado Saudável
              </h3>
              <p className="text-xs text-slate-300 mt-1 m-0">
                Todos os 12 meses projetados possuem saldo acumulado positivo. Suas recorrências e faturas previstas cabem confortavelmente na estimativa de receita.
              </p>
            </div>
          </aside>
        )}

        {/* Tabela de Projeção Mês a Mês */}
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="card-title">Fluxo de Caixa Projetado (12 Meses)</h3>
            <Link href="/recorrencias" className="text-xs text-indigo-400 hover:text-indigo-300 link font-semibold">
              Gerenciar recorrências →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th className="text-right">Saldo Inicial</th>
                  <th className="text-right">Entradas (Ef. + Prev.)</th>
                  <th className="text-right">Saídas (Ef. + Prev.)</th>
                  <th className="text-right">Resultado Mês</th>
                  <th className="text-right">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {projecao.meses.map((m) => {
                  const totalEntradas = m.entradasEfetivadasCentavos + m.entradasPrevistasCentavos;
                  const totalSaidas = m.saidasEfetivadasCentavos + m.saidasPrevistasCentavos;

                  return (
                    <tr
                      key={m.mesReferencia}
                      className={m.alertaSaldoNegativo ? "bg-rose-950/30 border-l-2 border-rose-500" : ""}
                    >
                      <td className="font-bold text-white capitalize whitespace-nowrap">
                        {nomeDoMes(m.mesReferencia)}
                      </td>
                      <td className="text-right font-mono text-slate-400">
                        {formatarCentavos(m.saldoInicialCentavos)}
                      </td>
                      <td className="text-right font-mono text-emerald-400">
                        + {formatarCentavos(totalEntradas)}
                      </td>
                      <td className="text-right font-mono text-rose-400">
                        − {formatarCentavos(totalSaidas)}
                      </td>
                      <td
                        className="text-right font-mono font-semibold"
                        style={{
                          color: m.saldoMesCentavos >= 0 ? "var(--color-income)" : "var(--color-expense)",
                        }}
                      >
                        {m.saldoMesCentavos >= 0 ? "+" : "−"} {formatarCentavos(Math.abs(m.saldoMesCentavos))}
                      </td>
                      <td
                        className="text-right font-mono font-bold text-base"
                        style={{
                          color: m.saldoAcumuladoCentavos >= 0 ? "#10b981" : "#ef4444",
                        }}
                      >
                        {formatarCentavos(m.saldoAcumuladoCentavos)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
