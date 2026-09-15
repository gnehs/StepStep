"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { getUserFromJWT } from "./auth";
import { findUser, transaction, updateUserRow } from "../db";
import { getPasskeyConfig } from "../passkey-config";
import {
  consumeChallenge,
  deletePasskey,
  discardChallenge,
  findPasskey,
  findPasskeys,
  insertPasskey,
  saveChallenge,
  updatePasskeyUsage,
  type Ceremony,
} from "../passkey-store";

const failure = (message: string) => ({ success: false as const, message });
const challengeLifetime = 5 * 60 * 1000;
const cookieName = (ceremony: Ceremony) => `stepstep-passkey-${ceremony}`;

async function rememberChallenge(
  ceremony: Ceremony,
  challenge: string,
  userId: string | null,
) {
  const jar = await cookies();
  const name = cookieName(ceremony);
  const previous = jar.get(name)?.value;
  if (previous) discardChallenge(previous);
  const id = randomBytes(32).toString("base64url");
  saveChallenge(
    id,
    ceremony,
    challenge,
    userId,
    Date.now() + challengeLifetime,
  );
  jar.set(name, id, {
    httpOnly: true,
    secure: getPasskeyConfig().secure,
    sameSite: "strict",
    path: "/",
    maxAge: challengeLifetime / 1000,
  });
}

async function takeChallenge(ceremony: Ceremony) {
  const jar = await cookies();
  const name = cookieName(ceremony);
  const id = jar.get(name)?.value;
  jar.delete(name);
  return id ? consumeChallenge(id, ceremony) : null;
}

export async function getPasskeyRegistrationOptions(
  token: string,
  password: string,
) {
  try {
    const user = await getUserFromJWT(token);
    if (!user) return failure("登入已失效，請重新登入。");
    if (
      typeof password !== "string" ||
      !password ||
      password.length > 1024 ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return failure("目前密碼不正確。");
    }
    const config = getPasskeyConfig();
    const options = await generateRegistrationOptions({
      rpName: config.rpName,
      rpID: config.rpID,
      // Existing IDs are opaque UUIDs/CUIDs, never emails or display names.
      userID: new TextEncoder().encode(user.id),
      userName: user.email,
      userDisplayName: user.name,
      attestationType: "none",
      excludeCredentials: findPasskeys(user.id).map(({ id, transports }) => ({
        id,
        transports,
      })),
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "required",
      },
      timeout: 60000,
    });
    await rememberChallenge("registration", options.challenge, user.id);
    return { success: true as const, options };
  } catch {
    return failure(
      "無法開始新增 Passkey，請稍後再試或聯絡管理員確認網站設定。",
    );
  }
}

export async function verifyPasskeyRegistration(
  token: string,
  response: RegistrationResponseJSON,
  name: string,
) {
  try {
    const challenge = await takeChallenge("registration");
    const user = await getUserFromJWT(token);
    if (!user || !challenge || challenge.userId !== user.id) {
      return failure("驗證已失效，請重新新增 Passkey。");
    }
    if (typeof name !== "string" || !name.trim() || name.trim().length > 64) {
      return failure("請輸入 1 至 64 字的 Passkey 名稱。");
    }
    const { origin, rpID } = getPasskeyConfig();
    const { verified, registrationInfo } = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
    if (!verified || !registrationInfo)
      return failure("Passkey 驗證失敗，請重新新增。");
    const { credential, credentialDeviceType, credentialBackedUp } =
      registrationInfo;
    insertPasskey({
      ...credential,
      userId: user.id,
      name: name.trim(),
      transports: credential.transports ?? [],
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      createdAt: Date.now(),
      lastUsedAt: null,
    });
    return { success: true as const };
  } catch {
    return failure("無法新增 Passkey，可能已新增過或驗證失敗，請重試。");
  }
}

export async function getPasskeyAuthenticationOptions() {
  try {
    const { rpID } = getPasskeyConfig();
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "required",
      timeout: 60000,
    });
    await rememberChallenge("authentication", options.challenge, null);
    return { success: true as const, options };
  } catch {
    return failure(
      "目前無法使用 Passkey 登入，請改用密碼或聯絡管理員確認網站設定。",
    );
  }
}

export async function verifyPasskeyAuthentication(
  response: AuthenticationResponseJSON,
) {
  const invalid = "Passkey 登入失敗或驗證已逾時，請重試或使用密碼登入。";
  try {
    const challenge = await takeChallenge("authentication");
    if (
      !challenge ||
      challenge.userId !== null ||
      typeof response?.id !== "string"
    )
      return failure(invalid);
    const passkey = findPasskey(response.id);
    if (
      !passkey ||
      response.response?.userHandle !==
        Buffer.from(passkey.userId).toString("base64url")
    ) {
      return failure(invalid);
    }
    const { origin, rpID } = getPasskeyConfig();
    const { verified, authenticationInfo } = await verifyAuthenticationResponse(
      {
        response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: passkey,
        requireUserVerification: true,
      },
    );
    if (!verified) return failure(invalid);
    const token = transaction(() => {
      if (
        !findUser("id", passkey.userId) ||
        !updatePasskeyUsage(
          passkey,
          authenticationInfo.newCounter,
          authenticationInfo.credentialBackedUp,
        )
      ) {
        throw new Error("Credential changed during verification");
      }
      updateUserRow(passkey.userId, "lastLogin", new Date());
      return jwt.sign({ userId: passkey.userId }, process.env.JWT_SECRET!, {
        expiresIn: "30d",
      });
    });
    return { success: true as const, token };
  } catch {
    return failure(invalid);
  }
}

export async function listPasskeys(token: string) {
  try {
    const user = await getUserFromJWT(token);
    if (!user) return failure("登入已失效，請重新登入。");
    const passkeys = findPasskeys(user.id).map(
      ({ id, name, createdAt, lastUsedAt }) => ({
        id,
        name,
        createdAt,
        lastUsedAt,
      }),
    );
    return { success: true as const, passkeys };
  } catch {
    return failure("無法載入 Passkey，請稍後再試。");
  }
}

export async function removePasskey(token: string, id: string) {
  try {
    const user = await getUserFromJWT(token);
    if (!user) return failure("登入已失效，請重新登入。");
    if (typeof id !== "string" || !deletePasskey(user.id, id))
      return failure("找不到此 Passkey，請重新整理。");
    return { success: true as const };
  } catch {
    return failure("無法移除 Passkey，請稍後再試。");
  }
}
