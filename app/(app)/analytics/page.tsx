import Container from "@/components/Container";
import SectionTitle from "@/components/SectionTitle";
import { Footprints, Flame, Compass, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { getAnalyticsData } from "@/services/actions/analytics";
import { redirect } from "next/navigation";
import StatItem from "@/components/StatItem";
import AnalyticsCharts from "./AnalyticsCharts";

export default async function HistoryPage() {
  const response = await getAnalyticsData();
  if (!response.success) redirect("/login");

  const { aggregate, last30dAggregate, last30dByDay } = response.data;
  const chartData = {
    last30dAggregate,
    last30dByDay: last30dByDay.map(({ timestamp, ...item }) => ({
      ...item,
      timestamp: timestamp.getTime(),
    })),
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
      <div className="mb-2 grid grid-cols-2 gap-2">
        <div>
          <SectionTitle>踏踏總計</SectionTitle>
          <StatItem
            Icon={Footprints}
            title="總踏踏"
            value={(aggregate._sum.steps / 10_000).toLocaleString("zh-TW", {
              maximumFractionDigits: 2,
            })}
            unit="萬步"
          />
          <StatItem
            Icon={Compass}
            title="總距離"
            value={aggregate._sum.distance.toLocaleString("zh-TW", {
              maximumFractionDigits: 2,
            })}
            unit="公里"
          />
          <StatItem
            Icon={Flame}
            title="總動態能量"
            value={aggregate._sum.energy.toLocaleString("zh-TW", {
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
            value={aggregate._avg.steps.toLocaleString("zh-TW", {
              maximumFractionDigits: 2,
            })}
            unit="步"
          />
          <StatItem
            Icon={Compass}
            title="每小時距離"
            value={aggregate._avg.distance.toLocaleString("zh-TW", {
              maximumFractionDigits: 2,
            })}
            unit="公里"
          />
          <StatItem
            Icon={Flame}
            title="每小時動態能量"
            value={aggregate._avg.energy.toLocaleString("zh-TW", {
              maximumFractionDigits: 2,
            })}
            unit="大卡"
          />
        </div>
      </div>
      <AnalyticsCharts data={chartData} />
    </Container>
  );
}
