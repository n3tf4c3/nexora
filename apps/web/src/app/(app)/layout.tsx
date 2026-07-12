import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

const links = [
  { href: "/", rotulo: "Dashboard" },
  { href: "/transacoes", rotulo: "Transações" },
  { href: "/contas", rotulo: "Contas" },
  { href: "/categorias", rotulo: "Categorias" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200">
        <nav className="mx-auto flex max-w-4xl items-center gap-5 px-4 py-3 text-sm">
          <span className="font-semibold">Nexora</span>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-neutral-600 hover:text-neutral-900">
              {l.rotulo}
            </Link>
          ))}
          <form
            className="ml-auto"
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="text-neutral-400 hover:text-neutral-700">Sair</button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
