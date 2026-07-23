// Ícones Lucide usados pelo design (paths copiados do handoff).

type Props = { tamanho?: number; traco?: number; className?: string };

function Icone({
  tamanho = 16,
  traco = 2,
  className,
  children,
}: Props & { children: React.ReactNode }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={traco}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconeBusca(p: Props) {
  return (
    <Icone {...p}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </Icone>
  );
}

export function IconeDashboard(p: Props) {
  return (
    <Icone {...p}>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </Icone>
  );
}

export function IconeFila(p: Props) {
  return (
    <Icone {...p}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Icone>
  );
}

export function IconePulso(p: Props) {
  return (
    <Icone {...p}>
      <path d="M3 12h4l2.5-6 5 12 2.5-6h4" />
    </Icone>
  );
}

export function IconeTransacoes(p: Props) {
  return (
    <Icone {...p}>
      <path d="m16 3 4 4-4 4" />
      <path d="M20 7H4" />
      <path d="m8 21-4-4 4-4" />
      <path d="M4 17h16" />
    </Icone>
  );
}

export function IconeContas(p: Props) {
  return (
    <Icone {...p}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </Icone>
  );
}

export function IconeCartao(p: Props) {
  return (
    <Icone {...p}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </Icone>
  );
}

export function IconeRecorrencia(p: Props) {
  return (
    <Icone {...p}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </Icone>
  );
}

export function IconeProjecao(p: Props) {
  return (
    <Icone {...p}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </Icone>
  );
}

export function IconeMeta(p: Props) {
  return (
    <Icone {...p}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </Icone>
  );
}

export function IconeInvestimento(p: Props) {
  return (
    <Icone {...p}>
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </Icone>
  );
}

export function IconeMais(p: Props) {
  return (
    <Icone {...p}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </Icone>
  );
}

export function IconeSetaEsquerda(p: Props) {
  return (
    <Icone {...p}>
      <path d="m15 18-6-6 6-6" />
    </Icone>
  );
}

export function IconeSetaDireita(p: Props) {
  return (
    <Icone {...p}>
      <path d="m9 18 6-6-6-6" />
    </Icone>
  );
}

export function IconeEntradas(p: Props) {
  return (
    <Icone {...p}>
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </Icone>
  );
}

export function IconeSaidas(p: Props) {
  return (
    <Icone {...p}>
      <path d="m7 7 10 10" />
      <path d="M17 7v10H7" />
    </Icone>
  );
}

export function IconeSaldo(p: Props) {
  return (
    <Icone {...p}>
      <line x1="5" y1="9" x2="19" y2="9" />
      <line x1="5" y1="15" x2="19" y2="15" />
    </Icone>
  );
}

export function IconeCaixaVazia(p: Props) {
  return (
    <Icone {...p}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </Icone>
  );
}
