import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { usuarios } from "../src/db/schema";

const email = process.env.SEED_EMAIL?.toLowerCase().trim();
const senha = process.env.SEED_SENHA;

if (!process.env.DATABASE_URL || !email || !senha) {
  console.error("Defina DATABASE_URL, SEED_EMAIL e SEED_SENHA no .env.");
  process.exit(1);
}

const db = drizzle(neon(process.env.DATABASE_URL));

const senhaHash = await bcrypt.hash(senha, 12);
await db
  .insert(usuarios)
  .values({ email, senhaHash })
  .onConflictDoUpdate({
    target: usuarios.email,
    set: { senhaHash, credenciaisAtualizadasEm: sql`now()` },
  });

console.log(`Usuário ${email} criado/atualizado.`);
