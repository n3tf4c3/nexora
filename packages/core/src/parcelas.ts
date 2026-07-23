import { calcularCicloFatura, type CicloFatura } from "./faturas";

export interface ItemParcela {
  numeroParcela: number;
  totalParcelas: number;
  valorCentavos: number;
  data: string; // "YYYY-MM-DD"
  cicloFatura?: CicloFatura;
}

function obterUltimoDiaDoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

function somarMesesAData(dataISO: string, mesesParaSomar: number): string {
  const partes = dataISO.split("-").map(Number);
  const ano = partes[0];
  const mes = partes[1];
  const dia = partes[2];

  if (
    partes.length !== 3 ||
    ano === undefined ||
    mes === undefined ||
    dia === undefined ||
    isNaN(ano) ||
    isNaN(mes) ||
    isNaN(dia)
  ) {
    throw new Error(`Data inválida: ${dataISO}`);
  }

  const totalMeses = ano * 12 + (mes - 1) + mesesParaSomar;
  const novoAno = Math.floor(totalMeses / 12);
  const novoMes = (totalMeses % 12) + 1;
  const ultimoDia = obterUltimoDiaDoMes(novoAno, novoMes);
  const novoDia = Math.min(dia, ultimoDia);

  return `${novoAno}-${String(novoMes).padStart(2, "0")}-${String(novoDia).padStart(2, "0")}`;
}

export function distribuirParcelas({
  valorTotalCentavos,
  numeroParcelas,
  dataPrimeiraParcela,
  diaFechamento,
  diaVencimento,
}: {
  valorTotalCentavos: number;
  numeroParcelas: number;
  dataPrimeiraParcela: string;
  diaFechamento?: number;
  diaVencimento?: number;
}): ItemParcela[] {
  if (numeroParcelas < 2 || !Number.isInteger(numeroParcelas)) {
    throw new Error(`Número de parcelas inválido: ${numeroParcelas}`);
  }
  if (valorTotalCentavos <= 0 || !Number.isInteger(valorTotalCentavos)) {
    throw new Error(`Valor total em centavos inválido: ${valorTotalCentavos}`);
  }

  const baseCentavos = Math.floor(valorTotalCentavos / numeroParcelas);
  const restoCentavos = valorTotalCentavos % numeroParcelas;

  const parcelas: ItemParcela[] = [];

  for (let i = 1; i <= numeroParcelas; i++) {
    const valorCentavos = baseCentavos + (i === 1 ? restoCentavos : 0);
    const data = somarMesesAData(dataPrimeiraParcela, i - 1);

    let cicloFatura: CicloFatura | undefined;
    if (diaFechamento !== undefined && diaVencimento !== undefined) {
      cicloFatura = calcularCicloFatura({
        dataCompra: data,
        diaFechamento,
        diaVencimento,
      });
    }

    parcelas.push({
      numeroParcela: i,
      totalParcelas: numeroParcelas,
      valorCentavos,
      data,
      cicloFatura,
    });
  }

  return parcelas;
}
