import type { MigrationMeta } from "drizzle-orm/migrator";
import { describe, expect, it } from "vitest";
import { criarPlanoMigracoes } from "./migration-runner";

function migration(sobrescritas: Partial<MigrationMeta> = {}): MigrationMeta {
  return {
    sql: ["CREATE TABLE teste (id integer)"],
    folderMillis: 1_783_843_699_651,
    hash: "a".repeat(64),
    bps: true,
    ...sobrescritas,
  };
}

describe("criarPlanoMigracoes", () => {
  it("ordena lock, journal e migrations no mesmo plano transacional", () => {
    const plano = criarPlanoMigracoes([
      migration(),
      migration({ folderMillis: 1_783_846_181_724, hash: "b".repeat(64) }),
    ]);

    expect(plano).toHaveLength(5);
    expect(plano[0]).toContain("pg_advisory_xact_lock");
    expect(plano[1]).toBe('CREATE SCHEMA IF NOT EXISTS "drizzle"');
    expect(plano[2]).toContain('CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations"');
    expect(plano[3]).toContain("CREATE TABLE teste (id integer)");
    expect(plano[3]).toContain("VALUES ('aaaaaaaa");
    expect(plano[4]).toContain("1783846181724");
    expect(plano[4]).toContain("VALUES ('bbbbbbbb");
  });

  it("mantém o SQL intacto mesmo quando ele contém o marcador dollar-quote", () => {
    const comando = "SELECT '$nexora_sql_0$' AS valor";
    const bloco = criarPlanoMigracoes([migration({ sql: [comando] })])[3];

    expect(bloco).toContain(`$nexora_sql_0_1$${comando}$nexora_sql_0_1$`);
  });

  it("recusa metadados inválidos antes de montar consultas", () => {
    expect(() => criarPlanoMigracoes([migration({ folderMillis: Number.NaN })])).toThrow(
      "Timestamp inválido",
    );
    expect(() => criarPlanoMigracoes([migration({ hash: "não-é-sha256" })])).toThrow(
      "Hash inválido",
    );
  });
});
