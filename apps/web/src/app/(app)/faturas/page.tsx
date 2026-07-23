import Link from "next/link";
import { formatarCentavos } from "@nexora/core";
import { db } from "@/db";
import { contas } from "@/db/schema";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { IconeCartao, IconeContas } from "@/components/icones";
import { Topo } from "@/components/topo";
import { hojeISO } from "@/lib/hoje";
import { listarFaturasDoUsuario } from "@/server/faturas";
import { usuarioLogadoId } from "@/server/posse";
import { atualizarValorInformadoFatura, liquidarFatura } from "./actions";

function StatusBadge({ status }: { status: string }) {
  let cor = "bg-slate-800 text-slate-300 border-slate-700";
  let label = "Aberta";

  if (status === "reconciliada") {
    cor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 glow-emerald";
    label = "Reconciliada (100%)";
  } else if (status === "paga") {
    cor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
    label = "Paga";
  } else if (status === "fechada") {
    cor = "bg-amber-500/10 text-amber-400 border-amber-500/30";
    label = "Fechada";
  }

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${cor}`}
    >
      {label}
    </span>
  );
}

export default async function FaturasPage() {
  const usuarioId = await usuarioLogadoId();

  const [cartoes, faturasLista] = await Promise.all([
    db.query.contas.findMany({
      where: (t, { and, eq }) => and(eq(t.usuarioId, usuarioId), eq(t.tipo, "cartao_credito")),
    }),
    listarFaturasDoUsuario({ usuarioId }),
  ]);

  const contasParaPagamento = await db.query.contas.findMany({
    where: (t, { and, eq, ne }) => and(eq(t.usuarioId, usuarioId), ne(t.tipo, "cartao_credito")),
  });

  return (
    <>
      <Topo
        titulo="Faturas de Cartão"
        subtitulo="Gestão de ciclos de faturas, parcelamentos e reconciliação Nexora Fechado."
      />

      <div className="mx-auto w-full max-w-[1160px] p-4 sm:p-6">
        {cartoes.length === 0 ? (
          <div className="card text-center py-12">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <IconeCartao tamanho={24} />
            </div>
            <h3 className="text-lg font-semibold text-white">Nenhum cartão de crédito cadastrado</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mt-1 mb-4">
              Para gerenciar faturas por ciclo e compras parceladas, cadastre uma conta do tipo Cartão de Crédito.
            </p>
            <Link href="/contas" className="btn btn-primary inline-flex items-center gap-2">
              <IconeContas tamanho={16} />
              Ir para Contas
            </Link>
          </div>
        ) : faturasLista.length === 0 ? (
          <div className="card text-center py-12">
            <h3 className="text-lg font-semibold text-white">Nenhuma fatura gerada ainda</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mt-1">
              As faturas serão criadas automaticamente conforme você lançar compras no cartão ou confirmar SMS bancários.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {faturasLista.map((fatura) => {
              const { reconciliacao } = fatura;

              return (
                <div
                  key={fatura.id}
                  className="rounded-2xl border border-slate-800 bg-[#0d1322] p-5 sm:p-6 shadow-lg transition-all"
                >
                  {/* Cabeçalho da Fatura */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-bold text-white font-heading">
                          {fatura.nomeConta} · {fatura.mesReferencia}
                        </h3>
                        <StatusBadge status={fatura.status} />
                      </div>
                      <div className="mt-1 text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          Fechamento: <strong>{fatura.dataFechamento.slice(8, 10)}/{fatura.dataFechamento.slice(5, 7)}</strong>
                        </span>
                        <span>
                          Vencimento: <strong>{fatura.dataVencimento.slice(8, 10)}/{fatura.dataVencimento.slice(5, 7)}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total Explicado / Fatura</div>
                      <div className="text-2xl font-bold text-white font-mono">
                        {formatarCentavos(reconciliacao.totalExplicadoCentavos)}
                      </div>
                    </div>
                  </div>

                  {/* Painel Nexora Fechado */}
                  <div className="my-5 rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                          Nexora Fechado (Reconciliação)
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-indigo-200">
                        {reconciliacao.percentualExplicado}% Explicado
                      </span>
                    </div>

                    {/* Barra de Progresso Visual */}
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 transition-all duration-500"
                        style={{ width: `${reconciliacao.percentualExplicado}%` }}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
                      <div>
                        {fatura.valorTotalInformadoCentavos ? (
                          <span>
                            Total Banco (SMS):{" "}
                            <strong className="text-white">
                              {formatarCentavos(fatura.valorTotalInformadoCentavos)}
                            </strong>
                            {reconciliacao.diferencaCentavos > 0 && (
                              <span className="ml-2 text-rose-400 font-medium">
                                (Faltam {formatarCentavos(reconciliacao.diferencaCentavos)} a explicar)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            Valor total informado pelo banco ainda não registrado.
                          </span>
                        )}
                      </div>

                      {/* Formulário para definir/editar valor informado */}
                      <form
                        action={atualizarValorInformadoFatura.bind(null, fatura.id)}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          name="valorTotalInformado"
                          placeholder="Ex: 135,79"
                          className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-indigo-700/60 bg-indigo-900/40 px-2.5 py-1 text-xs font-medium text-indigo-200 hover:bg-indigo-800/60 transition-all"
                        >
                          Definir total banco
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Ação de Liquidação / Pagamento da Fatura */}
                  {fatura.status !== "paga" && (
                    <div className="mt-4 border-t border-slate-800/60 pt-4">
                      <form
                        action={liquidarFatura.bind(null, fatura.id)}
                        className="flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="text-xs text-slate-400">Pagar fatura debitando de:</label>
                          <select
                            name="contaOrigemId"
                            required
                            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="">Selecione a conta corrente...</option>
                            {contasParaPagamento.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nome}
                              </option>
                            ))}
                          </select>

                          <input
                            type="date"
                            name="dataPagamento"
                            defaultValue={hojeISO()}
                            required
                            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <BotaoConfirmar
                          mensagem={`Confirmar pagamento da fatura de ${formatarCentavos(
                            fatura.valorTotalInformadoCentavos || reconciliacao.totalExplicadoCentavos,
                          )}? Isto criará uma liquidação de passivo sem duplicar despesas no Dashboard.`}
                          className="btn btn-primary text-xs"
                        >
                          Liquidar / Pagar Fatura
                        </BotaoConfirmar>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
