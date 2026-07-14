package expo.modules.capturasms

import android.content.Context
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config as RobolectricConfig

@RunWith(RobolectricTestRunner::class)
@RobolectricConfig(sdk = [35])
class ConfigTest {
  private lateinit var contexto: Context
  private lateinit var config: Config

  @Before
  fun preparar() {
    contexto = RuntimeEnvironment.getApplication()
    contexto.getSharedPreferences("captura_sms_config", Context.MODE_PRIVATE)
      .edit()
      .clear()
      .commit()
    config = Config(contexto)
  }

  @Test
  fun `allowlist vazia bloqueia qualquer remetente`() {
    assertFalse(config.remetentePermitido("1482"))
    assertFalse(config.remetentePermitido("Nubank"))
  }

  @Test
  fun `remetentes sao normalizados persistidos e deduplicados`() {
    config.remetentes = listOf(" 1482 ", "", "Nubank", "1482")

    assertEquals(listOf("1482", "Nubank"), Config(contexto).remetentes)
  }

  @Test
  fun `comparacao e exata sem diferenciar caixa`() {
    config.remetentes = listOf("1482", "Nubank")

    assertTrue(config.remetentePermitido("1482"))
    assertTrue(config.remetentePermitido("NUBANK"))
    assertFalse(config.remetentePermitido("Avisos Nubank"))
    assertFalse(config.remetentePermitido("14820"))
  }

  @Test
  fun `diagnostico registra falha e limpa depois de conexao aprovada`() {
    config.registrarTentativa(1_000)
    config.registrarErro("rede", instanteMs = 2_000)

    assertEquals(1_000L, config.ultimaTentativaEmMs)
    assertEquals("rede", config.ultimoErroCodigo)
    assertEquals(2_000L, config.ultimoErroEmMs)
    assertEquals(1, config.falhasConsecutivas)

    config.registrarConexaoAprovada(200)

    assertNull(config.ultimoErroCodigo)
    assertNull(config.ultimoErroEmMs)
    assertEquals(0, config.falhasConsecutivas)
    assertEquals(200, config.ultimoStatusHttp)
  }
}
