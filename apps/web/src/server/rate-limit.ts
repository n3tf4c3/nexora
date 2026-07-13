import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/env";

const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiterLogin = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      prefix: "nexora:login",
    })
  : null;

const limiterCaptura = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      prefix: "nexora:captura",
    })
  : null;

/**
 * Fail-closed: com o limiter configurado, erro no backing store NEGA a
 * tentativa (não libera). Sem as env vars (dev/CI), é no-op — produção
 * exige o par Upstash na validação de env.
 */
async function permitido(limiter: Ratelimit | null, chave: string): Promise<boolean> {
  if (!limiter) return true;
  try {
    return (await limiter.limit(chave)).success;
  } catch {
    return false;
  }
}

/** Primeiro IP do x-forwarded-for (preenchido pela Vercel; confiável no deploy). */
export function ipDaRequisicao(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
}

export async function limitarTentativasLogin(email: string, ip: string): Promise<void> {
  const [porEmail, porIp] = await Promise.all([
    permitido(limiterLogin, `email:${email}`),
    permitido(limiterLogin, `ip:${ip}`),
  ]);
  if (!porEmail || !porIp) {
    throw new Error("Muitas tentativas de login; aguarde um minuto.");
  }
}

export async function capturaPermitida(ip: string): Promise<boolean> {
  return permitido(limiterCaptura, `ip:${ip}`);
}
