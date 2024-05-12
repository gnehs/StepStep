"use server";
import prisma from "@/services/prisma";
import { getUserFromJWT } from "./auth";
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
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, 10),
    },
  });
  return { success: true, user };
}
export async function updateName({
  token,
  name,
}: {
  token: string;
  name: string;
}) {
  let userData = await getUserFromJWT(token);
  if (!userData) {
    return null;
  }
  let user = await prisma.user.update({
    where: {
      id: userData?.id,
    },
    data: {
      name,
    },
  });
  return user;
}
