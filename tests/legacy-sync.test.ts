import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createUserRow, findRecords, getDb } from "../services/db";
import { POST as legacyPost } from "../app/api/v1/sync/[token]/route";
import { POST as headerPost } from "../app/api/v1/sync/route";

const directory = mkdtempSync(join(tmpdir(), "stepstep-sync-api-db-"));
const previousSqlitePath = process.env.SQLITE_PATH;
const previousJwtSecret = process.env.JWT_SECRET;
type SyncPayload = {
  time?: string[];
  step?: string[];
  distance?: string[];
  energy?: string[];
};
const payload: SyncPayload & {
  time: string[];
  step: string[];
  distance: string[];
} = {
  time: ["2026-09-15T08:34:56.000Z"],
  step: ["1234"],
  distance: ["1.5"],
  energy: ["42"],
};
let user: ReturnType<typeof createUserRow>;

before(() => {
  process.env.SQLITE_PATH = join(directory, "test.db");
  process.env.JWT_SECRET = randomBytes(32).toString("base64url");
  user = createUserRow(
    "Legacy Sync Test",
    "legacy-sync@example.invalid",
    randomBytes(24).toString("base64url"),
  );
});

after(() => {
  getDb().close();
  rmSync(directory, { recursive: true, force: true });
  if (previousSqlitePath === undefined) delete process.env.SQLITE_PATH;
  else process.env.SQLITE_PATH = previousSqlitePath;
  if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousJwtSecret;
});

function request(url: string, body: SyncPayload = payload, token?: string) {
  return new Request(url, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function assertLegacyHeaders(response: Response) {
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("deprecation"), "true");
  assert.match(
    response.headers.get("link") ?? "",
    /<\/api\/v1\/sync>;\s*rel="successor-version"/,
  );
}

test("legacy token-in-path sync keeps the old successful response and data shape", async () => {
  const timestamp = new Date(payload.time[0]);
  timestamp.setMinutes(0, 0, 0);
  const response = await legacyPost(
    request(`https://steps.example.test/api/v1/sync/${user.token}`, payload),
    { params: Promise.resolve({ token: user.token }) },
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/json");
  assertLegacyHeaders(response);
  const body = await response.text();
  assert.equal(body, `${user.name}，已同步 ${payload.time.length} 筆資料`);
  assert.equal(body.includes(user.token), false);

  const [record] = findRecords(user.id);
  assert.ok(record);
  assert.equal(record.timestamp.getTime(), timestamp.getTime());
  assert.equal(record.steps, 1234);
  assert.equal(record.distance, 1.5);
  assert.equal(record.energy, 42);
});

test("legacy invalid-token and malformed-payload responses preserve the old contract", async () => {
  const invalidToken = `${user.token}-invalid`;
  const invalid = await legacyPost(
    request(`https://steps.example.test/api/v1/sync/${invalidToken}`),
    { params: Promise.resolve({ token: invalidToken }) },
  );
  assert.equal(invalid.status, 200);
  assert.equal(invalid.headers.get("content-type"), "application/json");
  assertLegacyHeaders(invalid);
  assert.deepEqual(await invalid.json(), {
    success: false,
    message: "令牌無效",
  });

  const malformed = await legacyPost(
    request(`https://steps.example.test/api/v1/sync/${user.token}`, {
      time: ["2026-09-15T08:34:56.000Z"],
      step: [],
      distance: ["1.5"],
    }),
    { params: Promise.resolve({ token: user.token }) },
  );
  assert.equal(malformed.status, 400);
  assert.equal(malformed.headers.get("content-type"), "application/json");
  assertLegacyHeaders(malformed);
  assert.deepEqual(await malformed.json(), {
    success: false,
    message: "資料格式無效",
  });
});

test("new sync API accepts the header credential and rejects query-only credentials", async () => {
  const response = await headerPost(
    request("https://steps.example.test/api/v1/sync", payload, user.token),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(
    await response.text(),
    `${user.name}，已同步 ${payload.time.length} 筆資料`,
  );

  const queryOnly = await headerPost(
    request(
      `https://steps.example.test/api/v1/sync?token=${user.token}`,
      payload,
    ),
  );
  assert.equal(queryOnly.status, 401);
  assert.equal(queryOnly.headers.get("cache-control"), "no-store");
  assert.deepEqual(await queryOnly.json(), {
    success: false,
    message: "需要 Authorization: Bearer <同步令牌>",
  });
});
