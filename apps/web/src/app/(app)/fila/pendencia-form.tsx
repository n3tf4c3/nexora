"use client";

import { useActionState } from "react";
import { confirmarSms } from "./actions";
import { botaoPrimario, campo } from "@/components/estilos";

type Opcao = { id: string; nome: string };

export function PendenciaForm({
  mensagemId,
  dataSugerida,
  contas,
  categorias,
}: {
  mensagemId: string;
  dataSugerida: string;
  contas: Opcao[];
  categorias: Opcao[];
}) {
  const [estado, agir, pendente] = useActionState(confirmarSms, {});

  return (
    <form action={agir}>
      <input type="hidden" name="mensagemId" value={mensagemId} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="field">
          <label>Tipo</label>
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
        </div>
        <div className="field">
          <label>Valor</label>
          <input
            name="valor"
            placeholder="0,00"
            required
            inputMode="decimal"
            className={campo}
          />
        </div>
        <div className="field">
          <label>Data</label>
          <input name="data" type="date" defaultValue={dataSugerida} required className={campo} />
        </div>
        <div className="field">
          <label>Conta</label>
          <select name="contaId" required defaultValue="" className={campo}>
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
          <label>Categoria (opcional)</label>
          <select name="categoriaId" defaultValue="" className={campo}>
            <option value="">Nenhuma</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Descrição</label>
          <input name="descricao" placeholder="Ex.: Padaria, mercado..." className={campo} />
        </div>
      </div>
      {estado.erro && (
        <p className="mt-3 mb-0 text-sm text-(--color-error)">{estado.erro}</p>
      )}
      <button type="submit" disabled={pendente} className={`${botaoPrimario} mt-3`}>
        {pendente ? "Confirmando..." : "Confirmar como transação"}
      </button>
    </form>
  );
}
