"use client";
import { useEffect, useState } from "react";
import { X, Search, Trash2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { t } from "@/utils/i18n";

// Curated keyword suggestions per event type (no API key needed).
const SUGGESTIONS = {
  trip: ["bali", "travel", "mountain", "beach", "adventure", "backpacking"],
  wedding: ["wedding", "flowers", "romance", "ceremony", "love"],
  anniversary: ["couple", "romance", "dinner", "candles", "love"],
  babymoon: ["pregnancy", "baby", "nursery", "soft", "pastel"],
  graduation: ["graduation", "university", "celebration", "diploma"],
  custom: ["celebration", "party", "event", "lifestyle"],
};

// Build 9 slightly-varied image URLs for a keyword.
function buildUrls(query) {
  const q = encodeURIComponent(query.trim() || "celebration");
  return Array.from(
    { length: 9 },
    (_, i) => `https://source.unsplash.com/featured/400x300?${q}&sig=${i + 1}`
  );
}

export default function UnsplashModal({
  isOpen,
  onClose,
  eventType = "custom",
  onSelect,
  onRemove,
}) {
  useLang();
  const suggestions = SUGGESTIONS[eventType] ?? SUGGESTIONS.custom;
  const [query, setQuery] = useState(suggestions[0]);
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(false);

  const runSearch = (q) => {
    setQuery(q);
    setLoading(true);
    setUrls(buildUrls(q));
  };

  // Seed the grid whenever the modal opens.
  useEffect(() => {
    if (isOpen) runSearch(suggestions[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close on ESC.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-kiiya-dark">
            {t("unsplash.title")}
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

        <div className="overflow-y-auto px-6 py-5">
          {/* Search bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(query);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("unsplash.searchPlaceholder")}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-kiiya-primary focus:ring-2 focus:ring-kiiya-primary/20"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-kiiya-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Search className="h-4 w-4" />
              {t("unsplash.search")}
            </button>
          </form>

          {/* Suggested keyword pills */}
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => runSearch(s)}
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                  query === s
                    ? "bg-kiiya-primary text-white"
                    : "border border-purple-100 text-kiiya-dark/70 hover:border-kiiya-primary/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Image grid */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {urls.map((url, i) => (
              <button
                key={url}
                onClick={() => {
                  onSelect?.(url);
                  onClose();
                }}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100"
              >
                {/* Loading shimmer behind the image */}
                <div className="absolute inset-0 animate-pulse bg-gray-100" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${query} ${i + 1}`}
                  loading="lazy"
                  className="relative h-full w-full object-cover transition group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.opacity = "0.3";
                  }}
                />
              </button>
            ))}
          </div>

          {/* Remove cover */}
          {onRemove && (
            <button
              onClick={() => {
                onRemove();
                onClose();
              }}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-500 transition hover:opacity-80"
            >
              <Trash2 className="h-4 w-4" />
              {t("unsplash.remove")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
