"use client";
import { useEffect, useState } from "react";
import { ACHIEVEMENT_EVENT } from "@/utils/achievements";

export default function AchievementToaster() {
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    const handler = (e) => setCurrent(e.detail);
    window.addEventListener(ACHIEVEMENT_EVENT, handler);
    return () => window.removeEventListener(ACHIEVEMENT_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!current) return;
    const id = setTimeout(() => setCurrent(null), 4000);
    return () => clearTimeout(id);
  }, [current]);

  if (!current) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4">
      <div className="animate-achievement flex items-center gap-4 rounded-2xl border border-purple-100 bg-white px-5 py-4 shadow-2xl dark:border-[#2D2A3E] dark:bg-[#1A1825]">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-kiiya-primary to-kiiya-romantic text-3xl shadow-inner">
          {current.emoji}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-kiiya-primary">
            Achievement Unlocked! 🏆
          </p>
          <p className="mt-0.5 font-bold text-kiiya-dark dark:text-white">{current.name}</p>
          <p className="text-sm text-gray-500">{current.desc}</p>
        </div>
      </div>
    </div>
  );
}
