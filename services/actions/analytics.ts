"use server";
import prisma from "@/services/prisma";
import { getUserFromJWT } from "@/services/actions/auth";
export async function getAnalyticsData(token: string) {
  let user = await getUserFromJWT(token);
  if (!user) {
    return { success: false, message: "無效的 token" };
  }
  let aggregate = await prisma.record.aggregate({
    where: { userId: user.id },
    _sum: { distance: true, energy: true, steps: true },
    _avg: { distance: true, energy: true, steps: true },
  });
  // 30d by hours & week by days
  let last30d = new Date();
  last30d.setDate(last30d.getDate() - 30);
  let last30dData = await prisma.record.findMany({
    where: {
      userId: user.id,
      timestamp: {
        gte: last30d,
      },
    },
  });
  let weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  let hours = Array.from(
    { length: 24 },
    (_, i) => i.toString().padStart(2, "0") + ":00",
  );
  let last30dAggregate = {} as Record<
    string,
    Record<string, Record<string, number>>
  >;

  for (let day of weekDays) {
    for (let hour of hours) {
      if (!last30dAggregate[day]) last30dAggregate[day] = {};
      let filteredData = last30dData.filter((record) => {
        let recordDay = record.timestamp.getDay();
        let recordHour = record.timestamp.getHours();
        return weekDays[recordDay] === day && hours[recordHour] === hour;
      });
      let reducedData = filteredData.reduce(
        (acc, record) => {
          return {
            distance: (acc.distance ?? 0) + record.distance,
            energy: (acc.energy ?? 0) + record.energy,
            steps: (acc.steps ?? 0) + record.steps,
          };
        },
        {} as Record<string, number>,
      );
      last30dAggregate[day][hour] = {
        distance: reducedData.distance / filteredData.length,
        energy: reducedData.energy / filteredData.length,
        steps: reducedData.steps / filteredData.length,
      };
    }
  }

  return { success: true, data: { aggregate, last30dAggregate } };
}
