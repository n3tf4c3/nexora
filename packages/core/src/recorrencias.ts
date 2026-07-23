import type {
  FrequenciaRecorrencia,
  NaturezaTransacao,
  TipoTransacao,
} from "./contratos";

export interface RegraRecorrencia {
  id: string;
  usuarioId: string;
  contaId: string;
  categoriaId?: string | null;
  tipo: TipoTransacao;
  natureza: NaturezaTransacao;
  descricao: string;
  valorCentavos: number;
  frequencia: FrequenciaRecorrencia;
  diaVencimento: number; // 1..31 para mensal/anual
  dataInicio: string; // "YYYY-MM-DD"
  dataFim?: string | null;
  ativa: boolean;
}

export interface OcorrenciaPrevista {
  recorrenciaId: string;
  data: string; // "YYYY-MM-DD"
  contaId: string;
  categoriaId?: string | null;
  tipo: TipoTransacao;
  natureza: NaturezaTransacao;
  descricao: string;
  valorCentavos: number;
}

function obterUltimoDiaDoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

function formatarISO(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function gerarOcorrenciasParaRegra({
  regra,
  inicioPeriodo,
  fimPeriodo,
}: {
  regra: RegraRecorrencia;
  inicioPeriodo: string;
  fimPeriodo: string;
}): OcorrenciaPrevista[] {
  if (!regra.ativa) return [];

  const ocorrencias: OcorrenciaPrevista[] = [];
  const [anoInicioP, mesInicioP] = inicioPeriodo.split("-").map(Number);
  const [anoFimP, mesFimP] = fimPeriodo.split("-").map(Number);

  if (
    anoInicioP === undefined ||
    mesInicioP === undefined ||
    anoFimP === undefined ||
    mesFimP === undefined
  ) {
    return [];
  }

  const limiteInicioMeses = anoInicioP * 12 + (mesInicioP - 1);
  const limiteFimMeses = anoFimP * 12 + (mesFimP - 1);

  for (let m = limiteInicioMeses; m <= limiteFimMeses; m++) {
    const ano = Math.floor(m / 12);
    const mes = (m % 12) + 1;

    let diaTarget = Math.min(regra.diaVencimento, obterUltimoDiaDoMes(ano, mes));

    if (regra.frequencia === "anual") {
      const mesInicioRegra = Number(regra.dataInicio.slice(5, 7));
      if (mes !== mesInicioRegra) continue;
    }

    const dataIso = formatarISO(ano, mes, diaTarget);

    if (dataIso < inicioPeriodo || dataIso > fimPeriodo) continue;
    if (dataIso < regra.dataInicio) continue;
    if (regra.dataFim && dataIso > regra.dataFim) continue;

    ocorrencias.push({
      recorrenciaId: regra.id,
      data: dataIso,
      contaId: regra.contaId,
      categoriaId: regra.categoriaId ?? null,
      tipo: regra.tipo,
      natureza: regra.natureza,
      descricao: regra.descricao,
      valorCentavos: regra.valorCentavos,
    });
  }

  return ocorrencias;
}
