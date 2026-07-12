"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarCategoria } from "./actions";
import { botaoPrimario, campo } from "@/components/estilos";

export function CategoriaForm() {
  const [estado, agir, pendente] = useActionState(criarCategoria, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) formRef.current?.reset();
  }, [estado]);

  return (
    <form ref={formRef} action={agir} className="space-y-3 rounded border border-neutral-200 p-4">
      <h2 className="text-sm font-medium">Nova categoria</h2>
      <div className="flex gap-3">
        <input name="nome" placeholder="Nome" required className={campo} />
        <button type="submit" disabled={pendente} className={botaoPrimario}>
          {pendente ? "Criando..." : "Criar"}
        </button>
      </div>
      {estado.erro && <p className="text-sm text-red-600">{estado.erro}</p>}
    </form>
  );
}
