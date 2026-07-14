"use client";

import Link from "next/link";
import Form from "next/form";
import { usePathname } from "next/navigation";
import {
  IconeBusca,
  IconeContas,
  IconeDashboard,
  IconeFila,
  IconePulso,
  IconeTransacoes,
} from "./icones";
import { LogoNexora } from "./logo";

const itens = [
  { href: "/", rotulo: "Dashboard", rotuloMobile: "Início", icone: IconeDashboard },
  { href: "/fila", rotulo: "Fila de confirmação", rotuloMobile: "Fila", icone: IconeFila },
  { href: "/saude", rotulo: "Saúde da automação", rotuloMobile: "Saúde", icone: IconePulso },
  { href: "/transacoes", rotulo: "Transações", rotuloMobile: "Transações", icone: IconeTransacoes },
  { href: "/contas", rotulo: "Contas e categorias", rotuloMobile: "Contas", icone: IconeContas },
];

function estaAtivo(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function BadgePendencias({ total }: { total: number }) {
  if (total === 0) return null;
  return (
    <span
      className="flex min-w-5 items-center justify-center rounded-full bg-(--color-expense) px-1.5 py-0.5 text-[10px] font-bold text-white"
      aria-label={`${total} pendência${total === 1 ? "" : "s"}`}
    >
      {total > 99 ? "99+" : total}
    </span>
  );
}

export function Sidebar({
  hoje,
  pendencias,
  sair,
}: {
  hoje: string;
  pendencias: number;
  sair: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col overflow-y-auto border-r border-(--color-divider) bg-(--color-surface) p-4 md:flex">
      <div className="mb-5 flex items-center gap-3">
        <LogoNexora caixa={40} raio={12} icone={20} />
        <div>
          <div className="fonte-marca text-[19px]">Nexora</div>
          <div className="text-[12px] text-(--color-neutral-500)">Financeiro pessoal</div>
        </div>
      </div>

      <Form action="/transacoes" className="relative mb-6">
        <IconeBusca
          tamanho={15}
          className="pointer-events-none absolute top-1/2 left-[10px] -translate-y-1/2 text-(--color-neutral-400)"
        />
        <input
          className="input pl-8 text-[13px]"
          type="text"
          name="q"
          placeholder="Buscar transações..."
          aria-label="Buscar transações"
        />
      </Form>

      <div className="mb-6">
        <div className="mb-2 text-[11px] font-bold tracking-[0.06em] text-(--color-neutral-500) uppercase">
          Geral
        </div>
        <Link
          href="/"
          aria-current={estaAtivo(pathname, "/") ? "page" : undefined}
          className={`link-nav${estaAtivo(pathname, "/") ? " ativo" : ""}`}
        >
          <span className="flex items-center gap-[10px]">
            <IconeDashboard />
            Dashboard
          </span>
        </Link>
      </div>

      <div className="mb-6">
        <div className="mb-2 text-[11px] font-bold tracking-[0.06em] text-(--color-neutral-500) uppercase">
          Finanças
        </div>
        {itens
          .filter((i) => i.href !== "/")
          .map((i) => (
            <Link
              key={i.href}
              href={i.href}
              aria-current={estaAtivo(pathname, i.href) ? "page" : undefined}
              className={`link-nav${estaAtivo(pathname, i.href) ? " ativo" : ""}`}
            >
              <span className="flex items-center gap-[10px]">
                <i.icone />
                {i.rotulo}
              </span>
              {i.href === "/fila" && <BadgePendencias total={pendencias} />}
            </Link>
          ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-(--color-divider) pt-3 text-[12px] text-(--color-neutral-500)">
        <span>{hoje}</span>
        <form action={sair}>
          <button className="min-h-10 cursor-pointer px-2 hover:text-(--color-text)">Sair</button>
        </form>
      </div>
    </aside>
  );
}

export function NavMobile({
  pendencias,
  sair,
}: {
  pendencias: number;
  sair: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 w-full border-b border-(--color-divider) bg-(--color-surface) px-3 pt-3 shadow-(--shadow-sm) md:hidden">
      <div className="flex items-center justify-between px-1 pb-2">
        <div className="flex items-center gap-2">
          <LogoNexora caixa={28} raio={8} icone={15} />
          <span className="fonte-marca text-[18px]">Nexora</span>
        </div>
        <form action={sair}>
          <button className="min-h-11 px-2 text-[14px] text-(--color-neutral-600)">Sair</button>
        </form>
      </div>
      <nav aria-label="Navegação principal" className="flex w-full gap-1 overflow-x-auto pb-2">
        {itens.map((i) => {
          const ativo = estaAtivo(pathname, i.href);
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={ativo ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] ${
                ativo
                  ? "bg-(--color-accent-100) font-bold text-(--color-accent-700)"
                  : "text-(--color-neutral-600)"
              }`}
            >
              {i.rotuloMobile}
              {i.href === "/fila" && <BadgePendencias total={pendencias} />}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
