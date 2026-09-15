"use server";
import { createUserRow, updateUserRow } from "@/services/db";
import { getCurrentUserRecord, toPublicUser } from "@/services/session";
import bcrypt from "bcryptjs";
export async function createUser({
  inviteCode,
  name,
  email,
  password,
}: {
  inviteCode: string;
  name: string;
  email: string;
  password: string;
}) {
  if (inviteCode !== process.env.INVITE_CODE) {
    return { success: false, message: "邀請碼錯誤" };
  }
  const user = createUserRow(name, email, await bcrypt.hash(password, 10));
  return { success: true, user: toPublicUser(user) };
}
export async function updateName({ name }: { name: string }) {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 64) {
    return null;
  }
  const userData = await getCurrentUserRecord();
  if (!userData) {
    return null;
  }
  const user = updateUserRow(userData.id, "name", name.trim());
  return toPublicUser(user);
}
