"use client";
import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import EmojiPicker from "@/components/ui/EmojiPicker";
import { useLang } from "@/hooks/useLang";
import { useTheme } from "@/hooks/useTheme";
import { t } from "@/utils/i18n";

// Clickable suggestions that autofill the (free-text) type + matching emoji.
const TYPE_SUGGESTIONS = [
  { emoji: "✈️", label: "Trip" },
  { emoji: "💍", label: "Wedding" },
  { emoji: "💑", label: "Anniversary" },
  { emoji: "🤰", label: "Babymoon" },
  { emoji: "🎓", label: "Graduation" },
];

// Pick a sensible default emoji from the typed type (EN + ID keywords).
function defaultEmojiForType(type) {
  const n = (type || "").toLowerCase();
  if (/trip|travel|wisata/.test(n)) return "✈️";
  if (/wedding|nikah|kawin/.test(n)) return "💍";
  if (/anniversary|ultah/.test(n)) return "💑";
  if (/graduation|wisuda|lulus/.test(n)) return "🎓";
  if (/babymoon|baby|hamil/.test(n)) return "🤰";
  return "✨";
}

const STATUSES = ["upcoming", "ongoing", "completed", "archived"];

function toForm(event) {
  return {
    title: event?.title ?? "",
    type: event?.type ?? "",
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
  const { lang } = useLang();
  const { isDark } = useTheme();
  const [form, setForm] = useState(() => toForm(event));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  // Track whether the user explicitly chose an emoji, so we stop auto-deriving
  // it from the type once they have.
  const emojiTouched = useRef(false);
  const pickerRef = useRef(null);

  // Re-seed the form whenever the modal opens or the target event changes.
  useEffect(() => {
    if (isOpen) {
      setForm(toForm(event));
      setError("");
      setLoading(false);
      setPickerOpen(false);
      emojiTouched.current = false;
    }
  }, [isOpen, event]);

  // Close on ESC (modal) / close the picker first if it's open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (pickerOpen) setPickerOpen(false);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, pickerOpen]);

  // Close the emoji picker on outside-click.
  useEffect(() => {
    if (!pickerOpen) return;
    const onDoc = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target))
        setPickerOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [pickerOpen]);

  if (!isOpen) return null;

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onTypeChange = (value) =>
    setForm((f) => ({
      ...f,
      type: value,
      coverEmoji: emojiTouched.current ? f.coverEmoji : defaultEmojiForType(value),
    }));

  const applySuggestion = (s) => {
    emojiTouched.current = true;
    setForm((f) => ({ ...f, type: s.label, coverEmoji: s.emoji }));
  };

  const onPickEmoji = (emoji) => {
    emojiTouched.current = true;
    setField("coverEmoji", emoji.native);
    setPickerOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.type.trim() || !form.startDate) {
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
        type: form.type.trim(),
        status: form.status,
        cover_emoji: form.coverEmoji || defaultEmojiForType(form.type) || "✨",
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
    "w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none transition focus:border-kiiya-primary focus:ring-2 focus:ring-kiiya-primary/20 dark:border-[#2D2A3E] dark:bg-[#221F32] dark:text-white dark:placeholder:text-[#6B6480]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-modal animate-modal-in dark:bg-[#1A1825] dark:shadow-black/60">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-[#2D2A3E]">
          <h2 className="text-lg font-bold text-kiiya-dark dark:text-white">
            {t("editEvent.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 transition hover:text-kiiya-dark dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
              {t("editEvent.eventTitle")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Type — free text */}
          <div>
            <label className="mb-1 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
              {t("editEvent.type")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.type}
              onChange={(e) => onTypeChange(e.target.value)}
              placeholder="e.g. Trip, Wedding, Anniversary, Custom..."
              className={inputCls}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TYPE_SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => applySuggestion(s)}
                  className="cursor-pointer rounded-full bg-purple-50 px-2.5 py-1 text-xs text-gray-600 transition hover:bg-purple-100 dark:bg-[#221F32] dark:text-[#A89EC9] dark:hover:bg-[#2D2A3E]"
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
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

          {/* Cover emoji — emoji-mart picker */}
          <div>
            <label className="mb-2 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
              {t("editEvent.coverEmoji")}
            </label>
            <div className="relative inline-block" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setPickerOpen((o) => !o)}
                className="flex items-center gap-3 rounded-xl border border-purple-100 px-3 py-2 transition hover:bg-purple-50 dark:border-[#2D2A3E] dark:hover:bg-[#221F32]"
              >
                <span className="text-[40px] leading-none">{form.coverEmoji}</span>
                <span className="text-sm font-medium text-kiiya-primary">Change</span>
              </button>
              {pickerOpen && (
                <div className="absolute left-0 top-full z-30 mt-2">
                  <EmojiPicker
                    onEmojiSelect={onPickEmoji}
                    theme={isDark ? "dark" : "light"}
                    locale={lang === "id" ? "id" : "en"}
                    previewPosition="none"
                    skinTonePosition="none"
                    maxFrequentRows={2}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
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
              <label className="mb-1 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
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
            <label className="mb-1 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
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
            <label className="mb-1 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
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
            <label className="mb-1 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
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
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-[#2D2A3E]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 font-semibold text-kiiya-dark transition hover:bg-gray-50 dark:border-[#2D2A3E] dark:text-white dark:hover:bg-[#221F32]"
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
