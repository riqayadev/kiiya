"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
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
import { getEventColor, statusColors } from "@/utils/eventColors";
import { formatRupiah, formatDateRange, formatDateShort } from "@/utils/format";
import InlineEdit from "@/components/ui/InlineEdit";
import dynamic from "next/dynamic";
import ItineraryTab from "@/components/event/ItineraryTab";
import BudgetTab from "@/components/event/BudgetTab";
import ChecklistTab from "@/components/event/ChecklistTab";
import MembersTab from "@/components/event/MembersTab";
import UnsplashModal from "@/components/ui/UnsplashModal";
import AsyncErrorBoundary from "@/components/ui/AsyncErrorBoundary";
import { toast } from "@/components/ui/Toast";

// Mood Board and Time Capsule are only seen when their tab is opened, so they
// are code-split out of the main event-detail bundle (the Mood Board also pulls
// in the Unsplash flow).
const MoodBoardTab = dynamic(() => import("@/components/event/MoodBoardTab"), {
  ssr: false,
});
const TimeCapsuleTab = dynamic(
  () => import("@/components/event/TimeCapsuleTab"),
  { ssr: false }
);

const TABS = [
  { key: "itinerary", emoji: "🗓", label: "eventDetail.tabs.itinerary" },
  { key: "budget", emoji: "💰", label: "eventDetail.tabs.budget" },
  { key: "checklist", emoji: "✅", label: "eventDetail.tabs.checklist" },
  { key: "members", emoji: "👥", label: "eventDetail.tabs.members" },
  { key: "moodboard", emoji: "🎨", label: "eventDetail.tabs.moodboard" },
  { key: "timecapsule", emoji: "💌", label: "eventDetail.tabs.timecapsule" },
];

const STATUSES = ["upcoming", "ongoing", "completed", "archived"];

// Solid dot color per status — used in the hero status badge.
const STATUS_DOT = {
  upcoming: "#3B82F6",
  ongoing: "#22C55E",
  completed: "#9CA3AF",
  archived: "#F59E0B",
};

// One labelled property in the editable grid — a small inset card.
function PropCard({ label, children }) {
  return (
    <div className="rounded-2xl bg-[#FAFAF8] p-3 dark:bg-[#252235]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <div className="mt-1 font-jakarta text-sm font-semibold text-gray-800 dark:text-gray-100">
        {children}
      </div>
    </div>
  );
}

