"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { criarTransacao } from "./actions";
import { botaoPrimario, campo } from "@/components/estilos";
import { IconeMais } from "@/components/icones";

type Opcao = { id: string; nome: string };

export function TransacaoForm({
  contas,
  categorias,
  hoje,
}: {
  contas: Opcao[];
  categorias: Opcao[];
  hoje: string;
}) {
  const [estado, agir, pendente] = useActionState(criarTransacao, {});
  const formRef = useRef<HTMLFormElement>(null);
  const id = useId();

  useEffect(() => {
    if (estado.ok) formRef.current?.reset();
  }, [estado]);

  return (
    <form ref={formRef} action={agir}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <fieldset className="field m-0 border-0 p-0">
          <legend className="p-0">Tipo</legend>
          <div className="seg">
            <label className="seg-opt">
              <input type="radio" name="tipo" value="saida" defaultChecked />
              Saída
            </label>
            <label className="seg-opt">
              <input type="radio" name="tipo" value="entrada" />
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
            className={campo}
          />
        </div>
        <div className="field">
          <label htmlFor={`${id}-data`}>Data</label>
          <input
            id={`${id}-data`}
            name="data"
            type="date"
            defaultValue={hoje}
            required
            className={campo}
          />
        </div>
        <div className="field">
          <label htmlFor={`${id}-conta`}>Conta</label>
          <select id={`${id}-conta`} name="contaId" required defaultValue="" className={campo}>
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
          <select id={`${id}-categoria`} name="categoriaId" defaultValue="" className={campo}>
            <option value="">Nenhuma</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="field md:col-span-3">
          <label htmlFor={`${id}-descricao`}>Descrição</label>
          <input
            id={`${id}-descricao`}
            name="descricao"
            placeholder="Ex.: Supermercado, aluguel, salário..."
            className={campo}
          />
        </div>
      </div>
      {estado.erro && (
        <p role="alert" className="mt-3 mb-0 text-sm text-(--color-error)">
          {estado.erro}
        </p>
      )}
      <button type="submit" disabled={pendente} className={`${botaoPrimario} mt-3`}>
        <IconeMais tamanho={15} traco={2.2} />
        {pendente ? "Adicionando..." : "Adicionar"}
      </button>
    </form>
  );
}
