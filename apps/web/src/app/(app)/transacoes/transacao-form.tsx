"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useMemo, useRef } from "react";
import { DESCRICAO_TRANSACAO_MAX } from "@nexora/core";
import { atualizarTransacao, criarTransacao } from "./actions";
import { botaoPrimario, campo } from "@/components/estilos";
import { IconeMais } from "@/components/icones";

type Opcao = { id: string; nome: string };

export type TransacaoEditavel = {
  id: string;
  tipo: "entrada" | "saida";
  valorCentavos: number;
  data: string;
  contaId: string;
  categoriaId: string | null;
  descricao: string | null;
};

// Valor no formato que o campo aceita ("1.234,56"), sem o prefixo R$.
function valorParaCampo(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Formulário de transação — cria quando `transacao` está ausente, edita quando presente. */
export function TransacaoForm({
  contas,
  categorias,
  hoje,
  transacao,
}: {
  contas: Opcao[];
  categorias: Opcao[];
  hoje: string;
  transacao?: TransacaoEditavel;
}) {
  const acao = useMemo(
    () => (transacao ? atualizarTransacao.bind(null, transacao.id) : criarTransacao),
    [transacao],
  );
  const [estado, agir, pendente] = useActionState(acao, {});
  const formRef = useRef<HTMLFormElement>(null);
  const id = useId();

  useEffect(() => {
    if (estado.ok && !transacao) formRef.current?.reset();
  }, [estado, transacao]);

  return (
    <form ref={formRef} action={agir}>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <fieldset className="field m-0 border-0 p-0">
          <legend className="p-0">Tipo</legend>
          <div className="seg">
            <label className="seg-opt">
              <input
                type="radio"
                name="tipo"
                value="saida"
                defaultChecked={(transacao?.tipo ?? "saida") === "saida"}
              />
              Saída
            </label>
            <label className="seg-opt">
              <input
                type="radio"
                name="tipo"
                value="entrada"
                defaultChecked={transacao?.tipo === "entrada"}
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
            required
            inputMode="decimal"
            maxLength={14}
            defaultValue={transacao ? valorParaCampo(transacao.valorCentavos) : undefined}
            className={campo}
          />
        </div>
        <div className="field">
          <label htmlFor={`${id}-data`}>Data</label>
          <input
            id={`${id}-data`}
            name="data"
            type="date"
            defaultValue={transacao?.data ?? hoje}
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
            defaultValue={transacao?.contaId ?? ""}
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
            defaultValue={transacao?.categoriaId ?? ""}
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
        <div className="field lg:col-span-3">
          <label htmlFor={`${id}-descricao`}>Descrição</label>
          <input
            id={`${id}-descricao`}
            name="descricao"
            placeholder="Ex.: Supermercado, aluguel, salário..."
            maxLength={DESCRICAO_TRANSACAO_MAX}
            defaultValue={transacao?.descricao ?? undefined}
            className={campo}
          />
        </div>
      </div>
      {estado.erro && (
        <p role="alert" className="mt-3 mb-0 text-sm text-(--color-error)">
          {estado.erro}
        </p>
      )}
      <div className="mt-3 flex items-center gap-4">
        <button type="submit" disabled={pendente} className={botaoPrimario}>
          {!transacao && <IconeMais tamanho={15} traco={2.2} />}
          {transacao
            ? pendente
              ? "Salvando..."
              : "Salvar alterações"
            : pendente
              ? "Adicionando..."
              : "Adicionar"}
        </button>
        {transacao && (
          <Link href="/transacoes" className="link text-sm">
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
