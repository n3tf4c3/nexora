/**
 * Cálculo de ciclo de fatura de cartão de crédito.
 */

export interface CicloFatura {
  mesReferencia: string; // "YYYY-MM" do vencimento
  dataFechamento: string; // "YYYY-MM-DD"
  dataVencimento: string; // "YYYY-MM-DD"
}

function obterUltimoDiaDoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

function formatarDataISO(ano: number, mes: number, dia: number): string {
  const m = String(mes).padStart(2, "0");
  const d = String(dia).padStart(2, "0");
  return `${ano}-${m}-${d}`;
}

export function calcularCicloFatura({
  dataCompra,
  diaFechamento,
  diaVencimento,
}: {
  dataCompra: string; // "YYYY-MM-DD"
  diaFechamento: number;
  diaVencimento: number;
}): CicloFatura {
  const partes = dataCompra.split("-").map(Number);
  const anoCompra = partes[0];
  const mesCompra = partes[1];
  const diaCompra = partes[2];

  if (
    partes.length !== 3 ||
    anoCompra === undefined ||
    mesCompra === undefined ||
    diaCompra === undefined ||
    isNaN(anoCompra) ||
    isNaN(mesCompra) ||
    isNaN(diaCompra)
  ) {
    throw new Error(`Data de compra inválida: ${dataCompra}`);
  }

  if (diaFechamento < 1 || diaFechamento > 31) {
    throw new Error(`Dia de fechamento inválido: ${diaFechamento}`);
  }
  if (diaVencimento < 1 || diaVencimento > 31) {
    throw new Error(`Dia de vencimento inválido: ${diaVencimento}`);
  }

  // 1. Determinar o mês/ano de fechamento
  let anoFechamento = anoCompra;
  let mesFechamento = mesCompra;

  if (diaCompra > diaFechamento) {
    mesFechamento += 1;
    if (mesFechamento > 12) {
      mesFechamento = 1;
      anoFechamento += 1;
    }
  }

  const diaFechamentoReal = Math.min(
    diaFechamento,
    obterUltimoDiaDoMes(anoFechamento, mesFechamento),
  );
  const dataFechamento = formatarDataISO(anoFechamento, mesFechamento, diaFechamentoReal);

  // 2. Determinar o mês/ano de vencimento
  let anoVencimento = anoFechamento;
  let mesVencimento = mesFechamento;

  if (diaVencimento <= diaFechamento) {
    mesVencimento += 1;
    if (mesVencimento > 12) {
      mesVencimento = 1;
      anoVencimento += 1;
    }
  }

  const diaVencimentoReal = Math.min(
    diaVencimento,
    obterUltimoDiaDoMes(anoVencimento, mesVencimento),
  );
  const dataVencimento = formatarDataISO(anoVencimento, mesVencimento, diaVencimentoReal);

  const mesReferencia = `${anoVencimento}-${String(mesVencimento).padStart(2, "0")}`;

  return {
    mesReferencia,
    dataFechamento,
    dataVencimento,
  };
}
