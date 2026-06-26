"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown,
  Timer,
  Search,
  X,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useEvents } from "@/hooks/useEvents";
import { t } from "@/utils/i18n";
import { getEventColor, statusColors } from "@/utils/eventColors";
import { formatDateRange } from "@/utils/format";
import NewEventModal from "@/components/ui/NewEventModal";
import EditEventModal from "@/components/ui/EditEventModal";
import OnboardingModal from "@/components/ui/OnboardingModal";
import Skeleton from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import { perf } from "@/utils/perf";

const FILTERS = ["all", "upcoming", "ongoing", "completed"];
const STATUSES = ["upcoming", "ongoing", "completed", "archived"];
const SORTS = ["newest", "oldest", "az", "date"];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

// Compact IDR for list rows: "Rp 2,5jt" for ≥ 1jt, full id-ID format otherwise.
function formatBudgetShort(amount) {
  if (!amount) return null;
  if (amount >= 1_000_000) {
    const jt = (amount / 1_000_000).toFixed(1).replace(/\.0$/, "").replace(".", ",");
    return `Rp ${jt}jt`;
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Shared centered empty-state block (no events / no filter match / no search match).
function EmptyState({ emoji, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-7xl">{emoji}</div>
      <h3 className="font-jakarta text-xl font-bold text-gray-700 dark:text-gray-200">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-xs text-sm text-gray-400 dark:text-gray-500">
        {subtitle}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

function EventsSkeleton({ view }) {
  if (view === "grid") {
    return (
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-3xl" />
        ))}
      </div>
    );
  }
  return (
    <div className="mt-6 space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-2xl" />
      ))}
    </div>
  );
}

