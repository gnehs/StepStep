import "server-only";

import { checkAndGiveBadge } from "@/services/actions/badge";
import { getUserBySyncToken } from "@/services/actions/auth";
import { transaction, updateUserRow, upsertRecord } from "@/services/db";
import { unauthorizedBearerResponse } from "@/services/api-auth";

type SyncPayload = {
  time?: unknown;
  step?: unknown;
  distance?: unknown;
  energy?: unknown;
};

type SyncEndpointOptions = {
  legacy?: boolean;
};

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function responseHeaders(
  options: SyncEndpointOptions,
  contentType: "json" | "text",
) {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type":
      contentType === "json" ? "application/json" : "text/plain; charset=utf-8",
  });
  if (options.legacy) {
    headers.set("Deprecation", "true");
    headers.set("Link", '</api/v1/sync>; rel="successor-version"');
  }
  return headers;
}

export async function syncHealthData(
  request: Request,
  token: string,
  options: SyncEndpointOptions = {},
) {
  const user = await getUserBySyncToken(token);
  if (!user) {
    if (options.legacy) {
      return new Response(
        JSON.stringify({ success: false, message: "令牌無效" }),
        { headers: responseHeaders(options, "json") },
      );
    }

    const response = unauthorizedBearerResponse("令牌無效", true);
    return response;
  }

  let data: SyncPayload;
  try {
    data = (await request.json()) as SyncPayload;
  } catch {
    return Response.json(
      { success: false, message: "資料格式無效" },
      { status: 400, headers: responseHeaders(options, "json") },
    );
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return Response.json(
      { success: false, message: "資料格式無效" },
      { status: 400, headers: responseHeaders(options, "json") },
    );
  }

  const { time, step, distance, energy } = data;
  const energyValues = isArray(energy) ? energy : [];
  if (
    !isArray(time) ||
    !isArray(step) ||
    !isArray(distance) ||
    // Keep the legacy truthiness check: omitted/null/empty scalar energy was
    // treated as zero by the original endpoint, while a supplied array must
    // still line up with the required samples.
    (energy && (!isArray(energy) || energy.length !== time.length)) ||
    time.length !== step.length ||
    time.length !== distance.length
  ) {
    return Response.json(
      { success: false, message: "資料格式無效" },
      { status: 400, headers: responseHeaders(options, "json") },
    );
  }

  const records = time.map((value, index) => {
    // The old endpoint passed JSON values directly to Date/parse*; retaining
    // that coercion keeps existing Shortcut payloads compatible (some send
    // numbers rather than strings).
    const timestamp = new Date(value as string | number);
    timestamp.setMinutes(0, 0, 0);
    const steps = Number.parseInt(step[index] as string, 10);
    const recordDistance = Number.parseFloat(distance[index] as string);
    const recordEnergy = Number.parseFloat(
      (energyValues[index] ?? "0") as string,
    );
    return {
      time: timestamp,
      steps,
      distance: recordDistance,
      energy: recordEnergy,
    };
  });

  if (
    records.some(
      ({ time: timestamp, steps, distance: recordDistance, energy: recordEnergy }) =>
        Number.isNaN(timestamp.getTime()) ||
        !Number.isFinite(steps) ||
        !Number.isFinite(recordDistance) ||
        !Number.isFinite(recordEnergy),
    )
  ) {
    return Response.json(
      { success: false, message: "資料格式無效" },
      { status: 400, headers: responseHeaders(options, "json") },
    );
  }

  transaction(() => {
    for (const record of records) {
      upsertRecord(
        user.id,
        record.time,
        record.steps,
        record.distance,
        record.energy,
      );
    }
    updateUserRow(user.id, "lastSync", new Date());
  });
  await checkAndGiveBadge({ id: user.id });

  const message =
    time.length > 0
      ? `${user.name}，已同步 ${time.length} 筆資料`
      : `${user.name}，沒有接受到任何健康資料，請檢查來源是否正確`;

  return new Response(
    message,
    {
      // Keep the legacy response's historical JSON content type for existing
      // shortcuts; the canonical endpoint returns correctly labelled text.
      headers: responseHeaders(options, options.legacy ? "json" : "text"),
    },
  );
}
