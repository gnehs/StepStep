import { getAnalyticsDataFromToken } from "@/services/actions/analytics";
import type { NextRequest } from "next/server";
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return new Response("Invalid token", { status: 400 });
  }
  const result = await getAnalyticsDataFromToken(token);
  return new Response(JSON.stringify(result), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
