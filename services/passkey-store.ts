import "server-only";
import { createHash } from "node:crypto";
import type { WebAuthnCredential } from "@simplewebauthn/server";
import { getDb } from "./db";

export type StoredPasskey = {
  id: string;
  userId: string;
  name: string;
  publicKey: WebAuthnCredential["publicKey"];
  counter: number;
  transports: NonNullable<WebAuthnCredential["transports"]>;
  deviceType: string;
  backedUp: boolean;
  createdAt: number;
  lastUsedAt: number | null;
};

export type Ceremony = "registration" | "authentication";
type Challenge = {
  challenge: string;
  userId: string | null;
  expiresAt: number;
};

function db() {
  const connection = getDb();
  connection.exec(`
    CREATE TABLE IF NOT EXISTS "Passkey" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "name" TEXT NOT NULL,
      "publicKey" BLOB NOT NULL,
      "counter" INTEGER NOT NULL,
      "transports" TEXT NOT NULL,
      "deviceType" TEXT NOT NULL,
      "backedUp" INTEGER NOT NULL,
      "createdAt" INTEGER NOT NULL,
      "lastUsedAt" INTEGER
    );
    CREATE INDEX IF NOT EXISTS "Passkey_userId_idx" ON "Passkey"("userId");
    CREATE TABLE IF NOT EXISTS "PasskeyChallenge" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "ceremony" TEXT NOT NULL,
      "challenge" TEXT NOT NULL,
      "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
      "expiresAt" INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "PasskeyChallenge_expiresAt_idx" ON "PasskeyChallenge"("expiresAt");
  `);
  return connection;
}

type PasskeyRow = Omit<StoredPasskey, "transports" | "backedUp"> & {
  transports: string;
  backedUp: number;
};

function fromRow(row: PasskeyRow): StoredPasskey {
  return {
    ...row,
    publicKey: new Uint8Array(row.publicKey),
    transports: JSON.parse(row.transports),
    backedUp: Boolean(row.backedUp),
  };
}

export function findPasskeys(userId: string): StoredPasskey[] {
  const rows = db()
    .prepare(
      'SELECT * FROM "Passkey" WHERE "userId" = ? ORDER BY "createdAt" DESC',
    )
    .all(userId) as PasskeyRow[];
  return rows.map(fromRow);
}

export function findPasskey(id: string): StoredPasskey | null {
  const row = db().prepare('SELECT * FROM "Passkey" WHERE "id" = ?').get(id) as
    PasskeyRow | undefined;
  return row ? fromRow(row) : null;
}

export function insertPasskey(passkey: StoredPasskey) {
  db()
    .prepare(
      'INSERT INTO "Passkey" ("id", "userId", "name", "publicKey", "counter", "transports", "deviceType", "backedUp", "createdAt", "lastUsedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .run(
      passkey.id,
      passkey.userId,
      passkey.name,
      passkey.publicKey,
      passkey.counter,
      JSON.stringify(passkey.transports),
      passkey.deviceType,
      Number(passkey.backedUp),
      passkey.createdAt,
      passkey.lastUsedAt,
    );
}

export function deletePasskey(userId: string, id: string) {
  return (
    db()
      .prepare('DELETE FROM "Passkey" WHERE "id" = ? AND "userId" = ?')
      .run(id, userId).changes === 1
  );
}

export function updatePasskeyUsage(
  passkey: StoredPasskey,
  counter: number,
  backedUp: boolean,
) {
  // Compare-and-swap also prevents a login completing after removal or a newer counter update.
  return (
    db()
      .prepare(
        'UPDATE "Passkey" SET "counter" = ?, "backedUp" = ?, "lastUsedAt" = ? WHERE "id" = ? AND "counter" = ?',
      )
      .run(counter, Number(backedUp), Date.now(), passkey.id, passkey.counter)
      .changes === 1
  );
}

const hash = (id: string) => createHash("sha256").update(id).digest("hex");

export function saveChallenge(
  id: string,
  ceremony: Ceremony,
  challenge: string,
  userId: string | null,
  expiresAt: number,
) {
  const connection = db();
  connection
    .prepare('DELETE FROM "PasskeyChallenge" WHERE "expiresAt" <= ?')
    .run(Date.now());
  connection
    .prepare(
      'INSERT INTO "PasskeyChallenge" ("id", "ceremony", "challenge", "userId", "expiresAt") VALUES (?, ?, ?, ?, ?)',
    )
    .run(hash(id), ceremony, challenge, userId, expiresAt);
}

export function discardChallenge(id: string) {
  db().prepare('DELETE FROM "PasskeyChallenge" WHERE "id" = ?').run(hash(id));
}

export function consumeChallenge(
  id: string,
  ceremony: Ceremony,
): Challenge | null {
  // DELETE RETURNING is atomic across requests and processes: every attempt is single-use.
  const row = db()
    .prepare(
      'DELETE FROM "PasskeyChallenge" WHERE "id" = ? AND "ceremony" = ? RETURNING "challenge", "userId", "expiresAt"',
    )
    .get(hash(id), ceremony) as Challenge | undefined;
  return row && row.expiresAt > Date.now() ? row : null;
}
