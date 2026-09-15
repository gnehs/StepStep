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
  const days = Object.keys(data);
  const timeSlots = days.length > 0 ? Object.keys(data[days[0]] ?? {}) : [];

  if (days.length === 0 || timeSlots.length === 0) {
    return (
      <div
        role="status"
        className="flex min-h-64 items-center justify-center rounded-2xl bg-primary-50 p-6 text-center text-sm text-primary-700 dark:bg-primary-800/50 dark:text-primary-100"
      >
        目前尚無足夠的時段資料
      </div>
    );
  }

  const parsedData: Array<{
    id: string;
    data: Array<{ x: string; y: number }>;
  }> = [];

  for (const time of timeSlots) {
    const result = {
      id: time,
      data: [] as { x: string; y: number }[],
    };
    for (const day of days) {
      result.data.push({
        x: day,
        y: data[day]?.[time]?.distance ?? 0,
      });
    }
    parsedData.push(result);
  }

  const values = parsedData.flatMap((item) => item.data.map((cell) => cell.y));
  const maxVal = values.length > 0 ? Math.max(...values) : 0;

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
        <div className="surface-card px-3 py-2 text-sm dark:text-white">
          <span className="mr-1 opacity-75">
            週{cell.data.x} {cell.serieId}
          </span>
          <span>{cell.value?.toFixed(2)} 公里</span>
        </div>
      )}
    />
  );
}

function AnalyticsTooltip({
  payload,
  active,
}: {
  payload?: any[];
  active?: boolean;
}) {
  if (!active || !payload) return null;

  return (
    <div className="surface-card z-10 w-30 text-tremor-default tabular-nums dark:text-white">
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
      <div
        className="surface-card my-3 mb-5 w-full p-3 sm:p-4"
        role="group"
        aria-label="過去三十日步數圖"
      >
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
      <div
        className="surface-card my-3 h-[730px] w-full p-3 sm:p-4"
        role="group"
        aria-label="過去三十日踏踏時間分布圖"
      >
        <HeatMap30d data={data.last30dAggregate} />
      </div>
    </>
  );
}
