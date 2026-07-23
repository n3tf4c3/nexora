import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { formatarCentavos } from "@nexora/core";
import { db } from "@/db";
import { categorias, contas } from "@/db/schema";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { botaoPerigo, campo } from "@/components/estilos";
import { IconeCategoria } from "@/components/icone-categoria";
import { IconeMais } from "@/components/icones";
import { Topo } from "@/components/topo";
import { hojeISO } from "@/lib/hoje";
import { usuarioLogadoId } from "@/server/posse";
import { listarRecorrenciasDoUsuario } from "@/server/recorrencias";
import {
  alternarStatusRecorrenciaAction,
  criarRecorrenciaAction,
  excluirRecorrenciaAction,
} from "./actions";

export default async function RecorrenciasPage() {
  const usuarioId = await usuarioLogadoId();

  const [listaContas, listaCategorias, listaRecorrencias] = await Promise.all([
    db
      .select({ id: contas.id, nome: contas.nome })
      .from(contas)
      .where(eq(contas.usuarioId, usuarioId))
      .orderBy(asc(contas.nome)),
    db
      .select({ id: categorias.id, nome: categorias.nome })
      .from(categorias)
      .where(eq(categorias.usuarioId, usuarioId))
      .orderBy(asc(categorias.nome)),
    listarRecorrenciasDoUsuario({ usuarioId }),
  ]);

  return (
    <>
      <Topo
        titulo="Recorrências"
        subtitulo="Cadastre despesas e receitas periódicas que alimentam a projeção de caixa."
      >
        <a href="#nova-recorrencia" className="btn btn-primary">
          <IconeMais tamanho={15} traco={2.2} />
          Nova recorrência
        </a>
      </Topo>

      <div className="mx-auto w-full max-w-[1160px] p-4 sm:p-6 space-y-6">
        {/* Formulário de Nova Recorrência */}
        <div id="nova-recorrencia" className="card">
          <h3 className="card-title mb-4">Nova regra de recorrência</h3>
          {listaContas.length === 0 ? (
            <p className="text-muted m-0 text-sm">
              Crie uma{" "}
              <Link href="/contas" className="link">
                conta
              </Link>{" "}
              antes de cadastrar recorrências.
            </p>
          ) : (
            <form action={criarRecorrenciaAction}>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <fieldset className="field m-0 border-0 p-0">
                  <legend className="p-0">Tipo</legend>
                  <div className="seg">
                    <label className="seg-opt">
                      <input type="radio" name="tipo" value="saida" defaultChecked />
                      Saída
                    </label>
                    <label className="seg-opt">
                      <input type="radio" name="tipo" value="entrada" />
                      Entrada
                    </label>
                  </div>
                </fieldset>

                <div className="field">
                  <label htmlFor="rec-descricao">Descrição</label>
                  <input
                    id="rec-descricao"
                    name="descricao"
                    placeholder="Ex.: Aluguel, Netflix, Salário..."
                    required
                    className={campo}
                  />
                </div>

                <div className="field">
                  <label htmlFor="rec-valor">Valor Mensal (R$)</label>
                  <input
                    id="rec-valor"
                    name="valor"
                    placeholder="0,00"
                    required
                    inputMode="decimal"
                    className={campo}
                  />
                </div>

                <div className="field">
                  <label htmlFor="rec-dia">Dia do Vencimento (1 a 31)</label>
                  <input
                    id="rec-dia"
                    name="diaVencimento"
                    type="number"
                    min={1}
                    max={31}
                    defaultValue={10}
                    required
                    className={campo}
                  />
                </div>

                <div className="field">
                  <label htmlFor="rec-frequencia">Frequência</label>
                  <select id="rec-frequencia" name="frequencia" defaultValue="mensal" className={campo}>
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                    <option value="semanal">Semanal</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="rec-conta">Conta de Origem/Destino</label>
                  <select id="rec-conta" name="contaId" required defaultValue="" className={campo}>
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

                <div className="field">
                  <label htmlFor="rec-categoria">Categoria (opcional)</label>
                  <select id="rec-categoria" name="categoriaId" className={campo}>
                    <option value="">Nenhuma</option>
                    {listaCategorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="rec-dataInicio">Data de Início</label>
                  <input
                    id="rec-dataInicio"
                    name="dataInicio"
                    type="date"
                    defaultValue={hojeISO()}
                    required
                    className={campo}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button type="submit" className="btn btn-primary">
                  <IconeMais tamanho={15} traco={2.2} />
                  Salvar recorrência
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Listagem de Recorrências Cadastradas */}
        <div className="card">
          <h3 className="card-title mb-4">Regras recorrentes ativas e pausadas</h3>

          {listaRecorrencias.length === 0 ? (
            <div className="estado-vazio">
              <p className="m-0">Nenhuma regra de recorrência cadastrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Vencimento</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Conta</th>
                    <th>Frequência</th>
                    <th className="text-right">Valor</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {listaRecorrencias.map((rec) => (
                    <tr key={rec.id}>
                      <td className="whitespace-nowrap font-semibold">
                        Dia {rec.diaVencimento}
                      </td>
                      <td className="font-medium text-white">{rec.descricao}</td>
                      <td>
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <IconeCategoria nome={rec.nomeCategoria} tamanho={24} />
                          {rec.nomeCategoria ?? "Sem categoria"}
                        </span>
                      </td>
                      <td className="text-slate-400">{rec.nomeConta}</td>
                      <td className="capitalize text-slate-400">{rec.frequencia}</td>
                      <td
                        className="text-right font-bold whitespace-nowrap font-mono"
                        style={{
                          color:
                            rec.tipo === "entrada"
                              ? "var(--color-income)"
                              : "var(--color-expense)",
                        }}
                      >
                        {rec.tipo === "entrada" ? "+" : "−"} {formatarCentavos(rec.valorCentavos)}
                      </td>
                      <td>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            rec.ativa
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {rec.ativa ? "Ativa" : "Pausada"}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-3">
                          <form
                            action={alternarStatusRecorrenciaAction.bind(null, rec.id, !rec.ativa)}
                          >
                            <button
                              type="submit"
                              className="text-xs text-indigo-400 hover:text-indigo-300 link"
                            >
                              {rec.ativa ? "Pausar" : "Ativar"}
                            </button>
                          </form>
                          <form action={excluirRecorrenciaAction.bind(null, rec.id)}>
                            <BotaoConfirmar
                              mensagem="Excluir esta regra recorrente?"
                              className={botaoPerigo}
                            >
                              Excluir
                            </BotaoConfirmar>
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
