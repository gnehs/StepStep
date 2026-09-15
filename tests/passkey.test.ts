import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import {
  createHash,
  generateKeyPairSync,
  randomBytes,
  sign,
} from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { createUserRow, getDb, findUser } from "../services/db";
import { getPasskeyConfig } from "../services/passkey-config";
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "../services/session";
import {
  findPasskey,
  consumeChallenge,
  saveChallenge,
  updatePasskeyUsage,
} from "../services/passkey-store";
import {
  getPasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  getPasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
  listPasskeys,
  removePasskey,
} from "../services/actions/passkey";
import { cookieValues, cookieOptions, resetCookies } from "./mocks/headers";

const directory = mkdtempSync(join(tmpdir(), "stepstep-passkey-db-"));
const origin = "https://steps.example.test";
const rpID = "steps.example.test";
const password = randomBytes(24).toString("base64url");
let user: ReturnType<typeof createUserRow>;
let other: ReturnType<typeof createUserRow>;
const previousNodeEnv = process.env.NODE_ENV;

before(async () => {
  process.env.SQLITE_PATH = join(directory, "test.db");
  process.env.WEBAUTHN_ORIGIN = origin;
  process.env.JWT_SECRET = randomBytes(32).toString("base64url");
  Object.assign(process.env, { NODE_ENV: "production" });
  user = createUserRow(
    "Test User",
    "test@example.invalid",
    await bcrypt.hash(password, 4),
  );
  other = createUserRow(
    "Other User",
    "other@example.invalid",
    await bcrypt.hash(password, 4),
  );
  resetCookies();
  setSession(user.id);
});
after(() => {
  getDb().close();
  rmSync(directory, { recursive: true, force: true });
  if (previousNodeEnv === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
  else Object.assign(process.env, { NODE_ENV: previousNodeEnv });
});

function setSession(userId: string) {
  cookieValues.set(SESSION_COOKIE_NAME, signSessionToken(userId));
}

// Minimal test authenticator: emit CBOR attestation and sign genuine ES256 assertions.
// Production verification always uses the real SimpleWebAuthn implementation.
function cbor(value: number | string | Buffer | Map<unknown, unknown>): Buffer {
  function head(major: number, length: number) {
    if (length < 24) return Buffer.from([(major << 5) | length]);
    if (length < 256) return Buffer.from([(major << 5) | 24, length]);
    const bytes = Buffer.alloc(3);
    bytes[0] = (major << 5) | 25;
    bytes.writeUInt16BE(length, 1);
    return bytes;
  }
  if (typeof value === "number")
    return value >= 0 ? head(0, value) : head(1, -1 - value);
  if (typeof value === "string") {
    const bytes = Buffer.from(value);
    return Buffer.concat([head(3, bytes.length), bytes]);
  }
  if (Buffer.isBuffer(value))
    return Buffer.concat([head(2, value.length), value]);
  return Buffer.concat([
    head(5, value.size),
    ...[...value].flatMap(([key, item]) => [
      cbor(key as Parameters<typeof cbor>[0]),
      cbor(item as Parameters<typeof cbor>[0]),
    ]),
  ]);
}

function authenticator() {
  const { privateKey, publicKey } = generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  });
  const jwk = publicKey.export({ format: "jwk" });
  const credentialID = randomBytes(32);
  const id = credentialID.toString("base64url");
  function authData(counter: number, flags: number, host = rpID) {
    const bytes = Buffer.alloc(37);
    createHash("sha256").update(host).digest().copy(bytes);
    bytes[32] = flags;
    bytes.writeUInt32BE(counter, 33);
    return bytes;
  }
  return {
    id,
    registration(
      challenge: string,
      settings: { origin?: string; rpID?: string; flags?: number } = {},
    ): RegistrationResponseJSON {
      const credentialLength = Buffer.alloc(2);
      credentialLength.writeUInt16BE(credentialID.length);
      const cose = cbor(
        new Map<number, number | Buffer>([
          [1, 2],
          [3, -7],
          [-1, 1],
          [-2, Buffer.from(jwk.x!, "base64url")],
          [-3, Buffer.from(jwk.y!, "base64url")],
        ]),
      );
      const data = Buffer.concat([
        authData(0, settings.flags ?? 0x45, settings.rpID),
        Buffer.alloc(16),
        credentialLength,
        credentialID,
        cose,
      ]);
      const attestation = cbor(
        new Map<string, unknown>([
          ["fmt", "none"],
          ["attStmt", new Map()],
          ["authData", data],
        ]),
      );
      return {
        id,
        rawId: id,
        type: "public-key",
        clientExtensionResults: { credProps: { rk: true } },
        response: {
          clientDataJSON: Buffer.from(
            JSON.stringify({
              type: "webauthn.create",
              challenge,
              origin: settings.origin ?? origin,
            }),
          ).toString("base64url"),
          attestationObject: attestation.toString("base64url"),
          transports: ["internal"],
        },
      };
    },
    authentication(
      challenge: string,
      userId = user.id,
      settings: {
        origin?: string;
        rpID?: string;
        flags?: number;
        counter?: number;
        type?: string;
      } = {},
    ): AuthenticationResponseJSON {
      const clientData = Buffer.from(
        JSON.stringify({
          type: settings.type ?? "webauthn.get",
          challenge,
          origin: settings.origin ?? origin,
        }),
      );
      const data = authData(
        settings.counter ?? 0,
        settings.flags ?? 0x05,
        settings.rpID,
      );
      const signature = sign(
        "sha256",
        Buffer.concat([data, createHash("sha256").update(clientData).digest()]),
        privateKey,
      );
      return {
        id,
        rawId: id,
        type: "public-key",
        clientExtensionResults: {},
        response: {
          clientDataJSON: clientData.toString("base64url"),
          authenticatorData: data.toString("base64url"),
          signature: signature.toString("base64url"),
          userHandle: Buffer.from(userId).toString("base64url"),
        },
      };
    },
  };
}

