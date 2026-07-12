import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categorias, contas } from "@/db/schema";
import { botaoPerigo } from "@/components/estilos";
import { IconeMais } from "@/components/icones";
import { Topo } from "@/components/topo";
import { usuarioLogadoId } from "@/server/posse";
import { excluirCategoria } from "../categorias/actions";
import { CategoriaForm } from "../categorias/categoria-form";
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
  const [listaContas, listaCategorias] = await Promise.all([
    db.select().from(contas).where(eq(contas.usuarioId, usuarioId)).orderBy(asc(contas.nome)),
    db
      .select()
      .from(categorias)
      .where(eq(categorias.usuarioId, usuarioId))
      .orderBy(asc(categorias.nome)),
  ]);

  return (
    <>
      <Topo titulo="Contas e categorias" subtitulo="Gerencie suas contas e categorias.">
        <a href="#nova-conta" className="btn btn-primary">
          <IconeMais tamanho={15} traco={2.2} />
          Nova conta
        </a>
      </Topo>

      <div className="mx-auto w-full max-w-[1160px] p-6">
        {erro && (
          <p className="mb-6 rounded-(--radius-md) bg-(--color-error-bg) p-3 text-sm text-(--color-error)">
            {erro}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="card">
            <h3 className="card-title mb-[2px]">Contas</h3>
            <ContaForm />
            {listaContas.length === 0 ? (
              <div className="estado-vazio p-4">
                <p className="m-0">Nenhuma conta cadastrada.</p>
              </div>
            ) : (
              <div>
                {listaContas.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-[10px] border-b border-(--color-divider) py-[10px]"
                  >
                    <div>
                      <strong className="text-[14px]">{c.nome}</strong>
                      <div className="text-[12px] text-(--color-neutral-600)">
                        {rotuloTipo[c.tipo]}
                      </div>
                      {c.tipo === "cartao_credito" && (
                        <div className="text-[12px] text-(--color-neutral-600)">
                          Fecha dia {c.diaFechamento}, vence dia {c.diaVencimento}.
                        </div>
                      )}
                    </div>
                    <form action={excluirConta.bind(null, c.id)}>
                      <button className={botaoPerigo} style={{ fontSize: 12 }}>
                        Excluir
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="card-title mb-[2px]">Categorias</h3>
            <CategoriaForm />
            {listaCategorias.length === 0 ? (
              <div className="estado-vazio p-4">
                <p className="m-0">Nenhuma categoria cadastrada.</p>
              </div>
            ) : (
              <div>
                {listaCategorias.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-[10px] border-b border-(--color-divider) py-[10px]"
                  >
                    <span className="text-[14px]">{c.nome}</span>
                    <form action={excluirCategoria.bind(null, c.id)}>
                      <button className={botaoPerigo} style={{ fontSize: 12 }}>
                        Excluir
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
