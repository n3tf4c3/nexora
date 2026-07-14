type TipoIconeCategoria =
  | "alimentacao"
  | "transporte"
  | "moradia"
  | "lazer"
  | "saude"
  | "assinaturas"
  | "etiqueta";

export type PropsIconeCategoria = {
  nome?: string | null;
  tamanho?: number;
  className?: string;
};

const MATIZES = [55, 230, 285, 335, 165, 90, 20, 200, 260, 130];

function normalizarTamanho(tamanho: number) {
  if (!Number.isFinite(tamanho)) return 28;
  return Math.min(64, Math.max(12, tamanho));
}

function obterMetaCategoria(nomeRecebido: string | null | undefined): {
  icone: TipoIconeCategoria;
  cor: string;
  fundo: string;
} {
  const nome = typeof nomeRecebido === "string" ? nomeRecebido : "";

  if (!nome || nome === "Sem categoria") {
    return {
      icone: "etiqueta",
      cor: "var(--color-neutral-500)",
      fundo: "var(--color-neutral-100)",
    };
  }

  let icone: TipoIconeCategoria = "etiqueta";
  let matiz: number | undefined;

  switch (nome) {
    case "Alimentação":
      icone = "alimentacao";
      matiz = 55;
      break;
    case "Transporte":
      icone = "transporte";
      matiz = 230;
      break;
    case "Moradia":
      icone = "moradia";
      matiz = 285;
      break;
    case "Lazer":
      icone = "lazer";
      matiz = 335;
      break;
    case "Saúde":
      icone = "saude";
      matiz = 165;
      break;
    case "Assinaturas":
      icone = "assinaturas";
      matiz = 90;
      break;
    default: {
      let hash = 0;
      for (let indice = 0; indice < nome.length; indice += 1) {
        hash = (hash * 31 + nome.charCodeAt(indice)) % 360;
      }
      matiz = MATIZES[hash % MATIZES.length];
    }
  }

  return {
    icone,
    cor: `oklch(56% 0.12 ${matiz})`,
    fundo: `oklch(94% 0.028 ${matiz})`,
  };
}

function DesenhoCategoria({
  icone,
  tamanho,
}: {
  icone: TipoIconeCategoria;
  tamanho: number;
}) {
  const atributos = {
    width: tamanho,
    height: tamanho,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (icone) {
    case "alimentacao":
      return (
        <svg {...atributos}>
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" y1="2" x2="6" y2="4" />
          <line x1="10" y1="2" x2="10" y2="4" />
          <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
      );
    case "transporte":
      return (
        <svg {...atributos}>
          <path d="M5 11 6.5 6.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
          <rect x="3" y="11" width="18" height="6" rx="2" />
          <circle cx="7.5" cy="17" r="1.5" />
          <circle cx="16.5" cy="17" r="1.5" />
        </svg>
      );
    case "moradia":
      return (
        <svg {...atributos}>
          <path d="m3 9 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          <polyline points="9 21 9 12 15 12 15 21" />
        </svg>
      );
    case "lazer":
      return (
        <svg {...atributos}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      );
    case "saude":
      return (
        <svg {...atributos}>
          <path d="M20.8 4.9a5.4 5.4 0 0 0-7.7 0L12 6l-1.1-1.1a5.4 5.4 0 0 0-7.7 7.7L4 13.4 12 21l8-7.6.8-.8a5.4 5.4 0 0 0 0-7.7Z" />
        </svg>
      );
    case "assinaturas":
      return (
        <svg {...atributos}>
          <polyline points="21 3 21 9 15 9" />
          <polyline points="3 21 3 15 9 15" />
          <path d="M3.5 9a8.5 8.5 0 0 1 14-3.2L21 9" />
          <path d="M20.5 15a8.5 8.5 0 0 1-14 3.2L3 15" />
        </svg>
      );
    default:
      return (
        <svg {...atributos}>
          <path d="M12.6 2.6a2 2 0 0 0-1.4-.6H4a2 2 0 0 0-2 2v7.2c0 .5.2 1 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4Z" />
          <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

export function IconeCategoria({
  nome,
  tamanho = 28,
  className,
}: PropsIconeCategoria) {
  const tamanhoNormalizado = normalizarTamanho(tamanho);
  const tamanhoIcone = Math.max(12, Math.round(tamanhoNormalizado * 0.52));
  const meta = obterMetaCategoria(nome);

  return (
    <span
      className={className}
      style={{
        width: tamanhoNormalizado,
        height: tamanhoNormalizado,
        minWidth: tamanhoNormalizado,
        borderRadius: 999,
        background: meta.fundo,
        color: meta.cor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <DesenhoCategoria icone={meta.icone} tamanho={tamanhoIcone} />
    </span>
  );
}
