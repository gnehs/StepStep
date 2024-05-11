"use server";
import { getUserFromJWT } from "@/services/actions/auth";
import prisma from "@/services/prisma";
export async function getSyncStatus(token: string) {
  let user = await getUserFromJWT(token);
  if (!user) {
    return { success: false, message: "無效的 token" };
  }
  let lastSync = await prisma.record.findFirst({
    where: {
      userId: user.id,
    },
    orderBy: {
      timestamp: "desc",
    },
  });
  return { success: true, user, lastSync: lastSync?.timestamp || null };
}
