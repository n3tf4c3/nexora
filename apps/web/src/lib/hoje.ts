const FUSO = "America/Sao_Paulo";

/** Data de hoje ("YYYY-MM-DD") no fuso do usuário. */
export function hojeISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: FUSO });
}

/** Mês corrente ("YYYY-MM") no fuso do usuário. */
export function mesAtual(): string {
  return hojeISO().slice(0, 7);
}
