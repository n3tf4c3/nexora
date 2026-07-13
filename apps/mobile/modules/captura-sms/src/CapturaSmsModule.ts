import { requireNativeModule } from "expo";

export type EstadoCaptura = {
  urlApi: string | null;
  temToken: boolean;
  remetentes: string[];
  pendentes: number;
};

export type CapturaSmsNativo = {
  /** Token vazio preserva o token já salvo (permite editar só a URL). */
  configurar(urlApi: string, token: string): void;
  definirRemetentes(remetentes: string[]): void;
  obterEstado(): EstadoCaptura;
  sincronizarAgora(): void;
};

/**
 * Módulo nativo de captura. `null` quando o binário não o contém
 * (ex.: Expo Go) — a captura exige o dev client buildado.
 */
export function obterCapturaSms(): CapturaSmsNativo | null {
  try {
    return requireNativeModule<CapturaSmsNativo>("CapturaSms");
  } catch {
    return null;
  }
}
