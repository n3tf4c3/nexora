import { requireNativeModule } from "expo";

export type EstadoCaptura = {
  urlApi: string | null;
  temToken: boolean;
  remetentes: string[];
  pendentes: number;
  pendenteMaisAntigoEmMs: number | null;
  ultimoSmsRecebidoEmMs: number | null;
  ultimaTentativaEmMs: number | null;
  ultimoSucessoEmMs: number | null;
  ultimoErroEmMs: number | null;
  ultimoErroCodigo: string | null;
  ultimoStatusHttp: number | null;
  falhasConsecutivas: number;
};

export type ResultadoTesteConexao = {
  ok: boolean;
  codigo: string | null;
  statusHttp: number | null;
};

export type CapturaSmsNativo = {
  /** Token vazio preserva o token já salvo (permite editar só a URL). */
  configurar(urlApi: string, token: string): void;
  definirRemetentes(remetentes: string[]): void;
  obterEstado(): EstadoCaptura;
  sincronizarAgora(): void;
  testarConexao(): Promise<ResultadoTesteConexao>;
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
