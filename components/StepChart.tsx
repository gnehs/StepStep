import { ResponsiveBar } from "@nivo/bar";
import type { Record } from "@prisma/client";
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
    <ResponsiveBar
      data={chartData}
      keys={["步數"]}
      indexBy="time"
      margin={{ top: 30, right: 0, bottom: 0, left: 0 }}
      indexScale={{ type: "band", round: true }}
      enableGridY={false}
      enableLabel={false}
      ariaLabel="Steps bar chart"
      enableTotals
      valueFormat={(val) => val.toLocaleString()}
      tooltip={({ indexValue, value }) => (
        <div className="rounded-xl bg-white px-2 py-1 text-sm shadow-lg">
          <span className="mr-1 text-gray-500"> {indexValue}</span>
          <span className="text-gray-700"> {value.toLocaleString()} 步</span>
        </div>
      )}
    />
  );
}