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
    <form ref={formRef} action={agir} className="space-y-3 rounded border border-neutral-200 p-4">
      <h2 className="text-sm font-medium">Nova conta</h2>
      <div className="flex gap-3">
        <input name="nome" placeholder="Nome" required className={campo} />
        <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className={campo}>
          <option value="corrente">Conta corrente</option>
          <option value="carteira">Carteira</option>
          <option value="cartao_credito">Cartão de crédito</option>
        </select>
      </div>
      {tipo === "cartao_credito" && (
        <div className="flex gap-3">
          <input
            name="diaFechamento"
            type="number"
            min={1}
            max={31}
            placeholder="Dia de fechamento"
            required
            className={campo}
          />
          <input
            name="diaVencimento"
            type="number"
            min={1}
            max={31}
            placeholder="Dia de vencimento"
            required
            className={campo}
          />
        </div>
      )}
      {estado.erro && <p className="text-sm text-red-600">{estado.erro}</p>}
      <button type="submit" disabled={pendente} className={botaoPrimario}>
        {pendente ? "Criando..." : "Criar conta"}
      </button>
    </form>
  );
}
