import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  CORPO_SMS_MAX,
  DESCRICAO_TRANSACAO_MAX,
  ICONES_CONTA,
  NOME_CATEGORIA_MAX,
  NOME_CONTA_MAX,
  REMETENTE_SMS_MAX,
  STATUS_MENSAGEM_SMS,
  TIPOS_CONTA,
  TIPOS_TRANSACAO,
  type EventoSmsReconhecido,
} from "@nexora/core";

export const usuarios = pgTable("usuarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash").notNull(),
  // Carimbada em toda troca/reset de senha; JWTs emitidos antes dela são inválidos.
  credenciaisAtualizadasEm: timestamp("credenciais_atualizadas_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const tipoConta = pgEnum("tipo_conta", TIPOS_CONTA);
export const tipoIconeConta = pgEnum("tipo_icone_conta", ICONES_CONTA);
export const tipoTransacao = pgEnum("tipo_transacao", TIPOS_TRANSACAO);
export const statusMensagemSms = pgEnum("status_mensagem_sms", STATUS_MENSAGEM_SMS);

export const contas = pgTable(
  "contas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    nome: varchar("nome", { length: NOME_CONTA_MAX }).notNull(),
    tipo: tipoConta("tipo").notNull(),
    icone: tipoIconeConta("icone").notNull().default("banco"),
    // Só para cartão de crédito (validado no contrato do core).
    diaFechamento: integer("dia_fechamento"),
    diaVencimento: integer("dia_vencimento"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("contas_usuario_nome_unq").on(t.usuarioId, t.nome),
    // Expressão total (nunca NULL): cartão exige ambos os dias na faixa;
    // não cartão exige ambos nulos. IS NOT NULL evita o vazamento de NULL
    // que fazia o CHECK anterior aceitar estados inválidos (achado 8).
    check(
      "contas_dias_cartao_chk",
      sql`(${t.tipo} = 'cartao_credito'
        and ${t.diaFechamento} is not null and ${t.diaFechamento} between 1 and 31
        and ${t.diaVencimento} is not null and ${t.diaVencimento} between 1 and 31)
      or (${t.tipo} <> 'cartao_credito' and ${t.diaFechamento} is null and ${t.diaVencimento} is null)`,
    ),
  ],
);

export const categorias = pgTable(
  "categorias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    nome: varchar("nome", { length: NOME_CATEGORIA_MAX }).notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("categorias_usuario_nome_unq").on(t.usuarioId, t.nome)],
);

export const transacoes = pgTable(
  "transacoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id),
    categoriaId: uuid("categoria_id").references(() => categorias.id),
    tipo: tipoTransacao("tipo").notNull(),
    valorCentavos: integer("valor_centavos").notNull(),
    descricao: varchar("descricao", { length: DESCRICAO_TRANSACAO_MAX }),
    data: date("data").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("transacoes_valor_positivo_chk", sql`${t.valorCentavos} > 0`),
    // Consultas dominantes: listagem/dashboard por usuário e mês (achado 12).
    index("transacoes_usuario_data_idx").on(t.usuarioId, t.data, t.criadoEm),
    index("transacoes_conta_idx").on(t.contaId),
    index("transacoes_categoria_idx").on(t.categoriaId),
  ],
);

// SMS cru sempre persistido (auditoria e reprocessamento quando um parser melhorar).
export const mensagensSms = pgTable(
  "mensagens_sms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    remetente: varchar("remetente", { length: REMETENTE_SMS_MAX }).notNull(),
    corpo: varchar("corpo", { length: CORPO_SMS_MAX }).notNull(),
    // Instante em que o SMS chegou no aparelho (informado pelo app).
    recebidaEm: timestamp("recebida_em", { withTimezone: true }).notNull(),
    // sha256 hex de remetente+recebidaEm+corpo — reenvio/retry do app não duplica,
    // mas duas compras idênticas em instantes diferentes continuam distintas.
    hashDedup: varchar("hash_dedup", { length: 64 }).notNull(),
    status: statusMensagemSms("status").notNull().default("pendente"),
    // Momento da decisão humana. Pendente não possui carimbo; confirmar ou
    // ignorar preenche, e excluir a transação devolve a mensagem a pendente.
    revisadaEm: timestamp("revisada_em", { withTimezone: true }),
    // Preenchido quando a revisão na fila confirma a mensagem como transação.
    // Excluir a transação desvincula a mensagem (volta a pendente) no mesmo
    // batch atômico — por isso a FK é NO ACTION, não SET NULL.
    transacaoId: uuid("transacao_id").references(() => transacoes.id),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("mensagens_sms_usuario_hash_unq").on(t.usuarioId, t.hashDedup),
    // Vínculo 1:1 — uma transação pertence a no máximo um SMS.
    uniqueIndex("mensagens_sms_transacao_unq")
      .on(t.transacaoId)
      .where(sql`${t.transacaoId} is not null`),
    // Estado coerente: confirmada tem transação; pendente/ignorada não tem.
    check(
      "mensagens_sms_status_vinculo_chk",
      sql`(${t.status} = 'confirmada') = (${t.transacaoId} is not null)`,
    ),
    check(
      "mensagens_sms_status_revisao_chk",
      sql`(${t.status} = 'pendente') = (${t.revisadaEm} is null)`,
    ),
    // Fila: pendências por usuário em ordem de chegada (achado 12).
    index("mensagens_sms_usuario_status_recebida_idx").on(t.usuarioId, t.status, t.recebidaEm),
  ],
);

/**
 * Resultado append-only dos parsers. A mensagem bruta permanece independente:
 * uma versão nova do parser adiciona outra interpretação sem apagar a anterior.
 */
export const interpretacoesSms = pgTable(
  "interpretacoes_sms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mensagemId: uuid("mensagem_id")
      .notNull()
      .references(() => mensagensSms.id),
    parserId: varchar("parser_id", { length: 80 }).notNull(),
    parserVersao: integer("parser_versao").notNull(),
    evento: varchar("evento", { length: 40 }).notNull(),
    confianca: integer("confianca").notNull(),
    transacional: boolean("transacional").notNull(),
    resultado: jsonb("resultado").$type<EventoSmsReconhecido>().notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("interpretacoes_sms_mensagem_parser_versao_unq").on(
      t.mensagemId,
      t.parserId,
      t.parserVersao,
    ),
    check("interpretacoes_sms_parser_versao_chk", sql`${t.parserVersao} > 0`),
    check("interpretacoes_sms_confianca_chk", sql`${t.confianca} between 0 and 100`),
    index("interpretacoes_sms_mensagem_criado_idx").on(t.mensagemId, t.criadoEm),
  ],
);
