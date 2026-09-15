import { getRank } from "@/services/actions/rank";
import CalendarClient from "./CalendarClient";

export default async function RankPage() {
  const initialDate = new Date();
  const initialYear = initialDate.getFullYear();
  const initialMonth = initialDate.getMonth() + 1;
  let initialRank: Awaited<ReturnType<typeof getRank>> = [];
  let initialError = false;
  try {
    initialRank = await getRank(initialYear, initialMonth);
  } catch {
    initialError = true;
  }

  return (
    <CalendarClient
      initialDate={initialDate.getTime()}
      initialYear={initialYear}
      initialMonth={initialMonth}
      initialRank={initialRank}
      initialError={initialError}
    />
  );
}
