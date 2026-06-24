"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin purple loading bar at the very top that animates on each route change.
 * App Router has no navigation-start hook, so we trigger a quick fill whenever
 * the pathname settles on a new value.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setVisible(true);
    setWidth(0);
    const r1 = requestAnimationFrame(() => setWidth(80));
    const t = setTimeout(() => setWidth(100), 180);
    const done = setTimeout(() => setVisible(false), 520);
    return () => {
      cancelAnimationFrame(r1);
      clearTimeout(t);
      clearTimeout(done);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[200] h-0.5 bg-transparent">
      <div
        className="h-full bg-kiiya-primary shadow-[0_0_8px_rgba(124,110,245,0.6)] transition-all duration-300 ease-out"
        style={{ width: `${width}%`, opacity: width >= 100 ? 0 : 1 }}
      />
    </div>
  );
}
