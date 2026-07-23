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
  ESTADOS_TRANSACAO,
  FREQUENCIAS_RECORRENCIA,
  ICONES_CONTA,
  NATUREZAS_TRANSACAO,
  NOME_CATEGORIA_MAX,
  NOME_CONTA_MAX,
  REMETENTE_SMS_MAX,
  STATUS_FATURA,
  STATUS_MENSAGEM_SMS,
  TIPOS_ATIVO_INVESTIMENTO,
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
export const naturezaTransacao = pgEnum("natureza_transacao", NATUREZAS_TRANSACAO);
export const estadoTransacao = pgEnum("estado_transacao", ESTADOS_TRANSACAO);
export const statusFatura = pgEnum("status_fatura", STATUS_FATURA);
export const frequenciaRecorrencia = pgEnum("frequencia_recorrencia", FREQUENCIAS_RECORRENCIA);
export const tipoAtivoInvestimento = pgEnum("tipo_ativo_investimento", TIPOS_ATIVO_INVESTIMENTO);
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

export const faturas = pgTable(
  "faturas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id),
    mesReferencia: varchar("mes_referencia", { length: 7 }).notNull(),
    dataFechamento: date("data_fechamento").notNull(),
    dataVencimento: date("data_vencimento").notNull(),
    status: statusFatura("status").notNull().default("aberta"),
    valorTotalInformadoCentavos: integer("valor_total_informado_centavos"),
    valorMinimoInformadoCentavos: integer("valor_minimo_informado_centavos"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("faturas_usuario_conta_mes_unq").on(t.usuarioId, t.contaId, t.mesReferencia),
    index("faturas_conta_idx").on(t.contaId),
    index("faturas_usuario_mes_idx").on(t.usuarioId, t.mesReferencia),
  ],
);

export const parcelamentos = pgTable(
  "parcelamentos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id),
    categoriaId: uuid("categoria_id").references(() => categorias.id),
    descricao: varchar("descricao", { length: DESCRICAO_TRANSACAO_MAX }).notNull(),
    valorTotalCentavos: integer("valor_total_centavos").notNull(),
    numeroParcelas: integer("numero_parcelas").notNull(),
    dataPrimeiraParcela: date("data_primeira_parcela").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("parcelamentos_usuario_idx").on(t.usuarioId),
    check("parcelamentos_valor_positivo_chk", sql`${t.valorTotalCentavos} > 0`),
    check("parcelamentos_numero_parcelas_chk", sql`${t.numeroParcelas} >= 2`),
  ],
);

export const recorrencias = pgTable(
  "recorrencias",
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
    natureza: naturezaTransacao("natureza").notNull().default("competencia"),
    descricao: varchar("descricao", { length: DESCRICAO_TRANSACAO_MAX }).notNull(),
    valorCentavos: integer("valor_centavos").notNull(),
    frequencia: frequenciaRecorrencia("frequencia").notNull().default("mensal"),
    diaVencimento: integer("dia_vencimento").notNull(),
    dataInicio: date("data_inicio").notNull(),
    dataFim: date("data_fim"),
    ativa: boolean("ativa").notNull().default(true),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("recorrencias_usuario_idx").on(t.usuarioId),
    check("recorrencias_valor_positivo_chk", sql`${t.valorCentavos} > 0`),
    check("recorrencias_dia_vencimento_chk", sql`${t.diaVencimento} between 1 and 31`),
  ],
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
    natureza: naturezaTransacao("natureza").notNull().default("competencia"),
    estado: estadoTransacao("estado").notNull().default("efetivada"),
    valorCentavos: integer("valor_centavos").notNull(),
    descricao: varchar("descricao", { length: DESCRICAO_TRANSACAO_MAX }),
    data: date("data").notNull(),
    contaDestinoId: uuid("conta_destino_id").references(() => contas.id),
    faturaId: uuid("fatura_id").references(() => faturas.id),
    parcelamentoId: uuid("parcelamento_id").references(() => parcelamentos.id),
    recorrenciaId: uuid("recorrencia_id").references(() => recorrencias.id),
    numeroParcela: integer("numero_parcela"),
    totalParcelas: integer("total_parcelas"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("transacoes_valor_positivo_chk", sql`${t.valorCentavos} > 0`),
    // Consultas dominantes: listagem/dashboard por usuário e mês (achado 12).
    index("transacoes_usuario_data_idx").on(t.usuarioId, t.data, t.criadoEm),
    index("transacoes_conta_idx").on(t.contaId),
    index("transacoes_categoria_idx").on(t.categoriaId),
    index("transacoes_fatura_idx").on(t.faturaId),
    index("transacoes_parcelamento_idx").on(t.parcelamentoId),
    index("transacoes_recorrencia_idx").on(t.recorrenciaId),
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

export const metas = pgTable(
  "metas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    nome: varchar("nome", { length: 100 }).notNull(),
    descricao: text("descricao"),
    valorAlvoCentavos: integer("valor_alvo_centavos").notNull(),
    valorAtualCentavos: integer("valor_atual_centavos").notNull().default(0),
    dataAlvo: date("data_alvo"),
    icone: varchar("icone", { length: 30 }).notNull().default("alvo"),
    concluida: boolean("concluida").notNull().default(false),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("metas_usuario_idx").on(t.usuarioId),
    check("metas_valor_alvo_positivo_chk", sql`${t.valorAlvoCentavos} > 0`),
    check("metas_valor_atual_nao_negativo_chk", sql`${t.valorAtualCentavos} >= 0`),
  ],
);

export const aportesMetas = pgTable(
  "aportes_metas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    metaId: uuid("meta_id")
      .notNull()
      .references(() => metas.id, { onDelete: "cascade" }),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id),
    valorCentavos: integer("valor_centavos").notNull(),
    data: date("data").notNull(),
    transacaoId: uuid("transacao_id").references(() => transacoes.id),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("aportes_metas_meta_idx").on(t.metaId),
    index("aportes_metas_usuario_idx").on(t.usuarioId),
    check("aportes_metas_valor_positivo_chk", sql`${t.valorCentavos} > 0`),
  ],
);

export const investimentos = pgTable(
  "investimentos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id),
    nomeAtivo: varchar("nome_ativo", { length: 100 }).notNull(),
    tipoAtivo: tipoAtivoInvestimento("tipo_ativo").notNull().default("renda_fixa"),
    valorInvestidoCentavos: integer("valor_investido_centavos").notNull().default(0),
    valorAtualCentavos: integer("valor_atual_centavos").notNull().default(0),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("investimentos_usuario_idx").on(t.usuarioId),
    index("investimentos_conta_idx").on(t.contaId),
    check("investimentos_valor_investido_nao_negativo_chk", sql`${t.valorInvestidoCentavos} >= 0`),
    check("investimentos_valor_atual_nao_negativo_chk", sql`${t.valorAtualCentavos} >= 0`),
  ],
);
