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
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-(--color-divider) bg-(--color-surface) px-4 py-4 lg:px-6">
      <div>
        <h1 className="m-0 text-[22px] font-bold">{titulo}</h1>
        <div className="mt-[2px] text-[13px] text-(--color-neutral-600)">{subtitulo}</div>
      </div>
      {children}
    </div>
  );
}
