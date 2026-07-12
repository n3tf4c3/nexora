import Link from "next/link";
import { LogoNexora } from "@/components/logo";
import { IconeDashboard, IconeFila } from "@/components/icones";

// Landing pública (handoff "Nexora Identidade"). CTAs levam ao login:
// o produto é single user, não existe fluxo de cadastro.

function IconeCheque({ tamanho = 22 }: { tamanho?: number }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const passos = [
  {
    icone: <IconeFila tamanho={22} />,
    titulo: "SMS capturado",
    texto: "Nexora identifica compras, Pix e faturas assim que seu banco avisa por SMS.",
  },
  {
    icone: <IconeCheque />,
    titulo: "Você confirma em segundos",
    texto:
      "Revise o palpite, ajuste categoria e conta, confirme com um toque — ou edite o que quiser.",
  },
  {
    icone: <IconeDashboard tamanho={22} />,
    titulo: "Dashboard sempre atualizado",
    texto:
      "Saldo, entradas, saídas e gastos por categoria refletem cada confirmação, na hora.",
  },
];

const ctaPrimario =
  "inline-block rounded-[12px] bg-(--marca-escuro) px-[26px] py-[14px] text-[15px] font-bold text-white hover:opacity-90";

export default function InicioPage() {
  return (
    <div className="bg-(--color-surface)">
      <header className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-4 px-8 py-5">
        <div className="flex items-center gap-[10px]">
          <LogoNexora caixa={34} raio={10} icone={18} />
          <span className="fonte-marca text-[19px]">Nexora</span>
        </div>
        <div className="flex flex-wrap items-center gap-7">
          <a
            href="#como-funciona"
            className="text-[14px] font-semibold text-(--color-neutral-700)"
          >
            Como funciona
          </a>
          <Link href="/login" className="text-[14px] font-semibold text-(--color-neutral-700)">
            Entrar
          </Link>
          <Link
            href="/login"
            className="rounded-[10px] bg-(--marca-escuro) px-[18px] py-[10px] text-[14px] font-bold text-white hover:opacity-90"
          >
            Criar conta grátis
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1160px] grid-cols-1 gap-12 px-8 pt-14 pb-22 text-center">
        <div className="mx-auto max-w-[720px]">
          <div className="mb-5 inline-block rounded-full bg-(--marca-acento-suave) px-[14px] py-[6px] text-[12px] font-extrabold tracking-[0.08em] text-(--marca-acento) uppercase">
            Finanças automáticas
          </div>
          <h1 className="fonte-marca m-0 mb-5 text-[36px] leading-[1.08] tracking-[-0.02em] md:text-[52px]">
            As finanças da sua vida,
            <br />
            organizadas sozinhas.
          </h1>
          <p className="m-0 mb-8 text-[18px] leading-[1.6] text-(--color-neutral-700)">
            Nexora lê os avisos do seu banco por SMS, sugere cada lançamento e mantém dashboard,
            contas e categorias sempre em dia — você só confirma.
          </p>
          <div className="flex flex-wrap justify-center gap-[14px]">
            <Link href="/login" className={ctaPrimario}>
              Criar conta grátis
            </Link>
            <a
              href="#como-funciona"
              className="inline-block rounded-[12px] border border-(--color-divider) px-[26px] py-[14px] text-[15px] font-bold text-(--color-text) hover:bg-(--color-neutral-100)"
            >
              Ver como funciona
            </a>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[960px]">
          <div className="listras-marca flex h-[320px] w-full items-center justify-center rounded-[20px] border border-(--color-divider) bg-(--color-neutral-100) shadow-(--shadow-lg) md:h-[520px]">
            <span className="rounded-[8px] border border-(--color-divider) bg-(--color-surface) px-3 py-[6px] font-mono text-[13px] text-(--color-neutral-500)">
              [ dashboard preview screenshot ]
            </span>
          </div>
        </div>
      </div>

      <div
        id="como-funciona"
        className="border-y border-(--color-divider) bg-(--color-bg)"
      >
        <div className="mx-auto max-w-[1160px] px-8 py-20">
          <div className="mx-auto mb-14 max-w-[640px] text-center">
            <div className="mb-[14px] text-[12px] font-extrabold tracking-[0.08em] text-(--marca-acento) uppercase">
              Como funciona
            </div>
            <h2 className="fonte-marca m-0 text-[28px] leading-[1.2] tracking-[-0.01em] md:text-[34px]">
              Da mensagem do banco ao seu dashboard, em três passos.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {passos.map((p, i) => (
              <div key={p.titulo}>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-(--marca-escuro) text-white">
                  {p.icone}
                </div>
                <div className="mb-2 text-[12px] font-extrabold text-(--marca-acento)">
                  PASSO {i + 1}
                </div>
                <h3 className="m-0 mb-[10px] text-[19px] font-extrabold">{p.titulo}</h3>
                <p className="m-0 text-[15px] leading-[1.6] text-(--color-neutral-600)">
                  {p.texto}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/login" className={ctaPrimario}>
              Criar conta grátis
            </Link>
          </div>
        </div>
      </div>

      <footer className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-4 px-8 py-10">
        <div className="flex items-center gap-[10px]">
          <LogoNexora caixa={26} raio={8} icone={14} />
          <span className="fonte-marca text-[15px]">Nexora</span>
        </div>
        <div className="flex flex-wrap gap-6 text-[13px] text-(--color-neutral-600)">
          <span>contato@nexora.com.br</span>
          <span>© 2026 Nexora</span>
        </div>
      </footer>
    </div>
  );
}
