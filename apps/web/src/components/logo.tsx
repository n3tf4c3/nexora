// Marca Nexora: três barras num quadrado escuro arredondado (handoff Nexora Identidade).

export function LogoNexora({
  caixa = 34,
  raio = 10,
  icone = 18,
  fundo = "var(--marca-escuro)",
}: {
  caixa?: number;
  raio?: number;
  icone?: number;
  fundo?: string;
}) {
  return (
    <div
      className="flex shrink-0 items-end justify-center"
      style={{
        width: caixa,
        height: caixa,
        borderRadius: raio,
        background: fundo,
        padding: `${Math.round(caixa * 0.21)}px ${Math.round(caixa * 0.19)}px`,
      }}
    >
      <svg width={icone} height={icone} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="13" width="4.2" height="8" rx="1.2" fill="rgba(255,255,255,0.5)" />
        <rect x="10" y="8" width="4.2" height="13" rx="1.2" fill="rgba(255,255,255,0.85)" />
        <rect x="17" y="3" width="4.2" height="18" rx="1.2" fill="var(--marca-acento-2)" />
      </svg>
    </div>
  );
}
