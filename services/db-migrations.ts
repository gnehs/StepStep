import { createHash, randomUUID } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";

type Migration = {
  name: string;
  checksum: string;
  sql: string;
};

type MigrationRow = {
  migration_name: string;
  checksum: string;
  finished_at: string | null;
  rolled_back_at: string | null;
};

type ColumnRow = { name: string };

// Keep this table compatible with Prisma Migrate. That lets a database created by
// the old Prisma-based app and one created by this native SQLite app share the
// same migration history.
const migrationTable = `
  CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL PRIMARY KEY,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" DATETIME,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
  )
`;

const expectedMigrationColumns = [
  "id",
  "checksum",
  "finished_at",
  "migration_name",
  "logs",
  "rolled_back_at",
  "started_at",
  "applied_steps_count",
];

const passkeyMigrationName = "20260915180000_add_passkey_tables";

function migrationDirectory() {
  // Keep runtime SQL access scoped to the directory packaged with the app.
  // An arbitrary path makes Next.js trace the entire build context, including
  // unrelated local secrets, into standalone output.
  return join(process.cwd(), "prisma", "migrations");
}

function loadMigrations(): Migration[] {
  const directory = migrationDirectory();
  if (!existsSync(directory)) {
    throw new Error(
      `SQLite migration directory does not exist: ${directory}. ` +
        "Package prisma/migrations with the application.",
    );
  }

  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) => {
      const sqlPath = join(directory, name, "migration.sql");
      if (!existsSync(sqlPath)) {
        throw new Error(`SQLite migration is missing migration.sql: ${name}`);
      }
      const sql = readFileSync(sqlPath, "utf8");
      return {
        name,
        checksum: createHash("sha256").update(sql).digest("hex"),
        sql,
      };
    });
}

function hasTable(db: DatabaseSync, name: string) {
  return Boolean(
    db
      .prepare(
        'SELECT 1 AS present FROM "sqlite_master" WHERE "type" = \'table\' AND "name" = ?',
      )
      .get(name),
  );
}

function hasColumns(db: DatabaseSync, table: string, expected: string[]) {
  const columns = new Set(
    (db.prepare(`PRAGMA table_info("${table}")`).all() as ColumnRow[]).map(
      (column) => column.name,
    ),
  );
  return expected.every((column) => columns.has(column));
}

function hasIndex(db: DatabaseSync, name: string) {
  return Boolean(
    db
      .prepare(
        'SELECT 1 AS present FROM "sqlite_master" WHERE "type" = \'index\' AND "name" = ?',
      )
      .get(name),
  );
}

function hasCoreSchema(db: DatabaseSync) {
  return (
    hasTable(db, "User") &&
    hasColumns(db, "User", [
      "id",
      "email",
      "password",
      "name",
      "token",
      "lastLogin",
      "lastSync",
    ]) &&
    hasTable(db, "Record") &&
    hasColumns(db, "Record", [
      "id",
      "timestamp",
      "steps",
      "energy",
      "distance",
      "userId",
    ]) &&
    hasTable(db, "Group") &&
    hasColumns(db, "Group", ["id", "name", "ownerId"]) &&
    hasTable(db, "UserGroup") &&
    hasColumns(db, "UserGroup", ["id", "userId", "groupId"]) &&
    hasTable(db, "Badge") &&
    hasColumns(db, "Badge", [
      "id",
      "userId",
      "badgeId",
      "created",
      "updated",
      "count",
    ]) &&
    hasIndex(db, "User_email_key") &&
    hasIndex(db, "User_token_key") &&
    hasIndex(db, "Record_userId_timestamp_key") &&
    hasIndex(db, "Badge_badgeId_userId_key")
  );
}

function hasPasskeySchema(db: DatabaseSync) {
  return (
    hasTable(db, "Passkey") &&
    hasColumns(db, "Passkey", [
      "id",
      "userId",
      "name",
      "publicKey",
      "counter",
      "transports",
      "deviceType",
      "backedUp",
      "createdAt",
      "lastUsedAt",
    ]) &&
    hasTable(db, "PasskeyChallenge") &&
    hasColumns(db, "PasskeyChallenge", [
      "id",
      "ceremony",
      "challenge",
      "userId",
      "expiresAt",
    ]) &&
    hasIndex(db, "Passkey_userId_idx") &&
    hasIndex(db, "PasskeyChallenge_expiresAt_idx")
  );
}

function ensureMigrationTable(db: DatabaseSync) {
  if (!hasTable(db, "_prisma_migrations")) db.exec(migrationTable);
  if (!hasColumns(db, "_prisma_migrations", expectedMigrationColumns)) {
    throw new Error(
      "Unsupported _prisma_migrations table: expected Prisma migration metadata columns are missing.",
    );
  }
}

