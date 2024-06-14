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
import { ChevronLeft, ChevronRight } from "lucide-react";
import Loader from "@/components/Loader";
const SWIPE_THRESHOLD_X = 300;
const SWIPE_THRESHOLD_Y = 100;
const variants = {
  enter: (direction: number) => {
    if (direction === 0) {
      return {
        y: 100,
        x: 0,
        opacity: 1,
      };
    }
    return {
      x: direction > 0 ? 500 : -500,
      opacity: 0,
      scale: 0.75,
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      scale: 0.75,
      opacity: 0,
    };
  },
};
export default function Calendar() {
  const dragY = useMotionValue(0);
  const weekDragY = useTransform(() =>
    dragY.get() > 0 ? (dragY.get() / 6) * 250 : 0,
  );
  const avatarDragY = useTransform(dragY, [0, -1], [1, 0.5]);
  const avatarDragMarginBottom = useTransform(dragY, [0, -1], ["0px", "-24px"]);
  const [direction, setDirection] = useState(0);
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
    setDirection(1);
  }
  function prevMonth() {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setDirection(-1);
  }
  function nextDay() {
    if (currentDate === lastDate) {
      if (currentMonth === 12) {
        setCurrentYear(currentYear + 1);
        setCurrentMonth(1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
      setCurrentDate(1);
    } else {
      setCurrentDate(currentDate + 1);
    }
  }
  function prevDay() {
    if (currentDate === 1) {
      if (currentMonth === 1) {
        setCurrentYear(currentYear - 1);
        setCurrentMonth(12);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
      setCurrentDate(lastDate);
    } else {
      setCurrentDate(currentDate - 1);
    }
  }
  return (
    <Container>
      <div className="col-span-4 text-center text-sm opacity-50 sm:mt-2">
        {new Date(
          currentYear,
          currentMonth - 1,
          new Date().getDate(),
        ).toLocaleDateString("zh-TW", { year: "numeric" })}
      </div>
      <div className="grid grid-cols-10 items-center gap-2 tabular-nums">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.button
            onClick={prevMonth}
            className="col-span-3 flex items-center gap-1 px-2 text-left text-sm font-light text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            key={`prev-${currentMonth - 2}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ChevronLeft size={16} />
            {new Date(
              currentYear,
              currentMonth - 2,
              new Date().getDate(),
            ).toLocaleDateString("zh-TW", { month: "long" })}
          </motion.button>
        </AnimatePresence>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.h1
            className="col-span-4 text-center text-xl font-bold"
            key={`current-${currentMonth - 1}`}
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
        </AnimatePresence>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.button
            onClick={nextMonth}
            className="col-span-3 flex items-center justify-end gap-1 px-2 text-right text-sm font-light text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            key={`next-${currentMonth}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {new Date(
              currentYear,
              currentMonth,
              new Date().getDate(),
            ).toLocaleDateString("ja-JP", { month: "long" })}
            <ChevronRight size={16} />
          </motion.button>{" "}
        </AnimatePresence>
      </div>
      <div className="grid grid-cols-7 gap-2 pb-1 text-center text-sm font-light text-gray-400 sm:px-2">
        {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <motion.div
        drag="y"
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.001}
        style={{ y: dragY }}
        className="dark:sm:glass-effect relative mb-2 overflow-hidden bg-white max-sm:-mx-2 max-sm:border-b max-sm:border-t max-sm:border-primary-100 sm:rounded-lg sm:border-transparent sm:shadow-sm dark:bg-transparent max-sm:dark:border-white/5 dark:max-sm:bg-primary-900/20"
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            className="grid grid-cols-7 place-items-center gap-2 px-2 py-1 tabular-nums"
            key={currentMonth}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            onDragEnd={(event, info) => {
              const { offset } = info;
              if (
                Math.abs(offset.x) > SWIPE_THRESHOLD_X ||
                Math.abs(offset.y) > SWIPE_THRESHOLD_Y
              ) {
                // check x or y
                if (Math.abs(offset.x) > Math.abs(offset.y)) {
                  if (offset.x > 0) {
                    prevMonth();
                    setDirection(-1);
                  } else {
                    nextMonth();
                    setDirection(1);
                  }
                } else {
                  setAvatarView(offset.y > 0);
                }
              }
            }}
            dragDirectionLock
          >
            {
              // split by week and render
              dates.map((item, index) => {
                const currentDayRank = rank.find(
                  (z) => z.date.getDate() === item.text,
                );
                const avatarId = currentDayRank?.records[0]?.user.id;

                return (
                  <motion.button
                    className={twMerge(
                      "relative flex flex-col items-center justify-center rounded-full p-1 transition-all",
                      avatarView && "rounded-sm",
                      avatarId
                        ? "text-gray-800 dark:text-primary-300"
                        : "text-gray-300 dark:text-gray-600",
                      !item.current && "opacity-40",
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
                      if (item.date.getMonth() + 1 != currentMonth) {
                        setDirection(
                          item.date.getMonth() + 1 > currentMonth ? 1 : -1,
                        );
                      } else if (item.text != currentDate) {
                        setDirection(item.text > currentDate ? 1 : -1);
                      }
                    }}
                  >
                    <AnimatePresence>
                      {item.text === currentDate && item.current && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          className={twMerge(
                            "dark:glass-effect absolute top-0 size-8 rounded-full bg-primary-500/10",
                            avatarView && "h-full w-full rounded-[14px]",
                          )}
                        />
                      )}
                    </AnimatePresence>
                    <div className="relative">{item.text}</div>
                    <motion.div
                      style={{
                        scale: avatarDragY,
                        marginBottom: avatarDragMarginBottom,
                      }}
                      className="origin-top"
                    >
                      <AnimatePresence initial={!avatarView}>
                        {avatarView && item.current && (
                          <motion.div
                            className={twMerge(
                              "relative aspect-square w-full bg-white shadow-sm",
                              !avatarId && "bg-gray-200/50 dark:bg-gray-500/50",
                            )}
                            initial={{
                              opacity: 0,
                              height: 0,
                              scale: 0,
                              borderRadius: "48px",
                            }}
                            animate={{
                              opacity: 1,
                              height: "48px",
                              borderRadius: "12px",
                              scale: 1,
                            }}
                            exit={{
                              opacity: 0,
                              height: 0,
                              scale: 0,
                              borderRadius: "48px",
                            }}
                          >
                            {avatarId && (
                              <motion.img
                                src={`/api/v1/avatar/${avatarId}`}
                                className="h-full w-full rounded-xl object-cover"
                              />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.button>
                );
              })
            }
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <AnimatePresence custom={direction} mode="popLayout">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          key={currentDate + currentMonth}
          onDragEnd={(event, info) => {
            const { offset } = info;
            if (Math.abs(offset.x) > SWIPE_THRESHOLD_X) {
              if (offset.x > 0) {
                prevDay();
                setDirection(-1);
              } else {
                nextDay();
                setDirection(1);
              }
            }
          }}
        >
          {(currentDayRank?.records.length ?? 0) > 0 && (
            <motion.div className="dark:glass-effect rounded-lg bg-white p-2 shadow-sm dark:bg-black/20">
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
                      <motion.img
                        src={`/api/v1/avatar/${item.user?.id}`}
                        className="size-10 rounded bg-white"
                      />
                      <div>
                        <div className="font-bold">{item.user?.name}</div>
                        <div className="text-xs opacity-75">
                          {item.distance?.toFixed(2) ?? 0} 公里 -{" "}
                          {item.steps?.toLocaleString() ?? 0} 步
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
            </motion.div>
          )}
          {currentDayRank?.records.length === 0 && (
            <div className="flex h-20 items-center justify-center text-center opacity-50">
              尚無紀錄
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {rank.length === 0 && <Loader />}
    </Container>
  );
}
