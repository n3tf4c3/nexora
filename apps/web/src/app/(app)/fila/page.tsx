import Link from "next/link";
import { IconeCaixaVazia } from "@/components/icones";
import { Topo } from "@/components/topo";

// Tela da Fase 2 (captura por SMS). Por ora só existe o estado vazio do design;
// os cards de pendência chegam junto com o backend da fila.
export default function FilaPage() {
  return (
    <>
      <Topo
        titulo="Fila de confirmação"
        subtitulo="SMS capturados que o parser não confirmou sozinho."
      />
      <div className="mx-auto w-full max-w-[1160px] p-6">
        <div className="estado-vazio px-4 py-8">
          <IconeCaixaVazia tamanho={28} traco={1.6} className="mx-auto mb-3" />
          <p className="m-0 mb-2">Nenhuma pendência. Todos os SMS foram revisados.</p>
          <Link href="/" className="link">
            Ver dashboard do mês →
          </Link>
        </div>
      </div>
    </>
  );
}
