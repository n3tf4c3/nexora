import Link from "next/link";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { formatarCentavos } from "@nexora/core";
import { db } from "@/db";
import { categorias, contas, transacoes } from "@/db/schema";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { botaoPerigo } from "@/components/estilos";
import { IconeMais } from "@/components/icones";
import { Topo } from "@/components/topo";
import { hojeISO } from "@/lib/hoje";
import { uuidValido } from "@/server/form";
import { usuarioLogadoId } from "@/server/posse";
import { excluirTransacao } from "./actions";
import { TransacaoForm, type TransacaoEditavel } from "./transacao-form";

const POR_PAGINA = 50;
const BUSCA_MAX = 80;

// Query string repetida chega como array — normaliza para o primeiro valor.
function primeiroValor(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

// %, _ e \ são curingas/escape do ILIKE (o escape padrão do Postgres é \).
function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, "\\$&");
}

export default async function TransacoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    pagina?: string | string[];
    editar?: string | string[];
  }>;
}) {
  const usuarioId = await usuarioLogadoId();
  const { q, pagina: paginaParam, editar } = await searchParams;
  const busca = primeiroValor(q).trim().slice(0, BUSCA_MAX);
  const pagina = Math.max(1, Number.parseInt(primeiroValor(paginaParam) || "1", 10) || 1);
  const editarParam = primeiroValor(editar);
  const editarId = uuidValido(editarParam) ? editarParam : "";

  const padrao = `%${escaparLike(busca)}%`;
  const filtro = busca
    ? and(
        eq(transacoes.usuarioId, usuarioId),
        or(
          ilike(transacoes.descricao, padrao),
          ilike(contas.nome, padrao),
          ilike(categorias.nome, padrao),
        ),
      )
    : eq(transacoes.usuarioId, usuarioId);

  const [listaContas, listaCategorias, lista, [{ total }]] = await Promise.all([
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
        contaId: transacoes.contaId,
        categoriaId: transacoes.categoriaId,
      })
      .from(transacoes)
      .innerJoin(contas, eq(transacoes.contaId, contas.id))
      .leftJoin(categorias, eq(transacoes.categoriaId, categorias.id))
      .where(filtro)
      .orderBy(desc(transacoes.data), desc(transacoes.criadoEm))
      .limit(POR_PAGINA)
      .offset((pagina - 1) * POR_PAGINA),
    db
      .select({ total: count() })
      .from(transacoes)
      .innerJoin(contas, eq(transacoes.contaId, contas.id))
      .leftJoin(categorias, eq(transacoes.categoriaId, categorias.id))
      .where(filtro),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const hrefPagina = (p: number) =>
    `/transacoes?${new URLSearchParams({
      ...(busca ? { q: busca } : {}),
      ...(p > 1 ? { pagina: String(p) } : {}),
    }).toString()}`.replace(/\?$/, "");

  return (
    <>
      <Topo titulo="Transações" subtitulo="Registro completo de entradas e saídas.">
        <a href="#nova-transacao" className="btn btn-primary">
          <IconeMais tamanho={15} traco={2.2} />
          Nova transação
        </a>
      </Topo>

      <div className="mx-auto w-full max-w-[1160px] p-6">
        <div id="nova-transacao" className="card mb-6">
          <h3 className="card-title mb-[2px]">Nova transação</h3>
          {listaContas.length === 0 ? (
            <p className="text-muted m-0 text-sm">
              Crie uma{" "}
              <Link href="/contas" className="link">
                conta
              </Link>{" "}
              antes de lançar transações.
            </p>
          ) : (
            <TransacaoForm contas={listaContas} categorias={listaCategorias} hoje={hojeISO()} />
          )}
        </div>

        <div className="card">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="card-title">Todas as transações</h3>
            {busca && (
              <span className="text-[13px] text-(--color-neutral-600)">
                Filtrando por &quot;{busca}&quot; —{" "}
                <Link href="/transacoes" className="link">
                  limpar
                </Link>
              </span>
            )}
          </div>

          {lista.length === 0 ? (
            <div className="estado-vazio">
              {busca ? (
                <p className="m-0">Nenhum resultado para &quot;{busca}&quot;.</p>
              ) : (
                <p className="m-0">Nenhuma transação registrada.</p>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Conta</th>
                      <th className="text-right">Valor</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((t) =>
                      t.id === editarId ? (
                        <tr key={t.id}>
                          <td colSpan={6} className="bg-(--color-neutral-100)">
                            <TransacaoForm
                              contas={listaContas}
                              categorias={listaCategorias}
                              hoje={hojeISO()}
                              transacao={t satisfies TransacaoEditavel}
                            />
                          </td>
                        </tr>
                      ) : (
                        <tr key={t.id}>
                          <td className="whitespace-nowrap">
                            {t.data.slice(8, 10)}/{t.data.slice(5, 7)}/{t.data.slice(0, 4)}
                          </td>
                          <td>{t.descricao ?? "—"}</td>
                          <td>{t.categoria ?? "—"}</td>
                          <td>{t.conta}</td>
                          <td
                            className="text-right font-semibold whitespace-nowrap"
                            style={{
                              color:
                                t.tipo === "entrada"
                                  ? "var(--color-income)"
                                  : "var(--color-expense)",
                            }}
                          >
                            {t.tipo === "entrada" ? "+" : "−"} {formatarCentavos(t.valorCentavos)}
                          </td>
                          <td className="text-right">
                            <span className="flex items-center justify-end gap-3">
                              <Link href={`/transacoes?editar=${t.id}`} className="link text-[13px]">
                                Editar
                              </Link>
                              <form action={excluirTransacao.bind(null, t.id)}>
                                <BotaoConfirmar
                                  mensagem="Excluir esta transação? Se ela veio de um SMS, a mensagem volta para a fila."
                                  className={botaoPerigo}
                                >
                                  Excluir
                                </BotaoConfirmar>
                              </form>
                            </span>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden">
                {lista.map((t) =>
                  t.id === editarId ? (
                    <div key={t.id} className="border-b border-(--color-divider) py-3">
                      <TransacaoForm
                        contas={listaContas}
                        categorias={listaCategorias}
                        hoje={hojeISO()}
                        transacao={t satisfies TransacaoEditavel}
                      />
                    </div>
                  ) : (
                    <div key={t.id} className="border-b border-(--color-divider) py-[10px]">
                      <div className="flex justify-between gap-2">
                        <strong className="text-[14px]">{t.descricao ?? "—"}</strong>
                        <span
                          className="font-semibold whitespace-nowrap"
                          style={{
                            color:
                              t.tipo === "entrada"
                                ? "var(--color-income)"
                                : "var(--color-expense)",
                          }}
                        >
                          {t.tipo === "entrada" ? "+" : "−"} {formatarCentavos(t.valorCentavos)}
                        </span>
                      </div>
                      <div className="mb-1 text-[12px] text-(--color-neutral-600)">
                        {t.data.slice(8, 10)}/{t.data.slice(5, 7)}/{t.data.slice(0, 4)} ·{" "}
                        {t.categoria ?? "—"} · {t.conta}
                      </div>
                      <span className="flex items-center gap-3">
                        <Link
                          href={`/transacoes?editar=${t.id}`}
                          className="link text-[12px]"
                        >
                          Editar
                        </Link>
                        <form action={excluirTransacao.bind(null, t.id)}>
                          <BotaoConfirmar
                            mensagem="Excluir esta transação? Se ela veio de um SMS, a mensagem volta para a fila."
                            className={botaoPerigo}
                            style={{ fontSize: 12 }}
                          >
                            Excluir
                          </BotaoConfirmar>
                        </form>
                      </span>
                    </div>
                  ),
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px] text-(--color-neutral-600)">
                <span>
                  {total} transaç{total === 1 ? "ão" : "ões"} — página {pagina} de{" "}
                  {totalPaginas}
                </span>
                <span className="flex gap-4">
                  {pagina > 1 && (
                    <Link href={hrefPagina(pagina - 1)} className="link">
                      ← Anterior
                    </Link>
                  )}
                  {pagina < totalPaginas && (
                    <Link href={hrefPagina(pagina + 1)} className="link">
                      Próxima →
                    </Link>
                  )}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
