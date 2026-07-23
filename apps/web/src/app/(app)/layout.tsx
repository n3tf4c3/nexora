import { redirect } from "next/navigation";
import { and, count, eq } from "drizzle-orm";
import { auth, signOut } from "@/auth";
import { NavMobile, Sidebar } from "@/components/navegacao";
import { db } from "@/db";
import { mensagensSms } from "@/db/schema";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await auth();
  if (!sessao?.user) redirect("/inicio");

  const [{ total: pendencias }] = await db
    .select({ total: count() })
    .from(mensagensSms)
    .where(
      and(
        eq(mensagensSms.usuarioId, sessao.user.id),
        eq(mensagensSms.status, "pendente"),
      ),
    );

  async function sair() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-indigo-500/30">
      <a href="#conteudo-principal" className="skip-link">
        Pular para o conteúdo
      </a>
      <Sidebar hoje={hoje} pendencias={pendencias} sair={sair} />
      <div className="flex min-w-0 flex-1 flex-col">
        <NavMobile pendencias={pendencias} sair={sair} />
        <main id="conteudo-principal" className="min-w-0 flex-1 bg-[#090d16]">
          {children}
        </main>
      </div>
    </div>
  );
}
