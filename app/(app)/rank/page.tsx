"use client";
import { useEffect, useState } from "react";
import Container from "@/components/Container";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { twMerge } from "tailwind-merge";
import { getRank } from "@/services/actions/rank";
export default function Calendar() {
  const dragY = useMotionValue(0);
  const weekDragY = useTransform(() => (dragY.get() > 0 ? dragY.get() / 6 : 0));

  const [avatarView, setAvatarView] = useState(false);

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentDate, setCurrentDate] = useState(new Date().getDate());

  const [rank, setRank] = useState<
    {
      date: Date;
      records: {
        user: {
          id: string;
          name: string;
        };
        steps: number;
        distance: number;
        energy: number;
      }[];
    }[]
  >([]);
  const currentDayRank = rank.find(
    (item) => item.date.getDate() === currentDate,
  );
  useEffect(() => {
    setRank([]);
    getRank(currentYear, currentMonth).then((res) => {
      setRank(res as any);
    });
  }, [currentYear, currentMonth]);

  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
  const lastDate = new Date(currentYear, currentMonth, 0).getDate();
  const prevLastDate = new Date(currentYear, currentMonth - 1, 0).getDate();

  const prevDates = Array.from({ length: firstDay }, (_, i) => i + 1)
    .map((date) => prevLastDate - date + 1)
    .reverse()
    .map((date) => ({
      current: false,
      text: date,
      date: new Date(currentYear, currentMonth - 2, date),
    }));
  const nextDates = Array.from(
    { length: 42 - (lastDate + firstDay) },
    (_, i) => i + 1,
  ).map((date) => ({
    current: false,
    text: date,
    date: new Date(currentYear, currentMonth, date),
  }));

  const dates = [
    ...prevDates,
    ...Array.from({ length: lastDate }, (_, i) => i + 1).map((date) => ({
      current: true,
      text: date,
      date: new Date(currentYear, currentMonth - 1, date),
    })),
    ...nextDates,
  ];
  function nextMonth() {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }
  function prevMonth() {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }
  return (
    <Container>
      <div className="col-span-4 mt-2 text-center font-semibold">
        {new Date(
          currentYear,
          currentMonth - 1,
          new Date().getDate(),
        ).toLocaleDateString("zh-TW", { year: "numeric" })}
      </div>
      <div className="grid grid-cols-10 gap-2 tabular-nums">
        <motion.button
          onClick={prevMonth}
          className="col-span-3 p-2 text-left text-sm font-light text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          layoutId={(currentMonth - 2).toString()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {new Date(
            currentYear,
            currentMonth - 2,
            new Date().getDate(),
          ).toLocaleDateString("zh-TW", { month: "long" })}
        </motion.button>
        <motion.h1
          className="col-span-4 text-center text-2xl font-bold"
          layoutId={(currentMonth - 1).toString()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {new Date(
            currentYear,
            currentMonth - 1,
            new Date().getDate(),
          ).toLocaleDateString("zh-TW", {
            month: "long",
          })}
        </motion.h1>
        <motion.button
          onClick={nextMonth}
          className="col-span-3 p-2 text-right text-sm font-light text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          layoutId={currentMonth.toString()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {new Date(
            currentYear,
            currentMonth,
            new Date().getDate(),
          ).toLocaleDateString("ja-JP", { month: "long" })}
        </motion.button>
      </div>
      <div className="grid grid-cols-7 gap-2 pb-1 text-center text-sm font-light text-gray-400 sm:px-2">
        {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <motion.div className="dark:sm:glass-effect overflow-hidden bg-white max-sm:-mx-2 max-sm:border-b max-sm:border-t max-sm:border-primary-100 sm:rounded-lg sm:border-transparent sm:shadow-sm dark:bg-transparent max-sm:dark:border-primary-800 dark:max-sm:bg-primary-900">
        <motion.div
          className="grid grid-cols-7 place-items-center gap-2 px-2 py-1 tabular-nums"
          drag
          dragElastic={0.1}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          onDragEnd={(event, info) => {
            const { offset } = info;
            // check x or y
            if (Math.abs(offset.x) > Math.abs(offset.y)) {
              if (offset.x > 0) {
                prevMonth();
              } else {
                nextMonth();
              }
            } else {
              setAvatarView(offset.y > 0);
            }
          }}
          dragDirectionLock
          style={{ y: dragY }}
        >
          {
            // split by week and render
            dates.map((item, index) => {
              const currentDayRank = rank.find(
                (z) => z.date.getDate() === item.text,
              );
              const avatar = currentDayRank?.records[0]?.user.id;

              return (
                <motion.button
                  className={twMerge(
                    "relative flex flex-col items-center justify-center rounded-full p-1 transition-all",
                    avatarView && "rounded-sm text-sm",
                    item.current
                      ? "text-gray-800 dark:text-primary-300"
                      : "text-gray-300 dark:text-gray-600",
                    item.text === currentDate &&
                      item.current &&
                      "font-semibold text-primary-600 dark:text-primary-50",
                  )}
                  style={{ marginBottom: weekDragY }}
                  key={index}
                  onClick={() => {
                    setCurrentYear(item.date.getFullYear());
                    setCurrentMonth(item.date.getMonth() + 1);
                    setCurrentDate(item.text);
                  }}
                >
                  {item.text === currentDate && item.current && !avatarView && (
                    <motion.div
                      layoutId="selected"
                      className="dark:glass-effect absolute top-0 size-8 rounded-full bg-primary-500/10"
                      initial={{ opacity: 0, scale: 0.75 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.75 }}
                    />
                  )}
                  <div className="relative">{item.text}</div>
                  <AnimatePresence>
                    {avatarView && item.current && avatar && (
                      <motion.div
                        className="aspect-square w-full overflow-hidden rounded-sm bg-white"
                        initial={{ opacity: 0, height: 0, scale: 0 }}
                        animate={{ opacity: 1, height: "48px", scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0 }}
                      >
                        {avatar ? (
                          <img
                            src={`/api/v1/avatar?id=${avatar}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-gray-600"></div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })
          }
        </motion.div>
      </motion.div>
      {(currentDayRank?.records.length ?? 0) > 0 ? (
        <div className="dark:glass-effect my-2 rounded-lg bg-white p-2 shadow-sm dark:bg-black/20">
          {currentDayRank &&
            currentDayRank.records.map((item, index) => (
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
                    "dark:glass-effect rounded-full border border-gray-200 bg-gray-100 p-0.5 px-2 text-xs text-gray-600 empty:hidden dark:border-0 dark:bg-gray-800/20 dark:text-white/75",
                    index === 0 &&
                      "border-yellow-300 bg-yellow-100 text-yellow-600 dark:bg-yellow-800/20 dark:text-yellow-200/80",
                  )}
                >
                  {index === 0 && "步步冠軍"}
                  {index === 1 && "步步亞軍"}
                  {index === 2 && "步步季軍"}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="my-4 text-center opacity-50">尚無紀錄</div>
      )}
    </Container>
  );
}
