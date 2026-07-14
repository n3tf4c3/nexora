import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { asc, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { z } from "zod";
import * as schema from "../src/db/schema";
import { mensagensSms } from "../src/db/schema";
import { persistirInterpretacoesSms } from "../src/server/interpretacoes-sms";

const parse = z
  .object({ DATABASE_URL: z.string().min(1, "Defina DATABASE_URL no .env.") })
  .safeParse(process.env);

if (!parse.success) {
  console.error(parse.error.issues[0]?.message ?? "Configuração inválida.");
  process.exit(1);
}

const db = drizzle(neon(parse.data.DATABASE_URL), { schema });
const TAMANHO_LOTE = 500;

async function main() {
  let cursor: string | undefined;
  let processadas = 0;
  let interpretadas = 0;

  while (true) {
    const lote = await db
      .select({ id: mensagensSms.id, remetente: mensagensSms.remetente, corpo: mensagensSms.corpo })
      .from(mensagensSms)
      .where(cursor ? gt(mensagensSms.id, cursor) : undefined)
      .orderBy(asc(mensagensSms.id))
      .limit(TAMANHO_LOTE);
    if (lote.length === 0) break;

    interpretadas += await persistirInterpretacoesSms(db, lote);
    processadas += lote.length;
    cursor = lote.at(-1)?.id;
  }

  console.log(`${processadas} mensagens verificadas; ${interpretadas} novas interpretações.`);
}

main().catch((erro) => {
  console.error(erro instanceof Error ? erro.message : erro);
  process.exit(1);
});
