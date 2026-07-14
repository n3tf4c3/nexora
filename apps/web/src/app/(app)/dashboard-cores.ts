const MATIZES = [55, 230, 285, 335, 165, 90, 20, 200, 260, 130];

const MATIZES_CONHECIDAS: Record<string, number> = {
  Alimentação: 55,
  Transporte: 230,
  Moradia: 285,
  Lazer: 335,
  Saúde: 165,
  Assinaturas: 90,
};

export function corDaCategoria(nome: string): string {
  if (nome === "Sem categoria") return "var(--color-neutral-400)";

  let matiz = MATIZES_CONHECIDAS[nome];
  if (matiz === undefined) {
    let hash = 0;
    for (let indice = 0; indice < nome.length; indice += 1) {
      hash = (hash * 31 + nome.charCodeAt(indice)) % 360;
    }
    matiz = MATIZES[hash % MATIZES.length];
  }

  return `oklch(56% 0.12 ${matiz})`;
}
