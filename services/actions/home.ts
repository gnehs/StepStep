"use server";
import { findRecords, latestRecord, sumRecords } from "@/services/db";
import { getUserFromJWT } from "@/services/actions/auth";
import { getBadgeData } from "@/services/actions/badge";
export async function getHomeData(token: string) {
  let user = await getUserFromJWT(token);
  if (!user) {
    return { success: false, message: "無效的 token" };
  }
  let lastSync = latestRecord(user.id);
  // +0800 is the timezone offset for Taipei
  // get today 00:00:00 in Taipei timezone
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  let tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  let todayRecords = findRecords(user.id, today, tomorrow);
  let historyRecords = [];

  for (let i = 0; i < 7; i++) {
    let date = new Date(today);
    date.setDate(date.getDate() - i);
    let nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    let sums = sumRecords(date, nextDate, user.id);
    if (sums.steps !== null)
      historyRecords.push({
        date: date,
        ...sums,
      });
  }
  return {
    success: true,
    user,
    lastSync: lastSync?.timestamp || null,
    todayRecords,
    historyRecords,
    badges: await getBadgeData(token),
  };
}
