import { redirect } from "next/navigation";
import { formatarCentavos } from "@nexora/core";
import { auth, signOut } from "@/auth";

export default async function Home() {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nexora</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="text-sm text-neutral-500 underline">Sair</button>
        </form>
      </div>
      <p className="text-neutral-600">
        Logado como {sessao.user.email}. Saldo do mês: {formatarCentavos(0)}.
      </p>
    </main>
  );
}