async function enroll(device = authenticator()) {
  setSession(user.id);
  const options = await getPasskeyRegistrationOptions(password);
  if (!options.success) throw new Error(options.message);
  assert.equal(options.options.authenticatorSelection?.residentKey, "required");
  assert.equal(
    options.options.authenticatorSelection?.userVerification,
    "required",
  );
  assert.deepEqual(
    await verifyPasskeyRegistration(
      device.registration(options.options.challenge),
      "Test passkey",
    ),
    { success: true },
  );
  return device;
}

async function challenge() {
  const result = await getPasskeyAuthenticationOptions();
  if (!result.success) throw new Error(result.message);
  assert.equal(result.options.userVerification, "required");
  assert.equal(result.options.allowCredentials?.length ?? 0, 0);
  return result.options.challenge;
}

test("registers and authenticates with a genuine signature, issuing an HttpOnly session", async () => {
  const device = await enroll();
  const response = device.authentication(await challenge());
  const cookie = cookieOptions.get("stepstep-passkey-authentication");
  assert.deepEqual(cookie, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 300,
  });
  const result = await verifyPasskeyAuthentication(response);
  assert.deepEqual(result, { success: true });
  const session = cookieOptions.get(SESSION_COOKIE_NAME);
  assert.equal(session?.httpOnly, true);
  assert.equal(session?.secure, true);
  assert.equal(session?.sameSite, "lax");
  assert.equal(session?.path, "/");
  assert.equal(session?.maxAge, 30 * 24 * 60 * 60);
  assert.ok(findUser("id", user.id)?.lastLogin);
  assert.ok(findPasskey(device.id)?.lastUsedAt);
  assert.equal((await verifyPasskeyAuthentication(response)).success, false);
});

