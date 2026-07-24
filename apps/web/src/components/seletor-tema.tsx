"use client";

import { useEffect, useState } from "react";

export function SeletorTema() {
  const [tema, setTema] = useState<"dark" | "light">("dark");
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setMontado(true);
      const salvo = localStorage.getItem("theme") as "dark" | "light" | null;
      if (salvo) {
        setTema(salvo);
        document.documentElement.classList.remove("dark", "light");
        document.documentElement.classList.add(salvo);
      } else {
        const prefereEscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const inicial = prefereEscuro ? "dark" : "dark"; // padrão dark no fintech
        setTema(inicial);
        document.documentElement.classList.add(inicial);
      }
    });
  }, []);

  function alternarTema() {
    const novoTema = tema === "dark" ? "light" : "dark";
    setTema(novoTema);
    localStorage.setItem("theme", novoTema);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(novoTema);
  }

  if (!montado) {
    return (
      <div className="h-8 w-full rounded-xl bg-slate-800/40 animate-pulse" />
    );
  }

  return (
    <button
      type="button"
      onClick={alternarTema}
      className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-300 transition-all hover:border-indigo-500/40 hover:bg-slate-800 hover:text-white dark-toggle-btn"
      title={`Alternar para tema ${tema === "dark" ? "claro" : "escuro"}`}
    >
      <span className="flex items-center gap-2">
        {tema === "dark" ? (
          <>
            <span className="text-amber-400">☀️</span>
            <span>Tema claro</span>
          </>
        ) : (
          <>
            <span className="text-indigo-400">🌙</span>
            <span>Tema escuro</span>
          </>
        )}
      </span>
      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 uppercase">
        {tema}
      </span>
    </button>
  );
}
