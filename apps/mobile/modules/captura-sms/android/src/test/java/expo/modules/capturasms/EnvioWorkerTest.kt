package expo.modules.capturasms

import org.junit.Assert.assertEquals
import org.junit.Test

class EnvioWorkerTest {
  @Test
  fun `respostas 2xx sao sucesso`() {
    listOf(200, 201, 204, 299).forEach { status ->
      assertEquals(ClassificacaoRespostaHttp.SUCESSO, classificarRespostaHttp(status))
    }
  }

  @Test
  fun `429 e respostas 5xx sao transitorias`() {
    listOf(429, 500, 503, 599).forEach { status ->
      assertEquals(ClassificacaoRespostaHttp.RETENTAR, classificarRespostaHttp(status))
    }
  }

  @Test
  fun `demais respostas falham sem retry`() {
    listOf(199, 300, 400, 401, 404, 422, 430, 499).forEach { status ->
      assertEquals(ClassificacaoRespostaHttp.FALHA_PERMANENTE, classificarRespostaHttp(status))
    }
  }

  @Test
  fun `erros http recebem categorias operacionais`() {
    assertEquals("credencial", codigoErroHttp(401))
    assertEquals("limite", codigoErroHttp(429))
    assertEquals("payload", codigoErroHttp(422))
    assertEquals("servidor", codigoErroHttp(503))
    assertEquals("http", codigoErroHttp(418))
  }
}
