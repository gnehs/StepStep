"use server";
import prisma from "@/services/prisma";
export async function getRank() {
  try {
    // +0800 is the timezone offset for Taipei
    // get today 00:00:00 in Taipei timezone
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let historyRecords = [];
    for (let i = 0; i < 7; i++) {
      let date = new Date(today);
      date.setDate(date.getDate() - i);
      let nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      let records = await prisma.record.groupBy({
        by: ["userId"],
        _sum: {
          steps: true,
          distance: true,
          energy: true,
        },
        where: {
          timestamp: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      records = records.sort(
        (a, b) => (b._sum.steps ?? 0) - (a._sum.steps ?? 0)
      );
      records = records.slice(0, 10);
      let parsedRecords = await Promise.all(
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
            ...record._sum,
            user,
          };
        })
      );
      historyRecords.push({
        date,
        records: parsedRecords,
      });
    }

    return historyRecords;
  } catch (e) {
    return [];
  }
}
