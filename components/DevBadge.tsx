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
    <div className="fixed right-2 top-2 z-50 rounded bg-red-500 p-1 text-xs text-white">
      localhost
    </div>
  );
}
