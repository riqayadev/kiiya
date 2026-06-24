"use client";
import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { t } from "@/utils/i18n";

const EVENT_TYPES = [
  "trip",
  "wedding",
  "anniversary",
  "babymoon",
  "graduation",
  "custom",
];

const STATUSES = ["upcoming", "ongoing", "completed", "archived"];

const TYPE_EMOJI = {
  trip: "✈️",
  wedding: "💍",
  anniversary: "💑",
  babymoon: "🤰",
  graduation: "🎓",
  custom: "⭐",
};

const EMOJI_OPTIONS = ["✈️", "💍", "💑", "🤰", "🎓", "🌴", "🎉", "🏔️", "🌊", "⭐"];

function toForm(event) {
  return {
    title: event?.title ?? "",
    type: event?.type ?? "custom",
    coverEmoji: event?.cover_emoji ?? "✨",
    startDate: event?.start_date ?? "",
    endDate: event?.end_date ?? "",
    budget: event?.budget != null ? String(event.budget) : "",
    location: event?.location ?? "",
    status: event?.status ?? "upcoming",
    description: event?.description ?? "",
  };
}

/**
 * Edit an existing event. `onSubmit(updates)` should persist and resolve;
 * the modal handles validation, loading state, and closing.
 */
export default function EditEventModal({ isOpen, event, onClose, onSubmit }) {
  useLang();
  const [form, setForm] = useState(() => toForm(event));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Re-seed the form whenever the modal opens or the target event changes.
  useEffect(() => {
    if (isOpen) {
      setForm(toForm(event));
      setError("");
      setLoading(false);
    }
  }, [isOpen, event]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.type || !form.startDate) {
      setError("Please fill in the title, type, and start date.");
      return;
    }
    if (form.endDate && form.endDate < form.startDate) {
      setError("End date must be on or after the start date.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        type: form.type,
        status: form.status,
        cover_emoji: form.coverEmoji || TYPE_EMOJI[form.type] || "✨",
        start_date: form.startDate,
        end_date: form.endDate || null,
        budget: form.budget ? parseInt(form.budget, 10) : 0,
        location: form.location.trim() || null,
        description: form.description.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none transition focus:border-kiiya-primary focus:ring-2 focus:ring-kiiya-primary/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl animate-modal-in">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-kiiya-dark">
            {t("editEvent.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 transition hover:text-kiiya-dark"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-kiiya-dark">
              {t("editEvent.eventTitle")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-kiiya-dark">
              {t("editEvent.type")} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_TYPES.map((type) => {
                const selected = form.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setField("type", type)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-sm font-medium transition ${
                      selected
                        ? "border-2 border-kiiya-primary bg-purple-50 text-kiiya-primary"
                        : "border border-gray-200 text-kiiya-dark/70 hover:border-purple-300"
                    }`}
                  >
                    <span>{TYPE_EMOJI[type]}</span>
                    {t(`dashboard.eventTypes.${type}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium text-kiiya-dark">
              {t("editEvent.status")}
            </label>
            <select
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
              className={inputCls}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`dashboard.status.${s}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Cover emoji */}
          <div>
            <label className="mb-2 block text-sm font-medium text-kiiya-dark">
              {t("editEvent.coverEmoji")}
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => {
                const selected = form.coverEmoji === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setField("coverEmoji", emoji)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl transition ${
                      selected
                        ? "border-2 border-kiiya-primary bg-purple-50"
                        : "border border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-kiiya-dark">
                {t("editEvent.startDate")} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-kiiya-dark">
                {t("editEvent.endDate")}
              </label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => setField("endDate", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="mb-1 block text-sm font-medium text-kiiya-dark">
              {t("editEvent.location")}
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
              placeholder={t("editEvent.locationPlaceholder")}
              className={inputCls}
            />
          </div>

          {/* Budget */}
          <div>
            <label className="mb-1 block text-sm font-medium text-kiiya-dark">
              {t("editEvent.budget")}
            </label>
            <input
              type="number"
              min="0"
              value={form.budget}
              onChange={(e) => setField("budget", e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-kiiya-dark">
              {t("editEvent.description")}
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 font-semibold text-kiiya-dark transition hover:bg-gray-50"
            >
              {t("editEvent.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-kiiya-primary px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {t("editEvent.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
