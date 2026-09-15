import { getRankByDay } from "@/services/actions/rank";
export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date");
  // The date is public query data, unlike bearer credentials, so it may remain
  // in the URL. Keep the existing response contract for invalid dates.
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
