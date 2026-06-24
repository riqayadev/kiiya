"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Loader2, AlertCircle, MapPin } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useEventDetail } from "@/hooks/useEventDetail";
import { t } from "@/utils/i18n";
import { eventColors, statusColors } from "@/utils/eventColors";
import { formatRupiah, formatDateRange } from "@/utils/format";
import ItineraryTab from "@/components/event/ItineraryTab";
import BudgetTab from "@/components/event/BudgetTab";
import ChecklistTab from "@/components/event/ChecklistTab";

const TABS = [
  { key: "itinerary", label: "Itinerary" },
  { key: "budget", label: "Budget" },
  { key: "checklist", label: "Checklist" },
];

export default function EventDetailPage({ params }) {
  useLang();
  const detail = useEventDetail(params.id);
  const { event, loading, error, totalSpent, refetch } = detail;
  const [activeTab, setActiveTab] = useState("itinerary");

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

  return (
    <div className="-m-6 md:-m-8">
      {/* A) HERO */}
      <div className="relative">
        <div
          className={`relative flex h-48 items-center justify-center bg-gradient-to-br md:h-56 ${colors.gradient}`}
        >
          {/* Subtle dark overlay */}
          <div className="absolute inset-0 bg-black/15" />
          <span className="relative text-6xl drop-shadow-sm">
            {event.cover_emoji || colors.icon}
          </span>

          {/* Top controls */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-sm font-semibold text-kiiya-dark shadow-sm backdrop-blur transition hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-sm font-semibold text-kiiya-dark shadow-sm backdrop-blur transition hover:bg-white"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>

        {/* Overlapping info card */}
        <div className="px-6 md:px-8">
          <div className="-mt-10 rounded-2xl border border-purple-100 bg-white p-5 shadow-sm md:p-6">
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

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span>{formatDateRange(event.start_date, event.end_date)}</span>
              {event.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </span>
              )}
            </div>

            {/* Budget summary */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-500">Spent</span>
                <span className="font-semibold text-kiiya-dark">
                  {formatRupiah(totalSpent)} / {formatRupiah(budget)}
                </span>
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
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* C) TAB CONTENT */}
      <div className="px-6 py-6 md:px-8">
        {activeTab === "itinerary" && (
          <ItineraryTab
            itineraryDays={detail.itineraryDays}
            addDay={detail.addDay}
            addActivity={detail.addActivity}
            toggleActivity={detail.toggleActivity}
            deleteActivity={detail.deleteActivity}
          />
        )}
        {activeTab === "budget" && (
          <BudgetTab
            event={event}
            expenses={detail.expenses}
            addExpense={detail.addExpense}
            deleteExpense={detail.deleteExpense}
          />
        )}
        {activeTab === "checklist" && (
          <ChecklistTab
            checklist={detail.checklist}
            addChecklistItem={detail.addChecklistItem}
            toggleChecklistItem={detail.toggleChecklistItem}
            deleteChecklistItem={detail.deleteChecklistItem}
          />
        )}
      </div>
    </div>
  );
}
