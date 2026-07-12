"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarTransacao } from "./actions";
import { botaoPrimario, campo } from "@/components/estilos";

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

  useEffect(() => {
    if (estado.ok) formRef.current?.reset();
  }, [estado]);

  return (
    <form ref={formRef} action={agir} className="space-y-3 rounded border border-neutral-200 p-4">
      <h2 className="text-sm font-medium">Nova transação</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <select name="tipo" defaultValue="saida" className={campo}>
          <option value="saida">Saída</option>
          <option value="entrada">Entrada</option>
        </select>
        <input name="valor" placeholder="0,00" required inputMode="decimal" className={campo} />
        <input name="data" type="date" defaultValue={hoje} required className={campo} />
        <select name="contaId" required defaultValue="" className={campo}>
          <option value="" disabled>
            Conta…
          </option>
          {contas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <select name="categoriaId" defaultValue="" className={campo}>
          <option value="">Sem categoria</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <input name="descricao" placeholder="Descrição (opcional)" className={campo} />
      </div>
      {estado.erro && <p className="text-sm text-red-600">{estado.erro}</p>}
      <button type="submit" disabled={pendente} className={botaoPrimario}>
        {pendente ? "Lançando..." : "Lançar"}
      </button>
    </form>
  );
}
