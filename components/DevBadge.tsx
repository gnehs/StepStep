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
    <div className="fixed top-2 right-2 bg-red-500 text-white text-xs p-1 z-50 rounded">
      localhost
    </div>
  );
}
