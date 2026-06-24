"use client";
import { useEffect, useRef, useState } from "react";
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
  Wallet,
  Users,
  Tag,
  Plus,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useAuth } from "@/hooks/useAuth";
import { useEventDetail } from "@/hooks/useEventDetail";
import { t } from "@/utils/i18n";
import { getEventColor, statusColors } from "@/utils/eventColors";
import { formatRupiah, formatDateRange } from "@/utils/format";
import ItineraryTab from "@/components/event/ItineraryTab";
import BudgetTab from "@/components/event/BudgetTab";
import ChecklistTab from "@/components/event/ChecklistTab";
import MembersTab from "@/components/event/MembersTab";
import UnsplashModal from "@/components/ui/UnsplashModal";
import { toast } from "@/components/ui/Toast";

const TABS = [
  { key: "itinerary", label: "eventDetail.tabs.itinerary" },
  { key: "budget", label: "eventDetail.tabs.budget" },
  { key: "checklist", label: "eventDetail.tabs.checklist" },
  { key: "members", label: "eventDetail.tabs.members" },
];

const STATUSES = ["upcoming", "ongoing", "completed", "archived"];

function PropertyRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-4 border-b border-purple-50 py-2.5 dark:border-[#2D2A3E]">
      <div className="flex w-28 flex-shrink-0 items-center gap-2 text-sm text-gray-400 dark:text-[#6B6480] md:w-32">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="min-w-0 flex-1 text-sm text-kiiya-dark dark:text-white">
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
  const [editing, setEditing] = useState(null); // 'title' | 'date' | 'location' | 'budget' | 'status'
  const [draft, setDraft] = useState("");
  const titleRef = useRef(null);

  useEffect(() => {
    if (editing === "title" || editing === "location" || editing === "budget") {
      titleRef.current?.focus();
    }
  }, [editing]);

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
  const pct = budget > 0 ? Math.min(Math.round((totalSpent / budget) * 100), 100) : 0;
  const hasCover = !!event.cover_image_url;

  const save = (updates) =>
    updateEvent(updates)
      .then(() => setEditing(null))
      .catch((e) => toast.error(e.message));

  const startEdit = (field, value) => {
    setDraft(value ?? "");
    setEditing(field);
  };

  // Build avatar stack (owner first, then members).
  const memberAvatars = [
    { id: "owner", email: user?.email },
    ...detail.members,
  ].filter((m) => m.email);

  const valueBtn =
    "w-full rounded-md px-2 py-1 text-left transition hover:bg-purple-50 dark:hover:bg-[#221F32]";
  const inlineInput =
    "w-full rounded-md border border-kiiya-primary/40 bg-white px-2 py-1 text-sm outline-none focus:border-kiiya-primary dark:border-[#4A4560] dark:bg-[#1A1825] dark:text-white";

  return (
    <div className="-m-6 md:-m-8">
      {/* A) COVER */}
      <div className="relative h-64 w-full overflow-hidden md:h-80">
        {hasCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        <Link
          href="/dashboard"
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-lg bg-black/40 px-3 py-1.5 text-sm font-medium text-white backdrop-blur transition hover:bg-black/55"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("eventDetail.back")}
        </Link>

        <button
          type="button"
          onClick={() => setShowCover(true)}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-black/55"
        >
          <Camera className="h-3.5 w-3.5" />
          {t("eventDetail.changeCover")}
        </button>
      </div>

      {/* B) PAGE CONTENT */}
      <div className="mx-auto max-w-4xl px-6 md:px-8">
        {/* Title area */}
        <div className="relative z-10 -mt-8 mb-6">
          <span className="block text-5xl drop-shadow-sm">
            {event.cover_emoji || colors.icon}
          </span>

          {editing === "title" ? (
            <input
              ref={titleRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() =>
                draft.trim() ? save({ title: draft.trim() }) : setEditing(null)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditing(null);
              }}
              className="mt-3 w-full rounded-lg border border-kiiya-primary/40 bg-white px-2 py-1 text-3xl font-bold text-kiiya-dark outline-none focus:border-kiiya-primary dark:bg-[#1A1825] dark:text-white md:text-4xl"
            />
          ) : (
            <h1
              onClick={() => startEdit("title", event.title)}
              className="mt-3 cursor-text rounded-lg px-2 py-1 -ml-2 text-3xl font-bold text-kiiya-dark transition hover:bg-purple-50 dark:text-white dark:hover:bg-[#221F32] md:text-4xl"
            >
              {event.title}
            </h1>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 px-0">
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
        </div>

        {/* Property rows */}
        <div className="mb-8">
          <PropertyRow icon={Calendar} label={t("editEvent.startDate")}>
            {editing === "date" ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  defaultValue={event.start_date || ""}
                  className={inlineInput + " w-auto"}
                  id="edit-start"
                />
                <span className="text-gray-400">→</span>
                <input
                  type="date"
                  defaultValue={event.end_date || ""}
                  min={event.start_date || undefined}
                  className={inlineInput + " w-auto"}
                  id="edit-end"
                />
                <button
                  onClick={() => {
                    const start = document.getElementById("edit-start")?.value;
                    const end = document.getElementById("edit-end")?.value;
                    if (!start) return setEditing(null);
                    save({ start_date: start, end_date: end || null });
                  }}
                  className="rounded-md bg-kiiya-primary px-3 py-1 text-xs font-semibold text-white"
                >
                  Save
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing("date")} className={valueBtn + " -ml-2"}>
                {formatDateRange(event.start_date, event.end_date) || (
                  <span className="text-gray-400">Add date</span>
                )}
              </button>
            )}
          </PropertyRow>

          <PropertyRow icon={MapPin} label={t("editEvent.location")}>
            {editing === "location" ? (
              <input
                ref={titleRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => save({ location: draft.trim() || null })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") setEditing(null);
                }}
                placeholder="Add location"
                className={inlineInput}
              />
            ) : (
              <button
                onClick={() => startEdit("location", event.location)}
                className={valueBtn + " -ml-2"}
              >
                {event.location || <span className="text-gray-400">Add location</span>}
              </button>
            )}
          </PropertyRow>

          <PropertyRow icon={Wallet} label={t("editEvent.budget")}>
            {editing === "budget" ? (
              <input
                ref={titleRef}
                type="number"
                min="0"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => save({ budget: draft ? parseInt(draft, 10) : 0 })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") setEditing(null);
                }}
                placeholder="0"
                className={inlineInput}
              />
            ) : (
              <button
                onClick={() => startEdit("budget", budget ? String(budget) : "")}
                className={valueBtn + " -ml-2"}
              >
                {formatRupiah(budget)}
              </button>
            )}
          </PropertyRow>

          <PropertyRow icon={Users} label={t("eventDetail.tabs.members")}>
            <button
              onClick={() => setActiveTab("members")}
              className="flex items-center gap-2 rounded-md px-2 py-1 -ml-2 transition hover:bg-purple-50 dark:hover:bg-[#221F32]"
            >
              <div className="flex -space-x-2">
                {memberAvatars.slice(0, 3).map((m, i) => (
                  <span
                    key={m.id || i}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-kiiya-primary text-[10px] font-semibold text-white dark:border-[#0F0E17]"
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
          </PropertyRow>

          <PropertyRow icon={Tag} label={t("editEvent.status")}>
            {editing === "status" ? (
              <select
                autoFocus
                value={event.status}
                onChange={(e) => save({ status: e.target.value })}
                onBlur={() => setEditing(null)}
                className={inlineInput}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`dashboard.status.${s}`)}
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => setEditing("status")}
                className="-ml-2 inline-flex rounded-md px-2 py-1 transition hover:bg-purple-50 dark:hover:bg-[#221F32]"
              >
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-semibold ${statusColors[event.status]}`}
                >
                  {t(`dashboard.status.${event.status}`)}
                </span>
              </button>
            )}
          </PropertyRow>
        </div>

        {/* Completed → memory card banner */}
        {event.status === "completed" && (
          <Link
            href={`/dashboard/events/${event.id}/share`}
            className="mb-6 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-kiiya-primary to-kiiya-romantic p-4 text-white shadow-sm transition hover:opacity-95"
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
      <div className="sticky top-0 z-20 mt-2 border-b border-purple-100 bg-white/95 backdrop-blur dark:border-[#2D2A3E] dark:bg-[#0F0E17]/95">
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
