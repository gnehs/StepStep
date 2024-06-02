"use client";
import { useState, useEffect } from "react";
export default function DevBadge() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (location.hostname !== "localhost") return;
    setShow(true);
  }, []);
  if (!show) return null;
  return (
    <div className="dark:glass-effect fixed right-2 top-2 z-50 rounded bg-red-500 p-1 text-xs text-white dark:bg-red-500/20">
      localhost
    </div>
  );
}
