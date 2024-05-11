"use client";
import Container from "@/components/Container";
import PageTitle from "@/components/PageTitle";
import SectionTitle from "@/components/SectionTitle";
import { getHomeData } from "@/services/actions/home";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import type { Record } from "@prisma/client";
export default function Home() {
  const [token, setToken] = useLocalStorage("token", "");
  const [records, setRecords] = useState<Record[]>([]);
  const steps = records.reduce((acc, cur) => acc + cur.steps, 0);
  const distance = records.reduce((acc, cur) => acc + cur.distance, 0);
  const energy = records.reduce((acc, cur) => acc + cur.energy, 0);
  async function getData() {
    if (token === "") return;
    let res = await getHomeData(token);
    if (res.success) {
      console.log(res.records);
      setRecords(res.records!);
    }
  }
  useEffect(() => {
    getData();
  }, []);
  return (
    <Container>
      <PageTitle>餅餅踏踏</PageTitle>
      <SectionTitle>今日踏踏</SectionTitle>
      <p>{steps.toLocaleString()} 步</p>
      <SectionTitle>今日里程</SectionTitle>
      <p>{distance.toLocaleString()} 公里</p>
      <SectionTitle>今日消耗</SectionTitle>
      <p>{energy.toLocaleString()} 大卡</p>
    </Container>
  );
}
