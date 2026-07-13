package expo.modules.capturasms

import android.content.Context
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Ponte JS do módulo de captura: configuração (URL, token, allowlist) e
 * estado da fila. A captura em si é 100% nativa (SmsReceiver + EnvioWorker)
 * e funciona com o app fechado.
 */
class CapturaSmsModule : Module() {
  private val contexto: Context
    get() = appContext.reactContext?.applicationContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("CapturaSms")

    // Token vazio preserva o token já salvo (permite editar só a URL).
    Function("configurar") { urlApi: String, token: String ->
      val config = Config(contexto)
      config.urlApi = urlApi.trim().trimEnd('/')
      if (token.isNotBlank()) config.token = token.trim()
    }

    Function("definirRemetentes") { remetentes: List<String> ->
      Config(contexto).remetentes = remetentes.map { it.trim() }.filter { it.isNotEmpty() }
    }

    Function("obterEstado") {
      val config = Config(contexto)
      mapOf(
        "urlApi" to config.urlApi,
        "temToken" to config.temToken,
        "remetentes" to config.remetentes,
        "pendentes" to FilaSms(contexto).contar().toInt(),
      )
    }

    Function("sincronizarAgora") {
      EnvioWorker.agendar(contexto)
    }
  }
}
