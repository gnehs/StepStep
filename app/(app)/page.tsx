"use client";
import Container from "@/components/Container";
import PageTitle from "@/components/PageTitle";
import SectionTitle from "@/components/SectionTitle";
import { getHomeData } from "@/services/actions/home";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import type { Record } from "@prisma/client";
import { Footprints, Flame, Compass, Info, BarChart3 } from "lucide-react";
import StatItem from "@/components/StatItem";
import StepChart from "@/components/StepChart";
import Link from "next/link";
export default function Home() {
  const [token] = useLocalStorage("token", "");
  const [today, setToday] = useState<Record[]>([]);
  const [history, setHistory] = useState<
    {
      steps: number | null;
      distance: number | null;
      energy: number | null;
      date: Date;
    }[]
  >([]);
  const steps = today.reduce((acc, cur) => acc + cur.steps, 0);
  const distance = today.reduce((acc, cur) => acc + cur.distance, 0);
  const energy = today.reduce((acc, cur) => acc + cur.energy, 0);
  useEffect(() => {
    async function getData() {
      if (token === "") return;
      let res = await getHomeData(token);
      if (res.success) {
        setToday(res.todayRecords!);
        setHistory(res.historyRecords!);
      }
    }
    getData();
  }, [token]);
  return (
    <Container>
      <div className="flex items-center justify-between gap-2">
        <PageTitle>餅餅踏踏</PageTitle>
        <Link
          href="/analytics"
          className="dark:glass-effect flex size-10 items-center justify-center rounded-full bg-white text-blue-500 shadow-sm dark:bg-black/5 dark:text-blue-300"
        >
          <BarChart3 strokeWidth={2} />
        </Link>
      </div>

      <SectionTitle>今日統計</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <StatItem
          Icon={Footprints}
          title="踏踏"
          value={steps.toLocaleString("zh-TW", {
            maximumFractionDigits: 0,
          })}
          unit="步"
        />
        <StatItem
          Icon={Compass}
          title="距離"
          value={distance.toLocaleString("zh-TW", {
            maximumFractionDigits: 2,
          })}
          unit="公里"
        />
        <StatItem
          Icon={Flame}
          title="動態能量"
          value={energy.toLocaleString("zh-TW", {
            maximumFractionDigits: 1,
          })}
          unit="大卡"
        />
      </div>
      {today.length > 0 && steps > 0 && (
        <div className="dark:glass-effect mb-2 h-[150px] w-full rounded-lg bg-white pb-1 shadow-sm dark:bg-black/5">
          <StepChart data={today} />
        </div>
      )}
      {history.length !== 0 && <SectionTitle>歷史紀錄</SectionTitle>}
      {history.map((item, index) => (
        <div
          key={index}
          className="dark:glass-effect my-2 rounded-lg bg-gray-50 shadow-sm dark:bg-black/5"
        >
          <div className="rounded-t-lg bg-white px-3 py-2 text-sm shadow-sm dark:bg-white/5">
            {item.date.toLocaleDateString("zh-TW", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-b-lg px-3 py-2">
            <div>
              <div className="text-xs opacity-50">步數</div>
              <div>
                {item.steps?.toLocaleString()}{" "}
                <span className="text-sm opacity-50">步</span>
              </div>
            </div>
            <div>
              <div className="text-xs opacity-50">距離</div>
              <div>
                {item.distance?.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="text-sm opacity-50">公里</span>
              </div>
            </div>
            <div>
              <div className="text-xs opacity-50">動態能量</div>
              <div>
                {item.energy?.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}{" "}
                <span className="text-sm opacity-50">大卡</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {history.length === 0 && (
        <div className="dark:glass-effect flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm text-gray-500 shadow-sm dark:bg-black/5 dark:text-white/90">
          <Info size={16} />
          前往「設定」&rarr;「設定同步工具」讓您的健康數據與餅餅踏踏同步
        </div>
      )}
    </Container>
  );
}
