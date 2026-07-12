import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/env";
import * as schema from "./schema";

// Driver neon-http: sem transação interativa — operações multi-passo usam
// UPDATE ... WHERE ... RETURNING condicional ou db.batch.
export const db = drizzle(neon(env.DATABASE_URL), { schema });
