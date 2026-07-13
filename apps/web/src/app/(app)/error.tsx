"use client";

// Boundary das telas autenticadas: latência/falha do banco não cai mais no
// fallback genérico do framework (achado 26).
export default function Erro({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-[1160px] p-6">
      <div className="estado-vazio px-4 py-10" role="alert">
        <p className="m-0 mb-3">Algo deu errado ao carregar esta tela.</p>
        <button onClick={reset} className="btn btn-primary">
          Tentar de novo
        </button>
      </div>
    </div>
  );
}
