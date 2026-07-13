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
      prefs.edit().putString("remetentes", valor.joinToString("\n")).apply()
    }

  fun remetentePermitido(remetente: String): Boolean =
    remetentes.any { remetente.contains(it, ignoreCase = true) }

  val temToken: Boolean
    get() = prefs.contains("token_cifrado")

  var token: String?
    get() {
      val cifrado = prefs.getString("token_cifrado", null) ?: return null
      return try {
        decifrar(Base64.decode(cifrado, Base64.NO_WRAP))
      } catch (e: Exception) {
        // Chave perdida (ex.: restauração de backup em outro aparelho): trata como ausente.
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
  }
}
