import "server-only";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { runMigrations } from "./db-migrations";

export type User = {
  id: string;
  email: string;
  password: string;
  name: string;
  token: string;
  lastSync: Date | null;
  lastLogin: Date | null;
};
export type StepRecord = {
  id: number;
  timestamp: Date;
  steps: number;
  energy: number;
  distance: number;
  userId: string;
};
export type Badge = {
  id: string;
  userId: string;
  badgeId: string;
  created: Date;
  updated: Date;
  count: number;
};
export type Sums = {
  steps: number | null;
  distance: number | null;
  energy: number | null;
};

function databasePath() {
  if (process.env.SQLITE_PATH) {
    const path = process.env.SQLITE_PATH;
    return isAbsolute(path) ? path : resolve(process.cwd(), "prisma", path);
  }
  const legacy = process.env.DATABASE_URL;
  if (legacy && !legacy.startsWith("file:")) {
    throw new Error("DATABASE_URL must be a local file: SQLite URL");
  }
  const configured = legacy ? decodeURIComponent(legacy.slice(5)) : "./dev.db";
  return isAbsolute(configured)
    ? configured
    : resolve(process.cwd(), "prisma", configured);
}

let connection: DatabaseSync | undefined;
export function getDb() {
  if (connection) return connection;
  const path = databasePath();
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path, {
    timeout: 5000,
    enableForeignKeyConstraints: true,
  });
  try {
    runMigrations(db);
  } catch (error) {
    db.close();
    throw error;
  }
  connection = db;
  return db;
}

type StoredUser = Omit<User, "lastLogin" | "lastSync"> & {
  lastLogin: number | string | null;
  lastSync: number | string | null;
};
type StoredRecord = Omit<StepRecord, "timestamp"> & {
  timestamp: number | string;
};
type StoredBadge = Omit<Badge, "created" | "updated"> & {
  created: number | string;
  updated: number | string;
};
const date = (value: number | string | null) =>
  value == null ? null : new Date(value);
const userFromRow = (row: StoredUser | undefined) =>
  row
    ? { ...row, lastLogin: date(row.lastLogin), lastSync: date(row.lastSync) }
    : null;
const recordFromRow = (row: StoredRecord) => ({
  ...row,
  timestamp: new Date(row.timestamp),
});
const badgeFromRow = (row: StoredBadge) => ({
  ...row,
  created: new Date(row.created),
  updated: new Date(row.updated),
});

