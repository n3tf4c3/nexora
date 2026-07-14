package expo.modules.capturasms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony

/**
 * Recebe SMS_RECEIVED do sistema (inclusive com o app fechado), guarda o SMS
 * cru na fila local e agenda o envio via WorkManager.
 *
 * Privacidade: só remetentes da allowlist configurada saem do aparelho;
 * allowlist vazia não captura nada. SMS pessoais são ignorados aqui.
 */
class SmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
    val partes = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
    if (partes.isEmpty()) return

    // SMS longo chega fatiado no mesmo intent; o corpo cru é a concatenação
    // das partes, sem trim/normalização (achado 10 da auditoria).
    val remetente = partes.first().displayOriginatingAddress ?: return
    val corpo = partes.joinToString("") { it.displayMessageBody ?: "" }
    if (corpo.isBlank()) return

    val config = Config(context)
    if (!config.remetentePermitido(remetente)) return

    config.registrarSmsRecebido(partes.first().timestampMillis)
    FilaSms(context).inserir(remetente, corpo, partes.first().timestampMillis)
    EnvioWorker.agendar(context)
  }
}
