import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { formatarCentavos } from "@nexora/core";
import { db } from "@/db";
import { contas } from "@/db/schema";
import { campo } from "@/components/estilos";
import { IconeMais } from "@/components/icones";
import { Topo } from "@/components/topo";
import { usuarioLogadoId } from "@/server/posse";
import { listarInvestimentosDoUsuario } from "@/server/investimentos";
import {
  atualizarPosicaoAction,
  criarInvestimentoAction,
  registrarAporteInvestimentoAction,
} from "./actions";

export default async function InvestimentosPage() {
  const usuarioId = await usuarioLogadoId();

  const [listaContas, carteira] = await Promise.all([
    db
      .select({ id: contas.id, nome: contas.nome })
      .from(contas)
      .where(eq(contas.usuarioId, usuarioId))
      .orderBy(asc(contas.nome)),
    listarInvestimentosDoUsuario({ usuarioId }),
  ]);

  const { resumo, ativos } = carteira;

  return (
    <>
      <Topo
        titulo="Carteira de Investimentos"
        subtitulo="Gerencie a posição patrimonial e acompanhe o rendimento dos seus ativos."
      >
        <a href="#novo-ativo" className="btn btn-primary">
          <IconeMais tamanho={15} traco={2.2} />
          Novo ativo
        </a>
      </Topo>

      <div className="mx-auto w-full max-w-[1160px] p-4 sm:p-6 space-y-6">
        {/* KPI Cards de Resumo da Carteira */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card border-l-4 border-l-indigo-500">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Investido
            </span>
            <h3 className="text-2xl font-bold text-white mt-1 font-mono">
              {formatarCentavos(resumo.totalInvestidoCentavos)}
            </h3>
          </div>

          <div className="card border-l-4 border-l-cyan-500">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Valor Atual de Mercado
            </span>
            <h3 className="text-2xl font-bold text-white mt-1 font-mono">
              {formatarCentavos(resumo.totalAtualCentavos)}
            </h3>
          </div>

          <div
            className={`card border-l-4 ${
              resumo.rentabilidadeTotal.ganhoCentavos >= 0
                ? "border-l-emerald-500"
                : "border-l-rose-500"
            }`}
          >
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Rendimento Total
            </span>
            <div className="flex items-baseline gap-2 mt-1 font-mono">
              <h3
                className={`text-2xl font-bold ${
                  resumo.rentabilidadeTotal.ganhoCentavos >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {resumo.rentabilidadeTotal.ganhoCentavos >= 0 ? "+" : "−"}{" "}
                {formatarCentavos(Math.abs(resumo.rentabilidadeTotal.ganhoCentavos))}
              </h3>
              <span
                className={`text-xs font-bold ${
                  resumo.rentabilidadeTotal.percentualRendimento >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                ({resumo.rentabilidadeTotal.percentualRendimento >= 0 ? "+" : ""}
                {resumo.rentabilidadeTotal.percentualRendimento}%)
              </span>
            </div>
          </div>
        </div>

        {/* Formulário de Novo Ativo */}
        <div id="novo-ativo" className="card">
          <h3 className="card-title mb-4">Novo Ativo de Investimento</h3>
          {listaContas.length === 0 ? (
            <p className="text-muted m-0 text-sm">
              Crie uma{" "}
              <Link href="/contas" className="link">
                conta
              </Link>{" "}
              primeiro para vincular seus investimentos.
            </p>
          ) : (
            <form action={criarInvestimentoAction}>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                <div className="field lg:col-span-2">
                  <label htmlFor="inv-nome">Nome do Ativo</label>
                  <input
                    id="inv-nome"
                    name="nomeAtivo"
                    placeholder="Ex.: Tesouro Selic 2029, CDB Banco Master..."
                    required
                    className={campo}
                  />
                </div>

                <div className="field">
                  <label htmlFor="inv-tipo">Classe de Ativo</label>
                  <select id="inv-tipo" name="tipoAtivo" defaultValue="renda_fixa" className={campo}>
                    <option value="renda_fixa">Renda Fixa</option>
                    <option value="fundo">Fundo de Investimento</option>
                    <option value="fii">Fundo Imobiliário (FII)</option>
                    <option value="acao">Ação</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="inv-conta">Conta Custodiante</label>
                  <select id="inv-conta" name="contaId" required defaultValue="" className={campo}>
                    <option value="" disabled>
                      Selecione...
                    </option>
                    {listaContas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field lg:col-span-2">
                  <label htmlFor="inv-valorInvestido">Valor Investido Inicial (R$)</label>
                  <input
                    id="inv-valorInvestido"
                    name="valorInvestido"
                    placeholder="0,00"
                    inputMode="decimal"
                    className={campo}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button type="submit" className="btn btn-primary">
                  <IconeMais tamanho={15} traco={2.2} />
                  Cadastrar ativo
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Tabela de Ativos da Carteira */}
        <div className="card">
          <h3 className="card-title mb-4">Ativos da Carteira</h3>

          {ativos.length === 0 ? (
            <div className="estado-vazio">
              <p className="m-0">Nenhum ativo de investimento cadastrado na carteira.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ativo / Classe</th>
                    <th>Conta Custodiante</th>
                    <th className="text-right">Investido</th>
                    <th className="text-right">Posição Atual</th>
                    <th className="text-right">Rentabilidade</th>
                    <th className="text-right">Ações / Atualizar Posição</th>
                  </tr>
                </thead>
                <tbody>
                  {ativos.map((atv) => (
                    <tr key={atv.id}>
                      <td>
                        <div className="font-bold text-white">{atv.nomeAtivo}</div>
                        <div className="text-[11px] uppercase tracking-wider text-indigo-400 font-semibold">
                          {atv.tipoAtivo.replace("_", " ")}
                        </div>
                      </td>
                      <td className="text-slate-400">{atv.nomeConta}</td>
                      <td className="text-right font-mono text-slate-300">
                        {formatarCentavos(atv.valorInvestidoCentavos)}
                      </td>
                      <td className="text-right font-mono font-bold text-white">
                        {formatarCentavos(atv.valorAtualCentavos)}
                      </td>
                      <td className="text-right font-mono font-semibold">
                        <span
                          style={{
                            color:
                              atv.rentabilidade.ganhoCentavos >= 0
                                ? "var(--color-income)"
                                : "var(--color-expense)",
                          }}
                        >
                          {atv.rentabilidade.ganhoCentavos >= 0 ? "+" : "−"}{" "}
                          {formatarCentavos(Math.abs(atv.rentabilidade.ganhoCentavos))}
                          <div className="text-[11px]">
                            ({atv.rentabilidade.percentualRendimento >= 0 ? "+" : ""}
                            {atv.rentabilidade.percentualRendimento}%)
                          </div>
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex flex-col items-end gap-2">
                          {/* Atualizar posição de mercado */}
                          <form
                            action={atualizarPosicaoAction}
                            className="flex items-center gap-1.5"
                          >
                            <input type="hidden" name="id" value={atv.id} />
                            <input
                              name="novoValorAtual"
                              placeholder="Novo R$ Atual"
                              required
                              inputMode="decimal"
                              className="w-28 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-right font-mono text-white placeholder-slate-500"
                            />
                            <button
                              type="submit"
                              className="rounded-lg bg-indigo-600/80 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-600"
                            >
                              Atualizar
                            </button>
                          </form>

                          {/* Novo Aporte */}
                          <form
                            action={registrarAporteInvestimentoAction}
                            className="flex items-center gap-1.5"
                          >
                            <input type="hidden" name="investimentoId" value={atv.id} />
                            <select
                              name="contaOrigemId"
                              required
                              defaultValue=""
                              className="w-28 rounded-lg border border-slate-800 bg-slate-900 px-1 py-1 text-[11px] text-slate-300"
                            >
                              <option value="" disabled>
                                Origem...
                              </option>
                              {listaContas.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.nome}
                                </option>
                              ))}
                            </select>
                            <input
                              name="valorAporte"
                              placeholder="R$ Aporte"
                              required
                              inputMode="decimal"
                              className="w-24 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-right font-mono text-white placeholder-slate-500"
                            />
                            <button
                              type="submit"
                              className="rounded-lg bg-emerald-600/80 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-600"
                            >
                              + Aportar
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
