package expo.modules.capturasms

import android.content.Context
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

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
      val fila = FilaSms(contexto)
      mapOf(
        "urlApi" to config.urlApi,
        "temToken" to config.temToken,
        "remetentes" to config.remetentes,
        "pendentes" to fila.contar().toInt(),
        "pendenteMaisAntigoEmMs" to fila.recebidaEmMaisAntigaMs(),
        "ultimoSmsRecebidoEmMs" to config.ultimoSmsRecebidoEmMs,
        "ultimaTentativaEmMs" to config.ultimaTentativaEmMs,
        "ultimoSucessoEmMs" to config.ultimoSucessoEmMs,
        "ultimoErroEmMs" to config.ultimoErroEmMs,
        "ultimoErroCodigo" to config.ultimoErroCodigo,
        "ultimoStatusHttp" to config.ultimoStatusHttp,
        "falhasConsecutivas" to config.falhasConsecutivas,
      )
    }

    Function("sincronizarAgora") {
      EnvioWorker.agendar(contexto)
    }

    AsyncFunction("testarConexao") {
      val config = Config(contexto)
      val urlApi = config.urlApi
      val token = config.token
      if (urlApi.isNullOrBlank() || token.isNullOrBlank()) {
        return@AsyncFunction mapOf(
          "ok" to false,
          "codigo" to "configuracao",
          "statusHttp" to null,
        )
      }

      try {
        val status = consultarSaude(urlApi, token)
        if (status in 200..299) {
          config.registrarConexaoAprovada(status)
        } else {
          config.registrarErro(codigoErroHttp(status), status)
        }
        mapOf(
          "ok" to (status in 200..299),
          "codigo" to if (status in 200..299) null else codigoErroHttp(status),
          "statusHttp" to status,
        )
      } catch (e: IOException) {
        config.registrarErro("rede")
        mapOf(
          "ok" to false,
          "codigo" to "rede",
          "statusHttp" to null,
        )
      }
    }
  }

  private fun consultarSaude(urlApi: String, token: String): Int {
    val conexao = URL("$urlApi/api/capturas").openConnection() as HttpURLConnection
    return try {
      conexao.requestMethod = "GET"
      conexao.connectTimeout = 15_000
      conexao.readTimeout = 15_000
      conexao.setRequestProperty("Authorization", "Bearer $token")
      conexao.responseCode
    } finally {
      conexao.disconnect()
    }
  }
}
