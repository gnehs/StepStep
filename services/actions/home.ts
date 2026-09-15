"use server";
import { findBadges, findRecords, sumRecords } from "@/services/db";
import { getCurrentUser } from "@/services/session";

export async function getHomeData() {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false as const, message: "登入已失效，請重新登入。" };
  }

  // +0800 is the timezone offset for Taipei
  // get today 00:00:00 in Taipei timezone
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayRecords = findRecords(user.id, today, tomorrow);
  const historyRecords = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const sums = sumRecords(date, nextDate, user.id);
    if (sums.steps !== null)
      historyRecords.push({
        date: date,
        ...sums,
      });
  }

  return {
    success: true as const,
    todayRecords,
    historyRecords,
    // Only the fields used by the home page are returned. In particular, the
    // user's password and external sync token never cross the RSC boundary.
    badges: findBadges(user.id),
  };
}
