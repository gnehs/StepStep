"use client";
import Container from "@/components/Container";
import PageTitle from "@/components/PageTitle";
import SectionTitle from "@/components/SectionTitle";
import { getRank } from "@/services/actions/rank";
import { useEffect, useState } from "react";
export default function Rank() {
  const [rank, setRank] = useState<
    {
      date: Date;
      records: {
        steps: number;
        distance: number;
        energy: number;
        userId: string;
        user: {
          id: string;
          name: string;
          email: string;
        };
      }[];
    }[]
  >([]);
  async function getData() {
    let res = await getRank();

    setRank(res as any);
  }
  useEffect(() => {
    getData();
  }, []);
  return (
    <Container>
      <PageTitle>排行榜</PageTitle>

      <div>
        {rank.map((item, index: number) => (
          <div key={item.date.toLocaleDateString()}>
            <SectionTitle>{item.date.toLocaleDateString()}</SectionTitle>
            {item.records.map((item, index: number) => (
              <div key={item.userId}>
                <div className="bg-white rounded-lg p-2 my-2 flex justify-between gap-2 items-center">
                  <p className="font-bold">{item.user.name}</p>
                  <p>{item.steps.toLocaleString()} 步</p>
                </div>
              </div>
            ))}
            {item.records.length === 0 && (
              <div className="bg-white rounded-lg p-2 my-1 flex justify-between gap-2 items-center text-gray-400">
                暫無資料
              </div>
            )}
          </div>
        ))}
      </div>
    </Container>
  );
}
