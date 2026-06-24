"use client";
import { useMemo, useState } from "react";
import { Calendar, Clock, Zap, CheckCircle, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { t } from "@/utils/i18n";
import { eventColors, statusColors } from "@/utils/eventColors";

// Dummy events — replaced by Supabase data later.
const DUMMY_EVENTS = [
  { id: 1, title: "Bali Trip 2026", type: "trip", status: "upcoming", startDate: "2026-08-15", endDate: "2026-08-22", budget: 5000000, cover: "✈️" },
  { id: 2, title: "Anniversary Dinner", type: "anniversary", status: "ongoing", startDate: "2026-06-24", endDate: "2026-06-24", budget: 500000, cover: "💑" },
  { id: 3, title: "Graduation Trip", type: "graduation", status: "completed", startDate: "2026-05-01", endDate: "2026-05-07", budget: 3000000, cover: "🎓" },
  { id: 4, title: "Wedding Planning", type: "wedding", status: "upcoming", startDate: "2027-12-12", endDate: "2027-12-12", budget: 50000000, cover: "💍" },
];

const FILTERS = ["all", "upcoming", "ongoing", "completed"];

function formatRupiah(value) {
  return "Rp " + value.toLocaleString("id-ID");
}

function formatDateRange(start, end) {
  const opts = { day: "numeric", month: "short", year: "numeric" };
  const s = new Date(start).toLocaleDateString("en-GB", opts);
  if (start === end) return s;
  const e = new Date(end).toLocaleDateString("en-GB", opts);
  return `${s} – ${e}`;
}

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "dashboard.good.morning";
  if (h < 18) return "dashboard.good.afternoon";
  return "dashboard.good.evening";
}

function getDisplayName(user) {
  return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";
}

export default function Dashboard() {
  useLang();
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");

  // Stable random budget progress per event (won't change on re-render/filter).
  const progressById = useMemo(() => {
    const map = {};
    DUMMY_EVENTS.forEach((e) => {
      map[e.id] = Math.floor(Math.random() * 81);
    });
    return map;
  }, []);

  const stats = useMemo(() => {
    return {
      total: DUMMY_EVENTS.length,
      upcoming: DUMMY_EVENTS.filter((e) => e.status === "upcoming").length,
      ongoing: DUMMY_EVENTS.filter((e) => e.status === "ongoing").length,
      completed: DUMMY_EVENTS.filter((e) => e.status === "completed").length,
    };
  }, []);

  const filtered =
    filter === "all"
      ? DUMMY_EVENTS
      : DUMMY_EVENTS.filter((e) => e.status === filter);

  const name = getDisplayName(user);

  const statCards = [
    { icon: Calendar, value: stats.total, label: t("dashboard.stats.totalEvents") },
    { icon: Clock, value: stats.upcoming, label: t("dashboard.stats.upcoming") },
    { icon: Zap, value: stats.ongoing, label: t("dashboard.ongoing") },
    { icon: CheckCircle, value: stats.completed, label: t("dashboard.stats.completed") },
  ];

  return (
    <>
      {/* A) HEADER ROW */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kiiya-dark md:text-3xl">
            {t(greetingKey())}, {name}! 👋
          </h1>
          <p className="mt-1 text-gray-500">{t("dashboard.greetingSub")}</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-kiiya-primary px-5 py-3 font-semibold text-white shadow-sm transition hover:opacity-90">
          <Plus className="h-5 w-5" />
          {t("dashboard.newEvent")}
        </button>
      </div>

      {/* B) STATS ROW */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="rounded-2xl border border-purple-100 bg-white p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-kiiya-primary">
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-3xl font-bold text-kiiya-dark">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* C) FILTER TABS */}
      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const label =
            f === "all" ? t("dashboard.filter.all") : t(`dashboard.status.${f}`);
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-kiiya-primary text-white"
                  : "border border-purple-100 bg-white text-kiiya-dark/70 hover:border-kiiya-primary/40"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* D) EVENT CARDS GRID / E) EMPTY STATE */}
      {filtered.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-purple-200 bg-white py-16 text-center">
          <span className="text-5xl">🗺️</span>
          <h3 className="mt-4 text-xl font-bold text-kiiya-dark">
            {t("dashboard.noEvents")}
          </h3>
          <p className="mt-2 max-w-sm text-gray-500">
            {t("dashboard.noEventsSub")}
          </p>
          <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-kiiya-primary px-5 py-3 font-semibold text-white transition hover:opacity-90">
            <Plus className="h-5 w-5" />
            {t("dashboard.createFirst")}
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => {
            const colors = eventColors[event.type] ?? eventColors.custom;
            const progress = progressById[event.id];
            return (
              <div
                key={event.id}
                className="overflow-hidden rounded-2xl border border-purple-100 bg-white transition hover:scale-[1.01] hover:shadow-lg"
              >
                {/* Cover */}
                <div
                  className={`flex h-28 items-center justify-center bg-gradient-to-br text-5xl ${colors.gradient}`}
                >
                  {event.cover}
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[event.status]}`}
                    >
                      {t(`dashboard.status.${event.status}`)}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${colors.badge} border-transparent`}
                    >
                      {colors.icon} {t(`dashboard.eventTypes.${event.type}`)}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-semibold text-kiiya-dark">
                    {event.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatDateRange(event.startDate, event.endDate)}
                  </p>

                  <p className="mt-3 text-sm font-semibold text-kiiya-dark">
                    {formatRupiah(event.budget)}
                  </p>
                  {/* Budget progress bar */}
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-purple-100">
                    <div
                      className="h-full rounded-full bg-kiiya-primary"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{progress}% used</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
