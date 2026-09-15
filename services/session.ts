import "server-only";

import jwt, { type JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import { findUser, type User } from "@/services/db";

/**
 * The browser session is deliberately separate from User.token. User.token is
 * the long-lived secret used by the external sync API and must never be
 * included in the normal authenticated-user DTO.
 */
export const SESSION_COOKIE_NAME = "stepstep-session";
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export type PublicUser = Pick<
  User,
  "id" | "email" | "name" | "lastLogin" | "lastSync"
>;

const sessionCookieOptions = () => ({
  httpOnly: true,
  // Local development runs over http://localhost. Secure cookies are enabled
  // for production deployments, where HTTPS is required.
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
});

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
}

export function toPublicUser(user: User): PublicUser {
  const { id, email, name, lastLogin, lastSync } = user;
  return { id, email, name, lastLogin, lastSync };
}

export function signSessionToken(userId: string) {
  return jwt.sign({ userId }, jwtSecret(), {
    algorithm: "HS256",
    expiresIn: SESSION_MAX_AGE,
  });
}

export function verifySessionToken(token: string): string | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, jwtSecret(), {
      algorithms: ["HS256"],
    }) as JwtPayload;
    return typeof decoded.userId === "string" ? decoded.userId : null;
  } catch {
    return null;
  }
}

/** Set the authenticated browser session. Call only from a Server Function. */
export async function createSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    signSessionToken(userId),
    sessionCookieOptions(),
  );
}

/** Delete the authenticated browser session. Call only from a Server Function. */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/**
 * Resolve a JWT to its database row. This full row is server-only because it
 * contains password and external-sync secrets.
 */
export function getUserRecordFromToken(token: string): User | null {
  const userId = verifySessionToken(token);
  return userId ? findUser("id", userId) : null;
}

export async function getCurrentUserRecord(): Promise<User | null> {
  const token = await getSessionToken();
  return token ? getUserRecordFromToken(token) : null;
}

/** Safe authenticated-user DTO for Server Components and client boundaries. */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const user = await getCurrentUserRecord();
  return user ? toPublicUser(user) : null;
}
