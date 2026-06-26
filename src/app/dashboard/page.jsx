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
  Star,
  Sparkles,
  ArrowRight,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useAuth } from "@/hooks/useAuth";
import { useEvents } from "@/hooks/useEvents";
import { createClient } from "@/lib/supabase/client";
import { getEventColor } from "@/utils/eventColors";
import { formatDateRange, getTimeGreeting } from "@/utils/format";
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

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="kiiya-skeleton h-20 rounded-3xl" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="kiiya-skeleton h-32 rounded-3xl" />
        ))}
      </div>
      <div className="kiiya-skeleton h-60 rounded-3xl" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 [grid-auto-rows:160px]">
        <div className="kiiya-skeleton col-span-2 row-span-2 rounded-3xl" />
        <div className="kiiya-skeleton rounded-3xl" />
        <div className="kiiya-skeleton rounded-3xl" />
        <div className="kiiya-skeleton col-span-2 rounded-3xl" />
      </div>
    </div>
  );
}

// Full-bleed cover: photo when available, else gradient + emoji hero.
function CoverFill({ event, emojiSize = "text-5xl" }) {
  const colors = getEventColor(event.type);
  if (event.cover_image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={event.cover_image_url}
        alt={event.title}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${colors.gradient} ${emojiSize}`}
    >
      {event.cover_emoji || colors.icon}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className="rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
      {status}
    </span>
  );
}

// Magazine-style event card — the whole card is a cover, title overlays the
// bottom with a gradient scrim. Fills its grid cell.
function MagazineCard({ event }) {
  return (
    <Link
      href={`/dashboard/events/${event.id}`}
      className="card-hover group relative block h-full min-h-[160px] overflow-hidden rounded-3xl bg-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:bg-[#1A1725]"
    >
      <CoverFill event={event} />
      {/* Scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
      {/* Status badge */}
      <div className="absolute left-3 top-3 z-10">
        <StatusBadge status={event.status} />
      </div>
      {/* Bottom overlay */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4">
        <h3 className="line-clamp-2 font-jakarta text-lg font-bold leading-tight text-white drop-shadow">
          {event.title}
        </h3>
        <p className="mt-1 truncate text-xs font-medium text-white/80">
          {formatDateRange(event.start_date, event.end_date) || "No date set"}
        </p>
      </div>
    </Link>
  );
}

function StatCard({ icon: Icon, value, label, accent, trend }) {
  return (
    <div
      className="rounded-3xl border-l-4 bg-white p-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:bg-[#1A1725]"
      style={{ borderLeftColor: accent }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </div>
        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-500">
          <TrendingUp className="h-3 w-3" /> {trend}
        </span>
      </div>
      <p
        className="mt-4 font-jakarta text-4xl font-extrabold"
        style={{ color: accent }}
      >
        {value}
      </p>
      <p className="mt-0.5 text-sm font-medium text-gray-400 dark:text-[#6B6480]">
        {label}
      </p>
    </div>
  );
}

function QuickAction({ icon: Icon, label, tintBg, tintText, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex min-w-[140px] flex-col gap-2 rounded-2xl p-4 text-left transition hover:scale-[1.02]"
      style={{ backgroundColor: tintBg }}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: tintText, color: "#fff" }}
      >
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </span>
      <span
        className="font-jakarta text-sm font-semibold"
        style={{ color: tintText }}
      >
        {label}
      </span>
    </button>
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
        .select("full_name")
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
  const firstName = displayName.split(" ")[0];

  const greeting = GREETINGS[getTimeGreeting()];

  const datePill = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Dynamic subtext: spotlight a near event, else summarize the upcoming count.
  let subtext = `You have ${upcomingEvents.length} upcoming event${
    upcomingEvents.length === 1 ? "" : "s"
  }`;
  if (ongoingEvents[0]) {
    subtext = `🔥 ${ongoingEvents[0].title} is happening right now`;
  } else if (upcomingEvents[0]) {
    const d = daysUntil(upcomingEvents[0]);
    if (d !== null && d >= 0 && d <= 7) {
      subtext = `✈️ ${upcomingEvents[0].title} is in ${d} day${
        d === 1 ? "" : "s"
      }`;
    }
  }

  // Magazine grid — newest events first (own derivation, capped for the layout).
  const recentGrid = [...events]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);
  const useAsymmetric = recentGrid.length >= 4;
  const span = (i) => {
    if (!useAsymmetric) return "";
    if (i === 0) return "col-span-2 row-span-2";
    if (i === 3) return "col-span-2";
    return "";
  };

  const spotlightIsOngoing = !!ongoingEvents[0];

  if (loading) return <DashboardSkeleton />;

  return (
    <>
      {/* A) HERO GREETING */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-jakarta text-3xl font-bold text-kiiya-dark dark:text-white">
            {greeting}, {firstName} 👋
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500 dark:text-[#A89EC9]">
            {subtext}
          </p>
        </div>
        <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-400 shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:bg-[#1A1725] dark:text-[#6B6480]">
          <CalendarDays className="h-3.5 w-3.5" />
          {datePill}
        </span>
      </div>

      {/* B) STATS ROW */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={Layers}
          value={events.length}
          label="Total Events"
          accent="#7C6EF5"
          trend="12%"
        />
        <StatCard
          icon={Clock}
          value={upcomingEvents.length}
          label="Upcoming"
          accent="#F0956A"
          trend="8%"
        />
        <StatCard
          icon={Zap}
          value={ongoingEvents.length}
          label="In Progress"
          accent="#E8A0BF"
          trend="3%"
        />
        <StatCard
          icon={CheckCircle}
          value={completedEvents.length}
          label="Completed"
          accent="#2DD4BF"
          trend="5%"
        />
      </div>

      {/* C) NEXT EVENT SPOTLIGHT */}
      {nextEvent && (
        <div className="relative mb-8 h-56 overflow-hidden rounded-3xl bg-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:bg-[#1A1725] md:h-64">
          <CoverFill event={nextEvent} emojiSize="text-7xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
            <span className="rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
              {spotlightIsOngoing ? "Happening now" : "Next up"}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-jakarta text-2xl font-bold text-white drop-shadow">
                {nextEvent.title}
              </h2>
              <p className="mt-1 text-sm font-medium text-white/85">
                {formatDateRange(nextEvent.start_date, nextEvent.end_date)}
                {!spotlightIsOngoing &&
                  daysUntil(nextEvent) !== null &&
                  daysUntil(nextEvent) >= 0 &&
                  ` · in ${daysUntil(nextEvent)} day${
                    daysUntil(nextEvent) === 1 ? "" : "s"
                  }`}
              </p>
              {nextEvent.location && (
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-white/75">
                  <MapPin className="h-3.5 w-3.5" />
                  {nextEvent.location}
                </p>
              )}
            </div>
            <button
              onClick={() => router.push(`/dashboard/events/${nextEvent.id}`)}
              className="inline-flex flex-shrink-0 items-center gap-1.5 self-start rounded-full bg-white px-4 py-2 text-sm font-semibold text-kiiya-dark shadow-sm transition hover:bg-white/90 sm:self-auto"
            >
              Open Event <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* C2) ON THIS DAY */}
      <AsyncErrorBoundary>
        <OnThisDayWidget />
      </AsyncErrorBoundary>

      {/* D) RECENT EVENTS — magazine grid */}
      {recentGrid.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-jakarta text-lg font-bold text-kiiya-dark dark:text-white">
              Recent Events
            </h2>
            <Link
              href="/planning"
              className="inline-flex items-center gap-1 text-sm font-semibold text-kiiya-primary hover:underline dark:text-[#A594F9]"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div
            className={
              useAsymmetric
                ? "grid grid-cols-2 gap-4 md:grid-cols-4 [grid-auto-rows:160px]"
                : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 [grid-auto-rows:200px]"
            }
          >
            {recentGrid.map((event, i) => (
              <div key={event.id} className={span(i)}>
                <MagazineCard event={event} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* E) QUICK ACTIONS */}
      <div className="mb-8">
        <h2 className="mb-4 font-jakarta text-lg font-bold text-kiiya-dark dark:text-white">
          Quick Actions
        </h2>
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 scrollbar-hide md:grid md:grid-cols-4 md:overflow-visible">
          <QuickAction
            icon={Plus}
            label="New Event"
            tintBg="rgba(124,110,245,0.1)"
            tintText="#7C6EF5"
            onClick={() => setShowNewEvent(true)}
          />
          <QuickAction
            icon={Star}
            label="Add to Wishlist"
            tintBg="rgba(240,149,106,0.1)"
            tintText="#F0956A"
            onClick={() => router.push("/dashboard/wishlist")}
          />
          <QuickAction
            icon={CalendarDays}
            label="Open Calendar"
            tintBg="rgba(45,212,191,0.1)"
            tintText="#2DD4BF"
            onClick={() => router.push("/calendar")}
          />
          <QuickAction
            icon={Sparkles}
            label="Year Wrapped"
            tintBg="rgba(232,160,191,0.1)"
            tintText="#E8A0BF"
            onClick={() => router.push("/dashboard/wrapped")}
          />
        </div>
      </div>

      {/* F) ACHIEVEMENTS TEASER (small strip) */}
      {Object.keys(unlocked).length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-jakarta text-lg font-bold text-kiiya-dark dark:text-white">
              Achievements
            </h2>
            <Link
              href="/profile#achievements"
              className="inline-flex items-center gap-1 text-sm font-semibold text-kiiya-primary hover:underline dark:text-[#A594F9]"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {ACHIEVEMENTS.slice(0, 6).map((a) => {
              const isUnlocked = !!unlocked[a.id];
              return (
                <div
                  key={a.id}
                  className={`flex min-w-[120px] flex-shrink-0 flex-col items-center gap-1 rounded-2xl bg-white p-3 text-center shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:bg-[#1A1725] ${
                    isUnlocked ? "" : "opacity-50 grayscale"
                  }`}
                >
                  <span className="text-2xl">{a.emoji}</span>
                  <span className="font-jakarta text-xs font-semibold text-kiiya-dark dark:text-[#F0EEFF]">
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
