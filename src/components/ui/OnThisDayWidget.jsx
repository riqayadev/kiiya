"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/utils/i18n";
import { getEventColor } from "@/utils/eventColors";

// Returns the matched anniversary (years ago) for an event, or null. Checks
// both start_date and end_date for a month+day match in a previous year.
function matchYearsAgo(event, month, day, currentYear) {
  for (const dateStr of [event.start_date, event.end_date]) {
    if (!dateStr) continue;
    const d = new Date(dateStr);
    if (
      d.getMonth() + 1 === month &&
      d.getDate() === day &&
      d.getFullYear() < currentYear
    ) {
      return currentYear - d.getFullYear();
    }
  }
  return null;
}

export default function OnThisDayWidget() {
  useLang();
  const { user } = useAuth();
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  const [memories, setMemories] = useState([]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const year = today.getFullYear();

      // Exact month+day match (in a previous year) is done in the DB rather
      // than fetching a 10-year window and filtering on the client.
      const { data } = await supabase.rpc("get_on_this_day", {
        p_user_id: user.id,
        p_month: month,
        p_day: day,
      });

      if (!active) return;

      const matched = (data || [])
        .map((e) => {
          const yearsAgo = matchYearsAgo(e, month, day, year);
          return yearsAgo ? { ...e, yearsAgo } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.yearsAgo - b.yearsAgo);

      setMemories(matched);
    })();
    return () => {
      active = false;
    };
  }, [supabase, user]);

  if (memories.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        📅 {t("onThisDay.title")}
      </h2>
      <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
        {memories.map((event) => {
          const colors = getEventColor(event.type);
          const label =
            event.yearsAgo === 1
              ? t("onThisDay.oneYearAgo")
              : t("onThisDay.yearsAgo").replace("{years}", event.yearsAgo);
          return (
            <Link
              key={event.id}
              href={`/dashboard/events/${event.id}`}
              className="relative h-28 min-w-[200px] flex-shrink-0 overflow-hidden rounded-2xl"
            >
              {event.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.cover_image_url}
                  alt={event.title}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div
                  className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br text-4xl ${colors.gradient}`}
                >
                  {event.cover_emoji || colors.icon}
                </div>
              )}
              {/* Legibility overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {/* Years-ago pill */}
              <span className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                {label}
              </span>
              {/* Title + type */}
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="truncate text-sm font-semibold text-white drop-shadow">
                  {event.title}
                </p>
                {event.type && (
                  <p className="truncate text-xs text-white/80">{event.type}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
