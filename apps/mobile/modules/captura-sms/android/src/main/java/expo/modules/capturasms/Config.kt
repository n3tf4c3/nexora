package expo.modules.capturasms

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * Configuração persistida da captura (URL da API, token, allowlist de remetentes).
 *
 * O token nunca é gravado em claro: é cifrado com AES-GCM cuja chave vive no
 * Android Keystore (não extraível do hardware). A cifra é feita aqui, e não via
 * expo-secure-store, porque o EnvioWorker precisa ler o token sem runtime JS.
 */
class Config(context: Context) {
  private val prefs =
    context.applicationContext.getSharedPreferences("captura_sms_config", Context.MODE_PRIVATE)

  var urlApi: String?
    get() = prefs.getString("url_api", null)
    set(valor) {
      prefs.edit().putString("url_api", valor).apply()
    }

  /** Allowlist: só SMS destes remetentes saem do aparelho. Vazia = não captura nada. */
  var remetentes: List<String>
    get() = (prefs.getString("remetentes", "") ?: "").split("\n").filter { it.isNotBlank() }
    set(valor) {
      val normalizados = valor.map { it.trim() }.filter { it.isNotEmpty() }.distinct()
      prefs.edit().putString("remetentes", normalizados.joinToString("\n")).apply()
    }

  fun remetentePermitido(remetente: String): Boolean =
    remetentes.any { remetente.equals(it, ignoreCase = true) }

  val temToken: Boolean
    get() = token != null

  var token: String?
    get() {
      val cifrado = prefs.getString("token_cifrado", null) ?: return null
      return try {
        decifrar(Base64.decode(cifrado, Base64.NO_WRAP))
      } catch (e: Exception) {
        // Chave perdida (ex.: restauração de backup em outro aparelho): trata como ausente.
        prefs.edit().remove("token_cifrado").apply()
        null
      }
    }
    set(valor) {
      if (valor.isNullOrBlank()) {
        prefs.edit().remove("token_cifrado").apply()
      } else {
        val cifrado = Base64.encodeToString(cifrar(valor), Base64.NO_WRAP)
        prefs.edit().putString("token_cifrado", cifrado).apply()
      }
    }

  val ultimoSmsRecebidoEmMs: Long?
    get() = longOuNull(CHAVE_ULTIMO_SMS)

  val ultimaTentativaEmMs: Long?
    get() = longOuNull(CHAVE_ULTIMA_TENTATIVA)

  val ultimoSucessoEmMs: Long?
    get() = longOuNull(CHAVE_ULTIMO_SUCESSO)

  val ultimoErroEmMs: Long?
    get() = longOuNull(CHAVE_ULTIMO_ERRO_EM)

  val ultimoErroCodigo: String?
    get() = prefs.getString(CHAVE_ULTIMO_ERRO_CODIGO, null)

  val ultimoStatusHttp: Int?
    get() = if (prefs.contains(CHAVE_ULTIMO_STATUS_HTTP)) {
      prefs.getInt(CHAVE_ULTIMO_STATUS_HTTP, 0)
    } else {
      null
    }

  val falhasConsecutivas: Int
    get() = prefs.getInt(CHAVE_FALHAS_CONSECUTIVAS, 0)

  fun registrarSmsRecebido(instanteMs: Long) {
    prefs.edit().putLong(CHAVE_ULTIMO_SMS, instanteMs).apply()
  }

  fun registrarTentativa(instanteMs: Long = System.currentTimeMillis()) {
    prefs.edit().putLong(CHAVE_ULTIMA_TENTATIVA, instanteMs).apply()
  }

  fun registrarSucesso(statusHttp: Int, instanteMs: Long = System.currentTimeMillis()) {
    prefs.edit()
      .putLong(CHAVE_ULTIMO_SUCESSO, instanteMs)
      .putInt(CHAVE_ULTIMO_STATUS_HTTP, statusHttp)
      .putInt(CHAVE_FALHAS_CONSECUTIVAS, 0)
      .remove(CHAVE_ULTIMO_ERRO_EM)
      .remove(CHAVE_ULTIMO_ERRO_CODIGO)
      .apply()
  }

  fun registrarConexaoAprovada(statusHttp: Int) {
    prefs.edit()
      .putInt(CHAVE_ULTIMO_STATUS_HTTP, statusHttp)
      .putInt(CHAVE_FALHAS_CONSECUTIVAS, 0)
      .remove(CHAVE_ULTIMO_ERRO_EM)
      .remove(CHAVE_ULTIMO_ERRO_CODIGO)
      .apply()
  }

  fun registrarErro(
    codigo: String,
    statusHttp: Int? = null,
    instanteMs: Long = System.currentTimeMillis(),
  ) {
    val editor = prefs.edit()
      .putLong(CHAVE_ULTIMO_ERRO_EM, instanteMs)
      .putString(CHAVE_ULTIMO_ERRO_CODIGO, codigo)
      .putInt(CHAVE_FALHAS_CONSECUTIVAS, falhasConsecutivas + 1)
    if (statusHttp == null) {
      editor.remove(CHAVE_ULTIMO_STATUS_HTTP)
    } else {
      editor.putInt(CHAVE_ULTIMO_STATUS_HTTP, statusHttp)
    }
    editor.apply()
  }

  private fun longOuNull(chave: String): Long? =
    if (prefs.contains(chave)) prefs.getLong(chave, 0) else null

  private fun chave(): SecretKey {
    val keystore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    (keystore.getKey(ALIAS_CHAVE, null) as? SecretKey)?.let { return it }
    val gerador = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
    gerador.init(
      KeyGenParameterSpec.Builder(
        ALIAS_CHAVE,
        KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
      )
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .build(),
    )
    return gerador.generateKey()
  }

  // Formato gravado: IV de 12 bytes + ciphertext (tag GCM de 128 bits embutida).
  private fun cifrar(texto: String): ByteArray {
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.ENCRYPT_MODE, chave())
    return cipher.iv + cipher.doFinal(texto.toByteArray(Charsets.UTF_8))
  }

  private fun decifrar(dados: ByteArray): String {
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.DECRYPT_MODE, chave(), GCMParameterSpec(128, dados, 0, TAMANHO_IV))
    return String(cipher.doFinal(dados, TAMANHO_IV, dados.size - TAMANHO_IV), Charsets.UTF_8)
  }

  private companion object {
    const val ALIAS_CHAVE = "nexora-captura-token"
    const val TAMANHO_IV = 12
    const val CHAVE_ULTIMO_SMS = "ultimo_sms_recebido_em_ms"
    const val CHAVE_ULTIMA_TENTATIVA = "ultima_tentativa_em_ms"
    const val CHAVE_ULTIMO_SUCESSO = "ultimo_sucesso_em_ms"
    const val CHAVE_ULTIMO_ERRO_EM = "ultimo_erro_em_ms"
    const val CHAVE_ULTIMO_ERRO_CODIGO = "ultimo_erro_codigo"
    const val CHAVE_ULTIMO_STATUS_HTTP = "ultimo_status_http"
    const val CHAVE_FALHAS_CONSECUTIVAS = "falhas_consecutivas"
  }
}
