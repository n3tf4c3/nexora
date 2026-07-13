import Link from "next/link";
import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { categorias, contas, mensagensSms } from "@/db/schema";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { botaoPerigo } from "@/components/estilos";
import { IconeCaixaVazia } from "@/components/icones";
import { Topo } from "@/components/topo";
import { usuarioLogadoId } from "@/server/posse";
import { ignorarSms } from "./actions";
import { PendenciaForm } from "./pendencia-form";

const FUSO = "America/Sao_Paulo";
// Fila é revisada aos poucos; renderizar sem teto degrada com captura acumulada.
const MAX_PENDENCIAS = 50;

export default async function FilaPage() {
  const usuarioId = await usuarioLogadoId();

  const filtroPendentes = and(
    eq(mensagensSms.usuarioId, usuarioId),
    eq(mensagensSms.status, "pendente"),
  );

  const [pendencias, [{ total }], listaContas, listaCategorias] = await Promise.all([
    db
      .select({
        id: mensagensSms.id,
        remetente: mensagensSms.remetente,
        corpo: mensagensSms.corpo,
        recebidaEm: mensagensSms.recebidaEm,
      })
      .from(mensagensSms)
      .where(filtroPendentes)
      .orderBy(asc(mensagensSms.recebidaEm))
      .limit(MAX_PENDENCIAS),
    db.select({ total: count() }).from(mensagensSms).where(filtroPendentes),
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
  ]);

  return (
    <>
      <Topo
        titulo="Fila de confirmação"
        subtitulo="SMS capturados que o parser não confirmou sozinho."
      />
      <div className="mx-auto w-full max-w-[1160px] p-6">
        {pendencias.length === 0 ? (
          <div className="estado-vazio px-4 py-8">
            <IconeCaixaVazia tamanho={28} traco={1.6} className="mx-auto mb-3" />
            <p className="m-0 mb-2">Nenhuma pendência. Todos os SMS foram revisados.</p>
            <Link href="/" className="link">
              Ver dashboard do mês →
            </Link>
          </div>
        ) : (
          <>
            {total > pendencias.length && (
              <p className="m-0 mb-4 text-[13px] text-(--color-neutral-600)">
                Mostrando as {pendencias.length} pendências mais antigas de {total} — revise-as
                para ver as demais.
              </p>
            )}
            {pendencias.map((p) => (
            <div key={p.id} className="card mb-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="card-title m-0">{p.remetente}</h3>
                <span className="text-[13px] text-(--color-neutral-600)">
                  {p.recebidaEm.toLocaleString("pt-BR", { timeZone: FUSO })}
                </span>
              </div>
              <p className="m-0 mb-4 rounded-md bg-(--color-neutral-100) p-3 text-sm whitespace-pre-wrap">
                {p.corpo}
              </p>
              {listaContas.length === 0 ? (
                <p className="text-muted m-0 text-sm">
                  Crie uma{" "}
                  <Link href="/contas" className="link">
                    conta
                  </Link>{" "}
                  antes de confirmar transações.
                </p>
              ) : (
                <PendenciaForm
                  mensagemId={p.id}
                  dataSugerida={p.recebidaEm.toLocaleDateString("en-CA", { timeZone: FUSO })}
                  contas={listaContas}
                  categorias={listaCategorias}
                />
              )}
              <form action={ignorarSms.bind(null, p.id)} className="mt-3">
                <BotaoConfirmar
                  mensagem="Ignorar este SMS? Ele sai da fila (o texto cru continua guardado)."
                  className={botaoPerigo}
                >
                  Ignorar este SMS
                </BotaoConfirmar>
              </form>
            </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
