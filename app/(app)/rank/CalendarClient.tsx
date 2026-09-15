"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { twMerge } from "tailwind-merge";
import Container from "@/components/Container";
import Loader from "@/components/Loader";
import { getRank } from "@/services/actions/rank";
import {
  dateKey,
  getCalendarDates,
  shiftDay,
  shiftMonth,
} from "./calendar-utils";
import styles from "./calendar.module.css";
import { useCalendarPull } from "./use-calendar-pull";

type Ranking = Awaited<ReturnType<typeof getRank>>;
type Navigation = { direction: number; animate: boolean };
const ease = [0.22, 1, 0.36, 1] as const;
const slideVariants = {
  enter: ({ direction, animate }: Navigation) => ({
    x: animate ? direction * 24 : 0,
    opacity: animate ? 0 : 1,
  }),
  center: ({ animate }: Navigation) => ({
    x: 0,
    opacity: 1,
    transition: { duration: animate ? 0.22 : 0, ease },
  }),
  exit: ({ direction, animate }: Navigation) => ({
    x: animate ? direction * -16 : 0,
    opacity: 0,
    transition: { duration: animate ? 0.15 : 0, ease },
  }),
};

function SwipePanel({
  navigation,
  onSwipe,
  children,
  className,
  calendar = false,
}: {
  navigation: Navigation;
  onSwipe: (offset: number) => void;
  children: ReactNode;
  className?: string;
  calendar?: boolean;
}) {
  const isPresent = useIsPresent();
  const dragged = useRef(false);
  return (
    <motion.div
      className={twMerge("relative col-start-1 row-start-1 min-w-0", className)}
      style={{
        touchAction: calendar ? "pinch-zoom" : "pan-y pinch-zoom",
        pointerEvents: isPresent ? "auto" : "none",
      }}
      inert={!isPresent}
      aria-hidden={!isPresent || undefined}
      custom={navigation}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      drag={isPresent ? "x" : false}
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={navigation.animate ? 0.16 : 0}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 40 }}
      onPointerDownCapture={(event) => {
        if (event.isPrimary && event.button === 0) dragged.current = false;
      }}
      onDrag={(_, { offset }) => {
        if (Math.abs(offset.x) >= 8) dragged.current = true;
      }}
      onClickCapture={(event) => {
        if (dragged.current && event.detail !== 0) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onDragEnd={(_, { offset, velocity }) => {
        if (Math.abs(offset.x) <= Math.abs(offset.y)) return;
        const isSwipe =
          Math.abs(offset.x) >= 48 ||
          (Math.abs(offset.x) >= 12 &&
            Math.abs(velocity.x) >= 450 &&
            Math.sign(velocity.x) === Math.sign(offset.x));
        if (isSwipe) onSwipe(offset.x < 0 ? 1 : -1);
      }}
    >
      {children}
    </motion.div>
  );
}