export default function EventDetailPage({ params }) {
  useLang();
  const { user } = useAuth();
  const detail = useEventDetail(params.id);
  const { event, loading, error, totalSpent, refetch, updateEvent } = detail;
  const [activeTab, setActiveTab] = useState("itinerary");
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
      <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 py-16 text-center dark:border-red-500/20 dark:bg-red-500/5">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="mt-4 font-semibold text-kiiya-dark dark:text-white">
          {error ? "Something went wrong" : "Event not found"}
        </p>
        {error && (
          <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-[#A89EC9]">
            {error}
          </p>
        )}
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
            className="rounded-xl border border-gray-200 px-5 py-2.5 font-semibold text-kiiya-dark transition hover:bg-gray-50 dark:border-[#2D2A3E] dark:text-white dark:hover:bg-[#221F32]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const colors = getEventColor(event.type);
  const budget = event.budget || 0;
  const hasCover = !!event.cover_image_url;
  const dateRange = formatDateRange(event.start_date, event.end_date);

  // Persist a single field through the hook (optimistic local update + patch).
  // Throwing here makes InlineEdit revert and flash a red border.
  const saveField = (field) => (value) =>
    updateEvent({ [field]: value, updated_at: new Date().toISOString() });

  // Build avatar stack (owner first, then members).
  const memberAvatars = [
    { id: "owner", email: user?.email },
    ...detail.members,
  ].filter((m) => m.email);

  const statusOptions = STATUSES.map((s) => ({
    value: s,
    label: t(`dashboard.status.${s}`),
  }));

  const statusBadge = (
    <span
      className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${statusColors[event.status]}`}
    >
      {t(`dashboard.status.${event.status}`)}
    </span>
  );

  return (
    <div className="-m-6 md:-m-8">
      {/* A) HERO COVER — cinematic */}
      <div className="relative h-72 w-full overflow-hidden md:h-96">
        {hasCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_image_url}
            alt={event.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${colors.gradient}`}>
            <span className="text-7xl drop-shadow-lg md:text-9xl">
              {event.cover_emoji || colors.icon}
            </span>
          </div>
        )}

        {/* Scrim for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Back button */}
        <Link
          href="/dashboard"
          aria-label={t("eventDetail.back")}
          className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/25"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Change cover */}
        <button
          type="button"
          onClick={() => setShowCover(true)}
          className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/25"
        >
          <Camera className="h-4 w-4" />
          {t("eventDetail.changeCover")}
        </button>

        {/* Title + meta on overlay */}
        <div className="absolute inset-x-0 bottom-0 p-6 pb-12 md:p-8 md:pb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: STATUS_DOT[event.status] || "#9CA3AF" }}
            />
            {t(`dashboard.status.${event.status}`)}
          </span>
          <h1 className="mt-3 font-jakarta text-3xl font-extrabold text-white drop-shadow-lg md:text-4xl">
            {event.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-medium text-white/80 drop-shadow">
            {event.type && (
              <span>
                {colors.icon} {event.type}
              </span>
            )}
            {dateRange && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {dateRange}
              </span>
            )}
            {event.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* B) PAGE CONTENT */}
      <div className="mx-auto max-w-4xl px-4 md:px-8">
        {/* Properties card — overlaps the hero for depth */}
        <div className="relative z-10 -mt-6 rounded-3xl bg-white p-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:bg-[#1A1725]">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
            Details
          </p>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <PropCard label={t("editEvent.eventTitle")}>
              <InlineEdit
                value={event.title}
                onSave={saveField("title")}
                placeholder={t("placeholders.eventName")}
              />
            </PropCard>

            <PropCard label={t("editEvent.type")}>
              <InlineEdit
                value={event.type}
                onSave={saveField("type")}
                placeholder="Add type"
                display={event.type ? `${colors.icon} ${event.type}` : undefined}
              />
            </PropCard>

            <PropCard label={t("editEvent.status")}>
              <InlineEdit
                type="select"
                value={event.status}
                onSave={saveField("status")}
                options={statusOptions}
                display={statusBadge}
              />
            </PropCard>

            <PropCard label={t("editEvent.budget")}>
              <InlineEdit
                type="currency"
                prefix="IDR"
                value={budget}
                onSave={saveField("budget")}
                display={formatRupiah(budget)}
              />
            </PropCard>

            <PropCard label={t("editEvent.startDate")}>
              <InlineEdit
                type="date"
                value={event.start_date || ""}
                onSave={saveField("start_date")}
                placeholder="Add date"
                display={
                  event.start_date ? formatDateShort(event.start_date) : undefined
                }
              />
            </PropCard>

            <PropCard label={t("editEvent.endDate")}>
              <InlineEdit
                type="date"
                value={event.end_date || ""}
                onSave={saveField("end_date")}
                placeholder="Add date"
                display={
                  event.end_date ? formatDateShort(event.end_date) : undefined
                }
              />
            </PropCard>

            <PropCard label={t("editEvent.location")}>
              <InlineEdit
                value={event.location}
                onSave={saveField("location")}
                placeholder={t("placeholders.location")}
              />
            </PropCard>

            <PropCard label={t("eventDetail.tabs.members")}>
              <button
                onClick={() => setActiveTab("members")}
                className="-mx-1 flex items-center gap-2 rounded-lg px-1 py-0.5 transition hover:opacity-80"
              >
                <div className="flex -space-x-2">
                  {memberAvatars.slice(0, 3).map((m, i) => (
                    <span
                      key={m.id || i}
                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#FAFAF8] bg-kiiya-primary text-[10px] font-semibold text-white dark:border-[#252235]"
                    >
                      {(m.email || "?").slice(0, 2).toUpperCase()}
                    </span>
                  ))}
                </div>
                {memberAvatars.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{memberAvatars.length - 3}
                  </span>
                )}
              </button>
            </PropCard>
          </div>

          {/* Description — full width */}
          <div className="mt-4 rounded-2xl bg-[#FAFAF8] p-3 dark:bg-[#252235]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {t("editEvent.description")}
            </p>
            <div className="mt-1 text-sm text-gray-800 dark:text-gray-200">
              <InlineEdit
                type="textarea"
                value={event.description}
                onSave={saveField("description")}
                placeholder={t("placeholders.description")}
              />
            </div>
          </div>
        </div>

        {/* Completed → memory card banner */}
        {event.status === "completed" && (
          <Link
            href={`/dashboard/events/${event.id}/share`}
            className="mt-6 flex items-center gap-3 rounded-3xl bg-gradient-to-r from-kiiya-primary to-kiiya-romantic p-4 text-white shadow-[0_2px_20px_rgba(124,110,245,0.2)] transition hover:opacity-95"
          >
            <Sparkles className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-sm font-semibold">
              🎉 Event completed! Generate your memory card
            </span>
            <ChevronRight className="h-5 w-5 flex-shrink-0" />
          </Link>
        )}

        {/* C) TAB NAVIGATION — pill tabs */}
        <div className="mt-6 overflow-x-auto scrollbar-hide">
          <div className="inline-flex min-w-full gap-1 rounded-2xl bg-[#F4F2FF] p-1 dark:bg-[#252235]">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm transition ${
                    active
                      ? "bg-white font-semibold text-kiiya-primary shadow-sm dark:bg-[#1A1725]"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <span>{tab.emoji}</span>
                  {t(tab.label)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* D) TAB CONTENT */}
      <div className="mx-auto max-w-4xl px-4 pt-6 md:px-8">
        <AsyncErrorBoundary key={activeTab}>
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
          {activeTab === "moodboard" && (
            <MoodBoardTab eventId={event.id} eventType={event.type} />
          )}
          {activeTab === "timecapsule" && <TimeCapsuleTab event={event} />}
        </AsyncErrorBoundary>
      </div>

      <UnsplashModal
        isOpen={showCover}
        eventType={event.type}
        onClose={() => setShowCover(false)}
        onSelect={(url) =>
          updateEvent({ cover_image_url: url })
            .then(() => toast.success("Cover updated!"))
            .catch((e) => toast.error(e.message))
        }
        onRemove={
          hasCover
            ? () =>
                updateEvent({ cover_image_url: null })
                  .then(() => toast.success("Cover removed."))
                  .catch((e) => toast.error(e.message))
            : undefined
        }
      />
    </div>
  );
}
