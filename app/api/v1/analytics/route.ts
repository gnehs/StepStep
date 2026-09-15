import { getAnalyticsDataFromToken } from "@/services/actions/analytics";
import {
  getBearerToken,
  unauthorizedBearerResponse,
} from "@/services/api-auth";

export async function GET(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return unauthorizedBearerResponse();
  }

  const result = await getAnalyticsDataFromToken(token);
  if (!result.success) {
    return unauthorizedBearerResponse("令牌無效", true);
  }

  return Response.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
