import { getUserBySyncToken } from "@/services/actions/auth";
import { checkAndGiveBadge } from "@/services/actions/badge";
import { transaction, updateUserRow, upsertRecord } from "@/services/db";
export async function POST(request: Request) {
  const id = request.url.split("/").pop();
  const user = await getUserBySyncToken(id!);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, message: "令牌無效" }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  const data = (await request.json()) as {
    time: string[];
    step: string[];
    distance: string[];
    energy: string[];
  };
  if (!Array.isArray(data.time) || !Array.isArray(data.step) || !Array.isArray(data.distance) ||
      data.time.length !== data.step.length || data.time.length !== data.distance.length ||
      (data.energy && (!Array.isArray(data.energy) || data.energy.length !== data.time.length))) {
    return Response.json({ success: false, message: "資料格式無效" }, { status: 400 });
  }
  const records = data.time.map((value, i) => {
    const time = new Date(value);
    time.setMinutes(0, 0, 0);
    const steps = Number.parseInt(data.step[i], 10);
    const distance = Number.parseFloat(data.distance[i]);
    const energy = Number.parseFloat(data.energy?.[i] ?? "0");
    return { time, steps, distance, energy };
  });
  if (records.some(({ time, steps, distance, energy }) => Number.isNaN(time.getTime()) ||
      !Number.isFinite(steps) || !Number.isFinite(distance) || !Number.isFinite(energy))) {
    return Response.json({ success: false, message: "資料格式無效" }, { status: 400 });
  }
  transaction(() => {
    for (const record of records) upsertRecord(user.id, record.time, record.steps, record.distance, record.energy);
    updateUserRow(user.id, "lastSync", new Date());
  });
  await checkAndGiveBadge({ id: user.id });
  if (data.time.length > 0) {
    return new Response(`${user.name}，已同步 ${data.time.length} 筆資料`, {
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return new Response(
      `${user.name}，沒有接受到任何健康資料，請檢查來源是否正確`,
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