function EventMenu({ event, onEdit, onStatus, onDelete, dark }) {
  const [open, setOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setStatusOpen(false);
        setConfirmDelete(false);
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
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          stop(e);
          setConfirmDelete(false);
          setOpen((o) => !o);
        }}
        aria-label="Event menu"
        className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
          dark
            ? "border border-white/30 bg-white/20 text-white backdrop-blur-md hover:bg-white/30"
            : "text-kiiya-dark hover:bg-purple-50 dark:text-[#A89EC9] dark:hover:bg-[#221F32]"
        }`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg dark:border-[#2D2A3E] dark:bg-[#1A1825]"
          onClick={stop}
        >
          {confirmDelete ? (
            // Inline delete confirmation (replaces the menu items).
            <div className="px-3 py-2.5">
              <p className="mb-2.5 text-sm font-medium text-red-600 dark:text-red-400">
                Delete this event?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    stop(e);
                    setConfirmDelete(false);
                    setOpen(false);
                  }}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-[#2D2A3E] dark:text-[#A89EC9] dark:hover:bg-[#221F32]"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    stop(e);
                    setConfirmDelete(false);
                    setOpen(false);
                    onDelete();
                  }}
                  className="flex-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={(e) => {
                  stop(e);
                  setOpen(false);
                  onEdit();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-kiiya-dark transition hover:bg-purple-50 dark:text-[#F0EEFF] dark:hover:bg-[#221F32]"
              >
                <Pencil className="h-4 w-4" />
                {t("eventDetail.edit")}
              </button>

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
                  className="flex w-full items-center justify-between px-4 py-2 text-sm text-kiiya-dark transition hover:bg-purple-50 dark:text-[#F0EEFF] dark:hover:bg-[#221F32]"
                >
                  <span>{t("editEvent.status")}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
                {statusOpen && (
                  <div className="absolute right-full top-0 mr-1 w-40 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg dark:border-[#2D2A3E] dark:bg-[#1A1825]">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={(e) => {
                          stop(e);
                          setOpen(false);
                          setStatusOpen(false);
                          if (s !== event.status) onStatus(s);
                        }}
                        className={`flex w-full items-center px-4 py-2 text-sm transition hover:bg-purple-50 dark:hover:bg-[#221F32] ${
                          s === event.status
                            ? "font-semibold text-kiiya-primary"
                            : "text-kiiya-dark dark:text-[#F0EEFF]"
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
                  setStatusOpen(false);
                  setConfirmDelete(true);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EventRow({ event, onOpen, onEdit, onStatus, onDelete }) {
  const colors = getEventColor(event.type);
  const dateText =
    formatDateRange(event.start_date, event.end_date) || "No date";
  const budgetText = formatBudgetShort(event.budget);
  return (
    <div
      onClick={onOpen}
      className="group flex cursor-pointer items-center gap-3 border-l-2 border-transparent px-4 py-3 transition-colors hover:border-kiiya-primary hover:bg-[#7C6EF5]/[0.03] dark:hover:bg-white/5"
    >
      {/* Thumbnail */}
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl">
        {event.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_image_url}
            alt={event.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br text-2xl ${colors.gradient}`}
          >
            {event.cover_emoji || colors.icon}
          </div>
        )}
      </div>

      {/* Title + type */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-jakarta text-sm font-semibold text-gray-900 dark:text-gray-100">
          {event.title}
        </p>
        <p className="truncate text-xs text-gray-400 dark:text-gray-500">
          {colors.icon} {event.type}
        </p>
      </div>

      {/* Date range */}
      <span className="hidden flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 sm:block">
        {dateText}
      </span>

      {/* Budget (hidden when none) */}
      {budgetText && (
        <span className="hidden flex-shrink-0 text-xs font-medium text-gray-600 dark:text-gray-300 md:block">
          {budgetText}
        </span>
      )}

      {/* Status badge */}
      <span
        className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[event.status]}`}
      >
        {t(`dashboard.status.${event.status}`)}
      </span>

      {/* ⋯ menu */}
      <div onClick={(e) => e.stopPropagation()}>
        <EventMenu
          event={event}
          onEdit={onEdit}
          onStatus={onStatus}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

function EventCard({ event, onEdit, onStatus, onDelete }) {
  const colors = getEventColor(event.type);
  const budgetText = formatBudgetShort(event.budget);
  return (
    <div className="card-hover group relative overflow-hidden rounded-3xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_40px_rgba(124,110,245,0.15)] dark:bg-[#1A1725]">
      {/* Cover (≈65% of card) with status badge + menu overlaid */}
      <Link
        href={`/dashboard/events/${event.id}`}
        className="relative block h-44 cursor-pointer"
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
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br text-6xl ${colors.gradient}`}
          >
            {event.cover_emoji || colors.icon}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
          {t(`dashboard.status.${event.status}`)}
        </span>
      </Link>

      {/* Menu (sits above the cover link) */}
      <div className="absolute right-3 top-3 z-10">
        <EventMenu
          event={event}
          onEdit={onEdit}
          onStatus={onStatus}
          onDelete={onDelete}
          dark
        />
      </div>

      {/* Bottom info */}
      <Link
        href={`/dashboard/events/${event.id}`}
        className="block cursor-pointer p-4"
      >
        <h3 className="truncate font-jakarta text-base font-semibold text-kiiya-dark dark:text-white">
          {event.title}
        </h3>
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500 dark:text-[#6B6480]">
          📅 {formatDateRange(event.start_date, event.end_date) || "No date"}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-kiiya-dark dark:text-[#A89EC9]">
            {budgetText ? `💰 ${budgetText}` : "—"}
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7C6EF5]/10 text-kiiya-primary transition group-hover:bg-kiiya-primary group-hover:text-white">
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </div>
  );
}

export default function Planning() {
  useLang();
  const router = useRouter();
  const { events, loading, error, fetchEvents, createEvent, updateEvent, deleteEvent } =
    useEvents();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Perf: measure planning data load.
  const perfDone = useRef(false);
  useEffect(() => {
    perf.mark("planning-start");
  }, []);
  useEffect(() => {
    if (!loading && !perfDone.current) {
      perfDone.current = true;
      perf.mark("planning-end");
      perf.measure("planning-load", "planning-start", "planning-end");
    }
  }, [loading]);

  // Show onboarding once, on first visit.
  useEffect(() => {
    if (!localStorage.getItem("kiiya_onboarded")) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (!sortOpen) return;
    const onDoc = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [sortOpen]);

  const finishOnboarding = () => {
    localStorage.setItem("kiiya_onboarded", "1");
    setShowOnboarding(false);
  };

  const stats = useMemo(
    () => ({
      total: events.length,
      upcoming: events.filter((e) => e.status === "upcoming").length,
      ongoing: events.filter((e) => e.status === "ongoing").length,
      completed: events.filter((e) => e.status === "completed").length,
    }),
    [events]
  );

  // Nearest upcoming event within 30 days → countdown banner.
  const countdown = useMemo(() => {
    const candidates = events
      .map((e) => ({ e, d: daysUntil(e.start_date) }))
      .filter(({ d }) => d !== null && d >= 0 && d <= 30)
      .sort((a, b) => a.d - b.d);
    return candidates[0] || null;
  }, [events]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let base =
      filter === "all" ? events : events.filter((e) => e.status === filter);
    // Realtime title search applies on top of the active tab filter.
    if (q) base = base.filter((e) => (e.title || "").toLowerCase().includes(q));
    const sorted = [...base];
    sorted.sort((a, b) => {
      if (sort === "az") return (a.title || "").localeCompare(b.title || "");
      if (sort === "date")
        return (a.start_date || "") < (b.start_date || "") ? -1 : 1;
      if (sort === "oldest")
        return (a.created_at || "") < (b.created_at || "") ? -1 : 1;
      return (a.created_at || "") > (b.created_at || "") ? -1 : 1; // newest
    });
    return sorted;
  }, [events, filter, sort, searchQuery]);

  const statCards = [
    { icon: Calendar, value: stats.total, label: t("dashboard.stats.totalEvents"), accent: "#7C6EF5" },
    { icon: Clock, value: stats.upcoming, label: t("dashboard.stats.upcoming"), accent: "#F0956A" },
    { icon: Zap, value: stats.ongoing, label: t("dashboard.ongoing"), accent: "#E8A0BF" },
    { icon: CheckCircle, value: stats.completed, label: t("dashboard.stats.completed"), accent: "#2DD4BF" },
  ];

  // Confirmation now happens inline inside the event menu; here we just run the
  // delete. deleteEvent() removes it from local state and toasts on success.
  const handleDelete = async (event) => {
    try {
      await deleteEvent(event.id);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const openEvent = (id) => router.push(`/dashboard/events/${id}`);
  const onStatus = (event, status) =>
    updateEvent(event.id, { status }).catch((e) => toast.error(e.message));

  return (
    <>
      {/* A) HEADER */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-jakarta text-3xl font-bold text-kiiya-dark dark:text-white">
            {t("dashboard.nav.planning")}
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-[#A89EC9]">
            {t("planning.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowNewEventModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-kiiya-primary px-5 py-3 font-semibold text-white shadow-primary transition hover:bg-[#6B5EE4]"
        >
          <Plus className="h-5 w-5" />
          {t("dashboard.newEvent")}
        </button>
      </div>

      {/* B) QUICK STATS */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map(({ icon: Icon, value, label, accent }) => (
          <div
            key={label}
            className="rounded-3xl border-l-4 bg-white p-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:bg-[#1A1725]"
            style={{ borderLeftColor: accent }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${accent}1A`, color: accent }}
            >
              <Icon className="h-5 w-5" strokeWidth={1.9} />
            </div>
            <p
              className="mt-4 font-jakarta text-3xl font-extrabold"
              style={{ color: accent }}
            >
              {value}
            </p>
            <p className="text-xs font-medium text-gray-400 dark:text-[#6B6480]">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* C) COUNTDOWN */}
      {countdown && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-kiiya-primary to-[#9B8DF8] p-5 text-white shadow-primary">
          <div className="flex items-center gap-2 text-sm font-medium text-white/90">
            <Timer className="h-4 w-4" />
            {countdown.d === 0
              ? "Happening today!"
              : `Coming up in ${countdown.d} day${countdown.d === 1 ? "" : "s"}`}
          </div>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-xl font-bold">{countdown.e.title}</p>
              <p className="text-sm text-white/80">
                {formatDateRange(countdown.e.start_date, countdown.e.end_date)}
              </p>
            </div>
            <Link
              href={`/dashboard/events/${countdown.e.id}`}
              className="flex-shrink-0 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold backdrop-blur transition hover:bg-white/30"
            >
              Open
            </Link>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${Math.round(((30 - countdown.d) / 30) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* D) TOOLBAR — search + filters + sort + view */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("planning.search_placeholder")}
              className="w-full rounded-2xl bg-white py-3 pl-11 pr-10 text-sm text-kiiya-dark shadow-[0_2px_12px_rgba(0,0,0,0.06)] outline-none ring-kiiya-primary/40 transition focus:ring-2 dark:bg-[#1A1725] dark:text-white dark:placeholder:text-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label={t("planning.clear_search")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const label =
              f === "all" ? t("dashboard.filter.all") : t(`dashboard.status.${f}`);
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-kiiya-primary text-white shadow-sm"
                    : "border border-gray-100 bg-white text-gray-500 hover:text-kiiya-primary dark:border-white/10 dark:bg-[#1A1725] dark:text-[#A89EC9]"
                }`}
              >
                {label}
              </button>
            );
          })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-gray-500 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition hover:text-kiiya-primary dark:bg-[#1A1725] dark:text-[#A89EC9]"
            >
              <ArrowUpDown className="h-4 w-4" />
              {t(`dashboard.sort.${sort}`)}
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-12 z-20 w-40 overflow-hidden rounded-2xl border border-gray-100 bg-white py-1 shadow-lg dark:border-[#2D2A3E] dark:bg-[#1A1825]">
                {SORTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSort(s);
                      setSortOpen(false);
                    }}
                    className={`flex w-full items-center px-4 py-2 text-sm transition hover:bg-purple-50 dark:hover:bg-[#221F32] ${
                      s === sort
                        ? "font-semibold text-kiiya-primary"
                        : "text-kiiya-dark dark:text-[#F0EEFF]"
                    }`}
                  >
                    {t(`dashboard.sort.${s}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex gap-1 rounded-2xl bg-white p-1 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:bg-[#1A1725]">
            <button
              onClick={() => setView("grid")}
              aria-label="Grid view"
              className={`rounded-xl p-2 transition ${
                view === "grid"
                  ? "bg-[#7C6EF5]/15 text-kiiya-primary dark:text-[#A594F9]"
                  : "text-gray-400 dark:text-[#6B6480]"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              aria-label="List view"
              className={`rounded-xl p-2 transition ${
                view === "list"
                  ? "bg-[#7C6EF5]/15 text-kiiya-primary dark:text-[#A594F9]"
                  : "text-gray-400 dark:text-[#6B6480]"
              }`}
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* E) CONTENT */}
      {loading ? (
        <EventsSkeleton view={view} />
      ) : error ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 py-16 text-center dark:border-red-500/20 dark:bg-red-500/5">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <p className="mt-4 font-semibold text-kiiya-dark dark:text-white">
            Something went wrong
          </p>
          <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-[#A89EC9]">
            {error}
          </p>
          <button
            onClick={fetchEvents}
            className="mt-6 rounded-xl bg-kiiya-primary px-5 py-2.5 font-semibold text-white transition hover:opacity-90"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        searchQuery.trim() ? (
          // C — search returned nothing
          <EmptyState
            emoji="🔍"
            title={t("planning.no_results_title").replace(
              "{query}",
              searchQuery.trim()
            )}
            subtitle={t("planning.no_results_subtitle")}
            action={
              <button
                onClick={() => setSearchQuery("")}
                className="inline-flex items-center gap-2 rounded-xl border border-purple-200 px-5 py-2.5 font-semibold text-kiiya-primary transition hover:bg-purple-50 dark:border-[#2D2A3E] dark:hover:bg-[#221F32]"
              >
                {t("planning.clear_search")}
              </button>
            }
          />
        ) : events.length === 0 ? (
          // A — no events at all (first-time user): premium welcome hero
          <div className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#7C6EF5] to-[#9B8FF7] p-10 text-center text-white shadow-[0_12px_40px_rgba(124,110,245,0.3)] sm:p-16">
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-white/10" />
            <div className="relative mx-auto max-w-md">
              <div className="mb-5 text-7xl">🗺️</div>
              <h3 className="font-jakarta text-3xl font-extrabold">
                {t("planning.empty_title")}
              </h3>
              <p className="mx-auto mt-3 max-w-sm text-sm text-white/85">
                {t("planning.empty_subtitle")}
              </p>
              <button
                onClick={() => setShowNewEventModal(true)}
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-jakarta font-bold text-kiiya-primary shadow-lg transition hover:scale-[1.03]"
              >
                <Plus className="h-5 w-5" />
                {t("dashboard.newEvent")}
              </button>
            </div>
          </div>
        ) : (
          // B — active tab filter has no matches
          <EmptyState
            emoji="📭"
            title={t("planning.empty_filter_title")}
            subtitle={t("planning.empty_filter_subtitle").replace(
              "{status}",
              filter === "all" ? "" : t(`dashboard.status.${filter}`).toLowerCase()
            )}
            action={
              <button
                onClick={() => setShowNewEventModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-purple-200 px-5 py-3 font-semibold text-kiiya-primary transition hover:bg-purple-50 dark:border-[#2D2A3E] dark:hover:bg-[#221F32]"
              >
                <Plus className="h-5 w-5" />
                {t("dashboard.newEvent")}
              </button>
            }
          />
        )
      ) : view === "list" ? (
        <div className="divide-y divide-gray-50 overflow-hidden rounded-3xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:divide-white/5 dark:bg-[#1A1725]">
          {filtered.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              onOpen={() => openEvent(event.id)}
              onEdit={() => setEditEvent(event)}
              onStatus={(status) => onStatus(event, status)}
              onDelete={() => handleDelete(event)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={() => setEditEvent(event)}
              onStatus={(status) => onStatus(event, status)}
              onDelete={() => handleDelete(event)}
            />
          ))}
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

      {/* First-run onboarding */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={finishOnboarding}
        onCreateEvent={() => {
          finishOnboarding();
          setShowNewEventModal(true);
        }}
      />
    </>
  );
}
