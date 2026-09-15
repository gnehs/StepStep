import {
  getBearerToken,
  unauthorizedBearerResponse,
} from "@/services/api-auth";
import { syncHealthData } from "@/services/sync-api";

export async function POST(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return unauthorizedBearerResponse();
  }

  return syncHealthData(request, token);
}