export default function Calendar({
  initialDate,
  initialYear,
  initialMonth,
  initialRank,
  initialError,
}: {
  initialDate: number;
  initialYear: number;
  initialMonth: number;
  initialRank: Ranking;
  initialError: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [pointerInput, setPointerInput] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date(initialDate));
  const [direction, setDirection] = useState(0);
  const pull = useCalendarPull(Boolean(reduceMotion));
  const initialMonthKey = `${initialYear}-${initialMonth}`;
  const [result, setResult] = useState<{
    key: string;
    rank: Ranking;
    error: boolean;
  } | null>(() => ({
    key: initialMonthKey,
    rank: initialRank,
    error: initialError,
  }));
  const [retry, setRetry] = useState(0);
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth() + 1;
  const monthKey = `${currentYear}-${currentMonth}`;
  const selectedKey = dateKey(selectedDate);
  const todayKey = dateKey(new Date());
  const navigation = { direction, animate: !reduceMotion && pointerInput };
  const loading = result?.key !== monthKey;
  const failed = !loading && result?.error;
  const rank = !loading && !failed ? result?.rank : undefined;
  const rankByDate = new Map(
    rank?.map((day) => [dateKey(day.date), day.records]),
  );
  const records = rankByDate.get(selectedKey) ?? [];

  useEffect(() => {
    if (result?.key === monthKey) return;

    let ignore = false;
    getRank(currentYear, currentMonth).then(
      (rank) => {
        if (!ignore) setResult({ key: monthKey, rank, error: false });
      },
      () => {
        if (!ignore) setResult({ key: monthKey, rank: [], error: true });
      },
    );
    return () => {
      ignore = true;
    };
  }, [currentYear, currentMonth, monthKey, retry, result?.key]);

  function changeMonth(offset: number) {
    setDirection(Math.sign(offset));
    setSelectedDate((date) => shiftMonth(date, offset));
  }
  function changeDay(offset: number) {
    setDirection(Math.sign(offset));
    setSelectedDate((date) => shiftDay(date, offset));
  }
  function selectDate(date: Date) {
    setDirection(Math.sign(date.getTime() - selectedDate.getTime()));
    setSelectedDate(date);
  }
  const monthLabel = (offset: number) =>
    new Date(currentYear, currentMonth - 1 + offset, 1).toLocaleDateString(
      "zh-TW",
      { month: "long" },
    );

  return (
    <Container>
      <section
        aria-label="排行榜月曆"
        onPointerDownCapture={() => setPointerInput(true)}
        onKeyDownCapture={() => setPointerInput(false)}
        className={styles.calendar}
        data-motion={navigation.animate ? "on" : "off"}
      >
        <div className="text-center text-sm opacity-50 sm:mt-2">
          {currentYear} 年
        </div>
        <div className="grid grid-cols-10 items-center gap-2 tabular-nums">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="上一個月"
            className={twMerge(
              styles.control,
              "col-span-3 flex items-center gap-1 px-2 text-left text-sm font-light text-gray-400 hover:text-gray-800 dark:hover:text-gray-200",
            )}
          >
            <ChevronLeft size={16} />
            {monthLabel(-1)}
          </button>
          <h1
            className="col-span-4 text-center text-xl font-bold"
            aria-live="polite"
            aria-atomic="true"
          >
            <button
              type="button"
              className={twMerge(styles.control, "px-3")}
              aria-label={`${monthLabel(0)}，${pull.expanded ? "收合" : "展開"}每日冠軍`}
              aria-expanded={pull.expanded}
              aria-controls="ranking-calendar-days"
              onClick={(event) =>
                pull.settle(
                  !pull.expanded,
                  Boolean(reduceMotion) || event.detail === 0,
                )
              }
            >
              <span className="sr-only">{currentYear} 年 </span>
              {monthLabel(0)}
            </button>
          </h1>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="下一個月"
            className={twMerge(
              styles.control,
              "col-span-3 flex items-center justify-end gap-1 px-2 text-right text-sm font-light text-gray-400 hover:text-gray-800 dark:hover:text-gray-200",
            )}
          >
            {monthLabel(1)}
            <ChevronRight size={16} />
          </button>
        </div>
        <div
          aria-hidden="true"
          className="grid grid-cols-7 gap-2 pb-1 text-center text-sm font-light text-gray-400 sm:px-2"
        >
          {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <motion.div
          id="ranking-calendar-days"
          style={{ height: pull.height, touchAction: "pinch-zoom" }}
          {...pull.gestureProps}
          onClickCapture={(event) => {
            if (pull.dragged.current && event.detail !== 0) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
          className="dark:sm:glass-effect max-sm:border-primary-100 dark:max-sm:bg-primary-900/20 relative mb-2 grid overflow-hidden bg-white max-sm:-mx-2 max-sm:border-y sm:rounded-lg sm:shadow-sm dark:bg-transparent max-sm:dark:border-white/5"
        >
          <AnimatePresence initial={false} custom={navigation}>
            <SwipePanel
              key={monthKey}
              calendar
              navigation={navigation}
              onSwipe={changeMonth}
              className="grid h-full grid-cols-7 grid-rows-6 gap-2 px-2 py-1 tabular-nums"
            >
              {getCalendarDates(selectedDate).map((item) => {
                const key = dateKey(item.date);
                const selected = key === selectedKey;
                const today = key === todayKey;
                const champion = item.current
                  ? rankByDate.get(key)?.[0]?.user
                  : undefined;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectDate(item.date)}
                    aria-label={item.date.toLocaleDateString("zh-TW", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    })}
                    aria-pressed={selected}
                    aria-current={today ? "date" : undefined}
                    className={twMerge(
                      styles.day,
                      "relative min-w-0 rounded-2xl",
                      champion
                        ? "dark:text-primary-300 text-gray-800"
                        : "text-gray-300 dark:text-gray-600",
                      !item.current && "opacity-40",
                      selected &&
                        "text-primary-600 dark:text-primary-50 font-semibold",
                    )}
                  >
                    {selected && (
                      <motion.span
                        aria-hidden="true"
                        layoutId={`selected-${monthKey}`}
                        initial={false}
                        transition={{
                          duration: navigation.animate ? 0.2 : 0,
                          ease,
                        }}
                        className="dark:glass-effect bg-primary-500/10 absolute top-0 left-1/2 -ml-4 size-8 rounded-full"
                      />
                    )}
                    <span className="absolute inset-x-0 top-0 flex h-8 items-center justify-center">
                      {item.text}
                    </span>
                    <motion.span
                      aria-hidden="true"
                      style={{
                        opacity: pull.avatarOpacity,
                        scale: pull.avatarProgress,
                        y: pull.avatarY,
                      }}
                      className="pointer-events-none absolute inset-x-0 top-9 flex origin-top justify-center"
                    >
                      {pull.avatarsMounted &&
                        item.current &&
                        (champion ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/v1/avatar/${champion.id}`}
                            alt=""
                            draggable={false}
                            className="size-10 max-w-full rounded-xl bg-white object-cover shadow-sm sm:size-12"
                          />
                        ) : (
                          <span className="size-10 max-w-full rounded-xl bg-gray-200/50 sm:size-12 dark:bg-gray-500/50" />
                        ))}
                    </motion.span>
                  </button>
                );
              })}
            </SwipePanel>
          </AnimatePresence>
        </motion.div>
        <h2 className="sr-only" aria-live="polite">
          {selectedDate.toLocaleDateString("zh-TW", {
            month: "long",
            day: "numeric",
          })}
          排行榜
        </h2>
        <div
          className="-mx-2 -mt-1 grid overflow-hidden px-2 pt-1 pb-3"
          aria-busy={loading}
        >
          <AnimatePresence initial={false} custom={navigation}>
            <SwipePanel
              key={selectedKey}
              navigation={navigation}
              onSwipe={changeDay}
              className="min-h-28"
            >
              {loading ? (
                <div
                  role="status"
                  className="flex h-28 items-center justify-center"
                >
                  <Loader />
                  <span className="sr-only">載入排行榜中</span>
                </div>
              ) : failed ? (
                <div
                  role="status"
                  className="flex min-h-28 flex-col items-center justify-center gap-1 text-sm text-gray-500"
                >
                  暫時無法載入排行榜
                  <button
                    type="button"
                    className={twMerge(
                      styles.control,
                      "text-primary-600 dark:text-primary-300 px-3",
                    )}
                    onClick={() => {
                      setResult(null);
                      setRetry((value) => value + 1);
                    }}
                  >
                    重試
                  </button>
                </div>
              ) : records.length === 0 ? (
                <div
                  role="status"
                  className="flex h-28 items-center justify-center text-sm text-gray-500"
                >
                  這天尚無紀錄
                </div>
              ) : (
                <div className="dark:glass-effect rounded-lg bg-white p-2 shadow-sm dark:bg-black/20">
                  {records.map((item, index) => (
                    <div
                      key={item.user.id}
                      className={twMerge(
                        "flex items-center justify-between gap-2",
                        index !== 0 &&
                          "mt-2 border-t border-gray-100 pt-2 dark:border-white/10",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/v1/avatar/${item.user.id}`}
                          alt=""
                          draggable={false}
                          className="size-10 rounded bg-white"
                        />
                        <div>
                          <div className="font-bold">{item.user.name}</div>
                          <div className="text-xs opacity-75">
                            {item.steps?.toLocaleString() ?? 0} 步 -{" "}
                            {item.distance?.toFixed(2) ?? 0} 公里
                          </div>
                        </div>
                      </div>
                      {index < 3 && (
                        <div
                          className={twMerge(
                            "dark:glass-effect rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:border-0 dark:bg-gray-800/20 dark:text-white/75",
                            index === 0 &&
                              "border-yellow-300 bg-yellow-100 text-yellow-600 dark:bg-yellow-800/20 dark:text-yellow-200/80",
                          )}
                        >
                          {["步步冠軍", "步步亞軍", "步步季軍"][index]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SwipePanel>
          </AnimatePresence>
        </div>
      </section>
    </Container>
  );
}
