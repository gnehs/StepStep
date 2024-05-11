"use server";
import prisma from "@/services/prisma";
import jwt from "jsonwebtoken";
export async function login({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  let user = await prisma.user.findFirst({
    where: {
      email,
      password,
    },
  });
  if (user) {
    let token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
    return { success: true, user, token };
  }
  return { success: false, message: "帳號或密碼錯誤" };
}
export async function refreshToken(token: string) {
  try {
    let decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    let user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });
    if (user) {
      let newToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
      return { success: true, user, token: newToken };
    }
  } catch (error) {}
  return { success: false, message: "無效的 token" };
}
export async function getUserFromJWT(token: string) {
  try {
    let decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    let user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });
    return user;
  } catch (error) {
    return null;
  }
}
export async function getUserBySyncToken(token: string) {
  try {
    let user = await prisma.user.findFirst({
      where: {
        token,
      },
    });
    return user;
  } catch (error) {
    return null;
  }
}
