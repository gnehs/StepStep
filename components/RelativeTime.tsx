"use client";
import { useEffect, useState } from "react";
export default function RelativeTime({ time }: { time: Date }) {
  function calcRelativeTime(date: Date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);
    if (years > 0) {
      return `${years} 年前`;
    } else if (months > 0) {
      return `${months} 月前`;
    } else if (days > 0) {
      return `${days} 天前`;
    } else if (hours > 0) {
      return `${hours} 小時前`;
    } else if (minutes > 0) {
      return `${minutes} 分鐘前`;
    } else if (seconds > 30) {
      return `${seconds} 秒前`;
    } else {
      return "剛剛";
    }
  }
  const [result, setResult] = useState("計算中⋯⋯");

  useEffect(() => {
    setResult(calcRelativeTime(time));
    const interval = setInterval(() => {
      setResult(calcRelativeTime(time));
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);
  return <span suppressHydrationWarning>{result}</span>;
}
