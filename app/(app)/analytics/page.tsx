"use client";
import Container from "@/components/Container";
import SectionTitle from "@/components/SectionTitle";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { Footprints, Flame, Compass, Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { getAnalyticsData } from "@/services/actions/analytics";
import StatItem from "@/components/StatItem";
function HeatMap30d({ data }: { data: any }) {
  const parsedData = [];

  for (let time of Object.keys(Object.values(data)[0] as any)) {
    let res = {
      id: time,
      data: [] as {
        x: string;
        y: string;
      }[],
    };
    for (let day of Object.keys(data)) {
      console.log(data[day][time]);
      res.data.push({
        x: day,
        y: data[day][time].distance,
      });
    }
    parsedData.push(res);
  }
  return (
    <ResponsiveHeatMap
      data={parsedData as any}
      margin={{ top: 20, right: 0, bottom: 0, left: 36 }}
      valueFormat={(value: number) => `${value.toFixed(3)} 公里`}
      label={(d) => `${d.value!.toFixed(1)} km`}
      axisTop={{
        tickSize: 5,
        tickPadding: 5,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 0,
      }}
      colors={{ type: "sequential", scheme: "blues", minValue: -0.25 }}
      labelTextColor="#fff"
      tooltip={({ cell }) => (
        <div className="rounded-xl bg-white px-2 py-1 text-sm shadow-lg">
          <span className="mr-1 text-gray-500">
            {cell.data.x} - {cell.serieId}
          </span>
          <span className="text-gray-700">{cell.value?.toFixed(2)} km</span>
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
  return (
    <Container>
      <div className="mb-3 grid grid-cols-3 items-center gap-2 py-2">
        <Link href="/" className="flex items-center gap-1 text-blue-500">
          <ChevronLeft size={24} />
          返回
        </Link>
        <div className="text-center font-semibold">踏踏分析</div>
      </div>
      {res === null && (
        <Loader size={32} className="mx-auto my-10 animate-spin opacity-20" />
      )}
      {res !== null && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <SectionTitle>踏踏總計</SectionTitle>
              <StatItem
                Icon={Footprints}
                title="總踏踏"
                value={(res.aggregate._sum.steps / 10_000).toLocaleString(
                  "zh-TW",
                  {
                    maximumFractionDigits: 2,
                  },
                )}
                unit="萬步"
              />
              <StatItem
                Icon={Compass}
                title="總距離"
                value={res.aggregate._sum.distance.toLocaleString("zh-TW", {
                  maximumFractionDigits: 2,
                })}
                unit="公里"
              />
              <StatItem
                Icon={Flame}
                title="總動態能量"
                value={res.aggregate._sum.energy.toLocaleString("zh-TW", {
                  maximumFractionDigits: 0,
                })}
                unit="大卡"
              />
            </div>
            <div>
              <SectionTitle>踏踏平均</SectionTitle>
              <StatItem
                Icon={Footprints}
                title="每小時踏踏"
                value={res.aggregate._avg.steps.toLocaleString("zh-TW", {
                  maximumFractionDigits: 2,
                })}
                unit="步"
              />
              <StatItem
                Icon={Compass}
                title="每小時距離"
                value={res.aggregate._avg.distance.toLocaleString("zh-TW", {
                  maximumFractionDigits: 2,
                })}
                unit="公里"
              />
              <StatItem
                Icon={Flame}
                title="每小時動態能量"
                value={res.aggregate._avg.energy.toLocaleString("zh-TW", {
                  maximumFractionDigits: 2,
                })}
                unit="大卡"
              />
            </div>
          </div>
          <div className="mb-6 text-sm text-gray-600">
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
          <SectionTitle>過去三十日踏踏時間分布圖</SectionTitle>
          <div className="my-2 h-[800px] w-full rounded-lg bg-white p-2 shadow-sm">
            <HeatMap30d data={res.last30dAggregate} />
          </div>
        </>
      )}
    </Container>
  );
}
