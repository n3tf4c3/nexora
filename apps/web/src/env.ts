import { z } from "zod";

// Schema central de env vars — toda leitura de process.env passa por aqui.
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  // Rate limit (Upstash). Ausentes = no-op (dev/CI); presentes = fail-closed.
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  // Token estático do app Android (POST /api/capturas). Ausente = endpoint desativado.
  CAPTURA_SMS_TOKEN: z.string().min(32).optional(),
});

export const env = schema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  CAPTURA_SMS_TOKEN: process.env.CAPTURA_SMS_TOKEN || undefined,
});
