import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { interpretacoesSms, mensagensSms, transacoes } from "@/db/schema";
import { Topo } from "@/components/topo";
import { calcularMetricasAutomacao } from "@/server/automacao-sms";
import { usuarioLogadoId } from "@/server/posse";

function formatarDuracao(minutos: number | null): string {
  if (minutos === null) return "Sem revisões medidas";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.round((minutos / 60) * 10) / 10;
  if (horas < 24) return `${horas.toLocaleString("pt-BR")} h`;
  return `${Math.round((horas / 24) * 10) / 10} d`;
}

function formatarIdade(instante: Date | null): string {
  if (!instante) return "Fila vazia";
  const minutos = Math.max(0, Math.floor((Date.now() - instante.getTime()) / 60_000));
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas} h`;
  return `${Math.floor(horas / 24)} d`;
}

export default async function SaudeAutomacaoPage() {
  const usuarioId = await usuarioLogadoId();
  const [mensagens, interpretacoes] = await Promise.all([
    db
      .select({
        id: mensagensSms.id,
        status: mensagensSms.status,
        recebidaEm: mensagensSms.recebidaEm,
        criadaEm: mensagensSms.criadoEm,
        revisadaEm: mensagensSms.revisadaEm,
        tipoTransacao: transacoes.tipo,
        valorCentavos: transacoes.valorCentavos,
      })
      .from(mensagensSms)
      .leftJoin(transacoes, eq(transacoes.id, mensagensSms.transacaoId))
      .where(eq(mensagensSms.usuarioId, usuarioId)),
    db
      .select({
        id: interpretacoesSms.id,
        mensagemId: interpretacoesSms.mensagemId,
        resultado: interpretacoesSms.resultado,
      })
      .from(interpretacoesSms)
      .innerJoin(
        mensagensSms,
        and(
          eq(mensagensSms.id, interpretacoesSms.mensagemId),
          eq(mensagensSms.usuarioId, usuarioId),
        ),
      )
      .orderBy(desc(interpretacoesSms.criadoEm), desc(interpretacoesSms.id)),
  ]);

  const interpretacaoPorMensagem = new Map<string, (typeof interpretacoes)[number]>();
  for (const interpretacao of interpretacoes) {
    if (!interpretacaoPorMensagem.has(interpretacao.mensagemId)) {
      interpretacaoPorMensagem.set(interpretacao.mensagemId, interpretacao);
    }
  }

  const metricas = calcularMetricasAutomacao(
    mensagens.map((mensagem) => {
      const interpretacao = interpretacaoPorMensagem.get(mensagem.id)?.resultado;
      const transacao =
        mensagem.tipoTransacao && mensagem.valorCentavos !== null
          ? { tipo: mensagem.tipoTransacao, valorCentavos: mensagem.valorCentavos }
          : undefined;
      return {
        status: mensagem.status,
        criadaEm: mensagem.criadaEm,
        revisadaEm: mensagem.revisadaEm,
        interpretacao,
        transacao,
      };
    }),
  );
  const pendenciaMaisAntiga = mensagens
    .filter((mensagem) => mensagem.status === "pendente")
    .sort((a, b) => a.recebidaEm.getTime() - b.recebidaEm.getTime())[0]?.recebidaEm ?? null;

  const cartoes = [
    {
      rotulo: "SMS capturados",
      valor: String(metricas.capturadas),
      detalhe: `${metricas.confirmadas} confirmados · ${metricas.ignoradas} ignorados`,
    },
    {
      rotulo: "Cobertura do parser",
      valor: `${metricas.coberturaParserPct}%`,
      detalhe: `${metricas.reconhecidas} de ${metricas.capturadas} mensagens reconhecidas`,
    },
    {
      rotulo: "Precisão essencial",
      valor:
        metricas.palpitesConfirmados > 0 ? `${metricas.precisaoEssencialPct}%` : "Sem amostra",
      detalhe: "Tipo e valor mantidos na confirmação",
    },
    {
      rotulo: "Fila web",
      valor: String(metricas.pendentes),
      detalhe: `Mais antiga: ${formatarIdade(pendenciaMaisAntiga)}`,
    },
  ];

  return (
    <>
      <Topo
        titulo="Saúde da automação"
        subtitulo="Cobertura e precisão calculadas a partir do histórico real do Nexora."
      >
        <Link href="/fila" className="btn btn-primary">
          Revisar fila
        </Link>
      </Topo>

      <div className="mx-auto w-full max-w-[1160px] p-4 sm:p-6">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cartoes.map((cartao) => (
            <div key={cartao.rotulo} className="card">
              <span className="card-kicker">{cartao.rotulo}</span>
              <strong className="text-[26px]">{cartao.valor}</strong>
              <span className="text-xs leading-5 text-(--color-neutral-600)">{cartao.detalhe}</span>
            </div>
          ))}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="card">
            <h2 className="card-title mb-4">Qualidade das confirmações</h2>
            <dl className="m-0 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-(--color-neutral-600)">Palpites confirmados</dt>
                <dd className="m-0 mt-1 text-xl font-bold">{metricas.palpitesConfirmados}</dd>
              </div>
              <div>
                <dt className="text-xs text-(--color-neutral-600)">Sem ajuste essencial</dt>
                <dd className="m-0 mt-1 text-xl font-bold">{metricas.acertosEssenciais}</dd>
              </div>
              <div>
                <dt className="text-xs text-(--color-neutral-600)">Correções de tipo</dt>
                <dd className="m-0 mt-1 text-xl font-bold">{metricas.correcoesTipo}</dd>
              </div>
              <div>
                <dt className="text-xs text-(--color-neutral-600)">Correções de valor</dt>
                <dd className="m-0 mt-1 text-xl font-bold">{metricas.correcoesValor}</dd>
              </div>
            </dl>
          </section>

          <section className="card">
            <h2 className="card-title mb-4">Tempo de revisão</h2>
            <p className="m-0 text-[28px] font-extrabold">
              {formatarDuracao(metricas.tempoMedianoRevisaoMin)}
            </p>
            <p className="mt-2 mb-0 text-sm leading-6 text-(--color-neutral-600)">
              Mediana entre a chegada ao servidor e a decisão de confirmar ou ignorar. O indicador
              melhora conforme novas mensagens são revisadas.
            </p>
          </section>
        </div>

        <section className="card mb-6">
          <h2 className="card-title mb-4">Desempenho por parser</h2>
          {metricas.porParser.length === 0 ? (
            <p className="text-muted m-0">Ainda não há mensagens reconhecidas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Parser</th>
                    <th>Reconhecidas</th>
                    <th>Confirmadas</th>
                    <th>Precisão essencial</th>
                  </tr>
                </thead>
                <tbody>
                  {metricas.porParser.map((parser) => (
                    <tr key={`${parser.parserId}@${parser.parserVersao}`}>
                      <td className="font-semibold">
                        {parser.parserId} v{parser.parserVersao}
                      </td>
                      <td>{parser.reconhecidas}</td>
                      <td>{parser.confirmadas}</td>
                      <td>
                        {parser.confirmadas > 0
                          ? `${Math.round((parser.acertosEssenciais / parser.confirmadas) * 100)}%`
                          : "Sem amostra"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="rounded-(--radius-lg) border border-(--color-divider) bg-(--color-accent-100) p-4 text-sm leading-6">
          <strong>Leitura honesta dos números:</strong> cobertura do parser mede apenas os SMS que
          chegaram ao Nexora. Ela não prova que o banco enviou SMS para todas as movimentações. A
          completude financeira será verificada depois por faturas e outras âncoras de reconciliação.
        </aside>
      </div>
    </>
  );
}
