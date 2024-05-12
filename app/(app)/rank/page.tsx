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
              <div key={item.user.id}>
                <div className="bg-white rounded-lg p-2 my-2 flex justify-between gap-2 items-center shadow-sm">
                  <p className="font-bold">{item.user.name}</p>
                  <p>{item.steps?.toLocaleString() ?? 0} 步</p>
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
