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
import ItineraryTab from "@/components/event/ItineraryTab";
import BudgetTab from "@/components/event/BudgetTab";
import ChecklistTab from "@/components/event/ChecklistTab";
import MembersTab from "@/components/event/MembersTab";
import MoodBoardTab from "@/components/event/MoodBoardTab";
import TimeCapsuleTab from "@/components/event/TimeCapsuleTab";
import UnsplashModal from "@/components/ui/UnsplashModal";
import { toast } from "@/components/ui/Toast";

const TABS = [
  { key: "itinerary", label: "eventDetail.tabs.itinerary" },
  { key: "budget", label: "eventDetail.tabs.budget" },
  { key: "checklist", label: "eventDetail.tabs.checklist" },
  { key: "members", label: "eventDetail.tabs.members" },
  { key: "moodboard", label: "eventDetail.tabs.moodboard" },
  { key: "timecapsule", label: "eventDetail.tabs.timecapsule" },
];

const STATUSES = ["upcoming", "ongoing", "completed", "archived"];

// One labelled property row in the editable card.
function Field({ label, children }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-3 py-2 sm:grid-cols-[140px_1fr]">
      <span className="pt-1.5 text-sm font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </span>
      <div className="min-w-0 text-sm text-gray-800 dark:text-gray-200">
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
      {/* A) HERO COVER */}
      <div className="relative h-64 w-full overflow-hidden md:h-80">
        {hasCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${colors.gradient}`}>
            <span className="text-7xl drop-shadow-lg md:text-8xl">
              {event.cover_emoji || colors.icon}
            </span>
          </div>
        )}

        {/* Overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Back button */}
        <Link
          href="/dashboard"
          aria-label={t("eventDetail.back")}
          className="absolute left-4 top-4 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/30"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {/* Change cover */}
        <button
          type="button"
          onClick={() => setShowCover(true)}
          className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/30"
        >
          <Camera className="h-3.5 w-3.5" />
          {t("eventDetail.changeCover")}
        </button>

        {/* Title + meta on overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {hasCover && (
            <span className="block text-3xl drop-shadow-md">
              {event.cover_emoji || colors.icon}
            </span>
          )}
          <h1 className="mt-1 text-2xl font-bold text-white drop-shadow-md">
            {event.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-medium text-white/90 drop-shadow">
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
      <div className="mx-auto max-w-4xl px-6 md:px-8">
        {/* Editable properties */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-white/5">
          <Field label={t("editEvent.eventTitle")}>
            <InlineEdit
              value={event.title}
              onSave={saveField("title")}
              placeholder="Untitled event"
            />
          </Field>

          <Field label={t("editEvent.type")}>
            <InlineEdit
              value={event.type}
              onSave={saveField("type")}
              placeholder="Add type"
              display={event.type ? `${colors.icon} ${event.type}` : undefined}
            />
          </Field>

          <Field label={t("editEvent.status")}>
            <InlineEdit
              type="select"
              value={event.status}
              onSave={saveField("status")}
              options={statusOptions}
              display={statusBadge}
            />
          </Field>

          <Field label={t("editEvent.startDate")}>
            <InlineEdit
              type="date"
              value={event.start_date || ""}
              onSave={saveField("start_date")}
              placeholder="Add date"
              display={
                event.start_date ? formatDateShort(event.start_date) : undefined
              }
            />
          </Field>

          <Field label={t("editEvent.endDate")}>
            <InlineEdit
              type="date"
              value={event.end_date || ""}
              onSave={saveField("end_date")}
              placeholder="Add date"
              display={
                event.end_date ? formatDateShort(event.end_date) : undefined
              }
            />
          </Field>

          <Field label={t("editEvent.location")}>
            <InlineEdit
              value={event.location}
              onSave={saveField("location")}
              placeholder="Add location"
            />
          </Field>

          <Field label={t("editEvent.budget")}>
            <InlineEdit
              type="currency"
              prefix="IDR"
              value={budget}
              onSave={saveField("budget")}
              display={formatRupiah(budget)}
            />
          </Field>

          <Field label={t("eventDetail.tabs.members")}>
            <button
              onClick={() => setActiveTab("members")}
              className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-gray-50/50 dark:hover:bg-white/5"
            >
              <div className="flex -space-x-2">
                {memberAvatars.slice(0, 3).map((m, i) => (
                  <span
                    key={m.id || i}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-kiiya-primary text-[10px] font-semibold text-white dark:border-[#1E1B2E]"
                  >
                    {(m.email || "?").slice(0, 2).toUpperCase()}
                  </span>
                ))}
              </div>
              {memberAvatars.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{memberAvatars.length - 3} more
                </span>
              )}
            </button>
          </Field>

          <Field label={t("editEvent.description")}>
            <InlineEdit
              type="textarea"
              value={event.description}
              onSave={saveField("description")}
              placeholder="Add a description…"
            />
          </Field>
        </div>

        {/* Completed → memory card banner */}
        {event.status === "completed" && (
          <Link
            href={`/dashboard/events/${event.id}/share`}
            className="mb-6 mt-6 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-kiiya-primary to-kiiya-romantic p-4 text-white shadow-sm transition hover:opacity-95"
          >
            <Sparkles className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-sm font-semibold">
              🎉 Event completed! Generate your memory card
            </span>
            <ChevronRight className="h-5 w-5 flex-shrink-0" />
          </Link>
        )}
      </div>

      {/* C) TAB NAVIGATION (sticky) */}
      <div className="sticky top-0 z-20 mt-6 border-b border-purple-100 bg-white/95 backdrop-blur dark:border-[#2D2A3E] dark:bg-[#0F0E17]/95">
        <div className="mx-auto flex max-w-4xl gap-6 overflow-x-auto px-6 md:px-8">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap border-b-2 py-3 text-sm font-medium transition ${
                  active
                    ? "border-kiiya-primary text-kiiya-primary"
                    : "border-transparent text-gray-400 hover:text-kiiya-dark dark:hover:text-white"
                }`}
              >
                {t(tab.label)}
              </button>
            );
          })}
        </div>
      </div>

      {/* D) TAB CONTENT */}
      <div className="mx-auto max-w-4xl px-6 pt-6 md:px-8">
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
