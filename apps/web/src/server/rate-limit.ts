import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/env";

const limiter =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: env.UPSTASH_REDIS_REST_URL,
          token: env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        prefix: "nexora:login",
      })
    : null;

/**
 * Fail-closed: com o limiter configurado, erro no backing store NEGA a
 * tentativa (não libera). Sem as env vars (dev/CI), é no-op.
 */
export async function limitarTentativasLogin(chave: string): Promise<void> {
  if (!limiter) return;
  let permitido = false;
  try {
    permitido = (await limiter.limit(chave)).success;
  } catch {
    permitido = false;
  }
  if (!permitido) throw new Error("Muitas tentativas de login; aguarde um minuto.");
}
