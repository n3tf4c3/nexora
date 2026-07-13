import Svg, { Line, Path, Rect } from 'react-native-svg';

// Ícones lucide usados no handoff (viewBox 24, stroke 2, cantos redondos).
type Props = { tamanho?: number; cor: string };

function Base({ tamanho = 18, cor, children }: Props & { children: React.ReactNode }) {
  return (
    <Svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke={cor}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export function IconeDashboard(p: Props) {
  return (
    <Base {...p}>
      <Rect width="7" height="9" x="3" y="3" rx="1" />
      <Rect width="7" height="5" x="14" y="3" rx="1" />
      <Rect width="7" height="9" x="14" y="12" rx="1" />
      <Rect width="7" height="5" x="3" y="16" rx="1" />
    </Base>
  );
}

export function IconeFila(p: Props) {
  return (
    <Base {...p}>
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Base>
  );
}

export function IconeTransacoes(p: Props) {
  return (
    <Base {...p}>
      <Path d="m16 3 4 4-4 4" />
      <Path d="M20 7H4" />
      <Path d="m8 21-4-4 4-4" />
      <Path d="M4 17h16" />
    </Base>
  );
}

export function IconeContas(p: Props) {
  return (
    <Base {...p}>
      <Rect width="20" height="14" x="2" y="5" rx="2" />
      <Line x1="2" y1="10" x2="22" y2="10" />
    </Base>
  );
}

export function IconeEntrada(p: Props) {
  return (
    <Base {...p}>
      <Path d="M7 17 17 7" />
      <Path d="M7 7h10v10" />
    </Base>
  );
}

export function IconeSaida(p: Props) {
  return (
    <Base {...p}>
      <Path d="m7 7 10 10" />
      <Path d="M17 7v10H7" />
    </Base>
  );
}

/** Sliders (ajustes) — abre a tela de captura de SMS. */
export function IconeAjustes(p: Props) {
  return (
    <Base {...p}>
      <Line x1="4" y1="21" x2="4" y2="14" />
      <Line x1="4" y1="10" x2="4" y2="3" />
      <Line x1="12" y1="21" x2="12" y2="12" />
      <Line x1="12" y1="8" x2="12" y2="3" />
      <Line x1="20" y1="21" x2="20" y2="16" />
      <Line x1="20" y1="12" x2="20" y2="3" />
      <Line x1="2" y1="14" x2="6" y2="14" />
      <Line x1="10" y1="8" x2="14" y2="8" />
      <Line x1="18" y1="16" x2="22" y2="16" />
    </Base>
  );
}

export function IconeVoltar(p: Props) {
  return (
    <Base {...p}>
      <Path d="m15 18-6-6 6-6" />
    </Base>
  );
}
