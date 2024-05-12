"use client";
import Container from "@/components/Container";
import PageTitle from "@/components/PageTitle";
import SectionTitle from "@/components/SectionTitle";
import { getHomeData } from "@/services/actions/home";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import type { Record } from "@prisma/client";
import { Footprints, Flame, Compass } from "lucide-react";
import StatItem from "@/components/StatItem";
export default function Home() {
  const [token, setToken] = useLocalStorage("token", "");
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
  async function getData() {
    if (token === "") return;
    let res = await getHomeData(token);
    if (res.success) {
      setToday(res.todayRecords!);
      setHistory(res.historyRecords!);
    }
  }
  useEffect(() => {
    getData();
  }, []);
  return (
    <Container>
      <PageTitle>餅餅踏踏</PageTitle>
      <SectionTitle>今日統計</SectionTitle>
      <StatItem
        Icon={Footprints}
        title="踏踏"
        value={steps.toLocaleString()}
        unit="步"
      />
      <StatItem
        Icon={Compass}
        title="距離"
        value={distance.toLocaleString()}
        unit="公里"
      />
      <StatItem
        Icon={Flame}
        title="動態能量"
        value={energy.toLocaleString()}
        unit="大卡"
      />
      <SectionTitle>歷史紀錄</SectionTitle>
      {history.map((item, index) => (
        <div key={index} className="bg-gray-50 rounded-lg my-2 shadow-sm">
          <div className="p-2 text-sm shadow-sm rounded-t-lg bg-white">
            {item.date.toLocaleDateString()}
          </div>
          <div className="grid grid-cols-3 gap-2 p-2 rounded-b-lg">
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
    </Container>
  );
}