export function findUser(
  column: "id" | "email" | "token",
  value: string,
): User | null {
  const row = getDb()
    .prepare(`SELECT * FROM "User" WHERE "${column}" = ?`)
    .get(value) as StoredUser | undefined;
  return userFromRow(row);
}
export function createUserRow(
  name: string,
  email: string,
  password: string,
): User {
  const id = randomUUID();
  getDb()
    .prepare(
      'INSERT INTO "User" ("id", "name", "email", "password", "token") VALUES (?, ?, ?, ?, ?)',
    )
    .run(id, name, email, password, randomUUID());
  return findUser("id", id)!;
}
export function updateUserRow(
  id: string,
  column: "name" | "lastLogin" | "lastSync",
  value: string | Date,
): User {
  getDb()
    .prepare(`UPDATE "User" SET "${column}" = ? WHERE "id" = ?`)
    .run(value instanceof Date ? value.getTime() : value, id);
  const user = findUser("id", id);
  if (!user) throw new Error("User not found");
  return user;
}
export function findRecords(
  userId: string,
  from?: Date,
  to?: Date,
): StepRecord[] {
  const rows = getDb()
    .prepare(
      'SELECT * FROM "Record" WHERE "userId" = ? AND "timestamp" >= ? AND "timestamp" < ? ORDER BY "timestamp"',
    )
    .all(
      userId,
      from?.getTime() ?? Number.MIN_SAFE_INTEGER,
      to?.getTime() ?? Number.MAX_SAFE_INTEGER,
    ) as StoredRecord[];
  return rows.map(recordFromRow);
}
export function latestRecord(userId: string): StepRecord | null {
  const row = getDb()
    .prepare(
      'SELECT * FROM "Record" WHERE "userId" = ? ORDER BY "timestamp" DESC LIMIT 1',
    )
    .get(userId) as StoredRecord | undefined;
  return row ? recordFromRow(row) : null;
}
export function sumRecords(
  from: Date | null,
  to: Date | null,
  userId?: string,
): Sums {
  const where = userId ? 'AND "userId" = ?' : "";
  const row = getDb()
    .prepare(
      `SELECT SUM("steps") AS steps, SUM("distance") AS distance, SUM("energy") AS energy FROM "Record" WHERE "timestamp" >= ? AND "timestamp" < ? ${where}`,
    )
    .get(
      from?.getTime() ?? Number.MIN_SAFE_INTEGER,
      to?.getTime() ?? Number.MAX_SAFE_INTEGER,
      ...(userId ? [userId] : []),
    ) as Sums;
  return row;
}
export function aggregateRecords(userId: string) {
  const row = getDb()
    .prepare(
      'SELECT SUM("steps") AS steps, SUM("distance") AS distance, SUM("energy") AS energy, AVG("steps") AS avgSteps, AVG("distance") AS avgDistance, AVG("energy") AS avgEnergy FROM "Record" WHERE "userId" = ?',
    )
    .get(userId) as Sums & {
    avgSteps: number | null;
    avgDistance: number | null;
    avgEnergy: number | null;
  };
  return {
    _sum: { steps: row.steps, distance: row.distance, energy: row.energy },
    _avg: {
      steps: row.avgSteps,
      distance: row.avgDistance,
      energy: row.avgEnergy,
    },
  };
}
export function rankRecords(from: Date, to: Date) {
  return getDb()
    .prepare(
      'SELECT r."userId", SUM(r."steps") AS steps, SUM(r."distance") AS distance, SUM(r."energy") AS energy, u."id" AS id, u."name" AS name FROM "Record" r JOIN "User" u ON u."id" = r."userId" WHERE r."timestamp" >= ? AND r."timestamp" < ? GROUP BY r."userId" ORDER BY steps DESC LIMIT 10',
    )
    .all(from.getTime(), to.getTime()) as (Sums & {
    userId: string;
    id: string;
    name: string;
  })[];
}
export function upsertRecord(
  userId: string,
  timestamp: Date,
  steps: number,
  distance: number,
  energy: number,
) {
  getDb()
    .prepare(
      'INSERT INTO "Record" ("userId", "timestamp", "steps", "distance", "energy") VALUES (?, ?, ?, ?, ?) ON CONFLICT("userId", "timestamp") DO UPDATE SET "steps" = excluded."steps", "distance" = excluded."distance", "energy" = excluded."energy"',
    )
    .run(userId, timestamp.getTime(), steps, distance, energy);
}
export function findBadges(userId: string): Badge[] {
  return (
    getDb()
      .prepare(
        'SELECT * FROM "Badge" WHERE "userId" = ? ORDER BY "updated" DESC, "created" DESC',
      )
      .all(userId) as StoredBadge[]
  ).map(badgeFromRow);
}
export function giveBadge(
  userId: string,
  badgeId: string,
  allowMultiple = false,
) {
  const now = Date.now();
  const badge = getDb()
    .prepare('SELECT "id" FROM "Badge" WHERE "userId" = ? AND "badgeId" = ?')
    .get(userId, badgeId);
  if (badge) {
    if (allowMultiple)
      getDb()
        .prepare(
          'UPDATE "Badge" SET "count" = "count" + 1, "updated" = ? WHERE "userId" = ? AND "badgeId" = ?',
        )
        .run(now, userId, badgeId);
  } else {
    getDb()
      .prepare(
        'INSERT INTO "Badge" ("id", "userId", "badgeId", "created", "updated", "count") VALUES (?, ?, ?, ?, ?, 1)',
      )
      .run(randomUUID(), userId, badgeId, now, now);
  }
}
export function transaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
