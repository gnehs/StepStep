import { getRankByDay } from "@/services/actions/rank";
import type { NextRequest } from "next/server";
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  // chcek date is YYYY-MM-DD format
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Response("Invalid date", { status: 400 });
  }
  const splitDate = date.split("-").map(Number);
  const rank = await getRankByDay(splitDate[0], splitDate[1], splitDate[2]);
  return new Response(JSON.stringify(rank), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
