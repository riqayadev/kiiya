"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  Clock,
  Zap,
  CheckCircle,
  Plus,
  CalendarDays,
  ClipboardList,
  UserCircle,
  ArrowRight,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useAuth } from "@/hooks/useAuth";
import { useEvents } from "@/hooks/useEvents";
import { createClient } from "@/lib/supabase/client";
import { getEventColor, statusColors } from "@/utils/eventColors";
import { formatRupiah, formatDateRange, getTimeGreeting } from "@/utils/format";
import { ACHIEVEMENTS, getUnlocked } from "@/utils/achievements";
import NewEventModal from "@/components/ui/NewEventModal";
import OnThisDayWidget from "@/components/ui/OnThisDayWidget";
import AsyncErrorBoundary from "@/components/ui/AsyncErrorBoundary";
import { perf } from "@/utils/perf";

const GREETINGS = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
};

function truncate(str, n) {
  if (!str) return "";
  return str.length > n ? `${str.slice(0, n)}…` : str;
}

// Inline illustration: a person stargazing among floating stars.
function HeroIllustration() {
  return (
    <svg viewBox="0 0 220 180" className="h-40 w-52" aria-hidden>
      <circle cx="40" cy="36" r="3" fill="#C4B8FF" className="animate-float" />
      <circle cx="180" cy="50" r="2.5" fill="#F0956A" className="animate-float-delayed" />
      <circle cx="150" cy="24" r="2" fill="#E8A0BF" className="animate-float-slow" />
      <path d="M70 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#7C6EF5" className="animate-float-slow" />
      <path d="M196 96l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#7C6EF5" className="animate-float" />
      <ellipse cx="110" cy="158" rx="64" ry="9" fill="#EDE9FF" className="dark:hidden" />
      <ellipse cx="110" cy="158" rx="64" ry="9" fill="#221F32" className="hidden dark:block" />
      {/* globe */}
      <circle cx="150" cy="120" r="30" fill="#F0EEFF" stroke="#C4B8FF" strokeWidth="2" className="dark:hidden" />
      <circle cx="150" cy="120" r="30" fill="#221F32" stroke="#4A4560" strokeWidth="2" className="hidden dark:block" />
      <path d="M120 120h60M150 90v60M128 102c14 8 30 8 44 0M128 138c14-8 30-8 44 0" stroke="#A594F9" strokeWidth="1.5" fill="none" opacity="0.7" />
      {/* person */}
      <circle cx="78" cy="98" r="12" fill="#F0956A" />
      <path d="M62 150c0-16 8-28 16-28s16 12 16 28z" fill="#7C6EF5" />
      <rect x="58" y="148" width="40" height="8" rx="4" fill="#6B5EE4" />
    </svg>
  );
}

function StatCard({ icon: Icon, iconWrap, value, label, sub }) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover dark:border-[#2D2A3E] dark:bg-[#1A1825]">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconWrap}`}>
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <p className="mt-4 text-2xl font-bold text-kiiya-dark dark:text-white">{value}</p>
      <p className="text-sm font-semibold text-kiiya-dark dark:text-[#F0EEFF]">{label}</p>
      <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-[#6B6480]">{sub}</p>
    </div>
  );
}

function ActionCard({ icon: Icon, iconWrap, label, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-purple-100 bg-white p-4 text-center transition-all hover:border-kiiya-primary hover:shadow-card-hover dark:border-[#2D2A3E] dark:bg-[#1A1825] dark:hover:border-kiiya-primary"
    >
      <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${iconWrap}`}>
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <p className="mt-3 text-sm font-semibold text-kiiya-dark dark:text-white">{label}</p>
      <p className="text-xs text-gray-400 dark:text-[#6B6480]">{sub}</p>
    </button>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="kiiya-skeleton h-44 rounded-2xl bg-gray-100 dark:bg-[#2D2A3E]" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#2D2A3E]" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#2D2A3E]" />
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#2D2A3E]" />
        ))}
      </div>
    </div>
  );
}

function Thumb({ event }) {
  const colors = getEventColor(event.type);
  if (event.cover_image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={event.cover_image_url}
        alt={event.title}
        loading="lazy"
        decoding="async"
        className="h-11 w-11 flex-shrink-0 rounded-xl object-cover"
      />
    );
  }
  return (
    <div
      className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg ${colors.gradient}`}
    >
      {event.cover_emoji || colors.icon}
    </div>
  );
}

