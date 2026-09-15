"use client";

import { ResponsiveHeatMap } from "@nivo/heatmap";
import { BarChart } from "@tremor/react";
import type { AnalyticsData } from "@/services/actions/analytics";
import SectionTitle from "@/components/SectionTitle";

type ChartData = {
  last30dAggregate: AnalyticsData["last30dAggregate"];
  last30dByDay: Array<
    Omit<AnalyticsData["last30dByDay"][number], "timestamp"> & {
      timestamp: number;
    }
  >;
};

function HeatMap30d({ data }: { data: AnalyticsData["last30dAggregate"] }) {
  const parsedData = [];

  for (const time of Object.keys(Object.values(data)[0] as object)) {
    const result = {
      id: time,
      data: [] as { x: string; y: number }[],
    };
    for (const day of Object.keys(data)) {
      result.data.push({
        x: day,
        y: data[day][time].distance,
      });
    }
    parsedData.push(result);
  }

  const maxVal = Math.max(
    ...parsedData.map((item) => item.data.map((cell) => cell.y)).flat(99),
  );

  return (
    <ResponsiveHeatMap
      data={parsedData as never}
      margin={{ top: 20, right: 0, bottom: 0, left: 40 }}
      valueFormat={(value: number) => `${value.toFixed(3)} 公里`}
      xInnerPadding={0.025}
      xOuterPadding={0.05}
      yInnerPadding={0.05}
      yOuterPadding={0.05}
      borderRadius={2}
      label={(cell) => `${cell.value!.toFixed(1)} km`}
      axisTop={{
        tickSize: 5,
        tickPadding: 5,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 2,
      }}
      theme={{
        text: {
          fill: "currentColor",
        },
      }}
      colors={{
        type: "sequential",
        scheme: "blue_purple",
        maxValue: Math.max(maxVal * 2, 1),
      }}
      labelTextColor="#333"
      tooltip={({ cell }) => (
        <div className="dark:glass-effect rounded-xl bg-white px-2 py-1 text-sm shadow-lg dark:bg-primary-950/50 dark:text-white">
          <span className="mr-1 opacity-75">
            週{cell.data.x} {cell.serieId}
          </span>
          <span>{cell.value?.toFixed(2)} 公里</span>
        </div>
      )}
    />
  );
}

function AnalyticsTooltip({ payload, active }: { payload?: any[]; active?: boolean }) {
  if (!active || !payload) return null;

  return (
    <div className="w-30 dark:glass-effect z-10 rounded-xl bg-white text-tremor-default tabular-nums shadow-lg dark:bg-primary-950/50 dark:text-white">
      {payload.map((category, index) => (
        <div key={index}>
          <div className="border-b border-tremor-border/10 p-1 px-3 font-bold">
            {category.payload.date}
          </div>
          <div className="p-1 px-3">
            <p className="font-medium">
              {category.value.toLocaleString()}{" "}
              <span className="text-xs font-normal opacity-50">步</span>
            </p>
            <p className="font-medium">
              {category.payload.distance.toLocaleString("zh-TW", {
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-xs font-normal opacity-50">公里</span>
            </p>
            <p className="font-medium">
              {category.payload.energy.toLocaleString("zh-TW", {
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-xs font-normal opacity-50">大卡</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsCharts({ data }: { data: ChartData }) {
  return (
    <>
      <SectionTitle>過去三十日步數</SectionTitle>
      <div className="dark:glass-effect my-2 mb-4 w-full rounded-lg bg-white p-2 shadow-sm dark:bg-black/5">
        <BarChart
          className="h-72"
          data={data.last30dByDay
            .map((item) => ({
              date: new Date(item.timestamp).toLocaleDateString("zh-TW", {
                month: "numeric",
                day: "2-digit",
              }),
              步數: item.steps,
              ...item,
            }))
            .reverse()}
          index="date"
          categories={["步數"]}
          colors={["blue"]}
          customTooltip={AnalyticsTooltip}
          showYAxis={false}
          showLegend={false}
        />
      </div>
      <SectionTitle>過去三十日踏踏時間分布圖</SectionTitle>
      <div className="dark:glass-effect my-2 h-[730px] w-full rounded-lg bg-white p-2 shadow-sm dark:bg-black/5">
        <HeatMap30d data={data.last30dAggregate} />
      </div>
    </>
  );
}
