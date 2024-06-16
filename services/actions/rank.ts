"use server";
import prisma from "@/services/prisma";
export async function getRank(year?: number, month?: number) {
  if (!year) year = new Date().getFullYear();
  if (!month) month = new Date().getMonth() + 1;

  // +0800 is the timezone offset for Taipei
  // get today 00:00:00 in Taipei timezone
  const numDays = (y: number, m: number) => new Date(y, m, 0).getDate();
  let dates = Array.from({ length: numDays(year, month) }, (_, i) => i + 1);

  let historyRecords = [];
  for (let date of dates) {
    historyRecords.push({
      date: new Date(year, month - 1, date),
      records: await getRankByDay(year, month, date),
    });
  }

  return historyRecords;
}
export async function getRankByDay(year: number, month: number, date: number) {
  let gte = new Date(year, month - 1, date);
  let lt = new Date(year, month - 1, date + 1);
  let records = await prisma.record.groupBy({
    by: ["userId"],
    _sum: {
      steps: true,
      distance: true,
      energy: true,
    },
    where: {
      timestamp: {
        gte,
        lt,
      },
    },
  });
  records = records.sort(
    (a, b) => (b._sum.distance ?? 0) - (a._sum.distance ?? 0),
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
    }),
  );
  return parsedRecords;
}
