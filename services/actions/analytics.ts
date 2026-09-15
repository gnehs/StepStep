"use server";
import { aggregateRecords, findRecords, findUser } from "@/services/db";
import { getCurrentUser } from "@/services/session";

export type AnalyticsData = {
  aggregate: {
    _sum: { steps: number; distance: number; energy: number };
    _avg: { steps: number; distance: number; energy: number };
  };
  last30dAggregate: Record<
    string,
    Record<string, { distance: number; energy: number; steps: number }>
  >;
  last30dByDay: {
    timestamp: Date;
    distance: number;
    energy: number;
    steps: number;
  }[];
};

type AnalyticsResult =
  | { success: true; data: AnalyticsData }
  | { success: false; message: string };

/** Fetch analytics for the currently authenticated browser session. */
export async function getAnalyticsData(): Promise<AnalyticsResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "登入已失效，請重新登入。" };
  }

  return buildAnalyticsData(user.id);
}

/**
 * Fetch analytics for the external sync API. This is intentionally separate
 * from the browser-session helper because User.token is a sync credential.
 */
export async function getAnalyticsDataFromToken(token: string) {
  const user = findUser("token", token);
  if (!user) {
    return { success: false as const, message: "無效的 token" };
  }

  return buildAnalyticsData(user.id);
}

async function buildAnalyticsData(userId: string): Promise<AnalyticsResult> {
  const aggregateRow = aggregateRecords(userId);
  const aggregate = {
    _sum: {
      steps: aggregateRow._sum.steps ?? 0,
      distance: aggregateRow._sum.distance ?? 0,
      energy: aggregateRow._sum.energy ?? 0,
    },
    _avg: {
      steps: aggregateRow._avg.steps ?? 0,
      distance: aggregateRow._avg.distance ?? 0,
      energy: aggregateRow._avg.energy ?? 0,
    },
  };

  // 30d by hours & week by days
  const last30d = new Date();
  last30d.setDate(last30d.getDate() - 30);
  const last30dData = findRecords(userId, last30d);
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  const hours = Array.from(
    { length: 24 },
    (_, i) => i.toString().padStart(2, "0") + ":00",
  );
  const last30dAggregate = {} as AnalyticsData["last30dAggregate"];

  for (const day of weekDays) {
    last30dAggregate[day] = {};
    for (const hour of hours) {
      const filteredData = last30dData.filter((record) => {
        const recordDay = record.timestamp.getDay();
        const recordHour = record.timestamp.getHours();
        return weekDays[recordDay] === day && hours[recordHour] === hour;
      });
      const reducedData = filteredData.reduce(
        (acc, record) => ({
          distance: acc.distance + record.distance,
          energy: acc.energy + record.energy,
          steps: acc.steps + record.steps,
        }),
        { distance: 0, energy: 0, steps: 0 },
      );
      const count = filteredData.length || 1;
      last30dAggregate[day][hour] = {
        distance: reducedData.distance / count,
        energy: reducedData.energy / count,
        steps: reducedData.steps / count,
      };
    }
  }

  // 30d by day
  const last30dByDay: AnalyticsData["last30dByDay"] = [];

  // Group records by local calendar day. This keeps the existing Taipei-local
  // display semantics while avoiding null/NaN values when a day has no data.
  for (let i = 0; i < 30; i++) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const filteredData = last30dData.filter(
      (record) => record.timestamp.toDateString() === day.toDateString(),
    );
    const reducedData = filteredData.reduce(
      (acc, record) => ({
        distance: acc.distance + record.distance,
        energy: acc.energy + record.energy,
        steps: acc.steps + record.steps,
      }),
      { distance: 0, energy: 0, steps: 0 },
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
