import { getUserBySyncToken } from "@/services/actions/auth";
import prisma from "@/services/prisma";
export async function POST(request: Request) {
  const id = request.url.split("/").pop();
  const user = await getUserBySyncToken(id!);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, message: "無效的 token" }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  const data = (await request.json()) as {
    time: string[];
    step: string[];
    distance: string[];
    energy: string[];
  };
  // print peak data
  console.log("[Sync]", new Date().toLocaleString());
  console.log("time", data.time.slice(0, 5));
  console.log("step", data.step.slice(0, 5));
  console.log("distance", data.distance.slice(0, 5));
  console.log("energy", data.energy.slice(0, 5));
  console.log("user", user);
  console.log("=====================================");
  for (let i = 0; i < data.time.length; i++) {
    let time = new Date(data.time[i]);
    // set minutes and seconds to 0
    time.setMinutes(0, 0, 0);
    await prisma.record.upsert({
      where: { userId_timestamp: { userId: user.id, timestamp: time } },
      create: {
        timestamp: time,
        steps: parseInt(data.step[i]),
        distance: parseFloat(data.distance[i]),
        energy: parseFloat(data.energy[i] ?? "0"),
        userId: user.id,
      },
      update: {
        steps: parseInt(data.step[i]),
        distance: parseFloat(data.distance[i]),
        energy: parseFloat(data.energy[i] ?? "0"),
      },
    });
  }
  // update user's last sync time
  await prisma.user.update({
    where: { id: user.id },
    data: { lastSync: new Date() },
  });
  if (data.time.length > 0) {
    return new Response(`${user.name}，已同步 ${data.time.length} 筆資料`, {
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return new Response(
      `${user.name}，沒有接受到任何健康資料，請檢查來源是否正確`,
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
