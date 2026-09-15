import { unauthorizedBearerResponse } from "@/services/api-auth";
import { syncHealthData } from "@/services/sync-api";

type LegacyRouteContext = {
  params: Promise<{ token: string }>;
};

/**
 * Compatibility endpoint for shortcuts installed before header auth.
 *
 * Keep this route only for migration: path tokens can be copied to access
 * logs, browser history, and analytics systems. New clients must use
 * /api/v1/sync with Authorization: Bearer <sync token>.
 */
export async function POST(request: Request, { params }: LegacyRouteContext) {
  const { token } = await params;

  if (!token) {
    return unauthorizedBearerResponse();
  }

  return syncHealthData(request, token, { legacy: true });
}
