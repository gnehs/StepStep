"use server";
import prisma from "@/services/prisma";
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
  if (inviteCode !== "勝勝聰明勝勝可愛") {
    return { success: false, message: "邀請碼錯誤" };
  }
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password,
    },
  });
  return { success: true, user };
}
