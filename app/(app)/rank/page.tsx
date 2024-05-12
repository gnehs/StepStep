import Container from "@/components/Container";
import PageTitle from "@/components/PageTitle";
import SectionTitle from "@/components/SectionTitle";
import { getRank } from "@/services/actions/rank";
export default async function Rank() {
  const rank = await getRank();
  return (
    <Container>
      <PageTitle>排行榜</PageTitle>

      <div>
        {rank.map((item, index: number) => (
          <div key={item.date.toLocaleDateString()}>
            <SectionTitle>{item.date.toLocaleDateString()}</SectionTitle>
            {item.records.map((item, index: number) => (
              <div key={item.user?.id ?? "" + index}>
                <div className="bg-white rounded-lg p-2 my-2 flex justify-between gap-2 items-center shadow-sm">
                  <div className="flex gap-2 items-center">
                    <img
                      src={`/api/v1/avatar?id=${item.user?.id}`}
                      className="size-10 rounded"
                    />
                    <div>
                      <div className="font-bold">{item.user?.name}</div>
                      <div className="text-xs opacity-75">
                        {item.steps?.toLocaleString() ?? 0} 步 -{" "}
                        {item.distance?.toFixed(2) ?? 0} 公里
                      </div>
                    </div>
                  </div>
                  <div>
                    {index === 0 && "步步冠軍"}
                    {index === 1 && "步步亞軍"}
                    {index === 2 && "步步季軍"}
                  </div>
                </div>
              </div>
            ))}
            {item.records.length === 0 && (
              <div className="bg-white rounded-lg p-2 my-2 flex justify-between gap-2 items-center text-gray-400 shadow-sm">
                暫無資料
              </div>
            )}
          </div>
        ))}
      </div>
    </Container>
  );
}
