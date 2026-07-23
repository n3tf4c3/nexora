// Barra de topo de cada tela: título, subtítulo e ação da tela (children).

export function Topo({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 bg-[#090d16]/80 px-6 py-4 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="m-0 text-xl font-bold tracking-tight text-white font-heading">{titulo}</h1>
          <div className="mt-0.5 text-xs font-medium text-slate-400">{subtitulo}</div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Automação Ativa</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {children}
      </div>
    </header>
  );
}
