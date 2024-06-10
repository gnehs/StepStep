"use client";
import Container from "@/components/Container";
import SectionTitle from "@/components/SectionTitle";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { Footprints, Flame, Compass, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import Link from "next/link";
import { getAnalyticsData } from "@/services/actions/analytics";
import { BarChart } from "@tremor/react";
import StatItem from "@/components/StatItem";
import Loader from "@/components/Loader";
function HeatMap30d({ data }: { data: any }) {
  const parsedData = [];

  for (let time of Object.keys(Object.values(data)[0] as any)) {
    let res = {
      id: time,
      data: [] as {
        x: string;
        y: number;
      }[],
    };
    for (let day of Object.keys(data)) {
      res.data.push({
        x: day,
        y: data[day][time].distance,
      });
    }
    parsedData.push(res);
  }
  const maxVal = Math.max(
    ...parsedData.map((x) => x.data.map((y) => y.y)).flat(99),
  );
  return (
    <ResponsiveHeatMap
      data={parsedData as any}
      margin={{ top: 20, right: 0, bottom: 0, left: 40 }}
      valueFormat={(value: number) => `${value.toFixed(3)} 公里`}
      xInnerPadding={0.025}
      xOuterPadding={0.05}
      yInnerPadding={0.05}
      yOuterPadding={0.05}
      borderRadius={2}
      label={(d) => `${d.value!.toFixed(1)} km`}
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
        maxValue: maxVal * 2,
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
export default function HistoryPage() {
  const [token] = useLocalStorage("token", "");
  const [res, setRes] = useState<any>(null);
  useEffect(() => {
    async function getData() {
      if (token === "") return;
      let res = await getAnalyticsData(token);
      if (res.success) {
        setRes(res.data);
      }
    }
    getData();
  }, [token]);
  const customTooltip = (props: any) => {
    const { payload, active } = props;
    if (!active || !payload) return null;
    return (
      <div className="w-30 dark:glass-effect z-10 rounded-xl bg-white text-tremor-default tabular-nums shadow-lg dark:bg-primary-950/50 dark:text-white">
        {payload.map((category: any, idx: string) => (
          <div key={idx}>
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
  };

  return (
    <Container>
      <div className="mb-3 grid grid-cols-3 items-center gap-2 py-2">
        <Link
          href="/"
          className="flex items-center gap-1 text-blue-500 dark:text-blue-300"
        >
          <ChevronLeft size={24} />
          返回
        </Link>
        <div className="text-center font-semibold">踏踏分析</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <SectionTitle>踏踏總計</SectionTitle>
          <StatItem
            Icon={Footprints}
            title="總踏踏"
            value={
              res
                ? (res.aggregate._sum.steps / 10_000).toLocaleString("zh-TW", {
                    maximumFractionDigits: 2,
                  })
                : "0"
            }
            unit="萬步"
          />
          <StatItem
            Icon={Compass}
            title="總距離"
            value={
              res?.aggregate._sum.distance.toLocaleString("zh-TW", {
                maximumFractionDigits: 2,
              }) ?? 0
            }
            unit="公里"
          />
          <StatItem
            Icon={Flame}
            title="總動態能量"
            value={
              res?.aggregate._sum.energy.toLocaleString("zh-TW", {
                maximumFractionDigits: 0,
              }) ?? 0
            }
            unit="大卡"
          />
        </div>
        <div>
          <SectionTitle>踏踏平均</SectionTitle>
          <StatItem
            Icon={Footprints}
            title="每小時踏踏"
            value={
              res?.aggregate._avg.steps.toLocaleString("zh-TW", {
                maximumFractionDigits: 2,
              }) ?? 0
            }
            unit="步"
          />
          <StatItem
            Icon={Compass}
            title="每小時距離"
            value={
              res?.aggregate._avg.distance.toLocaleString("zh-TW", {
                maximumFractionDigits: 2,
              }) ?? 0
            }
            unit="公里"
          />
          <StatItem
            Icon={Flame}
            title="每小時動態能量"
            value={
              res?.aggregate._avg.energy.toLocaleString("zh-TW", {
                maximumFractionDigits: 2,
              }) ?? 0
            }
            unit="大卡"
          />
        </div>
      </div>
      {res === null && <Loader />}
      {res !== null && (
        <>
          <div className="mb-6 text-sm text-gray-600 dark:text-white/40">
            你已經在餅餅踏踏上累計了{" "}
            {res.aggregate._sum.distance.toLocaleString("zh-TW", {
              maximumFractionDigits: 2,
            })}{" "}
            公里的步步資料，大概是{" "}
            {(res.aggregate._sum.distance / 352.3).toLocaleString("zh-TW", {
              maximumFractionDigits: 1,
            })}{" "}
            趟台北高雄來回的距離。
          </div>
          <SectionTitle>過去三十日步數</SectionTitle>
          <div className="dark:glass-effect my-2 mb-6 w-full rounded-lg bg-white p-2 shadow-sm dark:bg-black/5">
            <BarChart
              className="h-72"
              data={res.last30dByDay
                .map((d: any) => ({
                  date: new Date(d.timestamp).toLocaleDateString("zh-TW", {
                    month: "numeric",
                    day: "2-digit",
                  }),
                  步數: d.steps,
                  ...d,
                }))
                .reverse()}
              index="date"
              categories={["步數"]}
              colors={["blue"]}
              customTooltip={customTooltip}
              showYAxis={false}
              showLegend={false}
            />
          </div>
          <SectionTitle>過去三十日踏踏時間分布圖</SectionTitle>
          <div className="dark:glass-effect my-2 h-[730px] w-full rounded-lg bg-white p-2 shadow-sm dark:bg-black/5">
            <HeatMap30d data={res.last30dAggregate} />
          </div>
        </>
      )}
    </Container>
  );
}
