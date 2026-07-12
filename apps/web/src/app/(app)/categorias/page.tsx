import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categorias } from "@/db/schema";
import { botaoPerigo } from "@/components/estilos";
import { usuarioLogadoId } from "@/server/posse";
import { excluirCategoria } from "./actions";
import { CategoriaForm } from "./categoria-form";

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const usuarioId = await usuarioLogadoId();
  const { erro } = await searchParams;
  const lista = await db
    .select()
    .from(categorias)
    .where(eq(categorias.usuarioId, usuarioId))
    .orderBy(asc(categorias.nome));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Categorias</h1>
      {erro && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
      <CategoriaForm />
      {lista.length === 0 ? (
        <p className="text-sm text-neutral-500">Nenhuma categoria ainda.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded border border-neutral-200">
          {lista.map((c) => (
            <li key={c.id} className="flex items-center justify-between p-3 text-sm">
              <span className="font-medium">{c.nome}</span>
              <form action={excluirCategoria.bind(null, c.id)}>
                <button className={botaoPerigo}>Excluir</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
