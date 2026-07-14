import type { TipoIconeConta } from "@nexora/core";

export type PropsIconeConta = {
  tipo?: TipoIconeConta | null;
  tamanho?: number;
  className?: string;
};

type MetaConta = {
  icone: TipoIconeConta | "etiqueta";
  cor: string;
  fundo: string;
};

function normalizarTamanho(tamanho: number) {
  if (!Number.isFinite(tamanho)) return 28;
  return Math.min(64, Math.max(12, tamanho));
}

function obterMetaConta(tipoRecebido: TipoIconeConta | null | undefined): MetaConta {
  const tipo = tipoRecebido || "banco";
  let matiz: number;

  switch (tipo) {
    case "banco":
      matiz = 230;
      break;
    case "cartao":
      matiz = 285;
      break;
    case "dinheiro":
      matiz = 155;
      break;
    case "poupanca":
      matiz = 335;
      break;
    case "investimento":
      matiz = 90;
      break;
    default:
      return {
        icone: "etiqueta",
        cor: "var(--color-neutral-500)",
        fundo: "var(--color-neutral-100)",
      };
  }

  return {
    icone: tipo,
    cor: `oklch(56% 0.12 ${matiz})`,
    fundo: `oklch(94% 0.028 ${matiz})`,
  };
}

function DesenhoConta({
  icone,
  tamanho,
}: {
  icone: MetaConta["icone"];
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
    case "banco":
      return (
        <svg {...atributos}>
          <line x1="3" y1="22" x2="21" y2="22" />
          <line x1="6" y1="18" x2="6" y2="11" />
          <line x1="10" y1="18" x2="10" y2="11" />
          <line x1="14" y1="18" x2="14" y2="11" />
          <line x1="18" y1="18" x2="18" y2="11" />
          <polygon points="12 2 20 7 4 7" />
        </svg>
      );
    case "cartao":
      return (
        <svg {...atributos}>
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      );
    case "dinheiro":
      return (
        <svg {...atributos}>
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h3v-4Z" />
        </svg>
      );
    case "poupanca":
      return (
        <svg {...atributos}>
          <path d="M11 6a5 5 0 0 1 5 1.5c1.7 0 3 1 3 2.5h1v4h-1.3c-.3.9-1 1.6-1.7 2V19h-3v-1h-3v1H7v-2.6C5.2 15.6 4 14 4 12c0-1 .3-1.8.9-2.6C4.3 8.7 4 8 4 7.2 4 5.4 5.7 4 7.6 4c1.2 0 2.3.5 3 1.3.4-.2.9-.3 1.4-.3Z" />
          <circle cx="15.5" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );
    case "investimento":
      return (
        <svg {...atributos}>
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
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

export function IconeConta({ tipo, tamanho = 28, className }: PropsIconeConta) {
  const tamanhoNormalizado = normalizarTamanho(tamanho);
  const tamanhoIcone = Math.max(12, Math.round(tamanhoNormalizado * 0.52));
  const meta = obterMetaConta(tipo);

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
      <DesenhoConta icone={meta.icone} tamanho={tamanhoIcone} />
    </span>
  );
}
