import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import { executarMigracoesAtomicas } from "./migration-runner";

// Migra via HTTP: o `drizzle-kit migrate` conecta por websocket,
// que não fecha conexão em algumas redes.
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

const cliente = neon(parse.data.DATABASE_URL_UNPOOLED || parse.data.DATABASE_URL);

executarMigracoesAtomicas(cliente, "./drizzle")
  .then(() => {
    console.log("Migrations aplicadas.");
  })
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  });
