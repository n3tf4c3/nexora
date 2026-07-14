"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatarCentavos, type EventoSmsReconhecido } from "@nexora/core";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { botaoPrimario } from "@/components/estilos";
import { ignorarSms } from "./actions";
import { PendenciaForm } from "./pendencia-form";

type Opcao = { id: string; nome: string };

type Interpretacao = {
  parserId: string;
  parserVersao: number;
  confianca: number;
  resultado: EventoSmsReconhecido;
};

function rotuloEvento(evento: string): string {
  if (evento === "pix_recebido") return "Pix recebido";
  if (evento === "pix_enviado") return "Pix enviado";
  if (evento === "fatura_fechada") return "Fatura fechada";
  return evento;
}

function valorParaCampo(centavos: number): string {
  const reais = Math.floor(centavos / 100).toLocaleString("pt-BR");
  return `${reais},${String(centavos % 100).padStart(2, "0")}`;
}

export function PendenciaCard({
  mensagemId,
  remetente,
  corpo,
  recebidaEmIso,
  recebidaEmFormatada,
  dataSugerida,
  interpretacao,
  contaSugeridaId,
  categoriaSugeridaId,
  contas,
  categorias,
}: {
  mensagemId: string;
  remetente: string;
  corpo: string;
  recebidaEmIso: string;
  recebidaEmFormatada: string;
  dataSugerida: string;
  interpretacao?: Interpretacao;
  contaSugeridaId?: string;
  categoriaSugeridaId?: string;
  contas: Opcao[];
  categorias: Opcao[];
}) {
  const [expandida, setExpandida] = useState(false);
  const botaoConfirmarRef = useRef<HTMLButtonElement>(null);
  const formularioRef = useRef<HTMLDivElement>(null);
  const formularioId = `confirmar-sms-${mensagemId}`;
  const resultado = interpretacao?.resultado;
  const transacional = resultado?.transacional === true ? resultado : undefined;
  const contaSugerida = contas.find((conta) => conta.id === contaSugeridaId);
  const podeConfirmar = resultado?.transacional !== false && contas.length > 0;
  const corTipo = transacional?.tipoTransacao === "entrada" ? "income" : "expense";

  useEffect(() => {
    if (!expandida) return;
    formularioRef.current
      ?.querySelector<HTMLElement>("input:not([type='hidden']), select, button")
      ?.focus();
  }, [expandida]);

  function cancelarConfirmacao() {
    setExpandida(false);
    requestAnimationFrame(() => botaoConfirmarRef.current?.focus());
  }

  return (
    <article className="card mb-3 rounded-[10px] p-4">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <h2 className="m-0 text-[15px] font-bold">{remetente}</h2>
        <time
          dateTime={recebidaEmIso}
          className="text-xs whitespace-nowrap text-(--color-neutral-600)"
        >
          {recebidaEmFormatada}
        </time>
      </header>

      <div className="flex flex-wrap items-center gap-2 text-xs" aria-label="Palpite do parser">
        {transacional ? (
          <>
            <span
              className="rounded-full px-2.5 py-1 font-semibold"
              style={{
                color: `var(--color-${corTipo})`,
                background: `var(--color-${corTipo}-bg)`,
              }}
            >
              {transacional.tipoTransacao === "entrada" ? "+" : "−"} {" "}
              {formatarCentavos(transacional.valorCentavos)}
            </span>
            <span className="rounded-full bg-(--color-accent-100) px-2.5 py-1 font-semibold text-(--color-accent-700)">
              {transacional.tipoTransacao === "entrada" ? "Entrada" : "Saída"}
            </span>
            {contaSugerida && (
              <span className="rounded-full bg-(--color-neutral-100) px-2.5 py-1 font-medium text-(--color-neutral-700)">
                Conta: {contaSugerida.nome}
              </span>
            )}
          </>
        ) : !interpretacao ? (
          <span className="rounded-full bg-(--color-neutral-100) px-2.5 py-1 font-semibold text-(--color-neutral-600)">
            Sem palpite
          </span>
        ) : null}
        {interpretacao && interpretacao.confianca < 100 && (
          <span className="rounded-full bg-(--color-neutral-100) px-2.5 py-1 font-semibold text-(--color-neutral-700)">
            Incerto
          </span>
        )}
      </div>

      {interpretacao && (
        <p className="m-0 text-xs text-(--color-neutral-600)">
          {rotuloEvento(interpretacao.resultado.evento)} reconhecido · {interpretacao.parserId} v
          {interpretacao.parserVersao} · {interpretacao.confianca}% de confiança
        </p>
      )}

      <blockquote className="m-0 rounded-md bg-(--color-neutral-100) p-3 text-sm whitespace-pre-wrap break-words text-(--color-neutral-700)">
        &ldquo;{corpo}&rdquo;
      </blockquote>

      {resultado && !resultado.transacional && (
        <div className="rounded-lg border border-(--color-divider) bg-(--color-neutral-100) p-4 text-sm">
          <p className="m-0 font-semibold">Evento informativo, sem nova transação</p>
          <p className="mt-1 mb-0 text-(--color-neutral-600)">
            Fatura com vencimento dia {resultado.diaVencimento}, total de {" "}
            {formatarCentavos(resultado.totalCentavos)} e mínimo de {" "}
            {formatarCentavos(resultado.minimoCentavos)}. A associação à fatura será feita na
            etapa de cartão de crédito.
          </p>
        </div>
      )}

      {resultado?.transacional !== false && contas.length === 0 && (
        <p className="text-muted m-0 text-sm">
          Crie uma {" "}
          <Link href="/contas" className="link">
            conta
          </Link>{" "}
          antes de confirmar transações.
        </p>
      )}

      <div hidden={expandida} className="mt-1 flex flex-wrap items-center gap-2">
        {podeConfirmar && (
          <button
            ref={botaoConfirmarRef}
            type="button"
            className={botaoPrimario}
            aria-expanded={expandida}
            aria-controls={formularioId}
            onClick={() => setExpandida(true)}
          >
            Confirmar
          </button>
        )}
        <form action={ignorarSms.bind(null, mensagemId)}>
          <BotaoConfirmar
            mensagem="Ignorar este SMS? Ele sai da fila (o texto cru continua guardado)."
            className="btn btn-secondary"
          >
            Ignorar
          </BotaoConfirmar>
        </form>
      </div>

      <div ref={formularioRef} id={formularioId} hidden={!expandida}>
        {expandida && podeConfirmar && (
          <PendenciaForm
            mensagemId={mensagemId}
            dataSugerida={dataSugerida}
            tipoSugerido={transacional?.tipoTransacao}
            valorSugerido={
              transacional ? valorParaCampo(transacional.valorCentavos) : undefined
            }
            descricaoSugerida={transacional?.descricaoSugerida}
            contaSugeridaId={contaSugeridaId}
            categoriaSugeridaId={categoriaSugeridaId}
            contas={contas}
            categorias={categorias}
            onCancelar={cancelarConfirmacao}
          />
        )}
      </div>
    </article>
  );
}
