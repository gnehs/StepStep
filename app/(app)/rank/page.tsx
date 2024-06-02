import Container from "@/components/Container";
import PageTitle from "@/components/PageTitle";
import SectionTitle from "@/components/SectionTitle";
import { getRank } from "@/services/actions/rank";
import { twMerge } from "tailwind-merge";
export const dynamic = "force-dynamic";
export default async function Rank() {
  const rank = await getRank();
  return (
    <Container>
      <PageTitle>排行榜</PageTitle>
      <div>
        {rank.map((item) => (
          <div key={item.date.toLocaleDateString()} className="my-3">
            <SectionTitle className="mb-1">
              {item.date.toLocaleDateString("zh-TW", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </SectionTitle>
            <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-white/10">
              {item.records.map((item, index: number) => (
                <div
                  key={item.user?.id ?? "" + index}
                  className={twMerge(
                    "flex items-center justify-between gap-2",
                    index !== 0 &&
                      "mt-2 border-t border-gray-100 pt-2 dark:border-white/10",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={`/api/v1/avatar?id=${item.user?.id}`}
                      className="size-10 rounded bg-white"
                    />
                    <div>
                      <div className="font-bold">{item.user?.name}</div>
                      <div className="text-xs opacity-75">
                        {item.steps?.toLocaleString() ?? 0} 步 -{" "}
                        {item.distance?.toFixed(2) ?? 0} 公里
                      </div>
                    </div>
                  </div>
                  <div
                    className={twMerge(
                      "rounded-full border border-gray-200 bg-gray-100 p-0.5 px-2 text-xs text-gray-600 empty:hidden",
                      index === 0 &&
                        "border-yellow-300 bg-yellow-100 text-yellow-600",
                    )}
                  >
                    {index === 0 && "步步冠軍"}
                    {index === 1 && "步步亞軍"}
                    {index === 2 && "步步季軍"}
                  </div>
                </div>
              ))}
              {item.records.length === 0 && "暫無資料"}
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