test("registration requires a valid session, password, and the same account at verification", async () => {
  cookieValues.delete(SESSION_COOKIE_NAME);
  assert.equal((await getPasskeyRegistrationOptions(password)).success, false);
  setSession(user.id);
  assert.equal(
    (await getPasskeyRegistrationOptions("incorrect")).success,
    false,
  );
  const options = await getPasskeyRegistrationOptions(password);
  if (!options.success) throw new Error(options.message);
  const device = authenticator();
  const response = device.registration(options.options.challenge);
  setSession(other.id);
  assert.equal(
    (await verifyPasskeyRegistration(response, "Wrong account")).success,
    false,
  );
  setSession(user.id);
  assert.equal(
    (await verifyPasskeyRegistration(response, "Replay")).success,
    false,
  );
  assert.equal(findPasskey(device.id), null);
});

test("registration rejects wrong origin, RP ID, absent user verification, and duplicate credentials", async () => {
  setSession(user.id);
  for (const settings of [
    { origin: "https://attacker.example.test" },
    { rpID: "attacker.example.test" },
    { flags: 0x41 },
  ]) {
    const options = await getPasskeyRegistrationOptions(password);
    if (!options.success) throw new Error(options.message);
    const device = authenticator();
    assert.equal(
      (
        await verifyPasskeyRegistration(
          device.registration(options.options.challenge, settings),
          "Invalid",
        )
      ).success,
      false,
    );
    assert.equal(findPasskey(device.id), null);
  }
  const device = await enroll();
  const options = await getPasskeyRegistrationOptions(password);
  if (!options.success) throw new Error(options.message);
  assert.ok(
    options.options.excludeCredentials?.some(({ id }) => id === device.id),
  );
  assert.equal(
    (
      await verifyPasskeyRegistration(
        device.registration(options.options.challenge),
        "Duplicate",
      )
    ).success,
    false,
  );
});

test("authentication rejects wrong origin, RP, ceremony type, user verification, and challenge", async () => {
  const device = await enroll();
  for (const settings of [
    { origin: "https://attacker.example.test" },
    { rpID: "attacker.example.test" },
    { flags: 0x01 },
    { type: "webauthn.create" },
  ]) {
    const response = device.authentication(
      await challenge(),
      user.id,
      settings,
    );
    assert.equal((await verifyPasskeyAuthentication(response)).success, false);
  }
  await challenge();
  assert.equal(
    (
      await verifyPasskeyAuthentication(
        device.authentication("wrong-challenge"),
      )
    ).success,
    false,
  );
});

test("authentication rejects wrong user handles, missing cookies, and tampered signatures", async () => {
  const device = await enroll();
  assert.equal(
    (
      await verifyPasskeyAuthentication(
        device.authentication(await challenge(), other.id),
      )
    ).success,
    false,
  );
  const withoutCookie = device.authentication(await challenge());
  cookieValues.clear();
  assert.equal(
    (await verifyPasskeyAuthentication(withoutCookie)).success,
    false,
  );
  const tampered = device.authentication(await challenge());
  tampered.response.signature = randomBytes(64).toString("base64url");
  assert.equal((await verifyPasskeyAuthentication(tampered)).success, false);
});

test("expired and superseded challenges fail; even a restored cookie cannot replay a consumed challenge", async () => {
  const device = await enroll();
  const expired = device.authentication(await challenge());
  getDb()
    .prepare('UPDATE "PasskeyChallenge" SET "expiresAt" = ?')
    .run(Date.now() - 1);
  assert.equal((await verifyPasskeyAuthentication(expired)).success, false);
  const superseded = device.authentication(await challenge());
  const oldCookie = cookieValues.get("stepstep-passkey-authentication")!;
  await challenge();
  cookieValues.set("stepstep-passkey-authentication", oldCookie);
  assert.equal((await verifyPasskeyAuthentication(superseded)).success, false);
  const valid = device.authentication(await challenge());
  const currentCookie = cookieValues.get("stepstep-passkey-authentication")!;
  assert.equal((await verifyPasskeyAuthentication(valid)).success, true);
  cookieValues.set("stepstep-passkey-authentication", currentCookie);
  assert.equal((await verifyPasskeyAuthentication(valid)).success, false);
});

