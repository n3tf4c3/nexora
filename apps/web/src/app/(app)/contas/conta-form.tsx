"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { ICONES_CONTA, NOME_CONTA_MAX, type TipoIconeConta } from "@nexora/core";
import { criarConta } from "./actions";
import { botaoPrimario, campo } from "@/components/estilos";
import { IconeConta } from "@/components/icone-conta";

const ROTULOS_ICONE: Record<TipoIconeConta, string> = {
  banco: "Banco",
  cartao: "Cartão",
  dinheiro: "Dinheiro ou carteira",
  poupanca: "Poupança",
  investimento: "Investimento",
};

export function ContaForm() {
  const [estado, agir, pendente] = useActionState(criarConta, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [tipo, setTipo] = useState("corrente");
  const [icone, setIcone] = useState<TipoIconeConta>("banco");
  const id = useId();

  // Ajuste de estado em render (não em effect): sucesso volta o tipo ao padrão.
  const [estadoAnterior, setEstadoAnterior] = useState(estado);
  if (estado !== estadoAnterior) {
    setEstadoAnterior(estado);
    if (estado.ok) {
      setTipo("corrente");
      setIcone("banco");
    }
  }

  useEffect(() => {
    if (estado.ok) formRef.current?.reset();
  }, [estado]);

  return (
    <form
      id="nova-conta"
      ref={formRef}
      action={agir}
      className="mb-4 grid grid-cols-1 items-end gap-3 lg:grid-cols-2"
    >
      <div className="field lg:col-span-2">
        <label htmlFor={`${id}-nome`}>Nome</label>
        <input
          id={`${id}-nome`}
          name="nome"
          placeholder="Ex.: Banco do Brasil"
          required
          maxLength={NOME_CONTA_MAX}
          className={campo}
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-tipo`}>Tipo</label>
        <select
          id={`${id}-tipo`}
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className={campo}
        >
          <option value="corrente">Conta corrente</option>
          <option value="carteira">Carteira</option>
          <option value="cartao_credito">Cartão de crédito</option>
        </select>
      </div>
      <fieldset className="field m-0 border-0 p-0 lg:col-span-2">
        <legend className="p-0">Ícone</legend>
        <div className="flex flex-wrap gap-2" aria-label="Modelo de ícone da conta">
          {ICONES_CONTA.map((opcao) => (
            <label
              key={opcao}
              title={ROTULOS_ICONE[opcao]}
              className={`seletor-icone flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-full border bg-(--color-surface) transition ${
                icone === opcao
                  ? "border-(--color-accent) ring-2 ring-(--color-accent-200)"
                  : "border-(--color-divider) hover:border-(--color-neutral-400)"
              }`}
            >
              <input
                type="radio"
                name="icone"
                value={opcao}
                checked={icone === opcao}
                onChange={() => setIcone(opcao)}
                className="sr-only"
              />
              <IconeConta tipo={opcao} tamanho={32} />
              <span className="sr-only">{ROTULOS_ICONE[opcao]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {tipo === "cartao_credito" && (
        <>
          <div className="field">
            <label htmlFor={`${id}-fechamento`}>Fecha dia</label>
            <input
              id={`${id}-fechamento`}
              name="diaFechamento"
              type="number"
              min={1}
              max={31}
              required
              className={campo}
            />
          </div>
          <div className="field">
            <label htmlFor={`${id}-vencimento`}>Vence dia</label>
            <input
              id={`${id}-vencimento`}
              name="diaVencimento"
              type="number"
              min={1}
              max={31}
              required
              className={campo}
            />
          </div>
        </>
      )}
      <button type="submit" disabled={pendente} className={`${botaoPrimario} lg:col-span-2`}>
        {pendente ? "Adicionando..." : "Adicionar"}
      </button>
      {estado.erro && (
        <p role="alert" className="m-0 text-sm text-(--color-error) lg:col-span-2">
          {estado.erro}
        </p>
      )}
    </form>
  );
}
