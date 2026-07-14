"use client";

import { useActionState, useId } from "react";
import { DESCRICAO_TRANSACAO_MAX } from "@nexora/core";
import { confirmarSms } from "./actions";
import { botaoPrimario, campo } from "@/components/estilos";

type Opcao = { id: string; nome: string };

export function PendenciaForm({
  mensagemId,
  dataSugerida,
  tipoSugerido = "saida",
  valorSugerido,
  descricaoSugerida,
  contaSugeridaId,
  categoriaSugeridaId,
  contas,
  categorias,
  onCancelar,
}: {
  mensagemId: string;
  dataSugerida: string;
  tipoSugerido?: "entrada" | "saida";
  valorSugerido?: string;
  descricaoSugerida?: string;
  contaSugeridaId?: string;
  categoriaSugeridaId?: string;
  contas: Opcao[];
  categorias: Opcao[];
  onCancelar: () => void;
}) {
  const [estado, agir, pendente] = useActionState(confirmarSms, {});
  const id = useId();

  return (
    <form action={agir}>
      <input type="hidden" name="mensagemId" value={mensagemId} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <fieldset className="field m-0 border-0 p-0">
          <legend className="p-0">Tipo</legend>
          <div className="seg">
            <label className="seg-opt">
              <input
                type="radio"
                name="tipo"
                value="saida"
                defaultChecked={tipoSugerido === "saida"}
              />
              Saída
            </label>
            <label className="seg-opt">
              <input
                type="radio"
                name="tipo"
                value="entrada"
                defaultChecked={tipoSugerido === "entrada"}
              />
              Entrada
            </label>
          </div>
        </fieldset>
        <div className="field">
          <label htmlFor={`${id}-valor`}>Valor</label>
          <input
            id={`${id}-valor`}
            name="valor"
            placeholder="0,00"
            defaultValue={valorSugerido}
            required
            inputMode="decimal"
            maxLength={14}
            className={campo}
          />
        </div>
        <div className="field">
          <label htmlFor={`${id}-data`}>Data</label>
          <input
            id={`${id}-data`}
            name="data"
            type="date"
            defaultValue={dataSugerida}
            required
            className={campo}
          />
        </div>
        <div className="field">
          <label htmlFor={`${id}-conta`}>Conta</label>
          <select
            id={`${id}-conta`}
            name="contaId"
            required
            defaultValue={contaSugeridaId ?? ""}
            className={campo}
          >
            <option value="" disabled>
              Selecione
            </option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-categoria`}>Categoria (opcional)</label>
          <select
            id={`${id}-categoria`}
            name="categoriaId"
            defaultValue={categoriaSugeridaId ?? ""}
            className={campo}
          >
            <option value="">Nenhuma</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-descricao`}>Descrição</label>
          <input
            id={`${id}-descricao`}
            name="descricao"
            placeholder="Ex.: Padaria, mercado..."
            defaultValue={descricaoSugerida}
            maxLength={DESCRICAO_TRANSACAO_MAX}
            className={campo}
          />
        </div>
      </div>
      {(contaSugeridaId || categoriaSugeridaId) && (
        <p className="mt-2 mb-0 text-xs text-(--color-neutral-600)">
          {contaSugeridaId && categoriaSugeridaId
            ? "Conta e categoria reaproveitadas de confirmações anteriores equivalentes."
            : contaSugeridaId
              ? "Conta reaproveitada de uma confirmação anterior equivalente."
              : "Categoria reaproveitada de uma confirmação anterior equivalente."}
        </p>
      )}
      {estado.erro && (
        <p role="alert" className="mt-3 mb-0 text-sm text-(--color-error)">
          {estado.erro}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pendente} className={botaoPrimario}>
          {pendente ? "Salvando..." : "Salvar transação"}
        </button>
        <button
          type="button"
          disabled={pendente}
          className="btn btn-secondary"
          onClick={onCancelar}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
