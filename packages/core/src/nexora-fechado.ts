import type { NaturezaTransacao, StatusFatura, TipoTransacao } from "./contratos";

export interface ItemLancamentoFatura {
  valorCentavos: number;
  tipo: TipoTransacao;
  natureza: NaturezaTransacao;
}

export interface ResultadoReconciliacaoFatura {
  totalExplicadoCentavos: number;
  diferencaCentavos: number;
  percentualExplicado: number;
  statusSugerido: StatusFatura;
}

export function calcularReconciliacaoFatura({
  valorTotalInformadoCentavos,
  lancamentos,
  statusAtual = "aberta",
}: {
  valorTotalInformadoCentavos?: number | null;
  lancamentos: ItemLancamentoFatura[];
  statusAtual?: StatusFatura;
}): ResultadoReconciliacaoFatura {
  // Somar despesas/compras de competência como positivo, deduzir créditos/estornos
  let totalExplicadoCentavos = 0;

  for (const l of lancamentos) {
    if (l.natureza === "competencia" || l.natureza === "ajuste_saldo") {
      if (l.tipo === "saida") {
        totalExplicadoCentavos += l.valorCentavos;
      } else if (l.tipo === "entrada") {
        totalExplicadoCentavos -= l.valorCentavos;
      }
    }
  }

  // Garantir não negativo
  totalExplicadoCentavos = Math.max(0, totalExplicadoCentavos);

  if (
    valorTotalInformadoCentavos === undefined ||
    valorTotalInformadoCentavos === null ||
    valorTotalInformadoCentavos <= 0
  ) {
    return {
      totalExplicadoCentavos,
      diferencaCentavos: 0,
      percentualExplicado: 100,
      statusSugerido: statusAtual === "paga" ? "paga" : "aberta",
    };
  }

  const diferencaCentavos = Math.max(0, valorTotalInformadoCentavos - totalExplicadoCentavos);
  const percentualExplicado = Math.min(
    100,
    Math.max(0, Math.round((totalExplicadoCentavos / valorTotalInformadoCentavos) * 100)),
  );

  let statusSugerido: StatusFatura = statusAtual;
  if (statusAtual !== "paga") {
    if (diferencaCentavos === 0) {
      statusSugerido = "reconciliada";
    } else {
      statusSugerido = statusAtual === "aberta" ? "fechada" : statusAtual;
    }
  }

  return {
    totalExplicadoCentavos,
    diferencaCentavos,
    percentualExplicado,
    statusSugerido,
  };
}