export default function Dashboard() {
  useLang();
  const router = useRouter();
  const { user } = useAuth();
  const {
    events,
    loading,
    createEvent,
    upcomingEvents,
    ongoingEvents,
    completedEvents,
    nextEvent,
    recentEvents,
    totalBudget,
    daysUntil,
  } = useEvents();

  const [profile, setProfile] = useState(null);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [unlocked, setUnlocked] = useState({});

  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabaseRef.current
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (active) setProfile(data || {});
    })();
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    setUnlocked(getUnlocked());
  }, []);

  // Perf: measure dashboard data load (start on mount, end when loading clears).
  const perfDone = useRef(false);
  useEffect(() => {
    perf.mark("dashboard-start");
  }, []);
  useEffect(() => {
    if (!loading && !perfDone.current) {
      perfDone.current = true;
      perf.mark("dashboard-end");
      perf.measure("dashboard-load", "dashboard-start", "dashboard-end");
    }
  }, [loading]);

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "there";

  const greeting = GREETINGS[getTimeGreeting()];

  // Dynamic subtext based on what's going on.
  let subtext = "Ready to plan your next moment? ✨";
  if (ongoingEvents[0]) {
    subtext = `You have an ongoing event — ${ongoingEvents[0].title} 🔥`;
  } else if (upcomingEvents[0]) {
    const d = daysUntil(upcomingEvents[0]);
    if (d !== null && d >= 0 && d <= 7) {
      subtext = `📅 ${upcomingEvents[0].title} is coming up in ${d} day${d === 1 ? "" : "s"}!`;
    }
  }

  // Emoji stack from the 3 most recent events for the hero (fallback to globe).
  const heroEmojis = recentEvents
    .map((e) => e.cover_emoji || getEventColor(e.type).icon)
    .slice(0, 3);

  // Budget bars: up to 5 events with budget, sorted desc.
  const budgetEvents = [...events]
    .filter((e) => (e.budget || 0) > 0)
    .sort((a, b) => b.budget - a.budget);
  const maxBudget = budgetEvents[0]?.budget || 1;
  const budgetEventCount = budgetEvents.length;

  const lastCompleted = completedEvents[0];

  const spotlightIsOngoing = !!ongoingEvents[0];

  if (loading) return <DashboardSkeleton />;

  return (
    <>
      {/* A) HERO GREETING */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-br from-kiiya-bg to-white p-8 dark:border-[#2D2A3E] dark:from-[#0F0E17] dark:to-[#1A1825]">
        <div className="flex items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-sm font-medium text-kiiya-primary dark:text-[#A594F9]">
              {greeting},
            </p>
            <h1 className="mt-1 truncate text-3xl font-bold text-kiiya-dark dark:text-white">
              {displayName}
            </h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-[#A89EC9]">{subtext}</p>
          </div>
          <div className="hidden flex-shrink-0 sm:block">
            {heroEmojis.length > 0 ? (
              <div className="flex items-center -space-x-3">
                {heroEmojis.map((emoji, i) => (
                  <div
                    key={i}
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-100 bg-white text-3xl shadow-card dark:border-[#2D2A3E] dark:bg-[#221F32]"
                    style={{ zIndex: heroEmojis.length - i }}
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            ) : (
              <HeroIllustration />
            )}
          </div>
        </div>
      </div>

      {/* B) STATS ROW */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={Layers}
          iconWrap="bg-purple-100 text-kiiya-primary dark:bg-purple-900/30 dark:text-[#A594F9]"
          value={events.length}
          label="Total Events"
          sub="across all time"
        />
        <StatCard
          icon={Clock}
          iconWrap="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
          value={upcomingEvents.length}
          label="Upcoming"
          sub={
            upcomingEvents[0]
              ? `next: ${truncate(upcomingEvents[0].title, 20)}`
              : "nothing planned yet"
          }
        />
        <StatCard
          icon={Zap}
          iconWrap="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300"
          value={ongoingEvents.length}
          label="In Progress"
          sub={
            ongoingEvents[0]
              ? `${truncate(ongoingEvents[0].title, 16)} is happening`
              : "all quiet for now"
          }
        />
        <StatCard
          icon={CheckCircle}
          iconWrap="bg-orange-100 text-kiiya-warm dark:bg-orange-900/30 dark:text-orange-300"
          value={completedEvents.length}
          label="Completed"
          sub={
            lastCompleted
              ? `last: ${truncate(lastCompleted.title, 18)}`
              : "finish your first event!"
          }
        />
      </div>

      {/* C) NEXT EVENT SPOTLIGHT */}
      {nextEvent && (
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-kiiya-primary to-[#9B8DF8] p-6 text-white dark:from-[#2D1B69] dark:to-[#1A1458]">
          {/* decorative shapes */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white opacity-10" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                {spotlightIsOngoing ? "Happening now" : "Next up"}
              </p>
              <div className="mt-2 text-4xl">
                {nextEvent.cover_emoji || getEventColor(nextEvent.type).icon}
              </div>
              <h2 className="mt-2 truncate text-2xl font-bold">{nextEvent.title}</h2>
              <p className="mt-1 text-sm opacity-80">
                {formatDateRange(nextEvent.start_date, nextEvent.end_date)}
              </p>
              <p className="mt-1 text-sm opacity-70">
                Budget: {formatRupiah(nextEvent.budget)}
              </p>
            </div>
            <div className="flex flex-shrink-0 flex-col items-start gap-4 sm:items-center">
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white/15 text-center backdrop-blur">
                {spotlightIsOngoing ? (
                  (() => {
                    const total =
                      nextEvent.start_date && nextEvent.end_date
                        ? Math.max(
                            1,
                            Math.round(
                              (new Date(nextEvent.end_date) -
                                new Date(nextEvent.start_date)) /
                                86400000
                            ) + 1
                          )
                        : 1;
                    const elapsed =
                      Math.round(
                        (new Date().setHours(0, 0, 0, 0) -
                          new Date(nextEvent.start_date).setHours(0, 0, 0, 0)) /
                          86400000
                      ) + 1;
                    const day = Math.min(Math.max(elapsed, 1), total);
                    return (
                      <>
                        <span className="text-2xl font-bold">Day {day}</span>
                        <span className="text-xs opacity-80">of {total}</span>
                      </>
                    );
                  })()
                ) : (
                  (() => {
                    const d = daysUntil(nextEvent);
                    return (
                      <>
                        <span className="text-3xl font-bold">{d ?? "—"}</span>
                        <span className="text-xs opacity-80">
                          {d === 0 ? "today!" : `day${d === 1 ? "" : "s"} to go`}
                        </span>
                      </>
                    );
                  })()
                )}
              </div>
              <button
                onClick={() => router.push(`/dashboard/events/${nextEvent.id}`)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/30"
              >
                Open Event <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C2) ON THIS DAY */}
      <AsyncErrorBoundary>
        <OnThisDayWidget />
      </AsyncErrorBoundary>

      {/* D) RECENT ACTIVITY */}
      {recentEvents.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-kiiya-dark dark:text-white">
              Recent Events
            </h2>
            <Link
              href="/planning"
              className="inline-flex items-center gap-1 text-sm font-semibold text-kiiya-primary hover:underline dark:text-[#A594F9]"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white dark:border-[#2D2A3E] dark:bg-[#1A1825]">
            {recentEvents.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="flex items-center gap-3 border-b border-purple-50 px-4 py-3 transition-colors last:border-b-0 hover:bg-purple-50 dark:border-[#2D2A3E] dark:hover:bg-[#221F32]"
              >
                <Thumb event={event} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-kiiya-dark dark:text-white">
                    {event.title}
                  </p>
                  <p className="truncate text-xs text-gray-400 dark:text-[#6B6480]">
                    {formatDateRange(event.start_date, event.end_date)}
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[event.status]}`}
                  >
                    {event.status}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-[#6B6480]">
                    {formatRupiah(event.budget)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* E) QUICK ACTIONS */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-kiiya-dark dark:text-white">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <ActionCard
            icon={Plus}
            iconWrap="bg-kiiya-primary text-white"
            label="New Event"
            sub="Start planning"
            onClick={() => setShowNewEvent(true)}
          />
          <ActionCard
            icon={CalendarDays}
            iconWrap="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
            label="Calendar"
            sub="View schedule"
            onClick={() => router.push("/calendar")}
          />
          <ActionCard
            icon={ClipboardList}
            iconWrap="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300"
            label="My Events"
            sub="All events"
            onClick={() => router.push("/planning")}
          />
          <ActionCard
            icon={UserCircle}
            iconWrap="bg-orange-100 text-kiiya-warm dark:bg-orange-900/30 dark:text-orange-300"
            label="Profile"
            sub="Settings & more"
            onClick={() => router.push("/profile")}
          />
        </div>
      </div>

      {/* F) BUDGET OVERVIEW */}
      {budgetEventCount > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-kiiya-dark dark:text-white">
            Budget Overview
          </h2>
          <div className="rounded-2xl border border-purple-100 bg-white p-6 dark:border-[#2D2A3E] dark:bg-[#1A1825]">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-[#6B6480]">
                  Total Planned Budget
                </p>
                <p className="mt-1 text-2xl font-bold text-kiiya-dark dark:text-white">
                  {formatRupiah(totalBudget)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-[#6B6480]">
                  Events with budget
                </p>
                <p className="mt-1 text-2xl font-bold text-kiiya-dark dark:text-white">
                  {budgetEventCount}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {budgetEvents.slice(0, 5).map((event) => {
                const colors = getEventColor(event.type);
                const pct = Math.max(8, Math.round((event.budget / maxBudget) * 100));
                return (
                  <div key={event.id}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="min-w-0 truncate font-medium text-kiiya-dark dark:text-[#F0EEFF]">
                        {event.cover_emoji || colors.icon} {event.title}
                      </span>
                      <span className="flex-shrink-0 font-semibold text-gray-500 dark:text-[#A89EC9]">
                        {formatRupiah(event.budget)}
                      </span>
                    </div>
                    <div className="h-8 w-full overflow-hidden rounded-full bg-purple-50 dark:bg-[#221F32]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${colors.hex}, ${colors.hex}cc)`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* G) ACHIEVEMENTS TEASER */}
      {Object.keys(unlocked).length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-kiiya-dark dark:text-white">
              Achievements
            </h2>
            <Link
              href="/profile#achievements"
              className="inline-flex items-center gap-1 text-sm font-semibold text-kiiya-primary hover:underline dark:text-[#A594F9]"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {ACHIEVEMENTS.slice(0, 6).map((a) => {
              const isUnlocked = !!unlocked[a.id];
              return (
                <div
                  key={a.id}
                  className={`flex min-w-[120px] flex-shrink-0 flex-col items-center gap-1 rounded-xl border border-purple-100 bg-white p-3 text-center dark:border-[#2D2A3E] dark:bg-[#1A1825] ${
                    isUnlocked ? "" : "opacity-50 grayscale"
                  }`}
                >
                  <span className="text-2xl">{a.emoji}</span>
                  <span className="text-xs font-semibold text-kiiya-dark dark:text-[#F0EEFF]">
                    {a.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Event modal */}
      <NewEventModal
        isOpen={showNewEvent}
        onClose={() => setShowNewEvent(false)}
        onSuccess={(newEvent) =>
          router.push(`/dashboard/events/${newEvent.id}`)
        }
        createEvent={createEvent}
      />
    </>
  );
}
