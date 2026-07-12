import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Helper único de posse: todo acesso a dados parte daqui e toda query
 * filtra por este id. Nenhuma query global sem filtro de dono.
 */
export async function usuarioLogadoId(): Promise<string> {
  const sessao = await auth();
  const id = sessao?.user?.id;
  if (!id) redirect("/login");
  return id;
}
