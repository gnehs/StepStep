"use server";
import prisma from "@/services/prisma";
import { getUserFromJWT } from "@/services/actions/auth";
export async function getHomeData(token: string) {
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
  // +0800 is the timezone offset for Taipei
  // get today 00:00:00 in Taipei timezone
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  let tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  let records = await prisma.record.findMany({
    where: {
      userId: user.id,
      timestamp: {
        gte: today,
        lt: tomorrow,
      },
    },
  });
  return {
    success: true,
    user,
    lastSync: lastSync?.timestamp || null,
    records,
  };
}
