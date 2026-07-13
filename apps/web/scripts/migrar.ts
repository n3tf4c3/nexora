import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { z } from "zod";

// Migra via HTTP (neon-http): o `drizzle-kit migrate` conecta por websocket,
// que não fecha conexão em algumas redes. DDL na conexão direta quando disponível.
const parse = z
  .object({
    DATABASE_URL: z.string().min(1, "Defina DATABASE_URL no .env."),
    DATABASE_URL_UNPOOLED: z.string().optional(),
  })
  .safeParse(process.env);

if (!parse.success) {
  for (const issue of parse.error.issues) {
    console.error(`${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

const db = drizzle(neon(parse.data.DATABASE_URL_UNPOOLED || parse.data.DATABASE_URL));

migrate(db, { migrationsFolder: "./drizzle" })
  .then(() => {
    console.log("Migrations aplicadas.");
  })
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  });
