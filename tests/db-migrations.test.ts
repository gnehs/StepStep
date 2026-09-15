import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runMigrations } from "../services/db-migrations";

const directory = mkdtempSync(join(tmpdir(), "stepstep-migrations-"));
const migrationDirectory = resolve(process.cwd(), "prisma", "migrations");
const previousMigrationDirectory = process.env.STEPSTEP_MIGRATIONS_DIR;
const legacyMigrationNames = [
  "20240511114140_init",
  "20240511124536_init",
  "20240511125344_init",
  "20240513111459_added",
  "20240610133936_added",
  "20240610134345_added",
];

before(() => {
  process.env.STEPSTEP_MIGRATIONS_DIR = migrationDirectory;
});

after(() => {
  if (previousMigrationDirectory === undefined) {
    delete process.env.STEPSTEP_MIGRATIONS_DIR;
  } else {
    process.env.STEPSTEP_MIGRATIONS_DIR = previousMigrationDirectory;
  }
  rmSync(directory, { recursive: true, force: true });
});

function migrationRows(db: DatabaseSync) {
  return db
    .prepare(
      'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "migration_name"',
    )
    .all() as Array<{
    migration_name: string;
    checksum: string;
    finished_at: string | null;
    rolled_back_at: string | null;
  }>;
}

function tableNames(db: DatabaseSync) {
  return (
    db
      .prepare(
        'SELECT "name" FROM "sqlite_master" WHERE "type" = \'table\' ORDER BY "name"',
      )
      .all() as Array<{ name: string }>
  ).map(({ name }) => name);
}

function applyLegacyMigrations(db: DatabaseSync) {
  for (const name of legacyMigrationNames) {
    db.exec(
      readFileSync(join(migrationDirectory, name, "migration.sql"), "utf8"),
    );
  }
}

test("fresh databases apply every migration exactly once across a restart", () => {
  const path = join(directory, "fresh.db");
  let db = new DatabaseSync(path);
  runMigrations(db);

  const initialRows = migrationRows(db);
  assert.equal(initialRows.length, legacyMigrationNames.length + 1);
  assert.deepEqual(
    initialRows.map(({ migration_name }) => migration_name),
    [...legacyMigrationNames, "20260915180000_add_passkey_tables"].sort(),
  );
  assert.ok(
    initialRows.every(
      ({ finished_at, rolled_back_at }) => finished_at && !rolled_back_at,
    ),
  );
  assert.deepEqual(
    tableNames(db).filter((name) =>
      ["Passkey", "PasskeyChallenge"].includes(name),
    ),
    ["Passkey", "PasskeyChallenge"],
  );
  db.close();

  db = new DatabaseSync(path);
  runMigrations(db);
  assert.equal(migrationRows(db).length, initialRows.length);
  assert.deepEqual(
    migrationRows(db).map(({ migration_name, checksum }) => [
      migration_name,
      checksum,
    ]),
    initialRows.map(({ migration_name, checksum }) => [
      migration_name,
      checksum,
    ]),
  );
  db.close();
});

test("legacy databases preserve rows while baselining history and adding passkeys", () => {
  const path = join(directory, "legacy.db");
  const db = new DatabaseSync(path);
  applyLegacyMigrations(db);

  const userId = "legacy-user";
  const syncToken = randomBytes(24).toString("base64url");
  db.prepare(
    'INSERT INTO "User" ("id", "email", "password", "name", "token", "lastLogin", "lastSync") VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(
    userId,
    "legacy-migration@example.invalid",
    "legacy-password-hash",
    "Legacy Migration",
    syncToken,
    null,
    1700000000000,
  );
  db.prepare(
    'INSERT INTO "Record" ("timestamp", "steps", "energy", "distance", "userId") VALUES (?, ?, ?, ?, ?)',
  ).run(1700000000000, 4321, 12.5, 3.25, userId);

  runMigrations(db);
  const rows = migrationRows(db);
  assert.equal(rows.length, legacyMigrationNames.length + 1);
  assert.deepEqual(
    rows
      .slice(0, legacyMigrationNames.length)
      .map(({ migration_name }) => migration_name),
    legacyMigrationNames,
  );
  assert.equal(
    rows.at(-1)?.migration_name,
    "20260915180000_add_passkey_tables",
  );
  const passkeyCount = db
    .prepare('SELECT COUNT(*) AS count FROM "Passkey"')
    .get() as { count: number } | undefined;
  assert.equal(passkeyCount?.count, 0);
  const migratedUser = db
    .prepare(
      'SELECT "email", "password", "name", "token", "lastSync" FROM "User" WHERE "id" = ?',
    )
    .get(userId);
  assert.deepEqual(
    { ...migratedUser },
    {
      email: "legacy-migration@example.invalid",
      password: "legacy-password-hash",
      name: "Legacy Migration",
      token: syncToken,
      lastSync: 1700000000000,
    },
  );
  const migratedRecord = db
    .prepare(
      'SELECT "steps", "energy", "distance", "userId" FROM "Record" WHERE "userId" = ?',
    )
    .get(userId);
  assert.deepEqual(
    { ...migratedRecord },
    { steps: 4321, energy: 12.5, distance: 3.25, userId },
  );
  db.close();

  const restarted = new DatabaseSync(path);
  runMigrations(restarted);
  assert.equal(migrationRows(restarted).length, rows.length);
  const challengeCount = restarted
    .prepare('SELECT COUNT(*) AS count FROM "PasskeyChallenge"')
    .get() as { count: number } | undefined;
  assert.equal(challengeCount?.count, 0);
  restarted.close();
});