function readAppliedMigrations(db: DatabaseSync) {
  const rows = db
    .prepare(
      'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at", "id"',
    )
    .all() as MigrationRow[];
  const applied = new Map<string, string>();
  for (const row of rows) {
    if (row.rolled_back_at) continue;
    if (!row.finished_at) {
      throw new Error(
        `SQLite migration ${row.migration_name} has no finished_at value; inspect the database before retrying.`,
      );
    }
    const previousChecksum = applied.get(row.migration_name);
    if (previousChecksum && previousChecksum !== row.checksum) {
      throw new Error(
        `SQLite migration ${row.migration_name} has conflicting checksums in _prisma_migrations.`,
      );
    }
    applied.set(row.migration_name, row.checksum);
  }
  return applied;
}

function copyAppliedMigrations(
  target: Map<string, string>,
  source: Map<string, string>,
) {
  target.clear();
  for (const [name, checksum] of source) target.set(name, checksum);
}

function recordBaseline(db: DatabaseSync, migration: Migration) {
  db.prepare(
    'INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count") VALUES (?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, 0)',
  ).run(randomUUID(), migration.checksum, migration.name);
}

function baselineLegacySchema(
  db: DatabaseSync,
  migrations: Migration[],
  applied: Map<string, string>,
) {
  // Before the native driver was introduced, this application used Prisma's
  // six historical migrations. Existing native databases have the resulting
  // schema but no _prisma_migrations table, so mark only that known history as
  // applied. The new Passkey migration is applied normally unless its complete
  // schema is already present (for example, after an interrupted deployment).
  if (!hasCoreSchema(db)) return;

  for (const migration of migrations) {
    if (migration.name === passkeyMigrationName && !hasPasskeySchema(db)) {
      continue;
    }
    if (migration.name > passkeyMigrationName) continue;
    if (applied.has(migration.name)) continue;
    recordBaseline(db, migration);
    applied.set(migration.name, migration.checksum);
  }
}

function applyMigration(db: DatabaseSync, migration: Migration) {
  db.exec("BEGIN IMMEDIATE");
  try {
    // Another process may have completed this migration while this process was
    // loading the directory. Re-check after acquiring the write lock so a
    // concurrent startup never executes or records a migration twice.
    const rows = db
      .prepare(
        'SELECT "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" WHERE "migration_name" = ? ORDER BY "started_at", "id"',
      )
      .all(migration.name) as {
      checksum: string;
      finished_at: string | null;
      rolled_back_at: string | null;
    }[];
    const active = rows.filter((row) => !row.rolled_back_at);
    const unfinished = active.find((row) => !row.finished_at);
    if (unfinished) {
      throw new Error(
        `SQLite migration ${migration.name} has no finished_at value; inspect the database before retrying.`,
      );
    }
    const completed = active.find((row) => row.finished_at);
    if (completed) {
      if (completed.checksum !== migration.checksum) {
        throw new Error(
          `SQLite migration checksum mismatch for ${migration.name}; restore the original migration.sql or create a new migration.`,
        );
      }
      db.exec("COMMIT");
      return;
    }
    db.exec(migration.sql);
    if (migration.name === passkeyMigrationName && !hasPasskeySchema(db)) {
      throw new Error(
        `SQLite migration ${migration.name} did not produce the expected Passkey schema.`,
      );
    }
    db.prepare(
      'INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count") VALUES (?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, 1)',
    ).run(randomUUID(), migration.checksum, migration.name);
    db.exec("COMMIT");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // Preserve the migration error if SQLite has already rolled back.
    }
    throw error;
  }
}

/** Apply versioned SQL migrations once for a native SQLite connection. */
export function runMigrations(db: DatabaseSync) {
  const migrations = loadMigrations();
  ensureMigrationTable(db);
  const applied = readAppliedMigrations(db);

  // This is intentionally a read-only schema check followed by metadata writes;
  // it never rewrites a legacy table or drops user data.
  if (applied.size === 0) {
    db.exec("BEGIN IMMEDIATE");
    try {
      // Re-read while holding the write lock. A second process may have
      // created the baseline metadata after the first read above.
      const lockedApplied = readAppliedMigrations(db);
      if (lockedApplied.size === 0) {
        baselineLegacySchema(db, migrations, lockedApplied);
      }
      copyAppliedMigrations(applied, lockedApplied);
      db.exec("COMMIT");
    } catch (error) {
      try {
        db.exec("ROLLBACK");
      } catch {
        // Preserve the baseline error if SQLite has already rolled back.
      }
      throw error;
    }
  }

  for (const migration of migrations) {
    const existingChecksum = applied.get(migration.name);
    if (existingChecksum) {
      if (existingChecksum !== migration.checksum) {
        throw new Error(
          `SQLite migration checksum mismatch for ${migration.name}; restore the original migration.sql or create a new migration.`,
        );
      }
      continue;
    }
    applyMigration(db, migration);
    applied.set(migration.name, migration.checksum);
  }
}
