"use server";
import { rankRecords } from "@/services/db";
export async function getRank(year?: number, month?: number) {
  if (!year) year = new Date().getFullYear();
  if (!month) month = new Date().getMonth() + 1;

  // +0800 is the timezone offset for Taipei
  // get today 00:00:00 in Taipei timezone
  const numDays = (y: number, m: number) => new Date(y, m, 0).getDate();
  let dates = Array.from({ length: numDays(year, month) }, (_, i) => i + 1);

  const historyRecords = await Promise.all(
    dates.map(async (date) => ({
      date: new Date(year, month - 1, date),
      records: await getRankByDay(year, month, date),
    })),
  );

  return historyRecords;
}
export async function getRankByDay(year: number, month: number, date: number) {
  let gte = new Date(year, month - 1, date);
  let lt = new Date(year, month - 1, date + 1);
  return rankRecords(gte, lt).map(({ steps, distance, energy, id, name }) => ({
    steps, distance, energy, user: { id, name },
  }));
}
