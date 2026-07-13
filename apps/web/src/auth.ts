import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { ipDaRequisicao, limitarTentativasLogin } from "@/server/rate-limit";

// Chega ao cliente como `code: "limite"` — a tela distingue rate limit de
// credencial inválida sem vazar detalhes (achado 16).
class LimiteDeTentativas extends CredentialsSignin {
  code = "limite";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, senha: {} },
      async authorize(credentials, request) {
        const email = String(credentials?.email ?? "")
          .toLowerCase()
          .trim();
        const senha = String(credentials?.senha ?? "");
        if (!email || !senha) return null;

        try {
          await limitarTentativasLogin(email, ipDaRequisicao(request.headers));
        } catch {
          throw new LimiteDeTentativas();
        }

        const usuario = await db.query.usuarios.findFirst({
          where: eq(usuarios.email, email),
        });
        if (!usuario) return null;
        if (!(await bcrypt.compare(senha, usuario.senhaHash))) return null;

        return {
          id: usuario.id,
          email: usuario.email,
          credAt: usuario.credenciaisAtualizadasEm.getTime(),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.credAt = user.credAt;
        return token;
      }
      // JWT emitido antes da última troca de credenciais é inválido.
      const dono = token.sub
        ? await db.query.usuarios.findFirst({ where: eq(usuarios.id, token.sub) })
        : undefined;
      if (!dono || (token.credAt ?? 0) < dono.credenciaisAtualizadasEm.getTime()) {
        return null;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
