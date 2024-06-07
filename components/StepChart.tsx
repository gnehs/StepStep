import type { Record } from "@prisma/client";
import { BarChart } from "@tremor/react";
export default function StepChart({ data }: { data: Record[] }) {
  const chartData = data.map((record) => ({
    time: new Date(record.timestamp).toLocaleTimeString("zh-TW", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    步數: record.steps,
  }));
  return (
    <BarChart
      className="h-36"
      data={chartData}
      index="time"
      categories={["步數"]}
      colors={["blue"]}
      showYAxis={false}
      showLegend={false}
    />
  );
}
