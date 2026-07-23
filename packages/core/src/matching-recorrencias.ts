import type { OcorrenciaPrevista } from "./recorrencias";

export interface TransacaoParaMatching {
  id?: string;
  data: string; // "YYYY-MM-DD"
  contaId: string;
  tipo: "entrada" | "saida";
  valorCentavos: number;
}

export function encontrarOcorrenciaCorrespondente({
  transacaoReal,
  ocorrenciasPrevistas,
}: {
  transacaoReal: TransacaoParaMatching;
  ocorrenciasPrevistas: OcorrenciaPrevista[];
}): OcorrenciaPrevista | null {
  const mesReal = transacaoReal.data.slice(0, 7);

  for (const oc of ocorrenciasPrevistas) {
    if (oc.data.slice(0, 7) !== mesReal) continue;
    if (oc.tipo !== transacaoReal.tipo) continue;
    if (oc.contaId !== transacaoReal.contaId) continue;
    if (oc.valorCentavos !== transacaoReal.valorCentavos) continue;

    return oc;
  }

  return null;
}
