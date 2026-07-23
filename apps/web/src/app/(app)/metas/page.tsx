import { asc, eq } from "drizzle-orm";
import { formatarCentavos } from "@nexora/core";
import { db } from "@/db";
import { contas } from "@/db/schema";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { botaoPerigo, campo } from "@/components/estilos";
import { IconeMais } from "@/components/icones";
import { Topo } from "@/components/topo";
import { usuarioLogadoId } from "@/server/posse";
import { listarMetasDoUsuario } from "@/server/metas";
import {
  criarMetaAction,
  excluirMetaAction,
  registrarAporteMetaAction,
} from "./actions";

export default async function MetasPage() {
  const usuarioId = await usuarioLogadoId();

  const [listaContas, listaMetas] = await Promise.all([
    db
      .select({ id: contas.id, nome: contas.nome })
      .from(contas)
      .where(eq(contas.usuarioId, usuarioId))
      .orderBy(asc(contas.nome)),
    listarMetasDoUsuario({ usuarioId }),
  ]);

  return (
    <>
      <Topo
        titulo="Metas de Aquisição"
        subtitulo="Planeje compras e reservas de patrimônio com aportes acumulativos."
      >
        <a href="#nova-meta" className="btn btn-primary">
          <IconeMais tamanho={15} traco={2.2} />
          Nova meta
        </a>
      </Topo>

      <div className="mx-auto w-full max-w-[1160px] p-4 sm:p-6 space-y-6">
        {/* Formulário de Criar Nova Meta */}
        <div id="nova-meta" className="card">
          <h3 className="card-title mb-4">Nova meta ou objetivo financeiro</h3>
          <form action={criarMetaAction}>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="field lg:col-span-2">
                <label htmlFor="meta-nome">Nome do Objetivo</label>
                <input
                  id="meta-nome"
                  name="nome"
                  placeholder="Ex.: Reserva de Emergência, Viagem para Europa..."
                  required
                  className={campo}
                />
              </div>

              <div className="field">
                <label htmlFor="meta-valorAlvo">Valor Alvo (R$)</label>
                <input
                  id="meta-valorAlvo"
                  name="valorAlvo"
                  placeholder="10.000,00"
                  required
                  inputMode="decimal"
                  className={campo}
                />
              </div>

              <div className="field">
                <label htmlFor="meta-dataAlvo">Data Limite (opcional)</label>
                <input
                  id="meta-dataAlvo"
                  name="dataAlvo"
                  type="date"
                  className={campo}
                />
              </div>

              <div className="field lg:col-span-2">
                <label htmlFor="meta-descricao">Descrição / Detalhes (opcional)</label>
                <input
                  id="meta-descricao"
                  name="descricao"
                  placeholder="Ex.: 6 meses de custo fixo guardados no CDB 100% CDI"
                  className={campo}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button type="submit" className="btn btn-primary">
                <IconeMais tamanho={15} traco={2.2} />
                Salvar meta
              </button>
            </div>
          </form>
        </div>

        {/* Listagem de Metas de Aquisição */}
        {listaMetas.length === 0 ? (
          <div className="card estado-vazio">
            <p className="m-0">Nenhuma meta financeira cadastrada no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {listaMetas.map((m) => (
              <div
                key={m.id}
                className={`card relative overflow-hidden flex flex-col justify-between border ${
                  m.concluida
                    ? "border-emerald-500/40 bg-emerald-950/10"
                    : "border-slate-800 bg-[#0c121e]"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        {m.concluida ? "Concluída ✓" : "Em Progresso"}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-0.5">{m.nome}</h3>
                    </div>
                    <form action={excluirMetaAction.bind(null, m.id)}>
                      <BotaoConfirmar mensagem="Excluir esta meta?" className={botaoPerigo}>
                        Excluir
                      </BotaoConfirmar>
                    </form>
                  </div>

                  {m.descricao && <p className="text-xs text-slate-400 mb-4">{m.descricao}</p>}

                  {/* Barra de Progresso */}
                  <div className="space-y-1.5 my-4">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300 font-bold">
                        {formatarCentavos(m.valorAtualCentavos)}
                      </span>
                      <span className="text-slate-500">
                        Alvo: {formatarCentavos(m.valorAlvoCentavos)}
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800 p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          m.concluida ? "bg-emerald-500" : "bg-indigo-500 glow-indigo"
                        }`}
                        style={{ width: `${m.progresso.percentual}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{m.progresso.percentual}% atingido</span>
                      {m.dataAlvo && <span>Meta para {m.dataAlvo}</span>}
                    </div>
                  </div>

                  {!m.concluida && m.aporteSugeridoMensalCentavos > 0 && (
                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-2.5 text-xs text-indigo-300 mb-4 flex items-center justify-between">
                      <span>Aporte mensal recomendado:</span>
                      <span className="font-mono font-bold">
                        {formatarCentavos(m.aporteSugeridoMensalCentavos)}/mês
                      </span>
                    </div>
                  )}
                </div>

                {/* Formulário de Aporte Rápido */}
                {!m.concluida && (
                  <form
                    action={registrarAporteMetaAction}
                    className="mt-4 border-t border-slate-800/80 pt-3"
                  >
                    <input type="hidden" name="metaId" value={m.id} />
                    <div className="text-xs font-bold text-slate-400 mb-2">Realizar Aporte:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select name="contaId" required defaultValue="" className={campo}>
                        <option value="" disabled>
                          Conta origem...
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
                        className={campo}
                      />
                      <button type="submit" className="btn btn-primary w-full">
                        + Aportar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
