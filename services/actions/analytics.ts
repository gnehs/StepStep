"use server";
import prisma from "@/services/prisma";
import { getUserFromJWT } from "@/services/actions/auth";

export async function getAnalyticsDataFromJWT(token: string) {
  let user = await getUserFromJWT(token);
  if (!user) {
    return { success: false, message: "無效的 token" };
  }
  return await getAnalyticsData(user.id);
}
export async function getAnalyticsDataFromToken(token: string) {
  let user = await prisma.user.findFirst({
    where: {
      token: token,
    },
  });
  if (!user) {
    return { success: false, message: "無效的 token" };
  }
  return await getAnalyticsData(user.id);
}

export async function getAnalyticsData(userId: string) {
  let aggregate = await prisma.record.aggregate({
    where: { userId: userId },
    _sum: { distance: true, energy: true, steps: true },
    _avg: { distance: true, energy: true, steps: true },
  });
  // 30d by hours & week by days
  let last30d = new Date();
  last30d.setDate(last30d.getDate() - 30);
  let last30dData = await prisma.record.findMany({
    where: {
      userId: userId,
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
        (acc, record) => ({
          distance: (acc.distance ?? 0) + record.distance,
          energy: (acc.energy ?? 0) + record.energy,
          steps: (acc.steps ?? 0) + record.steps,
        }),
        {} as Record<string, number>,
      );
      last30dAggregate[day][hour] = {
        distance: reducedData.distance / filteredData.length,
        energy: reducedData.energy / filteredData.length,
        steps: reducedData.steps / filteredData.length,
      };
    }
  }
  // 30d by day
  let last30dByDay = [] as {
    timestamp: Date;
    distance: number;
    energy: number;
    steps: number;
  }[];
  // group by day
  for (let i = 0; i < 30; i++) {
    let day = new Date();
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    let filteredData = last30dData.filter(
      (record) => record.timestamp.toDateString() === day.toDateString(),
    );
    let reducedData = filteredData.reduce(
      (acc, record) => ({
        distance: (acc.distance ?? 0) + record.distance,
        energy: (acc.energy ?? 0) + record.energy,
        steps: (acc.steps ?? 0) + record.steps,
      }),
      {} as Record<string, number>,
    );
    last30dByDay.push({
      timestamp: day,
      distance: reducedData.distance,
      energy: reducedData.energy,
      steps: reducedData.steps,
    });
  }

  return { success: true, data: { aggregate, last30dAggregate, last30dByDay } };
}