test("challenge consumption is single-use and scoped to its ceremony", () => {
  const id = randomBytes(32).toString("base64url");
  saveChallenge(
    id,
    "registration",
    "test-challenge",
    user.id,
    Date.now() + 60000,
  );
  assert.equal(consumeChallenge(id, "authentication"), null);
  assert.equal(consumeChallenge(id, "registration")?.userId, user.id);
  assert.equal(consumeChallenge(id, "registration"), null);
});

test("nonzero counters must advance; zero-counter passkeys can sign in repeatedly", async () => {
  const device = await enroll();
  for (let index = 0; index < 2; index++) {
    assert.equal(
      (
        await verifyPasskeyAuthentication(
          device.authentication(await challenge()),
        )
      ).success,
      true,
    );
  }
  assert.equal(
    (
      await verifyPasskeyAuthentication(
        device.authentication(await challenge(), user.id, { counter: 2 }),
      )
    ).success,
    true,
  );
  assert.equal(findPasskey(device.id)?.counter, 2);
  assert.equal(
    (
      await verifyPasskeyAuthentication(
        device.authentication(await challenge(), user.id, { counter: 1 }),
      )
    ).success,
    false,
  );
  assert.equal(
    (
      await verifyPasskeyAuthentication(
        device.authentication(await challenge(), user.id, { counter: 2 }),
      )
    ).success,
    false,
  );
});

test("management enforces ownership, returns only metadata, and removed credentials cannot sign in", async () => {
  const device = await enroll();
  cookieValues.delete(SESSION_COOKIE_NAME);
  assert.equal((await listPasskeys()).success, false);
  setSession(user.id);
  const list = await listPasskeys();
  if (!list.success) throw new Error(list.message);
  const item = list.passkeys.find(({ id }) => id === device.id)!;
  assert.deepEqual(Object.keys(item).sort(), [
    "createdAt",
    "id",
    "lastUsedAt",
    "name",
  ]);
  setSession(other.id);
  assert.deepEqual(await listPasskeys(), {
    success: true,
    passkeys: [],
  });
  cookieValues.delete(SESSION_COOKIE_NAME);
  assert.equal((await removePasskey(device.id)).success, false);
  setSession(other.id);
  assert.equal((await removePasskey(device.id)).success, false);
  setSession(user.id);
  const response = device.authentication(await challenge());
  const stored = findPasskey(device.id)!;
  assert.equal((await removePasskey(device.id)).success, true);
  assert.equal(updatePasskeyUsage(stored, 1, false), false);
  assert.equal((await verifyPasskeyAuthentication(response)).success, false);
});

test("counter updates reject stale snapshots", async () => {
  const device = await enroll();
  const snapshot = findPasskey(device.id)!;
  assert.equal(updatePasskeyUsage(snapshot, 4, false), true);
  assert.equal(updatePasskeyUsage(snapshot, 2, false), false);
  assert.equal(findPasskey(device.id)?.counter, 4);
});

test("production requires a pinned HTTPS origin and rejects paths or credentials", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  Object.assign(process.env, { NODE_ENV: "production" });
  try {
    delete process.env.WEBAUTHN_ORIGIN;
    assert.throws(getPasskeyConfig);
    for (const value of [
      "http://steps.example.test",
      "https://steps.example.test/path",
      "https://test:fake@steps.example.test",
      "https://steps.example.test?query=1",
    ]) {
      process.env.WEBAUTHN_ORIGIN = value;
      assert.throws(getPasskeyConfig);
    }
    process.env.WEBAUTHN_ORIGIN = "http://localhost:3000";
    assert.equal(getPasskeyConfig().rpID, "localhost");
  } finally {
    if (previousNodeEnv === undefined)
      Reflect.deleteProperty(process.env, "NODE_ENV");
    else Object.assign(process.env, { NODE_ENV: previousNodeEnv });
    process.env.WEBAUTHN_ORIGIN = origin;
  }
});
