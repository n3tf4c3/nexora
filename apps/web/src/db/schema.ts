import { sql } from "drizzle-orm";
import {
  check,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  DESCRICAO_TRANSACAO_MAX,
  NOME_CATEGORIA_MAX,
  NOME_CONTA_MAX,
  TIPOS_CONTA,
  TIPOS_TRANSACAO,
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
export const tipoTransacao = pgEnum("tipo_transacao", TIPOS_TRANSACAO);

export const contas = pgTable(
  "contas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    nome: varchar("nome", { length: NOME_CONTA_MAX }).notNull(),
    tipo: tipoConta("tipo").notNull(),
    // Só para cartão de crédito (validado no contrato do core).
    diaFechamento: integer("dia_fechamento"),
    diaVencimento: integer("dia_vencimento"),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("contas_usuario_nome_unq").on(t.usuarioId, t.nome),
    check(
      "contas_dias_cartao_chk",
      sql`(${t.tipo} <> 'cartao_credito') or (${t.diaFechamento} between 1 and 31 and ${t.diaVencimento} between 1 and 31)`,
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
  (t) => [check("transacoes_valor_positivo_chk", sql`${t.valorCentavos} > 0`)],
);
