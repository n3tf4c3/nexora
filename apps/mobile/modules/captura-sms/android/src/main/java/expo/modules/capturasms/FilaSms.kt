package expo.modules.capturasms

import android.content.ContentValues
import android.content.Context
import android.database.DatabaseUtils
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

data class SmsPendente(
  val id: Long,
  val remetente: String,
  val corpo: String,
  val recebidaEmMs: Long,
)

/**
 * Fila local de SMS aguardando envio à API. Linhas só são removidas depois
 * que o servidor aceita o lote — queda de rede não perde SMS.
 */
class FilaSms(context: Context) :
  SQLiteOpenHelper(context.applicationContext, "captura_sms_fila.db", null, 1) {

  override fun onCreate(db: SQLiteDatabase) {
    db.execSQL(
      "CREATE TABLE fila (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "remetente TEXT NOT NULL, " +
        "corpo TEXT NOT NULL, " +
        "recebida_em_ms INTEGER NOT NULL)",
    )
  }

  override fun onUpgrade(db: SQLiteDatabase, versaoAntiga: Int, versaoNova: Int) = Unit

  fun inserir(remetente: String, corpo: String, recebidaEmMs: Long) {
    val valores = ContentValues().apply {
      put("remetente", remetente)
      put("corpo", corpo)
      put("recebida_em_ms", recebidaEmMs)
    }
    writableDatabase.insert("fila", null, valores)
  }

  /** Mais antigos primeiro, para o lote respeitar a ordem de chegada. */
  fun listar(limite: Int): List<SmsPendente> {
    val itens = mutableListOf<SmsPendente>()
    readableDatabase
      .query("fila", null, null, null, null, null, "id ASC", limite.toString())
      .use { cursor ->
        while (cursor.moveToNext()) {
          itens.add(
            SmsPendente(
              id = cursor.getLong(cursor.getColumnIndexOrThrow("id")),
              remetente = cursor.getString(cursor.getColumnIndexOrThrow("remetente")),
              corpo = cursor.getString(cursor.getColumnIndexOrThrow("corpo")),
              recebidaEmMs = cursor.getLong(cursor.getColumnIndexOrThrow("recebida_em_ms")),
            ),
          )
        }
      }
    return itens
  }

  fun remover(ids: List<Long>) {
    if (ids.isEmpty()) return
    writableDatabase.delete("fila", "id IN (${ids.joinToString(",")})", null)
  }

  fun contar(): Long = DatabaseUtils.queryNumEntries(readableDatabase, "fila")
}
