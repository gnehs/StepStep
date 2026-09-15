"use client";
import { useState, useEffect } from "react";
export default function DevBadge() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (location.hostname !== "localhost") return;
    // The hostname is only available after the client has mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(true);
  }, []);
  if (!show) return null;
  return (
    <div className="dark:glass-effect fixed right-2 top-[calc(var(--app-top-inset)+0.5rem)] z-50 rounded bg-red-500 p-1 text-xs text-white dark:bg-red-500/20">
      localhost
    </div>
  );
}
