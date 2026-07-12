import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { NavMobile, Sidebar } from "@/components/navegacao";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await auth();
  if (!sessao?.user) redirect("/inicio");

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
    <div className="flex min-h-screen">
      <Sidebar hoje={hoje} sair={sair} />
      <div className="flex min-w-0 flex-1 flex-col">
        <NavMobile sair={sair} />
        {children}
      </div>
    </div>
  );
}
