package expo.modules.capturasms

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.TimeUnit
import org.json.JSONArray
import org.json.JSONObject

internal enum class ClassificacaoRespostaHttp {
  SUCESSO,
  RETENTAR,
  FALHA_PERMANENTE,
}

internal fun classificarRespostaHttp(status: Int): ClassificacaoRespostaHttp =
  when {
    status in 200..299 -> ClassificacaoRespostaHttp.SUCESSO
    status == 429 || status >= 500 -> ClassificacaoRespostaHttp.RETENTAR
    else -> ClassificacaoRespostaHttp.FALHA_PERMANENTE
  }

internal fun codigoErroHttp(status: Int): String =
  when {
    status == 401 || status == 403 -> "credencial"
    status == 429 -> "limite"
    status == 400 || status == 413 || status == 422 -> "payload"
    status >= 500 -> "servidor"
    else -> "http"
  }

/**
 * Drena a fila local para o POST /api/capturas em lotes, com retry e backoff
 * exponencial do WorkManager. O reenvio é seguro: o servidor deduplica por
 * hash de remetente + instante + corpo.
 */
class EnvioWorker(context: Context, params: WorkerParameters) : Worker(context, params) {

  override fun doWork(): Result {
    val config = Config(applicationContext)
    config.registrarTentativa()
    val urlApi = config.urlApi
    val token = config.token
    // Sem configuração não há o que tentar; a fila fica preservada até o
    // usuário configurar e sincronizar de novo.
    if (urlApi.isNullOrBlank() || token.isNullOrBlank()) {
      config.registrarErro("configuracao")
      return Result.failure()
    }

    val fila = FilaSms(applicationContext)
    var ultimoStatusSucesso: Int? = null
    while (true) {
      val lote = fila.listar(LOTE_MAX)
      if (lote.isEmpty()) {
        ultimoStatusSucesso?.let { config.registrarSucesso(it) }
        return Result.success()
      }
      val status = try {
        enviar(urlApi, token, lote)
      } catch (e: IOException) {
        config.registrarErro("rede")
        return Result.retry()
      }
      when (classificarRespostaHttp(status)) {
        ClassificacaoRespostaHttp.SUCESSO -> {
          ultimoStatusSucesso = status
          fila.remover(lote.map { it.id })
        }
        ClassificacaoRespostaHttp.RETENTAR -> {
          config.registrarErro(codigoErroHttp(status), status)
          return Result.retry()
        }
        // Demais 4xx: URL/token errados ou payload rejeitado. Fila preservada;
        // corrigir a configuração e sincronizar manualmente.
        ClassificacaoRespostaHttp.FALHA_PERMANENTE -> {
          config.registrarErro(codigoErroHttp(status), status)
          return Result.failure()
        }
      }
    }
  }

  private fun enviar(urlApi: String, token: String, lote: List<SmsPendente>): Int {
    // Mesmo formato do z.iso.datetime do core. Derivado do timestamp gravado,
    // então o retry reproduz byte a byte a string do hash de dedup do servidor.
    val formatoIso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
      timeZone = TimeZone.getTimeZone("UTC")
    }
    val mensagens = JSONArray()
    for (sms in lote) {
      mensagens.put(
        JSONObject()
          .put("remetente", sms.remetente)
          .put("corpo", sms.corpo)
          .put("recebidaEm", formatoIso.format(Date(sms.recebidaEmMs))),
      )
    }
    val corpo = JSONObject().put("mensagens", mensagens).toString().toByteArray(Charsets.UTF_8)

    val conexao = URL("$urlApi/api/capturas").openConnection() as HttpURLConnection
    return try {
      conexao.requestMethod = "POST"
      conexao.connectTimeout = 15_000
      conexao.readTimeout = 30_000
      conexao.doOutput = true
      conexao.setRequestProperty("Content-Type", "application/json")
      conexao.setRequestProperty("Authorization", "Bearer $token")
      conexao.setFixedLengthStreamingMode(corpo.size)
      conexao.outputStream.use { it.write(corpo) }
      conexao.responseCode
    } finally {
      conexao.disconnect()
    }
  }

  companion object {
    // Espelha LOTE_CAPTURA_MAX de packages/core/src/limites.ts.
    private const val LOTE_MAX = 50
    private const val NOME_TRABALHO = "nexora-envio-capturas"

    fun agendar(context: Context) {
      val pedido = OneTimeWorkRequestBuilder<EnvioWorker>()
        .setConstraints(
          Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build(),
        )
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
        .build()
      // APPEND_OR_REPLACE encadeia após um envio em execução — SMS que chega
      // no meio de um envio não fica esquecido na fila até o próximo gatilho.
      WorkManager.getInstance(context.applicationContext)
        .enqueueUniqueWork(NOME_TRABALHO, ExistingWorkPolicy.APPEND_OR_REPLACE, pedido)
    }
  }
}
