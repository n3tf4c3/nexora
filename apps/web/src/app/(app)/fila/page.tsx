import Link from "next/link";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { formatarCentavos } from "@nexora/core";
import { db } from "@/db";
import {
  categorias,
  contas,
  interpretacoesSms,
  mensagensSms,
  transacoes,
} from "@/db/schema";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { botaoPerigo } from "@/components/estilos";
import { IconeCaixaVazia } from "@/components/icones";
import { Topo } from "@/components/topo";
import { usuarioLogadoId } from "@/server/posse";
import { sugerirClassificacaoSms } from "@/server/automacao-sms";
import { ignorarSms } from "./actions";
import { PendenciaForm } from "./pendencia-form";

const FUSO = "America/Sao_Paulo";
// Fila é revisada aos poucos; renderizar sem teto degrada com captura acumulada.
const MAX_PENDENCIAS = 50;

function valorParaCampo(centavos: number): string {
  const reais = Math.floor(centavos / 100).toLocaleString("pt-BR");
  return `${reais},${String(centavos % 100).padStart(2, "0")}`;
}

function rotuloEvento(evento: string): string {
  if (evento === "pix_recebido") return "Pix recebido";
  if (evento === "pix_enviado") return "Pix enviado";
  if (evento === "fatura_fechada") return "Fatura fechada";
  return evento;
}

