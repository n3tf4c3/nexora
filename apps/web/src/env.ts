import { z } from "zod";

// Produção de verdade (deploy prod na Vercel) — CI e previews ficam de fora.
const emProducao = process.env.VERCEL_ENV === "production";

// Schema central de env vars — toda leitura de process.env passa por aqui.
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET precisa de >= 32 caracteres (openssl rand -base64 32).")
    .refine((s) => !emProducao || !/dummy|exemplo|example|teste?/i.test(s), {
      message: "AUTH_SECRET de produção não pode ser valor de exemplo.",
    }),
  // Rate limit (Upstash). Ausentes = no-op (dev/CI); presentes = fail-closed.
  // Em produção o par é obrigatório (achado 3) — ver superRefine abaixo.
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  // Token estático do app Android (POST /api/capturas). Ausente = endpoint desativado.
  CAPTURA_SMS_TOKEN: z.string().min(32).optional(),
});

const schemaComRegras = schema.superRefine((valores, ctx) => {
  const temUrl = Boolean(valores.UPSTASH_REDIS_REST_URL);
  const temToken = Boolean(valores.UPSTASH_REDIS_REST_TOKEN);
  if (temUrl !== temToken) {
    ctx.addIssue({
      code: "custom",
      message: "UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN devem ser definidas juntas.",
    });
  }
  if (emProducao && !temUrl) {
    ctx.addIssue({
      code: "custom",
      message: "Rate limit (Upstash) é obrigatório em produção.",
    });
  }
});

export const env = schemaComRegras.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  CAPTURA_SMS_TOKEN: process.env.CAPTURA_SMS_TOKEN || undefined,
});
