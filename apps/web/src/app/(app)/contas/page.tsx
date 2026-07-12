import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contas } from "@/db/schema";
import { botaoPerigo } from "@/components/estilos";
import { usuarioLogadoId } from "@/server/posse";
import { excluirConta } from "./actions";
import { ContaForm } from "./conta-form";

const rotuloTipo = {
  corrente: "Conta corrente",
  carteira: "Carteira",
  cartao_credito: "Cartão de crédito",
} as const;

export default async function ContasPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const usuarioId = await usuarioLogadoId();
  const { erro } = await searchParams;
  const lista = await db
    .select()
    .from(contas)
    .where(eq(contas.usuarioId, usuarioId))
    .orderBy(asc(contas.nome));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Contas</h1>
      {erro && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
      <ContaForm />
      {lista.length === 0 ? (
        <p className="text-sm text-neutral-500">Nenhuma conta ainda.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded border border-neutral-200">
          {lista.map((c) => (
            <li key={c.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="font-medium">{c.nome}</p>
                <p className="text-neutral-500">
                  {rotuloTipo[c.tipo]}
                  {c.tipo === "cartao_credito" &&
                    ` — fecha dia ${c.diaFechamento}, vence dia ${c.diaVencimento}`}
                </p>
              </div>
              <form action={excluirConta.bind(null, c.id)}>
                <button className={botaoPerigo}>Excluir</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
