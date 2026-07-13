// Valores monetários circulam no sistema como inteiros em centavos (BRL).

import { VALOR_CENTAVOS_MAX } from "./limites";

export function formatarCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Converte um valor em texto no formato brasileiro ("1.234,56", "R$ 12,00")
 * para centavos. Retorna null se o texto não for um valor reconhecível —
 * chamadores (parsers de SMS, formulários) tratam null como pendência,
 * nunca como zero.
 */
export function parsearValorBRL(texto: string): number | null {
  // Prefixo ancorado no início: "1R$ 2" não pode virar "12" (achado 11).
  const limpo = texto.trim().replace(/^R\$\s*/i, "");
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(limpo)) {
    return null;
  }
  const [inteiros, decimais = ""] = limpo.replace(/\./g, "").split(",");
  const centavos = Number(inteiros) * 100 + Number(decimais.padEnd(2, "0") || 0);
  return centavos > VALOR_CENTAVOS_MAX ? null : centavos;
}
