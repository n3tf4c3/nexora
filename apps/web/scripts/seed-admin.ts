import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { CATEGORIAS_PADRAO } from "@nexora/core";
import { categorias, usuarios } from "../src/db/schema";

// Achado 20: a única conta do sistema não pode nascer com credencial trivial.
const parse = z
  .object({
    DATABASE_URL: z.string().min(1, "Defina DATABASE_URL no .env."),
    SEED_EMAIL: z.email("SEED_EMAIL precisa ser um e-mail válido.").max(254),
    SEED_SENHA: z
      .string()
      .min(12, "SEED_SENHA precisa de >= 12 caracteres.")
      .refine((s) => Buffer.byteLength(s, "utf8") <= 72, {
        message: "SEED_SENHA excede 72 bytes (limite do bcrypt).",
      }),
  })
  .safeParse(process.env);

if (!parse.success) {
  for (const issue of parse.error.issues) {
    console.error(`${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

const email = parse.data.SEED_EMAIL.toLowerCase().trim();
const senha = parse.data.SEED_SENHA;

const db = drizzle(neon(parse.data.DATABASE_URL));

async function main() {
  const senhaHash = await bcrypt.hash(senha, 12);
  const [usuario] = await db
    .insert(usuarios)
    .values({ email, senhaHash })
    .onConflictDoUpdate({
      target: usuarios.email,
      set: { senhaHash, credenciaisAtualizadasEm: sql`now()` },
    })
    .returning({ id: usuarios.id });
  if (!usuario) throw new Error("Não foi possível criar ou localizar o usuário administrador.");

  await db
    .insert(categorias)
    .values(CATEGORIAS_PADRAO.map((nome) => ({ usuarioId: usuario.id, nome })))
    .onConflictDoNothing({ target: [categorias.usuarioId, categorias.nome] });

  console.log(`Usuário ${email} criado/atualizado com categorias padrão.`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
