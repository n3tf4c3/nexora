"use client";

import { useActionState, useEffect, useRef } from "react";
import { NOME_CATEGORIA_MAX } from "@nexora/core";
import { criarCategoria } from "./actions";
import { botaoPrimario, campo } from "@/components/estilos";

export function CategoriaForm() {
  const [estado, agir, pendente] = useActionState(criarCategoria, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) formRef.current?.reset();
  }, [estado]);

  return (
    <form ref={formRef} action={agir} className="mb-4">
      <div className="flex gap-2">
        <label htmlFor="nova-categoria-nome" className="sr-only">
          Nome da categoria
        </label>
        <input
          id="nova-categoria-nome"
          name="nome"
          placeholder="Ex.: Educação"
          required
          maxLength={NOME_CATEGORIA_MAX}
          className={campo}
        />
        <button type="submit" disabled={pendente} className={`${botaoPrimario} whitespace-nowrap`}>
          {pendente ? "Adicionando..." : "Adicionar"}
        </button>
      </div>
      {estado.erro && (
        <p role="alert" className="mt-2 mb-0 text-sm text-(--color-error)">
          {estado.erro}
        </p>
      )}
    </form>
  );
}
