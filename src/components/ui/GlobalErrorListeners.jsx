"use client";
import { useEffect } from "react";
import { logger } from "@/utils/logger";

// Feeds window-level uncaught errors + unhandled promise rejections into the
// logger so they show up in the diagnostics panel. Renders nothing.
export default function GlobalErrorListeners() {
  useEffect(() => {
    const onError = (e) => {
      logger.error(
        e.message || "Uncaught error",
        e.error || { stack: `${e.filename}:${e.lineno}:${e.colno}` }
      );
    };
    const onRejection = (e) => {
      const reason = e.reason;
      logger.error(
        "Unhandled promise rejection",
        reason instanceof Error
          ? reason
          : { message: String(reason), stack: reason?.stack }
      );
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
