export interface RentabilidadeInvestimento {
  ganhoCentavos: number;
  percentualRendimento: number; // Ex: 5.25 para +5.25%
}

export function calcularRentabilidade({
  valorInvestidoCentavos,
  valorAtualCentavos,
}: {
  valorInvestidoCentavos: number;
  valorAtualCentavos: number;
}): RentabilidadeInvestimento {
  const ganhoCentavos = valorAtualCentavos - valorInvestidoCentavos;

  if (valorInvestidoCentavos <= 0) {
    return {
      ganhoCentavos: 0,
      percentualRendimento: 0,
    };
  }

  const pct = ((valorAtualCentavos - valorInvestidoCentavos) / valorInvestidoCentavos) * 100;
  const percentualRendimento = Number(pct.toFixed(2));

  return {
    ganhoCentavos,
    percentualRendimento,
  };
}
