"use client";

// Placeholder that mirrors the calendar layout (header controls + month grid)
// while the FullCalendar bundle streams in.
export default function CalendarSkeleton() {
  return (
    <div className="kiiya-calendar animate-pulse">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-white/5" />
          <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-white/5" />
          <div className="h-9 w-20 rounded-full bg-gray-100 dark:bg-white/5" />
          <div className="h-6 w-40 rounded bg-gray-100 dark:bg-white/5" />
        </div>
        <div className="h-10 w-56 rounded-full bg-gray-100 dark:bg-white/5" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Month grid: weekday header + 5 rows of 7 cells */}
        <div className="rounded-2xl border border-purple-100 bg-white p-4 dark:border-[#2D2A3E] dark:bg-[#1A1825]">
          <div className="mb-2 grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-4 rounded bg-gray-100 dark:bg-white/5"
              />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-lg bg-gray-100 dark:bg-white/5"
              />
            ))}
          </div>
        </div>

        {/* Upcoming sidebar */}
        <aside className="hidden lg:block">
          <div className="rounded-2xl border border-purple-100 bg-white p-5 dark:border-[#2D2A3E] dark:bg-[#1A1825]">
            <div className="mb-4 h-5 w-28 rounded bg-gray-100 dark:bg-white/5" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-gray-100 dark:bg-white/5"
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
