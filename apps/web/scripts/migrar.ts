import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

// Migra via HTTP (neon-http): o `drizzle-kit migrate` conecta por websocket,
// que não fecha conexão em algumas redes. DDL na conexão direta quando disponível.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("Defina DATABASE_URL no .env.");
  process.exit(1);
}

const db = drizzle(neon(url));

migrate(db, { migrationsFolder: "./drizzle" })
  .then(() => {
    console.log("Migrations aplicadas.");
  })
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  });
