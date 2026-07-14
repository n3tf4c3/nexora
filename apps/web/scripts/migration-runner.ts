import type { NeonQueryFunction } from "@neondatabase/serverless";
import { readMigrationFiles, type MigrationMeta } from "drizzle-orm/migrator";

const SCHEMA_MIGRATIONS = "drizzle";
const TABELA_MIGRATIONS = "__drizzle_migrations";
const CHAVE_LOCK = "5640000000000000001";

function marcadorDollar(base: string, conteudo: string): string {
  let sufixo = 0;

  while (true) {
    const marcador = `$${base}${sufixo === 0 ? "" : `_${sufixo}`}$`;
    if (!conteudo.includes(marcador)) return marcador;
    sufixo += 1;
  }
}

function criarBlocoMigration(migration: MigrationMeta): string {
  if (!Number.isSafeInteger(migration.folderMillis) || migration.folderMillis < 0) {
    throw new Error(`Timestamp inválido no journal: ${migration.folderMillis}.`);
  }
  if (!/^[a-f0-9]{64}$/.test(migration.hash)) {
    throw new Error(`Hash inválido no journal: ${migration.hash}.`);
  }

  const comandos = migration.sql
    .filter((comando) => comando.trim().length > 0)
    .map((comando, indice) => {
      const marcador = marcadorDollar(`nexora_sql_${indice}`, comando);
      return `    EXECUTE ${marcador}${comando}${marcador};`;
    });
  const corpo = [
    "BEGIN",
    "  IF COALESCE((",
    `    SELECT "created_at" FROM "${SCHEMA_MIGRATIONS}"."${TABELA_MIGRATIONS}"`,
    '    ORDER BY "created_at" DESC LIMIT 1',
    `  ), 0) < ${migration.folderMillis} THEN`,
    ...comandos,
    `    INSERT INTO "${SCHEMA_MIGRATIONS}"."${TABELA_MIGRATIONS}" ("hash", "created_at")`,
    `    VALUES ('${migration.hash}', ${migration.folderMillis});`,
    "  END IF;",
    "END;",
  ].join("\n");
  const marcadorBloco = marcadorDollar("nexora_migration", corpo);

  return `DO ${marcadorBloco}\n${corpo}\n${marcadorBloco};`;
}

export function criarPlanoMigracoes(migrations: readonly MigrationMeta[]): string[] {
  return [
    `SELECT pg_advisory_xact_lock(${CHAVE_LOCK})`,
    `CREATE SCHEMA IF NOT EXISTS "${SCHEMA_MIGRATIONS}"`,
    `CREATE TABLE IF NOT EXISTS "${SCHEMA_MIGRATIONS}"."${TABELA_MIGRATIONS}" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )`,
    ...migrations.map(criarBlocoMigration),
  ];
}

export async function executarMigracoesAtomicas(
  cliente: NeonQueryFunction<false, false>,
  migrationsFolder: string,
): Promise<void> {
  const plano = criarPlanoMigracoes(readMigrationFiles({ migrationsFolder }));
  await cliente.transaction(
    plano.map((consulta) => cliente.query(consulta)),
    { isolationLevel: "ReadCommitted" },
  );
}
