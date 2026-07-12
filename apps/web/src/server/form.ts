import { z } from "zod";

/** Estado devolvido pelas server actions consumidas com useActionState. */
export type EstadoForm = { erro?: string; ok?: boolean };

export function primeiroErro(erro: z.ZodError): string {
  return erro.issues[0]?.message ?? "Dados inválidos.";
}

/** Código SQLSTATE de um erro do driver Neon (23505 unique, 23503 FK). */
export function codigoSql(erro: unknown): string | undefined {
  return typeof erro === "object" && erro !== null && "code" in erro
    ? String((erro as { code: unknown }).code)
    : undefined;
}
