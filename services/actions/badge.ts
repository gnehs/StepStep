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

async function giveUserBadge(
  userId: string,
  badgeId: string,
  allowMultiple = false,
) {
  let badgeData = await prisma.badge.findMany({
    where: {
      userId,
    },
  });
  if (badgeData.some((badge) => badge.badgeId === badgeId)) {
    if (allowMultiple) {
      // update count
      let badge = badgeData.find((badge) => badge.badgeId === badgeId);
      if (badge) {
        await prisma.badge.update({
          where: {
            id: badge.id,
          },
          data: {
            count: badge.count + 1,
          },
        });
      }
    }
  } else {
    await prisma.badge.create({
      data: {
        userId,
        badgeId,
      },
    });
  }
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
  if ((records[0]._sum.steps ?? 0) >= 1) {
    await giveUserBadge(userId, "first-step");
  }
  if ((records[0]._sum.distance ?? 0) >= 352.3) {
    await giveUserBadge(userId, "tpe-to-khh");
  }
  if ((records[0]._sum.distance ?? 0) >= 384400) {
    await giveUserBadge(userId, "to-the-moon");
  }
}
