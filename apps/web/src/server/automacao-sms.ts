import type { EventoSmsReconhecido, TipoTransacao } from "@nexora/core";

type EventoTransacional = Extract<EventoSmsReconhecido, { transacional: true }>;

export type HistoricoClassificacaoSms = {
  remetente: string;
  resultado: EventoSmsReconhecido;
  contaId: string;
  categoriaId: string | null;
};

export type SugestaoClassificacaoSms = {
  contaId?: string;
  categoriaId?: string;
};

function normalizarContraparte(resultado: EventoTransacional): string {
  return resultado.contraparte.trim().toLocaleLowerCase("pt-BR");
}

/**
 * O histórico deve vir do mais recente para o mais antigo. Conta aprende pelo
 * mesmo remetente/parser; categoria exige também evento e contraparte iguais.
 */
export function sugerirClassificacaoSms(
  pendencia: { remetente: string; resultado: EventoSmsReconhecido },
  historico: readonly HistoricoClassificacaoSms[],
): SugestaoClassificacaoSms {
  if (!pendencia.resultado.transacional) return {};

  let contaId: string | undefined;
  let categoriaId: string | undefined;
  const contraparte = normalizarContraparte(pendencia.resultado);

  for (const item of historico) {
    if (!item.resultado.transacional || item.remetente !== pendencia.remetente) continue;

    if (!contaId && item.resultado.parserId === pendencia.resultado.parserId) {
      contaId = item.contaId;
    }
    if (
      !categoriaId &&
      item.categoriaId &&
      item.resultado.evento === pendencia.resultado.evento &&
      normalizarContraparte(item.resultado) === contraparte
    ) {
      categoriaId = item.categoriaId;
    }
    if (contaId && categoriaId) break;
  }

  return { contaId, categoriaId };
}

export type MensagemParaMetricasAutomacao = {
  status: "pendente" | "confirmada" | "ignorada";
  criadaEm: Date;
  revisadaEm: Date | null;
  interpretacao?: EventoSmsReconhecido;
  transacao?: {
    tipo: TipoTransacao;
    valorCentavos: number;
  };
};

export type MetricasParser = {
  parserId: string;
  parserVersao: number;
  reconhecidas: number;
  confirmadas: number;
  acertosEssenciais: number;
};

export type MetricasAutomacao = {
  capturadas: number;
  reconhecidas: number;
  pendentes: number;
  confirmadas: number;
  ignoradas: number;
  coberturaParserPct: number;
  palpitesConfirmados: number;
  acertosEssenciais: number;
  precisaoEssencialPct: number;
  correcoesTipo: number;
  correcoesValor: number;
  tempoMedianoRevisaoMin: number | null;
  porParser: MetricasParser[];
};

function percentual(parte: number, total: number): number {
  return total === 0 ? 0 : Math.round((parte / total) * 100);
}

function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  const valor =
    ordenados.length % 2 === 0
      ? ((ordenados[meio - 1] ?? 0) + (ordenados[meio] ?? 0)) / 2
      : (ordenados[meio] ?? 0);
  return Math.round(valor);
}

export function calcularMetricasAutomacao(
  mensagens: readonly MensagemParaMetricasAutomacao[],
): MetricasAutomacao {
  let reconhecidas = 0;
  let pendentes = 0;
  let confirmadas = 0;
  let ignoradas = 0;
  let palpitesConfirmados = 0;
  let acertosEssenciais = 0;
  let correcoesTipo = 0;
  let correcoesValor = 0;
  const temposRevisao: number[] = [];
  const porParser = new Map<string, MetricasParser>();

  for (const mensagem of mensagens) {
    if (mensagem.status === "pendente") pendentes += 1;
    if (mensagem.status === "confirmada") confirmadas += 1;
    if (mensagem.status === "ignorada") ignoradas += 1;

    if (mensagem.revisadaEm) {
      temposRevisao.push(
        Math.max(0, (mensagem.revisadaEm.getTime() - mensagem.criadaEm.getTime()) / 60_000),
      );
    }

    const interpretacao = mensagem.interpretacao;
    if (!interpretacao) continue;
    reconhecidas += 1;

    const chaveParser = `${interpretacao.parserId}@${interpretacao.parserVersao}`;
    const metricasParser = porParser.get(chaveParser) ?? {
      parserId: interpretacao.parserId,
      parserVersao: interpretacao.parserVersao,
      reconhecidas: 0,
      confirmadas: 0,
      acertosEssenciais: 0,
    };
    metricasParser.reconhecidas += 1;

    if (
      mensagem.status === "confirmada" &&
      interpretacao.transacional &&
      mensagem.transacao
    ) {
      palpitesConfirmados += 1;
      metricasParser.confirmadas += 1;
      const tipoCorreto = mensagem.transacao.tipo === interpretacao.tipoTransacao;
      const valorCorreto = mensagem.transacao.valorCentavos === interpretacao.valorCentavos;
      if (!tipoCorreto) correcoesTipo += 1;
      if (!valorCorreto) correcoesValor += 1;
      if (tipoCorreto && valorCorreto) {
        acertosEssenciais += 1;
        metricasParser.acertosEssenciais += 1;
      }
    }

    porParser.set(chaveParser, metricasParser);
  }

  return {
    capturadas: mensagens.length,
    reconhecidas,
    pendentes,
    confirmadas,
    ignoradas,
    coberturaParserPct: percentual(reconhecidas, mensagens.length),
    palpitesConfirmados,
    acertosEssenciais,
    precisaoEssencialPct: percentual(acertosEssenciais, palpitesConfirmados),
    correcoesTipo,
    correcoesValor,
    tempoMedianoRevisaoMin: mediana(temposRevisao),
    porParser: [...porParser.values()].sort((a, b) =>
      a.parserId.localeCompare(b.parserId, "pt-BR"),
    ),
  };
}
