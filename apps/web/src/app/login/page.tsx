"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { LogoNexora } from "@/components/logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const resultado = await signIn("credentials", {
        email,
        senha,
        redirect: false,
      });
      if (resultado?.error) {
        // Sem enumerar conta: credencial inválida tem mensagem própria;
        // rate limit orienta a aguardar; o resto é indisponibilidade genérica.
        setErro(
          resultado.code === "limite"
            ? "Muitas tentativas — aguarde um minuto e tente de novo."
            : resultado.error === "CredentialsSignin"
              ? "E-mail ou senha inválidos."
              : "Não foi possível entrar agora. Tente novamente em instantes.",
        );
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setErro("Falha de conexão. Verifique sua internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-(--color-neutral-100) px-6 py-14">
      <div className="flex w-full max-w-[1070px] overflow-hidden rounded-[24px] shadow-(--shadow-lg) md:min-h-[600px]">
        <div className="relative hidden w-[46%] shrink-0 flex-col overflow-hidden bg-(--marca-escuro) p-11 pt-12 text-white md:flex">
          <div className="mb-8">
            <LogoNexora caixa={52} raio={15} icone={26} fundo="var(--marca-escuro-suave)" />
          </div>
          <div className="fonte-marca mb-4 text-[28px]">Nexora</div>
          <p className="m-0 mb-10 max-w-[300px] text-[15px] leading-[1.6] text-white/68">
            Acompanhe entradas, saídas e metas do seu mês em um só lugar, com clareza no dia a
            dia.
          </p>

          <div className="relative mt-auto mb-8 h-[150px]">
            <svg width="100%" height="100%" viewBox="0 0 260 150" className="absolute inset-0">
              <polyline
                points="10,120 70,90 130,105 190,50 250,30"
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="120" r="6" fill="rgba(255,255,255,0.35)" />
              <circle cx="70" cy="90" r="6" fill="rgba(255,255,255,0.5)" />
              <circle cx="130" cy="105" r="7" fill="var(--marca-acento)" />
              <circle cx="190" cy="50" r="6" fill="rgba(255,255,255,0.5)" />
              <circle cx="250" cy="30" r="9" fill="var(--marca-acento-2)" />
            </svg>
          </div>

          <div className="border-t border-white/12 pt-5 text-[13px] text-white/45">
            Suporte: contato@nexora.com.br
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center bg-(--color-surface) p-8 md:p-14">
          <form onSubmit={entrar} className="mx-auto w-full max-w-[380px]">
            <div className="mb-3 text-[12px] font-extrabold tracking-[0.08em] text-(--marca-acento) uppercase">
              Acesso seguro
            </div>
            <h2 className="fonte-marca m-0 mb-2 text-[30px]">Bem-vindo(a)</h2>
            <p className="m-0 mb-7 text-[14px] text-(--color-neutral-600)">
              Entre com suas credenciais para continuar.
            </p>

            <div className="field mb-4">
              <label htmlFor="login-email">E-mail</label>
              <input
                id="login-email"
                className="input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field mb-6">
              <label htmlFor="login-senha">Senha</label>
              <input
                id="login-senha"
                className="input"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            {erro && (
              <p role="alert" className="m-0 mb-4 text-sm text-(--color-error)">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="block w-full cursor-pointer rounded-[12px] border-0 bg-(--marca-escuro) p-[14px] text-center text-[15px] font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {enviando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
