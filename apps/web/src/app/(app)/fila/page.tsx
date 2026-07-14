import Link from "next/link";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  categorias,
  contas,
  interpretacoesSms,
  mensagensSms,
  transacoes,
} from "@/db/schema";
import { IconeCaixaVazia } from "@/components/icones";
import { Topo } from "@/components/topo";
import { usuarioLogadoId } from "@/server/posse";
import { sugerirClassificacaoSms } from "@/server/automacao-sms";
import { PendenciaCard } from "./pendencia-card";

const FUSO = "America/Sao_Paulo";
// Fila é revisada aos poucos; renderizar sem teto degrada com captura acumulada.
const MAX_PENDENCIAS = 50;

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
      <div className="mx-auto w-full max-w-[1160px] p-4 sm:p-6">
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
                <PendenciaCard
                  key={p.id}
                  mensagemId={p.id}
                  remetente={p.remetente}
                  corpo={p.corpo}
                  recebidaEmIso={p.recebidaEm.toISOString()}
                  recebidaEmFormatada={p.recebidaEm.toLocaleString("pt-BR", {
                    timeZone: FUSO,
                  })}
                  dataSugerida={p.recebidaEm.toLocaleDateString("en-CA", { timeZone: FUSO })}
                  interpretacao={interpretacao && resultado ? { ...interpretacao, resultado } : undefined}
                  contaSugeridaId={sugestao.contaId}
                  categoriaSugeridaId={sugestao.categoriaId}
                  contas={listaContas}
                  categorias={listaCategorias}
                />
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
