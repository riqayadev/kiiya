"use client";
import { useMemo, useState } from "react";
import { Calendar, Clock, Zap, CheckCircle, Plus, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useEvents } from "@/hooks/useEvents";
import { t } from "@/utils/i18n";
import { eventColors, statusColors } from "@/utils/eventColors";
import { formatRupiah, formatDateRange, getTimeGreeting } from "@/utils/format";
import NewEventModal from "@/components/ui/NewEventModal";

const FILTERS = ["all", "upcoming", "ongoing", "completed"];

function getDisplayName(user) {
  return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";
}

function EventsSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-100" />
      ))}
    </div>
  );
}

export default function Dashboard() {
  useLang();
  const { user } = useAuth();
  const { events, loading, error, fetchEvents, createEvent } = useEvents();
  const [filter, setFilter] = useState("all");
  const [showNewEventModal, setShowNewEventModal] = useState(false);

  const stats = useMemo(
    () => ({
      total: events.length,
      upcoming: events.filter((e) => e.status === "upcoming").length,
      ongoing: events.filter((e) => e.status === "ongoing").length,
      completed: events.filter((e) => e.status === "completed").length,
    }),
    [events]
  );

  const filtered =
    filter === "all" ? events : events.filter((e) => e.status === filter);

  const name = getDisplayName(user);
  const greeting = t(`dashboard.good.${getTimeGreeting()}`);

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
            {greeting}, {name}! 👋
          </h1>
          <p className="mt-1 text-gray-500">{t("dashboard.greetingSub")}</p>
        </div>
        <button
          onClick={() => setShowNewEventModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-kiiya-primary px-5 py-3 font-semibold text-white shadow-sm transition hover:opacity-90"
        >
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

      {/* D) CONTENT: loading / error / empty / grid */}
      {loading ? (
        <EventsSkeleton />
      ) : error ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <p className="mt-4 font-semibold text-kiiya-dark">
            Something went wrong
          </p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchEvents}
            className="mt-6 rounded-xl bg-kiiya-primary px-5 py-2.5 font-semibold text-white transition hover:opacity-90"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-purple-200 bg-white py-16 text-center">
          <span className="text-5xl">🗺️</span>
          <h3 className="mt-4 text-xl font-bold text-kiiya-dark">
            {t("dashboard.noEvents")}
          </h3>
          <p className="mt-2 max-w-sm text-gray-500">
            {t("dashboard.noEventsSub")}
          </p>
          <button
            onClick={() => setShowNewEventModal(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-kiiya-primary px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            <Plus className="h-5 w-5" />
            {t("dashboard.createFirst")}
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => {
            const colors = eventColors[event.type] ?? eventColors.custom;
            return (
              <div
                key={event.id}
                className="overflow-hidden rounded-2xl border border-purple-100 bg-white transition hover:scale-[1.01] hover:shadow-lg"
              >
                {/* Cover */}
                <div
                  className={`flex h-28 items-center justify-center bg-gradient-to-br text-5xl ${colors.gradient}`}
                >
                  {event.cover_emoji || colors.icon}
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
                    {formatDateRange(event.start_date, event.end_date)}
                  </p>

                  <p className="mt-3 text-sm font-semibold text-kiiya-dark">
                    {formatRupiah(event.budget)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Event modal */}
      <NewEventModal
        isOpen={showNewEventModal}
        onClose={() => setShowNewEventModal(false)}
        onSuccess={() => fetchEvents()}
        createEvent={createEvent}
      />
    </>
  );
}
