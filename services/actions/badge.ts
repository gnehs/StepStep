"use server";
import prisma from "@/services/prisma";
import { getUserFromJWT } from "@/services/actions/auth";
export async function getBadgeData(token: string) {
  let user = await getUserFromJWT(token);
  if (!user) {
    return [];
  }
  await checkAndGiveBadge(user.id);
  let badgeData = await prisma.badge.findMany({
    where: {
      userId: user.id,
    },
  });
  return badgeData;
}

async function checkAndGiveBadge(userId: string) {
  console.time(`fetch records for user ${userId}`);
  let records = await prisma.record.groupBy({
    by: ["userId"],
    _sum: {
      steps: true,
      distance: true,
      energy: true,
    },
    where: {
      userId: userId,
    },
  });
  console.timeEnd(`fetch records for user ${userId}`);
  let badgeData = await prisma.badge.findMany({
    where: {
      userId: userId,
    },
  });
  const isBadgeExist = (badgeId: string) =>
    badgeData.some((badge) => badge.badgeId === badgeId);
  if ((records[0]._sum.steps ?? 0) >= 1 && !isBadgeExist("first-step")) {
    await prisma.badge.create({
      data: {
        userId: userId,
        badgeId: "first-step",
      },
    });
  }
  if ((records[0]._sum.distance ?? 0) >= 352.3 && !isBadgeExist("tpe-to-khh")) {
    await prisma.badge.create({
      data: {
        userId: userId,
        badgeId: "tpe-to-khh",
      },
    });
  }
  if (
    (records[0]._sum.distance ?? 0) >= 384400 &&
    !isBadgeExist("to-the-moon")
  ) {
    await prisma.badge.create({
      data: {
        userId: userId,
        badgeId: "to-the-moon",
      },
    });
  }
}
