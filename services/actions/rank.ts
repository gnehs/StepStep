"use server";
import prisma from "@/services/prisma";
export async function getRank() {
  // +0800 is the timezone offset for Taipei
  // get today 00:00:00 in Taipei timezone
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  let tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  let records = await prisma.record.groupBy({
    by: ["userId"],
    _sum: {
      steps: true,
      distance: true,
      energy: true,
    },
    where: {
      timestamp: {
        gte: today,
        lt: tomorrow,
      },
    },
  });
  records = records.sort((a, b) => (b._sum.steps ?? 0) - (a._sum.steps ?? 0));
  records = records.slice(0, 10);
  records = await Promise.all(
    records.map(async (record) => {
      let user = await prisma.user.findUnique({
        where: {
          id: record.userId,
        },
        select: {
          id: true,
          name: true,
        },
      });
      return {
        ...record,
        user: user,
      };
    })
  );

  return records;
}
