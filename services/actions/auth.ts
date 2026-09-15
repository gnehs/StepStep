"use server";

import bcrypt from "bcryptjs";
import { findUser, updateUserRow } from "@/services/db";
import {
  clearSession,
  createSession,
  getCurrentUserRecord,
  toPublicUser,
  type PublicUser,
} from "@/services/session";

type AuthSuccess = { success: true; user: PublicUser };
type AuthFailure = { success: false; message: string };

export async function login({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AuthSuccess | AuthFailure> {
  if (
    typeof email !== "string" ||
    !email.trim() ||
    email.length > 320 ||
    typeof password !== "string" ||
    !password ||
    password.length > 1024
  ) {
    return { success: false, message: "帳號或密碼錯誤" };
  }

  let user = findUser("email", email);
  const passwordMatch =
    user && (await bcrypt.compare(password, user.password || ""));
  if (user && passwordMatch) {
    // Update the last-login timestamp before creating the new browser session.
    user = updateUserRow(user.id, "lastLogin", new Date());
    await createSession(user.id);
    return { success: true, user: toPublicUser(user) };
  }
  return { success: false, message: "帳號或密碼錯誤" };
}

/** Refresh the HttpOnly browser session from the request cookie. */
export async function refreshToken(): Promise<AuthSuccess | AuthFailure> {
  const user = await getCurrentUserRecord();
  if (!user) return { success: false, message: "無效的 token" };

  await createSession(user.id);
  return { success: true, user: toPublicUser(user) };
}

/** Preferred name for new callers; unlike the old implementation it accepts no bearer token. */
export async function refreshSession(): Promise<AuthSuccess | AuthFailure> {
  return refreshToken();
}

export async function logout() {
  await clearSession();
  return { success: true as const };
}

/** Resolve the external sync secret only for the sync route itself. */
export async function getUserBySyncToken(token: string) {
  const user = findUser("token", token);
  return user ? toPublicUser(user) : null;
}

export async function getUserById(id: string) {
  const user = findUser("id", id);
  return user ? toPublicUser(user) : null;
}
