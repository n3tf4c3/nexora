import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
