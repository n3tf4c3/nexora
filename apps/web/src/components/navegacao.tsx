"use client";

import Link from "next/link";
import Form from "next/form";
import { usePathname } from "next/navigation";
import {
  IconeBusca,
  IconeCartao,
  IconeContas,
  IconeDashboard,
  IconeFila,
  IconeProjecao,
  IconePulso,
  IconeRecorrencia,
  IconeTransacoes,
} from "./icones";
import { LogoNexora } from "./logo";

const itens = [
  { href: "/", rotulo: "Dashboard", rotuloMobile: "Início", icone: IconeDashboard },
  { href: "/projecao", rotulo: "Projeção de caixa", rotuloMobile: "Projeção", icone: IconeProjecao },
  { href: "/recorrencias", rotulo: "Recorrências", rotuloMobile: "Recorrências", icone: IconeRecorrencia },
  { href: "/faturas", rotulo: "Faturas de cartão", rotuloMobile: "Faturas", icone: IconeCartao },
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
      className="flex min-w-5 items-center justify-center rounded-full bg-rose-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm shadow-rose-500/50"
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
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-[#090d16] p-4 text-slate-100 md:flex">
      {/* Brand Header */}
      <div className="mb-6 flex items-center gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/40 glow-indigo">
          <LogoNexora caixa={28} raio={6} icone={16} />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold tracking-tight text-white font-heading">NEXORA</span>
            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/30">
              PRO
            </span>
          </div>
          <div className="text-[11px] font-medium text-slate-400">Gestão Financeira</div>
        </div>
      </div>

      {/* Form de Busca */}
      <Form action="/transacoes" className="relative mb-6">
        <IconeBusca
          tamanho={15}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
        />
        <input
          className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 transition-all focus:border-indigo-500 focus:bg-slate-900 focus:outline-none"
          type="text"
          name="q"
          placeholder="Buscar transações..."
          aria-label="Buscar transações"
        />
      </Form>

      {/* Menu Principal */}
      <div className="mb-4">
        <div className="mb-2 px-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
          Visão Geral
        </div>
        <Link
          href="/"
          aria-current={estaAtivo(pathname, "/") ? "page" : undefined}
          className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
            estaAtivo(pathname, "/")
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/40 font-semibold"
              : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
          }`}
        >
          <span className="flex items-center gap-3">
            <IconeDashboard />
            Dashboard
          </span>
        </Link>
      </div>

      <div className="mb-6 flex-1">
        <div className="mb-2 px-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
          Módulos
        </div>
        <div className="space-y-1">
          {itens
            .filter((i) => i.href !== "/")
            .map((i) => {
              const ativo = estaAtivo(pathname, i.href);
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  aria-current={ativo ? "page" : undefined}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    ativo
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/40 font-semibold"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <i.icone />
                    {i.rotulo}
                  </span>
                  {i.href === "/fila" && <BadgePendencias total={pendencias} />}
                </Link>
              );
            })}
        </div>
      </div>

      {/* Footer do Usuário */}
      <div className="mt-auto border-t border-slate-800/80 pt-3">
        <div className="mb-2.5 flex items-center justify-between px-2 text-[11px] font-medium text-slate-400">
          <span>{hoje}</span>
        </div>
        <form action={sair}>
          <button className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-300 transition-all hover:border-rose-900/40 hover:bg-rose-950/30 hover:text-rose-400">
            Sair da conta
          </button>
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
    <header className="sticky top-0 z-20 w-full border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-xl px-4 pt-3 shadow-md md:hidden">
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
            <LogoNexora caixa={22} raio={5} icone={13} />
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-heading">Nexora</span>
        </div>
        <form action={sair}>
          <button className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300 hover:text-white">
            Sair
          </button>
        </form>
      </div>
      <nav aria-label="Navegação principal" className="flex w-full gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {itens.map((i) => {
          const ativo = estaAtivo(pathname, i.href);
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={ativo ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                ativo
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/40 font-semibold"
                  : "bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
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
