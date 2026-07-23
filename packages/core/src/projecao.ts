import { limitesDoMes, mesSeguinte } from "./datas";
import { gerarOcorrenciasParaRegra, type RegraRecorrencia } from "./recorrencias";

export interface TransacaoParaProjecao {
  id: string;
  data: string; // "YYYY-MM-DD"
  tipo: "entrada" | "saida";
  natureza: string;
  estado: "efetivada" | "prevista" | "cancelada";
  valorCentavos: number;
  recorrenciaId?: string | null;
  faturaId?: string | null;
}

export interface FaturaParaProjecao {
  id: string;
  mesReferencia: string; // "YYYY-MM"
  dataVencimento: string; // "YYYY-MM-DD"
  status: string;
  valorTotalInformadoCentavos?: number | null;
  totalExplicadoCentavos: number;
}

export interface MesProjecao {
  mesReferencia: string; // "YYYY-MM"
  inicioISO: string;
  fimISO: string;
  saldoInicialCentavos: number;
  entradasEfetivadasCentavos: number;
  entradasPrevistasCentavos: number;
  saidasEfetivadasCentavos: number;
  saidasPrevistasCentavos: number;
  saldoMesCentavos: number;
  saldoAcumuladoCentavos: number;
  alertaSaldoNegativo: boolean;
}

export interface ResultadoProjecaoFluxoCaixa {
  meses: MesProjecao[];
  temAlertaNegativo: boolean;
}

export function calcularProjecaoFluxoCaixa({
  saldoInicialConsolidadoCentavos,
  transacoes,
  faturas,
  recorrencias,
  mesInicial,
  mesesProjecao = 12,
}: {
  saldoInicialConsolidadoCentavos: number;
  transacoes: TransacaoParaProjecao[];
  faturas: FaturaParaProjecao[];
  recorrencias: RegraRecorrencia[];
  mesInicial: string;
  mesesProjecao?: number;
}): ResultadoProjecaoFluxoCaixa {
  const meses: MesProjecao[] = [];
  let saldoAcumulado = saldoInicialConsolidadoCentavos;
  let mesAtualRef = mesInicial;

  for (let i = 0; i < mesesProjecao; i++) {
    const { inicio, fim } = limitesDoMes(mesAtualRef);
    const saldoInicialDoMes = saldoAcumulado;

    let entradasEfetivadasCentavos = 0;
    let entradasPrevistasCentavos = 0;
    let saidasEfetivadasCentavos = 0;
    let saidasPrevistasCentavos = 0;

    // 1. Somar transações efetivadas do mês
    for (const t of transacoes) {
      if (t.data >= inicio && t.data <= fim && t.estado === "efetivada") {
        if (t.natureza === "competencia" || t.natureza === "ajuste_saldo") {
          if (t.tipo === "entrada") {
            entradasEfetivadasCentavos += t.valorCentavos;
          } else if (t.tipo === "saida") {
            saidasEfetivadasCentavos += t.valorCentavos;
          }
        }
      }
    }

    // 2. Somar faturas de cartão não pagas com vencimento neste mês
    for (const f of faturas) {
      if (f.mesReferencia === mesAtualRef && f.status !== "paga") {
        const valorFatura = f.valorTotalInformadoCentavos ?? f.totalExplicadoCentavos;
        saidasPrevistasCentavos += valorFatura;
      }
    }

    // 3. Somar ocorrências previstas das regras de recorrência ativas
    for (const r of recorrencias) {
      const ocorrencias = gerarOcorrenciasParaRegra({
        regra: r,
        inicioPeriodo: inicio,
        fimPeriodo: fim,
      });

      for (const oc of ocorrencias) {
        // Verificar se já existe transação efetivada no mês correspondente a esta recorrência
        const jaEfetivada = transacoes.some(
          (t) =>
            t.recorrenciaId === r.id &&
            t.data >= inicio &&
            t.data <= fim &&
            t.estado === "efetivada",
        );

        if (!jaEfetivada) {
          if (oc.tipo === "entrada") {
            entradasPrevistasCentavos += oc.valorCentavos;
          } else if (oc.tipo === "saida") {
            saidasPrevistasCentavos += oc.valorCentavos;
          }
        }
      }
    }

    const totalEntradas = entradasEfetivadasCentavos + entradasPrevistasCentavos;
    const totalSaidas = saidasEfetivadasCentavos + saidasPrevistasCentavos;
    const saldoMesCentavos = totalEntradas - totalSaidas;
    saldoAcumulado += saldoMesCentavos;

    const alertaSaldoNegativo = saldoAcumulado < 0;

    meses.push({
      mesReferencia: mesAtualRef,
      inicioISO: inicio,
      fimISO: fim,
      saldoInicialCentavos: saldoInicialDoMes,
      entradasEfetivadasCentavos,
      entradasPrevistasCentavos,
      saidasEfetivadasCentavos,
      saidasPrevistasCentavos,
      saldoMesCentavos,
      saldoAcumuladoCentavos: saldoAcumulado,
      alertaSaldoNegativo,
    });

    mesAtualRef = mesSeguinte(mesAtualRef);
  }

  const temAlertaNegativo = meses.some((m) => m.alertaSaldoNegativo);

  return {
    meses,
    temAlertaNegativo,
  };
}
