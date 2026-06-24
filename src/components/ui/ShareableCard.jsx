"use client";
import { forwardRef } from "react";
import { getEventColor } from "@/utils/eventColors";
import { formatRupiah, formatDateRange } from "@/utils/format";

// 9:16 memory card. Rendered at a modest on-screen size; html2canvas upscales
// it on export for a crisp IG-Stories-ready PNG.
const ShareableCard = forwardRef(function ShareableCard({ event, stats }, ref) {
  const colors = getEventColor(event?.type);
  const emoji = event?.cover_emoji || colors.icon;

  return (
    <div
      ref={ref}
      className={`relative flex h-[569px] w-[320px] flex-col items-center justify-between overflow-hidden bg-gradient-to-br ${colors.gradient} px-7 py-9 text-white`}
    >
      {/* Decorative floating circles */}
      <div className="pointer-events-none absolute -left-10 top-16 h-32 w-32 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -right-8 top-40 h-24 w-24 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute bottom-24 left-8 h-20 w-20 rounded-full bg-white/10" />

      {/* Logo */}
      <div className="flex w-full items-center justify-between">
        <span className="text-sm font-semibold text-white/80">Memory Card</span>
        <span className="text-base font-bold">✦ Kiiya</span>
      </div>

      {/* Center */}
      <div className="relative flex flex-col items-center text-center">
        <span className="text-[120px] leading-none drop-shadow-lg">{emoji}</span>
        <h1 className="mt-4 text-4xl font-extrabold leading-tight drop-shadow">
          {event?.title}
        </h1>
        <p className="mt-2 text-sm font-medium text-white/85">
          {formatDateRange(event?.start_date, event?.end_date)}
        </p>

        {/* Stats */}
        <div className="mt-6 flex items-stretch gap-3">
          {[
            { label: "Days", value: stats.days },
            { label: "Budget", value: formatRupiah(stats.budget) },
            { label: "Checklist", value: stats.checklistCount },
          ].map((s) => (
            <div
              key={s.label}
              className="min-w-[80px] rounded-2xl bg-white/15 px-3 py-3 backdrop-blur-sm"
            >
              <p className="text-lg font-bold leading-tight">{s.value}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/75">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-sm font-semibold">Life happens. This is your story.</p>
        <p className="mt-1 text-xs text-white/70">kiiya.vercel.app</p>
      </div>
    </div>
  );
});

export default ShareableCard;
