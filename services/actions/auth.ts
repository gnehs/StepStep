"use server";
import prisma from "@/services/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
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
    },
  });
  const passwordMatch =
    user && (await bcrypt.compare(password, user?.password || ""));
  if (user && passwordMatch) {
    // update user's last sync login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
    let token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "30d",
    });
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
      let newToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
        expiresIn: "7d",
      });
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
export async function getUserById(id: string) {
  try {
    let user = await prisma.user.findUnique({
      where: {
        id,
      },
    });
    return user;
  } catch (error) {
    return null;
  }
}
