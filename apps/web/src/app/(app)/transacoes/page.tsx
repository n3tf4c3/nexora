import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { formatarCentavos } from "@nexora/core";
import { db } from "@/db";
import { categorias, contas, transacoes } from "@/db/schema";
import { botaoPerigo } from "@/components/estilos";
import { hojeISO } from "@/lib/hoje";
import { usuarioLogadoId } from "@/server/posse";
import { excluirTransacao } from "./actions";
import { TransacaoForm } from "./transacao-form";

export default async function TransacoesPage() {
  const usuarioId = await usuarioLogadoId();

  const [listaContas, listaCategorias, lista] = await Promise.all([
    db
      .select({ id: contas.id, nome: contas.nome })
      .from(contas)
      .where(eq(contas.usuarioId, usuarioId))
      .orderBy(asc(contas.nome)),
    db
      .select({ id: categorias.id, nome: categorias.nome })
      .from(categorias)
      .where(eq(categorias.usuarioId, usuarioId))
      .orderBy(asc(categorias.nome)),
    db
      .select({
        id: transacoes.id,
        data: transacoes.data,
        tipo: transacoes.tipo,
        valorCentavos: transacoes.valorCentavos,
        descricao: transacoes.descricao,
        conta: contas.nome,
        categoria: categorias.nome,
      })
      .from(transacoes)
      .innerJoin(contas, eq(transacoes.contaId, contas.id))
      .leftJoin(categorias, eq(transacoes.categoriaId, categorias.id))
      .where(eq(transacoes.usuarioId, usuarioId))
      .orderBy(desc(transacoes.data), desc(transacoes.criadoEm))
      .limit(100),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Transações</h1>
      {listaContas.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Crie uma <Link href="/contas" className="underline">conta</Link> antes de lançar transações.
        </p>
      ) : (
        <TransacaoForm contas={listaContas} categorias={listaCategorias} hoje={hojeISO()} />
      )}
      {lista.length === 0 ? (
        <p className="text-sm text-neutral-500">Nenhuma transação ainda.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="py-2 font-normal">Data</th>
              <th className="py-2 font-normal">Descrição</th>
              <th className="py-2 font-normal">Conta</th>
              <th className="py-2 font-normal">Categoria</th>
              <th className="py-2 text-right font-normal">Valor</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {lista.map((t) => (
              <tr key={t.id} className="border-b border-neutral-100">
                <td className="py-2 whitespace-nowrap">
                  {t.data.slice(8, 10)}/{t.data.slice(5, 7)}/{t.data.slice(0, 4)}
                </td>
                <td className="py-2">{t.descricao ?? "—"}</td>
                <td className="py-2">{t.conta}</td>
                <td className="py-2">{t.categoria ?? "—"}</td>
                <td
                  className={`py-2 text-right whitespace-nowrap ${t.tipo === "entrada" ? "text-green-700" : "text-red-700"}`}
                >
                  {t.tipo === "entrada" ? "+" : "−"} {formatarCentavos(t.valorCentavos)}
                </td>
                <td className="py-2 text-right">
                  <form action={excluirTransacao.bind(null, t.id)}>
                    <button className={botaoPerigo}>Excluir</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
