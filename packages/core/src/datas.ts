// Mês de referência circula como "YYYY-MM"; datas como "YYYY-MM-DD" (ISO).

// Faixa prática de anos (1900–2199): evita aritmética degenerada em anos de
// borda como "0000", que produzia "-1-00" e quebrava o dashboard (achado 22).
const MES_RE = /^((?:19|20|21)\d{2})-(0[1-9]|1[0-2])$/;

export function ehMesValido(mes: string): boolean {
  return MES_RE.test(mes);
}

/** Primeiro e último dia (ISO) de um mês "YYYY-MM". */
export function limitesDoMes(mes: string): { inicio: string; fim: string } {
  const m = MES_RE.exec(mes);
  if (!m) throw new Error(`Mês inválido: ${mes}`);
  const ano = Number(m[1]);
  const numeroMes = Number(m[2]);
  const ultimoDia = new Date(Date.UTC(ano, numeroMes, 0)).getUTCDate();
  return {
    inicio: `${mes}-01`,
    fim: `${mes}-${String(ultimoDia).padStart(2, "0")}`,
  };
}

export function mesAnterior(mes: string): string {
  return somarMeses(mes, -1);
}

export function mesSeguinte(mes: string): string {
  return somarMeses(mes, 1);
}

function somarMeses(mes: string, delta: number): string {
  const m = MES_RE.exec(mes);
  if (!m) throw new Error(`Mês inválido: ${mes}`);
  const total = Number(m[1]) * 12 + (Number(m[2]) - 1) + delta;
  const ano = Math.floor(total / 12);
  const numeroMes = (total % 12) + 1;
  return `${ano}-${String(numeroMes).padStart(2, "0")}`;
}

/** Nome do mês por extenso, ex.: "julho de 2026". */
export function nomeDoMes(mes: string): string {
  const { inicio } = limitesDoMes(mes);
  return new Date(`${inicio}T12:00:00Z`).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
