"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Zap,
  CheckCircle,
  Plus,
  AlertCircle,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useEvents } from "@/hooks/useEvents";
import { t } from "@/utils/i18n";
import { eventColors, statusColors } from "@/utils/eventColors";
import { formatRupiah, formatDateRange, getTimeGreeting } from "@/utils/format";
import NewEventModal from "@/components/ui/NewEventModal";
import EditEventModal from "@/components/ui/EditEventModal";

const FILTERS = ["all", "upcoming", "ongoing", "completed"];
const STATUSES = ["upcoming", "ongoing", "completed", "archived"];

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

function CardMenu({ event, onEdit, onStatus, onDelete }) {
  const [open, setOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="absolute right-2 top-2 z-10" ref={ref}>
      <button
        onClick={(e) => {
          stop(e);
          setOpen((o) => !o);
        }}
        aria-label="Event menu"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-kiiya-dark opacity-0 shadow-sm backdrop-blur transition hover:bg-white group-hover:opacity-100"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-9 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
          onClick={stop}
        >
          <button
            onClick={(e) => {
              stop(e);
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-kiiya-dark transition hover:bg-purple-50"
          >
            <Pencil className="h-4 w-4" />
            {t("eventDetail.edit")}
          </button>

          {/* Change status with submenu */}
          <div
            className="relative"
            onMouseEnter={() => setStatusOpen(true)}
            onMouseLeave={() => setStatusOpen(false)}
          >
            <button
              onClick={(e) => {
                stop(e);
                setStatusOpen((s) => !s);
              }}
              className="flex w-full items-center justify-between px-4 py-2 text-sm text-kiiya-dark transition hover:bg-purple-50"
            >
              <span>{t("editEvent.status")}</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            {statusOpen && (
              <div className="absolute right-full top-0 mr-1 w-40 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={(e) => {
                      stop(e);
                      setOpen(false);
                      setStatusOpen(false);
                      if (s !== event.status) onStatus(s);
                    }}
                    className={`flex w-full items-center px-4 py-2 text-sm transition hover:bg-purple-50 ${
                      s === event.status
                        ? "font-semibold text-kiiya-primary"
                        : "text-kiiya-dark"
                    }`}
                  >
                    {t(`dashboard.status.${s}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              stop(e);
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  useLang();
  const { user } = useAuth();
  const { events, loading, error, fetchEvents, createEvent, updateEvent, deleteEvent } =
    useEvents();
  const [filter, setFilter] = useState("all");
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);

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

  const handleDelete = async (event) => {
    if (!confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    try {
      await deleteEvent(event.id);
    } catch (e) {
      alert(e.message);
    }
  };

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

      {/* D) CONTENT */}
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
                className="group relative overflow-hidden rounded-2xl border border-purple-100 bg-white transition hover:shadow-lg"
              >
                <CardMenu
                  event={event}
                  onEdit={() => setEditEvent(event)}
                  onStatus={(status) =>
                    updateEvent(event.id, { status }).catch((e) =>
                      alert(e.message)
                    )
                  }
                  onDelete={() => handleDelete(event)}
                />
                <Link
                  href={`/dashboard/events/${event.id}`}
                  className="block cursor-pointer"
                >
                  {/* Cover */}
                  {event.cover_image_url ? (
                    <div className="relative h-28">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={`flex h-28 items-center justify-center bg-gradient-to-br text-5xl ${colors.gradient}`}
                    >
                      {event.cover_emoji || colors.icon}
                    </div>
                  )}

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
                </Link>
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

      {/* Edit Event modal */}
      <EditEventModal
        isOpen={!!editEvent}
        event={editEvent}
        onClose={() => setEditEvent(null)}
        onSubmit={(updates) => updateEvent(editEvent.id, updates)}
      />
    </>
  );
}