export default async function FilaPage() {
  const usuarioId = await usuarioLogadoId();

  const filtroPendentes = and(
    eq(mensagensSms.usuarioId, usuarioId),
    eq(mensagensSms.status, "pendente"),
  );

  const [pendencias, [{ total }], listaContas, listaCategorias] = await Promise.all([
    db
      .select({
        id: mensagensSms.id,
        remetente: mensagensSms.remetente,
        corpo: mensagensSms.corpo,
        recebidaEm: mensagensSms.recebidaEm,
      })
      .from(mensagensSms)
      .where(filtroPendentes)
      .orderBy(asc(mensagensSms.recebidaEm))
      .limit(MAX_PENDENCIAS),
    db.select({ total: count() }).from(mensagensSms).where(filtroPendentes),
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
  ]);

  const interpretacoes =
    pendencias.length > 0
      ? await db
          .select({
            id: interpretacoesSms.id,
            mensagemId: interpretacoesSms.mensagemId,
            parserId: interpretacoesSms.parserId,
            parserVersao: interpretacoesSms.parserVersao,
            confianca: interpretacoesSms.confianca,
            resultado: interpretacoesSms.resultado,
          })
          .from(interpretacoesSms)
          .where(
            inArray(
              interpretacoesSms.mensagemId,
              pendencias.map((pendencia) => pendencia.id),
            ),
          )
          .orderBy(desc(interpretacoesSms.criadoEm), desc(interpretacoesSms.id))
      : [];
  const interpretacaoPorMensagem = new Map<string, (typeof interpretacoes)[number]>();
  for (const interpretacao of interpretacoes) {
    if (!interpretacaoPorMensagem.has(interpretacao.mensagemId)) {
      interpretacaoPorMensagem.set(interpretacao.mensagemId, interpretacao);
    }
  }

  const pendenciasTransacionais = pendencias.flatMap((pendencia) => {
    const resultado = interpretacaoPorMensagem.get(pendencia.id)?.resultado;
    return resultado?.transacional ? [{ ...pendencia, resultado }] : [];
  });
  const historicoClassificacao =
    pendenciasTransacionais.length > 0
      ? await db
          .select({
            remetente: mensagensSms.remetente,
            resultado: interpretacoesSms.resultado,
            contaId: transacoes.contaId,
            categoriaId: transacoes.categoriaId,
          })
          .from(mensagensSms)
          .innerJoin(transacoes, eq(transacoes.id, mensagensSms.transacaoId))
          .innerJoin(interpretacoesSms, eq(interpretacoesSms.mensagemId, mensagensSms.id))
          .where(
            and(
              eq(mensagensSms.usuarioId, usuarioId),
              eq(mensagensSms.status, "confirmada"),
              inArray(
                mensagensSms.remetente,
                [...new Set(pendenciasTransacionais.map((pendencia) => pendencia.remetente))],
              ),
              inArray(
                interpretacoesSms.evento,
                [...new Set(pendenciasTransacionais.map((pendencia) => pendencia.resultado.evento))],
              ),
            ),
          )
          .orderBy(desc(mensagensSms.recebidaEm), desc(interpretacoesSms.criadoEm))
          .limit(500)
      : [];

  return (
    <>
      <Topo
        titulo="Fila de confirmação"
        subtitulo="SMS capturados que o parser não confirmou sozinho."
      />
      <div className="mx-auto w-full max-w-[1160px] p-6">
        {pendencias.length === 0 ? (
          <div className="estado-vazio px-4 py-8">
            <IconeCaixaVazia tamanho={28} traco={1.6} className="mx-auto mb-3" />
            <p className="m-0 mb-2">Nenhuma pendência. Todos os SMS foram revisados.</p>
            <Link href="/" className="link">
              Ver dashboard do mês →
            </Link>
          </div>
        ) : (
          <>
            {total > pendencias.length && (
              <p className="m-0 mb-4 text-[13px] text-(--color-neutral-600)">
                Mostrando as {pendencias.length} pendências mais antigas de {total} — revise-as
                para ver as demais.
              </p>
            )}
            {pendencias.map((p) => {
              const interpretacao = interpretacaoPorMensagem.get(p.id);
              const resultado = interpretacao?.resultado;
              const sugestao = resultado
                ? sugerirClassificacaoSms(
                    { remetente: p.remetente, resultado },
                    historicoClassificacao,
                  )
                : {};
              return (
              <div key={p.id} className="card mb-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="card-title m-0">{p.remetente}</h3>
                <span className="text-[13px] text-(--color-neutral-600)">
                  {p.recebidaEm.toLocaleString("pt-BR", { timeZone: FUSO })}
                </span>
              </div>
              {interpretacao && resultado && (
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-(--color-accent-100) px-2.5 py-1 font-semibold text-(--color-accent)">
                    {rotuloEvento(resultado.evento)} reconhecido
                  </span>
                  <span className="text-(--color-neutral-600)">
                    {interpretacao.parserId} v{interpretacao.parserVersao} · {interpretacao.confianca}%
                  </span>
                </div>
              )}
              <p className="m-0 mb-4 rounded-md bg-(--color-neutral-100) p-3 text-sm whitespace-pre-wrap break-words">
                {p.corpo}
              </p>
              {resultado && !resultado.transacional ? (
                <div className="rounded-lg border border-(--color-divider) bg-(--color-neutral-100) p-4 text-sm">
                  <p className="m-0 font-semibold">Evento informativo, sem nova transação</p>
                  <p className="mt-1 mb-0 text-(--color-neutral-600)">
                    Fatura com vencimento dia {resultado.diaVencimento}, total de{" "}
                    {formatarCentavos(resultado.totalCentavos)} e mínimo de{" "}
                    {formatarCentavos(resultado.minimoCentavos)}. A associação à fatura será feita
                    na etapa de cartão de crédito.
                  </p>
                </div>
              ) : listaContas.length === 0 ? (
                <p className="text-muted m-0 text-sm">
                  Crie uma{" "}
                  <Link href="/contas" className="link">
                    conta
                  </Link>{" "}
                  antes de confirmar transações.
                </p>
              ) : (
                <PendenciaForm
                  mensagemId={p.id}
                  dataSugerida={p.recebidaEm.toLocaleDateString("en-CA", { timeZone: FUSO })}
                  tipoSugerido={resultado?.transacional ? resultado.tipoTransacao : undefined}
                  valorSugerido={
                    resultado?.transacional ? valorParaCampo(resultado.valorCentavos) : undefined
                  }
                  descricaoSugerida={
                    resultado?.transacional ? resultado.descricaoSugerida : undefined
                  }
                  contaSugeridaId={sugestao.contaId}
                  categoriaSugeridaId={sugestao.categoriaId}
                  contas={listaContas}
                  categorias={listaCategorias}
                />
              )}
              <form action={ignorarSms.bind(null, p.id)} className="mt-3">
                <BotaoConfirmar
                  mensagem="Ignorar este SMS? Ele sai da fila (o texto cru continua guardado)."
                  className={botaoPerigo}
                >
                  Ignorar este SMS
                </BotaoConfirmar>
              </form>
            </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
