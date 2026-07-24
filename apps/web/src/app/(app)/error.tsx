"use client";

import { useEffect } from "react";

// Boundary das telas autenticadas: latência/falha do banco não cai mais no
// fallback genérico do framework (achado 26).
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Erro capturado no ErrorBoundary:", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-[1160px] p-6">
      <div className="estado-vazio px-4 py-10" role="alert">
        <p className="m-0 mb-2 font-bold text-rose-400">Algo deu errado ao carregar esta tela.</p>
        {error?.message && (
          <p className="m-0 mb-4 text-xs font-mono text-slate-400 bg-slate-900 p-3 rounded-lg max-w-xl mx-auto overflow-x-auto text-left border border-slate-800">
            {error.message}
          </p>
        )}
        <button onClick={reset} className="btn btn-primary">
          Tentar de novo
        </button>
      </div>
    </div>
  );
}
