import Container from "@/components/Container";
import { getHomeData } from "@/services/actions/home";
import BadgesData from "@/data/badges";
import { ChartNoAxesColumn, Medal, ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import StepChart from "@/components/StepChart";

export default async function Home() {
  const result = await getHomeData();
  if (!result.success) redirect("/login");

  const { todayRecords: today, badges, historyRecords: history } = result;
  const steps = today.reduce((acc, cur) => acc + cur.steps, 0);
  const distance = today.reduce((acc, cur) => acc + cur.distance, 0);
  const energy = today.reduce((acc, cur) => acc + cur.energy, 0);
  const dateLabel = new Intl.DateTimeFormat("zh-TW", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <Container>
      <div className="space-y-6 py-6 pb-8">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="ios-title text-[2.125rem] font-semibold tracking-[-0.04em] text-primary-950 dark:text-white">
              餅餅踏踏
            </h1>
            <p className="ios-secondary mt-1">{dateLabel}</p>
          </div>
          <nav
            aria-label="餅餅踏踏相關頁面"
            className="flex shrink-0 items-center gap-1"
          >
            <Link
              href="/analytics"
              title="分析"
              className="ios-link pressable flex size-11 items-center justify-center rounded-full"
            >
              <ChartNoAxesColumn
                size={23}
                strokeWidth={1.8}
                aria-hidden="true"
              />
              <span className="sr-only">分析</span>
            </Link>
            <Link
              href="/badges"
              title="獎章"
              className="ios-link pressable flex size-11 items-center justify-center rounded-full"
            >
              <Medal size={23} strokeWidth={1.8} aria-hidden="true" />
              <span className="sr-only">獎章</span>
            </Link>
          </nav>
        </header>

        <section aria-labelledby="today-heading" className="space-y-3">
          <h2 id="today-heading" className="sr-only">
            今日活動
          </h2>

          <article className="surface-card overflow-hidden p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  步數
                </p>
                <p className="mt-2 text-[2.75rem] leading-none font-semibold tracking-[-0.06em] text-primary-950 tabular-nums sm:text-5xl dark:text-white">
                  {steps.toLocaleString("zh-TW", {
                    maximumFractionDigits: 0,
                  })}
                  <span className="ml-1 text-base font-medium tracking-normal text-primary-600 dark:text-primary-200">
                    步
                  </span>
                </p>
              </div>
            </div>

            {today.length > 0 && steps > 0 ? (
              <div className="mt-5 border-t border-primary-200 pt-3 dark:border-primary-700">
                <StepChart data={today} />
              </div>
            ) : (
              <div className="mt-5 border-t border-primary-200 pt-3 dark:border-primary-700">
                <p className="ios-secondary">今天還沒有步數資料。</p>
                <Link
                  href="/settings"
                  className="ios-link pressable mt-2 inline-block text-sm"
                >
                  前往設定同步
                </Link>
              </div>
            )}
          </article>

          <div className="grid grid-cols-2 gap-3">
            <article className="surface-card p-4">
              <p className="text-sm font-medium text-primary-700 dark:text-primary-200">
                距離
              </p>
              <p className="mt-3 text-3xl leading-none font-semibold tracking-[-0.05em] text-primary-950 tabular-nums dark:text-white">
                {distance.toLocaleString("zh-TW", {
                  maximumFractionDigits: 2,
                })}
                <span className="ml-1 text-sm font-medium tracking-normal text-primary-600 dark:text-primary-200">
                  公里
                </span>
              </p>
            </article>
            <article className="surface-card p-4">
              <p className="text-sm font-medium text-primary-700 dark:text-primary-200">
                動態能量
              </p>
              <p className="mt-3 text-3xl leading-none font-semibold tracking-[-0.05em] text-primary-950 tabular-nums dark:text-white">
                {energy.toLocaleString("zh-TW", {
                  maximumFractionDigits: 1,
                })}
                <span className="ml-1 text-sm font-medium tracking-normal text-primary-600 dark:text-primary-200">
                  大卡
                </span>
              </p>
            </article>
          </div>
        </section>

        {badges.length > 0 ? (
          <section aria-labelledby="badges-heading">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2
                id="badges-heading"
                className="text-xl font-semibold text-primary-950 dark:text-white"
              >
                獎章
              </h2>
              <Link href="/badges" className="ios-link pressable text-sm">
                全部
              </Link>
            </div>
            <div className="ios-group">
              {badges.slice(0, 3).map((badge) => {
                const badgeData = BadgesData.find(
                  (b) => b.id === badge.badgeId,
                );
                if (!badgeData) return null;
                return (
                  <Link
                    key={badge.badgeId}
                    href="/badges"
                    className="ios-row pressable flex items-center gap-3"
                  >
                    <span className="font-emoji text-xl" aria-hidden="true">
                      {badgeData.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary-950 dark:text-white">
                      {badgeData.name}
                    </span>
                    <ChevronRight
                      size={18}
                      strokeWidth={1.8}
                      className="shrink-0 text-primary-500 dark:text-primary-300"
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {history.length > 0 ? (
          <section aria-labelledby="history-heading">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2
                id="history-heading"
                className="text-xl font-semibold text-primary-950 dark:text-white"
              >
                歷史紀錄
              </h2>
            </div>
            <div className="ios-group">
              {history.map((item) => (
                <div
                  key={item.date.toISOString()}
                  className="ios-row flex flex-col items-stretch gap-3"
                >
                  <time
                    dateTime={item.date.toISOString()}
                    className="text-sm font-medium text-primary-950 dark:text-white"
                  >
                    {item.date.toLocaleDateString("zh-TW", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <dl className="grid grid-cols-3 gap-3">
                    <div>
                      <dt className="ios-secondary text-xs">步數</dt>
                      <dd className="mt-1 font-semibold text-primary-950 tabular-nums dark:text-white">
                        {item.steps?.toLocaleString("zh-TW") ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="ios-secondary text-xs">距離</dt>
                      <dd className="mt-1 font-semibold text-primary-950 tabular-nums dark:text-white">
                        {item.distance?.toLocaleString("zh-TW", {
                          maximumFractionDigits: 2,
                        }) ?? "—"}
                        <span className="ml-1 text-xs font-normal text-primary-600 dark:text-primary-200">
                          公里
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="ios-secondary text-xs">動態能量</dt>
                      <dd className="mt-1 font-semibold text-primary-950 tabular-nums dark:text-white">
                        {item.energy?.toLocaleString("zh-TW", {
                          maximumFractionDigits: 0,
                        }) ?? "—"}
                        <span className="ml-1 text-xs font-normal text-primary-600 dark:text-primary-200">
                          大卡
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </Container>
  );
}
