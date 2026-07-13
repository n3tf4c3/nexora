"use client";

import Link from "next/link";
import Form from "next/form";
import { usePathname } from "next/navigation";
import {
  IconeBusca,
  IconeContas,
  IconeDashboard,
  IconeFila,
  IconeTransacoes,
} from "./icones";
import { LogoNexora } from "./logo";

const itens = [
  { href: "/fila", rotulo: "Fila de confirmação", icone: IconeFila },
  { href: "/", rotulo: "Dashboard", icone: IconeDashboard },
  { href: "/transacoes", rotulo: "Transações", icone: IconeTransacoes },
  { href: "/contas", rotulo: "Contas e categorias", icone: IconeContas },
];

function estaAtivo(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({ hoje, sair }: { hoje: string; sair: () => Promise<void> }) {
  const pathname = usePathname();

  return (
    <aside className="nav-escura hidden min-h-screen w-[248px] shrink-0 flex-col bg-(--marca-escuro) p-4 text-white md:flex">
      <div className="mb-5 flex items-center gap-3">
        <LogoNexora caixa={40} raio={12} icone={20} fundo="var(--marca-escuro-suave)" />
        <div>
          <div className="fonte-marca text-[19px]">Nexora</div>
          <div className="text-[12px] text-white/55">Financeiro pessoal</div>
        </div>
      </div>

      <Form action="/transacoes" className="relative mb-6">
        <IconeBusca
          tamanho={15}
          className="pointer-events-none absolute top-1/2 left-[10px] -translate-y-1/2 text-white/40"
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
        <div className="mb-2 text-[11px] font-bold tracking-[0.06em] text-white/40 uppercase">
          Geral
        </div>
        <Link href="/" className={`link-nav${estaAtivo(pathname, "/") ? " ativo" : ""}`}>
          <span className="flex items-center gap-[10px]">
            <IconeDashboard />
            Dashboard
          </span>
        </Link>
      </div>

      <div className="mb-6">
        <div className="mb-2 text-[11px] font-bold tracking-[0.06em] text-white/40 uppercase">
          Finanças
        </div>
        {itens
          .filter((i) => i.href !== "/")
          .map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={`link-nav${estaAtivo(pathname, i.href) ? " ativo" : ""}`}
            >
              <span className="flex items-center gap-[10px]">
                <i.icone />
                {i.rotulo}
              </span>
            </Link>
          ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/12 pt-3 text-[12px] text-white/45">
        <span>{hoje}</span>
        <form action={sair}>
          <button className="cursor-pointer hover:text-white">Sair</button>
        </form>
      </div>
    </aside>
  );
}

export function NavMobile({ sair }: { sair: () => Promise<void> }) {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-10 flex w-full flex-wrap items-center gap-x-4 gap-y-1 bg-(--marca-escuro) px-4 py-3 text-white shadow-(--shadow-sm) md:hidden">
      <span className="mr-auto flex items-center gap-2">
        <LogoNexora caixa={28} raio={8} icone={15} fundo="var(--marca-escuro-suave)" />
        <span className="fonte-marca text-[18px]">Nexora</span>
      </span>
      {itens.map((i) => {
        const ativo = estaAtivo(pathname, i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={ativo ? "page" : undefined}
            className={`text-[14px] ${ativo ? "font-bold text-white underline" : "text-white/70"}`}
          >
            {i.rotulo}
          </Link>
        );
      })}
      <form action={sair}>
        <button className="text-[14px] text-white/60">Sair</button>
      </form>
    </div>
  );
}
