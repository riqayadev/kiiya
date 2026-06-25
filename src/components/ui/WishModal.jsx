"use client";
import { useEffect, useRef, useState } from "react";
import { X, Loader2, ImagePlus, Trash2 } from "lucide-react";
import EmojiPicker from "@/components/ui/EmojiPicker";
import { useLang } from "@/hooks/useLang";
import { useTheme } from "@/hooks/useTheme";
import { t } from "@/utils/i18n";
import UnsplashModal from "@/components/ui/UnsplashModal";

const TYPE_SUGGESTIONS = [
  { emoji: "✈️", label: "Trip" },
  { emoji: "💍", label: "Wedding" },
  { emoji: "💑", label: "Anniversary" },
  { emoji: "🤰", label: "Babymoon" },
  { emoji: "🎓", label: "Graduation" },
];

function defaultEmojiForType(type) {
  const n = (type || "").toLowerCase();
  if (/trip|travel|wisata/.test(n)) return "✈️";
  if (/wedding|nikah|kawin/.test(n)) return "💍";
  if (/anniversary|ultah/.test(n)) return "💑";
  if (/graduation|wisuda|lulus/.test(n)) return "🎓";
  if (/babymoon|baby|hamil/.test(n)) return "🤰";
  return "✨";
}

const PRIORITIES = [
  { value: 1, key: "wishlist.priorityHigh" },
  { value: 2, key: "wishlist.priorityMedium" },
  { value: 3, key: "wishlist.priorityLow" },
];

function toForm(wish) {
  return {
    title: wish?.title ?? "",
    type: wish?.type ?? "",
    coverEmoji: wish?.cover_emoji ?? "✨",
    coverImageUrl: wish?.cover_image_url ?? null,
    description: wish?.description ?? "",
    priority: wish?.priority ?? 2,
  };
}

/**
 * Add / edit a wish. `onSave(payload)` persists and resolves; modal handles
 * validation + loading + closing.
 */
export default function WishModal({ isOpen, wish, onClose, onSave }) {
  const { lang } = useLang();
  const { isDark } = useTheme();
  const [form, setForm] = useState(() => toForm(wish));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showUnsplash, setShowUnsplash] = useState(false);
  const emojiTouched = useRef(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setForm(toForm(wish));
      setError("");
      setLoading(false);
      setPickerOpen(false);
      emojiTouched.current = false;
    }
  }, [isOpen, wish]);

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
    if (!form.title.trim()) {
      setError("Please enter a title.");
      return;
    }
    setLoading(true);
    try {
      await onSave({
        title: form.title.trim(),
        type: form.type.trim() || null,
        cover_emoji: form.coverEmoji || defaultEmojiForType(form.type) || "✨",
        cover_image_url: form.coverImageUrl,
        description: form.description.trim() || null,
        priority: form.priority,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save wish.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-kiiya-primary focus:ring-2 focus:ring-kiiya-primary/20 dark:border-[#2D2A3E] dark:bg-[#221F32] dark:text-white dark:placeholder:text-[#6B6480]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-modal animate-modal-in dark:bg-[#1A1825] dark:shadow-black/60">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-[#2D2A3E]">
          <h2 className="text-lg font-bold text-kiiya-dark dark:text-white">
            {wish ? t("wishlist.editWish") : t("wishlist.newWish")}
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
              placeholder="e.g. See the Northern Lights"
              className={inputCls}
            />
          </div>

          {/* Type — free text */}
          <div>
            <label className="mb-1 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
              {t("editEvent.type")}
            </label>
            <input
              type="text"
              value={form.type}
              onChange={(e) => onTypeChange(e.target.value)}
              placeholder="e.g. Trip, Wedding, Custom..."
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

          {/* Emoji + Cover image */}
          <div className="flex flex-wrap items-start gap-6">
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

            <div>
              <label className="mb-2 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
                {t("eventDetail.changeCover")}
              </label>
              {form.coverImageUrl ? (
                <div className="relative h-[58px] w-24 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.coverImageUrl} alt="Cover" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setField("coverImageUrl", null)}
                    aria-label="Remove cover"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowUnsplash(true)}
                  className="flex h-[58px] w-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-purple-200 text-xs font-medium text-kiiya-primary transition hover:bg-purple-50 dark:border-[#2D2A3E] dark:hover:bg-[#221F32]"
                >
                  <ImagePlus className="h-4 w-4" />
                  Add
                </button>
              )}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="mb-1 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => setField("priority", parseInt(e.target.value, 10))}
              className={inputCls}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {t(p.key)}
                </option>
              ))}
            </select>
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
              placeholder="Why do you want this?"
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

      <UnsplashModal
        isOpen={showUnsplash}
        eventType={form.type || "custom"}
        onClose={() => setShowUnsplash(false)}
        onSelect={(url) => setField("coverImageUrl", url)}
      />
    </div>
  );
}
