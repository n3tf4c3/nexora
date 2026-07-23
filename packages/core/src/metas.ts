export interface MetaCalculada {
  percentual: number; // 0 a 100
  restanteCentavos: number;
  concluida: boolean;
}

export function calcularProgressoMeta({
  valorAtualCentavos,
  valorAlvoCentavos,
}: {
  valorAtualCentavos: number;
  valorAlvoCentavos: number;
}): MetaCalculada {
  if (valorAlvoCentavos <= 0) {
    return {
      percentual: 100,
      restanteCentavos: 0,
      concluida: true,
    };
  }

  const percentual = Math.min(
    100,
    Math.max(0, Math.round((valorAtualCentavos / valorAlvoCentavos) * 100)),
  );
  const restanteCentavos = Math.max(0, valorAlvoCentavos - valorAtualCentavos);
  const concluida = valorAtualCentavos >= valorAlvoCentavos;

  return {
    percentual,
    restanteCentavos,
    concluida,
  };
}

export function calcularRitmoAporteSugerido({
  valorRestanteCentavos,
  dataAlvo,
  dataAtual,
}: {
  valorRestanteCentavos: number;
  dataAlvo?: string | null;
  dataAtual: string; // "YYYY-MM-DD"
}): number {
  if (valorRestanteCentavos <= 0 || !dataAlvo) return 0;

  const [anoA, mesA] = dataAtual.split("-").map(Number);
  const [anoT, mesT] = dataAlvo.split("-").map(Number);

  if (
    anoA === undefined ||
    mesA === undefined ||
    anoT === undefined ||
    mesT === undefined
  ) {
    return valorRestanteCentavos;
  }

  const mesesA = anoA * 12 + (mesA - 1);
  const mesesT = anoT * 12 + (mesT - 1);
  const mesesRestantes = Math.max(1, mesesT - mesesA + 1);

  return Math.ceil(valorRestanteCentavos / mesesRestantes);
}
