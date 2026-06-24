"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Loader2,
  AlertCircle,
  MapPin,
  Calendar,
  Camera,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useAuth } from "@/hooks/useAuth";
import { useEventDetail } from "@/hooks/useEventDetail";
import { t } from "@/utils/i18n";
import { eventColors, statusColors } from "@/utils/eventColors";
import { formatRupiah, formatDateRange } from "@/utils/format";
import ItineraryTab from "@/components/event/ItineraryTab";
import BudgetTab from "@/components/event/BudgetTab";
import ChecklistTab from "@/components/event/ChecklistTab";
import MembersTab from "@/components/event/MembersTab";
import EditEventModal from "@/components/ui/EditEventModal";
import UnsplashModal from "@/components/ui/UnsplashModal";
import { toast } from "@/components/ui/Toast";

const TABS = [
  { key: "itinerary", label: "eventDetail.tabs.itinerary" },
  { key: "budget", label: "eventDetail.tabs.budget" },
  { key: "checklist", label: "eventDetail.tabs.checklist" },
  { key: "members", label: "eventDetail.tabs.members" },
];

export default function EventDetailPage({ params }) {
  useLang();
  const { user } = useAuth();
  const detail = useEventDetail(params.id);
  const { event, loading, error, totalSpent, refetch } = detail;
  const [activeTab, setActiveTab] = useState("itinerary");
  const [showEdit, setShowEdit] = useState(false);
  const [showCover, setShowCover] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-kiiya-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="mt-4 font-semibold text-kiiya-dark">
          {error ? "Something went wrong" : "Event not found"}
        </p>
        {error && <p className="mt-1 max-w-sm text-sm text-gray-500">{error}</p>}
        <div className="mt-6 flex gap-3">
          {error && (
            <button
              onClick={refetch}
              className="rounded-xl bg-kiiya-primary px-5 py-2.5 font-semibold text-white transition hover:opacity-90"
            >
              Retry
            </button>
          )}
          <Link
            href="/dashboard"
            className="rounded-xl border border-gray-200 px-5 py-2.5 font-semibold text-kiiya-dark transition hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const colors = eventColors[event.type] ?? eventColors.custom;
  const budget = event.budget || 0;
  const pct = budget > 0 ? Math.min(Math.round((totalSpent / budget) * 100), 100) : 0;
  const hasCover = !!event.cover_image_url;

  const ctrlBtn =
    "inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30";

  return (
    <div className="-m-6 md:-m-8">
      {/* A) HERO */}
      <div className="relative">
        <div
          className={`relative flex min-h-[280px] items-center justify-center overflow-hidden ${
            hasCover ? "" : `bg-gradient-to-br ${colors.gradient}`
          }`}
        >
          {hasCover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {/* Dark overlay from bottom for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          <span className="relative text-7xl drop-shadow-md">
            {event.cover_emoji || colors.icon}
          </span>

          {/* Back button */}
          <Link href="/dashboard" className={`absolute left-4 top-4 ${ctrlBtn}`}>
            <ArrowLeft className="h-4 w-4" />
            {t("eventDetail.back")}
          </Link>

          {/* Edit button */}
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            className={`absolute right-4 top-4 ${ctrlBtn}`}
          >
            <Pencil className="h-4 w-4" />
            {t("eventDetail.edit")}
          </button>

          {/* Change cover */}
          <button
            type="button"
            onClick={() => setShowCover(true)}
            className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/30"
          >
            <Camera className="h-3.5 w-3.5" />
            {t("eventDetail.changeCover")}
          </button>
        </div>

        {/* Info card overlapping the hero */}
        <div className="relative z-10 -mt-8 px-4">
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[event.status]}`}
              >
                {t(`dashboard.status.${event.status}`)}
              </span>
              <span
                className={`rounded-full border border-transparent px-3 py-1 text-xs font-semibold ${colors.badge}`}
              >
                {colors.icon} {t(`dashboard.eventTypes.${event.type}`)}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold text-kiiya-dark">
              {event.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDateRange(event.start_date, event.end_date)}
              </span>
              {event.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </span>
              )}
            </div>

            <div className="my-4 border-t border-gray-100" />

            {/* Budget row */}
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-500">
                  {t("eventDetail.spent")}: {formatRupiah(totalSpent)} /{" "}
                  {t("eventDetail.budget")}: {formatRupiah(budget)}
                </span>
                <span className="font-semibold text-gray-500">{pct}%</span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct < 70
                      ? "bg-green-500"
                      : pct < 90
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completed → memory card banner */}
      {event.status === "completed" && (
        <div className="px-4 pt-4">
          <Link
            href={`/dashboard/events/${event.id}/share`}
            className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-kiiya-primary to-kiiya-romantic p-4 text-white shadow-sm transition hover:opacity-95"
          >
            <Sparkles className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-sm font-semibold">
              🎉 Event completed! Generate your memory card
            </span>
            <ChevronRight className="h-5 w-5 flex-shrink-0" />
          </Link>
        </div>
      )}

      {/* B) TAB NAVIGATION (sticky) */}
      <div className="sticky top-0 z-20 mt-4 border-b border-purple-100 bg-white/95 backdrop-blur">
        <div className="flex gap-1 overflow-x-auto px-6 md:px-8">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "border-kiiya-primary text-kiiya-primary"
                    : "border-transparent text-gray-500 hover:text-kiiya-dark"
                }`}
              >
                {t(tab.label)}
              </button>
            );
          })}
        </div>
      </div>

      {/* C) TAB CONTENT */}
      <div className="px-6 py-6 md:px-8">
        {activeTab === "itinerary" && (
          <ItineraryTab
            event={event}
            itineraryDays={detail.itineraryDays}
            addDay={detail.addDay}
            addActivity={detail.addActivity}
            updateActivity={detail.updateActivity}
            toggleActivity={detail.toggleActivity}
            deleteActivity={detail.deleteActivity}
            updateDay={detail.updateDay}
            deleteDay={detail.deleteDay}
          />
        )}
        {activeTab === "budget" && (
          <BudgetTab
            event={event}
            expenses={detail.expenses}
            addExpense={detail.addExpense}
            updateExpense={detail.updateExpense}
            deleteExpense={detail.deleteExpense}
          />
        )}
        {activeTab === "checklist" && (
          <ChecklistTab
            checklist={detail.checklist}
            addChecklistItem={detail.addChecklistItem}
            updateChecklistItem={detail.updateChecklistItem}
            toggleChecklistItem={detail.toggleChecklistItem}
            deleteChecklistItem={detail.deleteChecklistItem}
          />
        )}
        {activeTab === "members" && (
          <MembersTab
            members={detail.members}
            currentUserEmail={user?.email}
            addMember={detail.addMember}
            removeMember={detail.removeMember}
          />
        )}
      </div>

      {/* Modals */}
      <EditEventModal
        isOpen={showEdit}
        event={event}
        onClose={() => setShowEdit(false)}
        onSubmit={detail.updateEvent}
      />
      <UnsplashModal
        isOpen={showCover}
        eventType={event.type}
        onClose={() => setShowCover(false)}
        onSelect={(url) =>
          detail
            .updateEvent({ cover_image_url: url })
            .then(() => toast.success("Cover updated!"))
            .catch((e) => toast.error(e.message))
        }
        onRemove={
          hasCover
            ? () =>
                detail
                  .updateEvent({ cover_image_url: null })
                  .then(() => toast.success("Cover removed."))
                  .catch((e) => toast.error(e.message))
            : undefined
        }
      />
    </div>
  );
}
