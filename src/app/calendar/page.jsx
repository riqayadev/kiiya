"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import NewEventModal from "@/components/ui/NewEventModal";
import { useLang } from "@/hooks/useLang";
import { useEvents } from "@/hooks/useEvents";
import { t } from "@/utils/i18n";
import { eventColors, statusColors } from "@/utils/eventColors";
import { formatRupiah, formatDateRange } from "@/utils/format";
import { toast } from "@/components/ui/Toast";

const VIEWS = [
  { key: "dayGridMonth", label: "calendar.month" },
  { key: "timeGridWeek", label: "calendar.week" },
  { key: "listMonth", label: "calendar.list" },
];

// FullCalendar treats all-day `end` as exclusive — add a day so multi-day
// events span correctly, and subtract a day when reading back.
function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function CalendarPage() {
  useLang();
  const router = useRouter();
  const { events, createEvent, updateEvent, fetchEvents } = useEvents();
  const calendarRef = useRef(null);
  const [view, setView] = useState("dayGridMonth");
  const [title, setTitle] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [initialDate, setInitialDate] = useState("");

  // On mobile, default to the compact list view.
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setView("listMonth");
      calendarRef.current?.getApi()?.changeView("listMonth");
    }
  }, []);

  const fcEvents = useMemo(
    () =>
      events.map((e) => {
        const colors = eventColors[e.type] ?? eventColors.custom;
        return {
          id: e.id,
          title: e.title,
          start: e.start_date,
          end: e.end_date ? addDays(e.end_date, 1) : undefined,
          allDay: true,
          backgroundColor: colors.hex,
          borderColor: "transparent",
          extendedProps: {
            type: e.type,
            status: e.status,
            emoji: e.cover_emoji || colors.icon,
            budget: e.budget,
          },
        };
      }),
    [events]
  );

  const upcoming = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return [...events]
      .filter((e) => e.start_date && e.start_date >= todayStr)
      .sort((a, b) => (a.start_date < b.start_date ? -1 : 1))
      .slice(0, 5);
  }, [events]);

  const api = () => calendarRef.current?.getApi();

  const changeView = (v) => {
    setView(v);
    api()?.changeView(v);
  };

  const handleDateClick = (info) => {
    setInitialDate(info.dateStr);
    setShowNew(true);
  };

  const handleEventClick = (info) => {
    router.push(`/dashboard/events/${info.event.id}`);
  };

  const handleEventDrop = (info) => {
    const start = info.event.startStr;
    const end = info.event.end
      ? addDays(info.event.endStr, -1)
      : null;
    updateEvent(info.event.id, {
      start_date: start,
      end_date: end,
    }).catch((e) => {
      toast.error(e.message);
      info.revert();
    });
  };

  const renderEventContent = (arg) => {
    const emoji = arg.event.extendedProps.emoji;
    return (
      <div className="flex items-center gap-1 overflow-hidden px-1 text-xs font-medium">
        <span>{emoji}</span>
        <span className="truncate">{arg.event.title}</span>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="kiiya-calendar">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                api()?.prev();
                setTitle(api()?.view.title || "");
              }}
              aria-label="Previous"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-purple-100 bg-white text-kiiya-dark transition hover:border-kiiya-primary/40 dark:border-[#2D2A3E] dark:bg-[#1A1825] dark:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                api()?.next();
                setTitle(api()?.view.title || "");
              }}
              aria-label="Next"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-purple-100 bg-white text-kiiya-dark transition hover:border-kiiya-primary/40 dark:border-[#2D2A3E] dark:bg-[#1A1825] dark:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                api()?.today();
                setTitle(api()?.view.title || "");
              }}
              className="rounded-full border border-purple-100 bg-white px-4 py-1.5 text-sm font-semibold text-kiiya-dark dark:border-[#2D2A3E] dark:bg-[#1A1825] dark:text-white transition hover:border-kiiya-primary/40"
            >
              {t("calendar.today")}
            </button>
            <h1 className="ml-1 text-lg font-bold text-kiiya-dark dark:text-white md:text-xl">
              {title}
            </h1>
          </div>

          {/* View switcher */}
          <div className="flex gap-1 rounded-full border border-purple-100 bg-white p-1 dark:border-[#2D2A3E] dark:bg-[#1A1825]">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                onClick={() => changeView(v.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  view === v.key
                    ? "bg-kiiya-primary text-white"
                    : "text-kiiya-dark/70 hover:text-kiiya-dark dark:text-[#A89EC9]"
                }`}
              >
                {t(v.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          {/* Calendar */}
          <div className="rounded-2xl border border-purple-100 bg-white p-4 dark:border-[#2D2A3E] dark:bg-[#1A1825]">
            <FullCalendar
              ref={calendarRef}
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                listPlugin,
                interactionPlugin,
              ]}
              initialView="dayGridMonth"
              headerToolbar={false}
              height="auto"
              events={fcEvents}
              editable
              eventStartEditable
              dayMaxEvents={3}
              datesSet={(arg) => setTitle(arg.view.title)}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventContent={renderEventContent}
            />
          </div>

          {/* Upcoming sidebar */}
          <aside className="hidden lg:block">
            <div className="rounded-2xl border border-purple-100 bg-white p-5 dark:border-[#2D2A3E] dark:bg-[#1A1825]">
              <h2 className="mb-3 font-bold text-kiiya-dark dark:text-white">
                {t("calendar.upcoming")}
              </h2>
              {upcoming.length === 0 ? (
                <p className="text-sm text-gray-400">
                  {t("calendar.noUpcoming")}
                </p>
              ) : (
                <div className="space-y-2">
                  {upcoming.map((e) => {
                    const colors = eventColors[e.type] ?? eventColors.custom;
                    return (
                      <Link
                        key={e.id}
                        href={`/dashboard/events/${e.id}`}
                        className="flex items-start gap-3 rounded-xl border border-gray-100 p-3 transition hover:border-kiiya-primary/40 dark:border-[#2D2A3E] dark:hover:border-kiiya-primary/40"
                      >
                        <span className="text-2xl">
                          {e.cover_emoji || colors.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-kiiya-dark dark:text-white">
                            {e.title}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {formatDateRange(e.start_date, e.end_date)}
                          </p>
                          <span
                            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[e.status]}`}
                          >
                            {t(`dashboard.status.${e.status}`)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <NewEventModal
        isOpen={showNew}
        initialDate={initialDate}
        onClose={() => setShowNew(false)}
        onSuccess={() => fetchEvents()}
        createEvent={createEvent}
      />
    </AppLayout>
  );
}
