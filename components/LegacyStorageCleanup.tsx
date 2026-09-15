"use client";

import { useEffect } from "react";

/** Remove credentials and full user rows saved by releases before cookie sessions. */
export default function LegacyStorageCleanup() {
  useEffect(() => {
    try {
      for (const key of ["token", "user", "syncToken"]) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Storage may be blocked by browser privacy settings. Sessions use only
      // HttpOnly cookies, so this cleanup is best-effort.
    }
  }, []);

  return null;
}
