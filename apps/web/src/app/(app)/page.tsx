import Link from "next/link";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import {
  ehMesValido,
  formatarCentavos,
  limitesDoMes,
  mesAnterior,
  mesSeguinte,
  nomeDoMes,
} from "@nexora/core";
import { db } from "@/db";
import { categorias, contas, transacoes } from "@/db/schema";
import { mesAtual } from "@/lib/hoje";
import { usuarioLogadoId } from "@/server/posse";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const usuarioId = await usuarioLogadoId();
  const { mes: mesParam } = await searchParams;
  const mes = mesParam && ehMesValido(mesParam) ? mesParam : mesAtual();
  const { inicio, fim } = limitesDoMes(mes);

  const filtroMes = and(
    eq(transacoes.usuarioId, usuarioId),
    gte(transacoes.data, inicio),
    lte(transacoes.data, fim),
  );

  const [totais] = await db
    .select({
      entradas: sql<string>`coalesce(sum(${transacoes.valorCentavos}) filter (where ${transacoes.tipo} = 'entrada'), 0)`,
      saidas: sql<string>`coalesce(sum(${transacoes.valorCentavos}) filter (where ${transacoes.tipo} = 'saida'), 0)`,
    })
    .from(transacoes)
    .where(filtroMes);

  const entradas = Number(totais?.entradas ?? 0);
  const saidas = Number(totais?.saidas ?? 0);
  const saldo = entradas - saidas;

  const doMes = await db
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
    .where(filtroMes)
    .orderBy(desc(transacoes.data), desc(transacoes.criadoEm));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold capitalize">{nomeDoMes(mes)}</h1>
        <div className="flex gap-3 text-sm">
          <Link href={`/?mes=${mesAnterior(mes)}`} className="text-neutral-600 hover:underline">
            ← anterior
          </Link>
          <Link href={`/?mes=${mesSeguinte(mes)}`} className="text-neutral-600 hover:underline">
            próximo →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Cartao rotulo="Entradas" valor={entradas} cor="text-green-700" />
        <Cartao rotulo="Saídas" valor={saidas} cor="text-red-700" />
        <Cartao rotulo="Saldo" valor={saldo} cor={saldo >= 0 ? "text-neutral-900" : "text-red-700"} />
      </div>

      {doMes.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Nenhuma transação no mês. <Link href="/transacoes" className="underline">Lançar a primeira</Link>.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="py-2 font-normal">Data</th>
              <th className="py-2 font-normal">Descrição</th>
              <th className="py-2 font-normal">Conta</th>
              <th className="py-2 font-normal">Categoria</th>
              <th className="py-2 text-right font-normal">Valor</th>
            </tr>
          </thead>
          <tbody>
            {doMes.map((t) => (
              <tr key={t.id} className="border-b border-neutral-100">
                <td className="py-2 whitespace-nowrap">{t.data.slice(8, 10)}/{t.data.slice(5, 7)}</td>
                <td className="py-2">{t.descricao ?? "—"}</td>
                <td className="py-2">{t.conta}</td>
                <td className="py-2">{t.categoria ?? "—"}</td>
                <td
                  className={`py-2 text-right whitespace-nowrap ${t.tipo === "entrada" ? "text-green-700" : "text-red-700"}`}
                >
                  {t.tipo === "entrada" ? "+" : "−"} {formatarCentavos(t.valorCentavos)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Cartao({ rotulo, valor, cor }: { rotulo: string; valor: number; cor: string }) {
  return (
    <div className="rounded border border-neutral-200 p-4">
      <p className="text-xs text-neutral-500">{rotulo}</p>
      <p className={`mt-1 text-lg font-semibold ${cor}`}>{formatarCentavos(valor)}</p>
    </div>
  );
}
