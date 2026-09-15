import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { createUserRow, getDb } from "../services/db";
import { login, logout, refreshSession } from "../services/actions/auth";
import { SESSION_COOKIE_NAME } from "../services/session";
import {
  cookieDeletes,
  cookieOperations,
  cookieValues,
  resetCookies,
} from "./mocks/headers";

const directory = mkdtempSync(join(tmpdir(), "stepstep-auth-db-"));
const email = "auth-test@example.invalid";
const password = randomBytes(24).toString("base64url");
const previousNodeEnv = process.env.NODE_ENV;

before(async () => {
  process.env.SQLITE_PATH = join(directory, "test.db");
  process.env.JWT_SECRET = randomBytes(32).toString("base64url");
  Object.assign(process.env, { NODE_ENV: "production" });
  createUserRow("Auth Test", email, await bcrypt.hash(password, 4));
  resetCookies();
});

after(() => {
  getDb().close();
  rmSync(directory, { recursive: true, force: true });
  if (previousNodeEnv === undefined)
    Reflect.deleteProperty(process.env, "NODE_ENV");
  else Object.assign(process.env, { NODE_ENV: previousNodeEnv });
});

function sessionSets() {
  return cookieOperations.filter(
    (
      operation,
    ): operation is Extract<
      (typeof cookieOperations)[number],
      { kind: "set" }
    > => operation.kind === "set",
  );
}

function assertSecureSessionCookie() {
  const [operation] = sessionSets().slice(-1);
  assert.ok(operation, "successful authentication must set a session cookie");
  assert.equal(operation.options.httpOnly, true);
  assert.equal(operation.options.secure, true);
  assert.equal(operation.options.sameSite, "lax");
  assert.equal(operation.options.path, "/");
  assert.equal(operation.options.maxAge, 30 * 24 * 60 * 60);
  assert.ok(operation.value.length > 20);
  return operation;
}

test("password login issues an HttpOnly session and only returns a public user", async () => {
  resetCookies();

  const result = await login({ email, password });

  assert.equal(result.success, true);
  assertSecureSessionCookie();
  assert.equal("token" in result, false);
  assert.equal("password" in result.user, false);
  assert.equal("token" in result.user, false);
  assert.doesNotMatch(JSON.stringify(result), /password|secret|\$2[aby]\$/i);
});

test("failed password login does not create or overwrite a session", async () => {
  resetCookies();

  const result = await login({ email, password: `${password}-wrong` });

  assert.equal(result.success, false);
  assert.equal(cookieOperations.length, 0);
  assert.equal(cookieValues.size, 0);
});

test("refresh and logout operate on the cookie instead of accepting a browser JWT", async () => {
  resetCookies();
  const refreshWithLegacyToken = refreshSession as unknown as (
    token: string,
  ) => ReturnType<typeof refreshSession>;
  assert.deepEqual(await refreshWithLegacyToken("legacy-browser-jwt"), {
    success: false,
    message: "無效的 token",
  });

  const loginResult = await login({ email, password });
  assert.equal(loginResult.success, true);
  assertSecureSessionCookie();

  cookieOperations.length = 0;
  const refreshed = await refreshSession();
  assert.equal(refreshed.success, true);
  assertSecureSessionCookie();
  assert.equal("token" in refreshed, false);
  assert.notEqual(cookieValues.size, 0);
  assert.equal(typeof cookieValues.get(SESSION_COOKIE_NAME), "string");

  cookieOperations.length = 0;
  assert.deepEqual(await logout(), { success: true });
  assert.deepEqual([...cookieDeletes], [SESSION_COOKIE_NAME]);
  assert.equal(cookieValues.has(SESSION_COOKIE_NAME), false);
});
