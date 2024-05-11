"use client";
import Container from "@/components/Container";
import PageTitle from "@/components/PageTitle";
import SectionTitle from "@/components/SectionTitle";
import { getRank } from "@/services/actions/rank";
import { useEffect, useState } from "react";
export default function Rank() {
  const [rank, setRank] = useState<any>([]);
  async function getData() {
    let res = await getRank();

    setRank(res);
  }
  useEffect(() => {
    getData();
  }, []);
  return (
    <Container>
      <PageTitle>排行榜</PageTitle>
      {/* <SectionTitle>全服排行</SectionTitle> */}
      <div>
        {rank.map((item: any, index: number) => (
          <div key={index} className="bg-white rounded-lg p-2 my-1">
            <p className="font-bold">{item.user.name}</p>
            <p>{item._sum.steps.toLocaleString()} 步</p>
          </div>
        ))}
      </div>
    </Container>
  );
}
