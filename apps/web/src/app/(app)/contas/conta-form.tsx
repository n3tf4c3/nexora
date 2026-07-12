"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { criarConta } from "./actions";
import { botaoPrimario, campo } from "@/components/estilos";

export function ContaForm() {
  const [estado, agir, pendente] = useActionState(criarConta, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [tipo, setTipo] = useState("corrente");

  // Ajuste de estado em render (não em effect): sucesso volta o tipo ao padrão.
  const [estadoAnterior, setEstadoAnterior] = useState(estado);
  if (estado !== estadoAnterior) {
    setEstadoAnterior(estado);
    if (estado.ok) setTipo("corrente");
  }

  useEffect(() => {
    if (estado.ok) formRef.current?.reset();
  }, [estado]);

  return (
    <form
      id="nova-conta"
      ref={formRef}
      action={agir}
      className="mb-4 grid grid-cols-1 items-end gap-2 md:grid-cols-2"
    >
      <div className="field md:col-span-2">
        <label>Nome</label>
        <input name="nome" placeholder="Ex.: Banco do Brasil" required className={campo} />
      </div>
      <div className="field">
        <label>Tipo</label>
        <select
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
      <button type="submit" disabled={pendente} className={botaoPrimario}>
        {pendente ? "Adicionando..." : "Adicionar"}
      </button>
      {tipo === "cartao_credito" && (
        <>
          <div className="field">
            <label>Fecha dia</label>
            <input
              name="diaFechamento"
              type="number"
              min={1}
              max={31}
              required
              className={campo}
            />
          </div>
          <div className="field">
            <label>Vence dia</label>
            <input
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
      {estado.erro && (
        <p className="m-0 text-sm text-(--color-error) md:col-span-2">{estado.erro}</p>
      )}
    </form>
  );
}
