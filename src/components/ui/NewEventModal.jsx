"use client";
import { useEffect, useRef, useState } from "react";
import { X, Loader2, Tag, Calendar, Wallet, Smile } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
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

const EMPTY_FORM = {
  title: "",
  type: "",
  coverEmoji: "✨",
  startDate: "",
  endDate: "",
  budget: "",
  description: "",
};

export default function NewEventModal({
  isOpen,
  onClose,
  onSuccess,
  createEvent,
  initialDate,
}) {
  const { lang } = useLang();
  const { isDark } = useTheme();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  // Track whether the user explicitly chose an emoji, so we stop auto-deriving
  // it from the type once they have.
  const emojiTouched = useRef(false);
  const titleRef = useRef(null);
  const pickerRef = useRef(null);

  // Reset the form whenever the modal is (re)opened, optionally prefilling
  // the start date (used by the calendar's empty-day click).
  useEffect(() => {
    if (isOpen) {
      setForm({ ...EMPTY_FORM, startDate: initialDate || "" });
      setError("");
      setLoading(false);
      setPickerOpen(false);
      emojiTouched.current = false;
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isOpen, initialDate]);

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
      const payload = {
        title: form.title.trim(),
        type: form.type.trim(),
        status: "upcoming",
        cover_emoji: form.coverEmoji || "✨",
        start_date: form.startDate,
        end_date: form.endDate || null,
        budget: form.budget ? parseInt(form.budget, 10) : 0,
        description: form.description.trim() || null,
      };
      const newEvent = await createEvent(payload);
      onSuccess?.(newEvent);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const dateInput =
    "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-kiiya-dark outline-none transition focus:border-kiiya-primary focus:ring-2 focus:ring-kiiya-primary/20 dark:border-[#2D2A3E] dark:bg-[#221F32] dark:text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-purple-100 bg-white shadow-modal animate-modal-in dark:border-[#2D2A3E] dark:bg-[#1A1825] dark:shadow-black/60">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 text-gray-400 transition hover:text-kiiya-dark dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="border-b border-purple-100 px-6 pb-4 pt-6 dark:border-[#2D2A3E]">
            <input
              ref={titleRef}
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Untitled Event"
              className="w-full bg-transparent text-2xl font-bold text-kiiya-dark outline-none placeholder:text-gray-300 dark:text-white dark:placeholder:text-[#4A4560]"
            />
          </div>

          <div className="space-y-5 px-6 py-5">
            {/* Type — free text */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#6B6480]">
                <Tag className="h-3.5 w-3.5" />
                Type
              </label>
              <input
                type="text"
                value={form.type}
                onChange={(e) => onTypeChange(e.target.value)}
                placeholder="e.g. Trip, Wedding, Anniversary, Custom..."
                className="w-full border-b border-purple-100 bg-transparent px-1 py-1.5 text-sm text-kiiya-dark outline-none transition focus:border-kiiya-primary placeholder:text-gray-300 dark:border-[#2D2A3E] dark:text-white dark:placeholder:text-[#4A4560]"
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

            {/* Icon — emoji-mart picker */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#6B6480]">
                <Smile className="h-3.5 w-3.5" />
                Icon
              </label>
              <div className="relative inline-block" ref={pickerRef}>
                <button
                  type="button"
                  onClick={() => setPickerOpen((o) => !o)}
                  className="flex items-center gap-3 rounded-xl border border-purple-100 px-3 py-2 transition hover:bg-purple-50 dark:border-[#2D2A3E] dark:hover:bg-[#221F32]"
                >
                  <span className="text-[40px] leading-none">{form.coverEmoji}</span>
                  <span className="text-sm font-medium text-kiiya-primary">
                    Change
                  </span>
                </button>

                {pickerOpen && (
                  <div className="absolute left-0 top-full z-30 mt-2">
                    <Picker
                      data={data}
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
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#6B6480]">
                <Calendar className="h-3.5 w-3.5" />
                Date
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                  className={dateInput}
                />
                <span className="text-gray-400">→</span>
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate || undefined}
                  onChange={(e) => setField("endDate", e.target.value)}
                  className={dateInput}
                />
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#6B6480]">
                <Wallet className="h-3.5 w-3.5" />
                Budget
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={form.budget}
                  onChange={(e) => setField("budget", e.target.value)}
                  placeholder="0"
                  className={`flex-1 ${dateInput}`}
                />
                <span className="text-sm font-medium text-gray-400 dark:text-[#6B6480]">
                  IDR
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Add a note…"
                className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-kiiya-dark outline-none transition focus:border-kiiya-primary focus:ring-2 focus:ring-kiiya-primary/20 dark:border-[#2D2A3E] dark:bg-[#221F32] dark:text-white dark:placeholder:text-[#6B6480]"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-purple-100 px-6 py-4 dark:border-[#2D2A3E]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 font-semibold text-gray-500 transition hover:bg-gray-50 dark:text-[#A89EC9] dark:hover:bg-[#221F32]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-kiiya-primary px-5 py-2.5 font-semibold text-white transition hover:bg-[#6B5EE4] disabled:opacity-60"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
