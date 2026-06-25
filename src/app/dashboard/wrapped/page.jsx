"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/utils/i18n";
import { formatRupiah } from "@/utils/format";
import { ACHIEVEMENTS, getUnlocked } from "@/utils/achievements";
import { toast } from "@/components/ui/Toast";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Vertical slide shell with a distinct gradient.
function Slide({ gradient, children }) {
  return (
    <div
      className={`flex min-h-[300px] flex-col justify-between rounded-3xl bg-gradient-to-br ${gradient} p-8 text-white shadow-card`}
    >
      {children}
    </div>
  );
}

export default function WrappedPage() {
  useLang();
  const { user } = useAuth();
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [events, setEvents] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [profileName, setProfileName] = useState("");
  const [unlocked, setUnlocked] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const slidesRef = useRef(null);

  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => currentYear - i),
    [currentYear]
  );

  // Profile name (for the hero subtitle).
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (active) setProfileName(data?.full_name || "");
    })();
    return () => {
      active = false;
    };
  }, [supabase, user]);

  useEffect(() => {
    setUnlocked(getUnlocked());
  }, []);

  // Events + expenses for the selected year.
  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    (async () => {
      const [{ data: ev }, { data: ex }] = await Promise.all([
        supabase
          .from("events")
          .select(
            "id, title, type, status, location, budget, start_date, end_date"
          )
          .eq("user_id", user.id)
          .gte("start_date", `${year}-01-01`)
          .lte("start_date", `${year}-12-31`),
        supabase
          .from("expenses")
          .select("amount, date")
          .eq("user_id", user.id)
          .gte("date", `${year}-01-01`)
          .lte("date", `${year}-12-31`),
      ]);
      if (!active) return;
      setEvents(ev || []);
      setExpenses(ex || []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase, user, year]);

  const displayName =
    profileName ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "You";

  // ── Aggregations ──
  const stats = useMemo(() => {
    const byStatus = { completed: 0, upcoming: 0, ongoing: 0, archived: 0 };
    const typeCounts = {};
    const locations = new Set();
    const perMonth = Array(12).fill(0);
    let totalBudget = 0;

    for (const e of events) {
      if (byStatus[e.status] !== undefined) byStatus[e.status] += 1;
      if (e.type) {
        const key = e.type.trim();
        if (key) typeCounts[key] = (typeCounts[key] || 0) + 1;
      }
      if (e.location) {
        e.location
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((loc) => locations.add(loc));
      }
      if (e.start_date) {
        const m = new Date(e.start_date).getMonth();
        if (m >= 0 && m <= 11) perMonth[m] += 1;
      }
      totalBudget += e.budget || 0;
    }

    const topType =
      Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const peakIdx = perMonth.reduce(
      (best, v, i) => (v > perMonth[best] ? i : best),
      0
    );
    const hasMonthData = perMonth.some((v) => v > 0);

    const totalSpent = expenses.reduce((sum, x) => sum + (x.amount || 0), 0);

    const statusMax = Math.max(
      1,
      byStatus.completed,
      byStatus.upcoming,
      byStatus.ongoing
    );

    return {
      total: events.length,
      byStatus,
      topType,
      locations: [...locations],
      perMonth,
      perMonthMax: Math.max(1, ...perMonth),
      peakIdx,
      hasMonthData,
      totalBudget,
      totalSpent,
      statusMax,
    };
  }, [events, expenses]);

  // Achievements unlocked within the selected year.
  const yearAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter((a) => {
      const ts = unlocked[a.id];
      return ts && new Date(ts).getFullYear() === year;
    });
  }, [unlocked, year]);

  const handleDownload = async () => {
    if (!slidesRef.current) return;
    setBusy(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(slidesRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `kiiya-wrapped-${year}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success(t("wrapped.downloaded"));
    } catch (e) {
      toast.error(e.message || "Could not generate image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl pb-28">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kiiya-dark dark:text-white">
            ✨ {t("wrapped.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-[#A89EC9]">
            {t("wrapped.subtitle")}
          </p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-xl border border-purple-100 bg-white px-3 py-2 text-sm font-semibold text-kiiya-dark outline-none transition focus:border-kiiya-primary dark:border-[#2D2A3E] dark:bg-[#1A1825] dark:text-white"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-24 text-kiiya-primary">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : stats.total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-purple-100 bg-white py-20 text-center dark:border-[#2D2A3E] dark:bg-[#1A1825]">
          <div className="mb-4 text-5xl">🗓️</div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {t("wrapped.emptyTitle").replace("{year}", year)}
          </h3>
          <p className="mx-auto mt-1 max-w-xs text-sm text-gray-400 dark:text-gray-500">
            {t("wrapped.emptySubtitle")}
          </p>
        </div>
      ) : (
        <div ref={slidesRef} className="space-y-5">
          {/* Slide 1 — Hero */}
          <Slide gradient="from-[#7C6EF5] to-[#9B8FF7]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
                {t("wrapped.hero.label").replace("{year}", year)} ✨
              </p>
              <p className="mt-2 text-lg text-white/85">
                {t("wrapped.hero.sub").replace("{name}", displayName)}
              </p>
            </div>
            <div>
              <p className="text-7xl font-extrabold leading-none">
                {stats.total}
              </p>
              <p className="mt-2 text-sm font-medium text-white/85">
                {t("wrapped.hero.events")}
              </p>
            </div>
          </Slide>

          {/* Slide 2 — Events breakdown */}
          <Slide gradient="from-[#F0956A] to-[#F7C59F]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
                {t("wrapped.events.label")}
              </p>
              {stats.topType && (
                <p className="mt-2 text-2xl font-bold">
                  {t("wrapped.events.mostCommon").replace(
                    "{type}",
                    stats.topType
                  )}
                </p>
              )}
            </div>
            <div className="space-y-3">
              {[
                { key: "completed", val: stats.byStatus.completed },
                { key: "upcoming", val: stats.byStatus.upcoming },
                { key: "ongoing", val: stats.byStatus.ongoing },
              ].map(({ key, val }) => (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between text-sm font-medium">
                    <span>{t(`dashboard.status.${key}`)}</span>
                    <span>{val}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-white/25">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{
                        width: `${Math.round((val / stats.statusMax) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Slide>

          {/* Slide 3 — Places */}
          <Slide gradient="from-[#2DD4BF] to-[#38BDF8]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
                {t("wrapped.places.label")}
              </p>
              <p className="mt-2 text-2xl font-bold">
                {t("wrapped.places.explored").replace(
                  "{count}",
                  stats.locations.length
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.locations.length > 0 ? (
                stats.locations.map((loc) => (
                  <span
                    key={loc}
                    className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur-sm"
                  >
                    📍 {loc}
                  </span>
                ))
              ) : (
                <p className="text-sm text-white/80">
                  {t("wrapped.places.none")}
                </p>
              )}
            </div>
          </Slide>

          {/* Slide 4 — Budget */}
          <Slide gradient="from-[#E8A0BF] to-[#F9C6D8]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
                {t("wrapped.budget.label")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">
                {t("wrapped.budget.allocated")}
              </p>
              <p className="text-3xl font-extrabold">
                {formatRupiah(stats.totalBudget)}
              </p>
              <p className="mt-4 text-4xl font-extrabold">
                {formatRupiah(stats.totalSpent)}
              </p>
              <p className="mt-1 text-sm font-medium text-white/85">
                {t("wrapped.budget.spent")}
              </p>
            </div>
          </Slide>

          {/* Slide 5 — Most active month */}
          <Slide gradient="from-[#7C6EF5] to-[#E8A0BF]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
                {t("wrapped.month.label")}
              </p>
              {stats.hasMonthData && (
                <p className="mt-2 text-2xl font-bold">
                  {t("wrapped.month.peak").replace(
                    "{month}",
                    MONTHS[stats.peakIdx]
                  )}
                </p>
              )}
            </div>
            <div className="flex items-end justify-between gap-1.5">
              {stats.perMonth.map((count, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-28 w-full items-end">
                    <div
                      className={`w-full rounded-t-md ${
                        i === stats.peakIdx && stats.hasMonthData
                          ? "bg-white"
                          : "bg-white/35"
                      }`}
                      style={{
                        height: `${Math.round(
                          (count / stats.perMonthMax) * 100
                        )}%`,
                        minHeight: count > 0 ? "6px" : "0px",
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-white/70">
                    {MONTHS[i][0]}
                  </span>
                </div>
              ))}
            </div>
          </Slide>

          {/* Slide 6 — Achievements */}
          <Slide gradient="from-[#1E1B2E] to-[#2D2A3E]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white/60">
                {t("wrapped.achievements.label")}
              </p>
              <p className="mt-2 text-2xl font-bold">
                {t("wrapped.achievements.count").replace(
                  "{count}",
                  yearAchievements.length
                )}
              </p>
            </div>
            <div>
              {yearAchievements.length > 0 && (
                <div className="mb-6 grid grid-cols-6 gap-3">
                  {yearAchievements.map((a) => (
                    <div
                      key={a.id}
                      title={a.name}
                      className="flex aspect-square items-center justify-center rounded-xl bg-white/10 text-2xl"
                    >
                      {a.emoji}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-base font-semibold text-[#A594F9]">
                {t("wrapped.achievements.closing")}
              </p>
            </div>
          </Slide>
        </div>
      )}

      {/* Fixed share button */}
      {!loading && stats.total > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 md:left-[calc(50%+7.5rem)]">
          <button
            onClick={handleDownload}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-kiiya-primary px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t("wrapped.share")}
          </button>
        </div>
      )}
    </div>
  );
}
