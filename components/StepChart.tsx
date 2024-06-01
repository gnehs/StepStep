import { ResponsiveBar } from "@nivo/bar";
import type { Record } from "@prisma/client";
export default function StepChart({ data }: { data: Record[] }) {
  const chartData = data.map((record) => ({
    time: new Date(record.timestamp).toLocaleTimeString("zh-TW", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    steps: record.steps,
    stepsColor: "rgb(17,17,17)",
  }));

  return (
    <>
      <ResponsiveBar
        data={chartData}
        keys={["steps"]}
        indexBy="time"
        margin={{ top: 30, right: 0, bottom: 0, left: 0 }}
        padding={0.3}
        valueScale={{ type: "linear" }}
        indexScale={{ type: "band", round: true }}
        axisTop={null}
        axisRight={null}
        axisBottom={null}
        axisLeft={null}
        enableGridY={false}
        enableLabel={false}
        legends={[]}
        role="application"
        ariaLabel="Steps bar chart"
        isInteractive={false}
        enableTotals
      />
    </>
  );
}
