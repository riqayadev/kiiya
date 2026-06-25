"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { t } from "@/utils/i18n";
import { formatDateShort } from "@/utils/format";
import { toast } from "@/components/ui/Toast";

const MAX_LEN = 2000;

// Midnight (local) for a date — used for whole-day reveal comparisons.
function dayStart(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function TimeCapsuleTab({ event }) {
  useLang();
  const { user } = useAuth();
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  const [capsule, setCapsule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [justRevealed, setJustRevealed] = useState(false);

  // The reveal date mirrors the event end_date.
  const revealDate = event?.end_date || null;
  const today = dayStart(new Date());
  const isOpen = revealDate ? today >= dayStart(revealDate) : false;
  const daysLeft = revealDate
    ? Math.ceil((dayStart(revealDate) - today) / 86400000)
    : null;

  // Fetch the capsule for this event (one per event in practice).
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("time_capsules")
        .select("id, event_id, user_id, message, reveal_date, opened_at, created_at")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (error) toast.error(error.message);
      setCapsule(data || null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase, event.id]);

  // When a sealed capsule's reveal date has passed, stamp opened_at once and
  // play the reveal animation.
  useEffect(() => {
    if (!capsule || capsule.opened_at || !isOpen) return;
    let active = true;
    (async () => {
      const openedAt = new Date().toISOString();
      const { error } = await supabase
        .from("time_capsules")
        .update({ opened_at: openedAt })
        .eq("id", capsule.id);
      if (!active || error) return;
      setCapsule((c) => ({ ...c, opened_at: openedAt }));
      setJustRevealed(true);
    })();
    return () => {
      active = false;
    };
  }, [capsule, isOpen, supabase]);

  const startWriting = () => {
    setDraft(capsule?.message || "");
    setWriting(true);
  };

  const save = async () => {
    const message = draft.trim();
    if (!message || !user || !revealDate) return;
    setSaving(true);
    if (capsule) {
      // Edit existing (only reachable while sealed).
      const { data, error } = await supabase
        .from("time_capsules")
        .update({ message })
        .eq("id", capsule.id)
        .select()
        .single();
      setSaving(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      setCapsule(data);
    } else {
      const { data, error } = await supabase
        .from("time_capsules")
        .insert([
          {
            event_id: event.id,
            user_id: user.id,
            message,
            reveal_date: revealDate,
          },
        ])
        .select()
        .single();
      setSaving(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      setCapsule(data);
    }
    setWriting(false);
    setDraft("");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-kiiya-primary">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  // ── Write form (inline) ──
  if (writing) {
    return (
      <div className="animate-fade-in rounded-2xl border border-purple-100 bg-white p-6 dark:border-[#2D2A3E] dark:bg-[#1A1825]">
        <h3 className="text-lg font-semibold text-kiiya-dark dark:text-white">
          💌 {t("timeCapsule.writeTitle")}
        </h3>
        <textarea
          autoFocus
          value={draft}
          maxLength={MAX_LEN}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("timeCapsule.placeholder")}
          className="mt-4 min-h-[200px] w-full resize-y rounded-xl border border-gray-200 p-4 text-sm leading-relaxed outline-none transition focus:border-kiiya-primary dark:border-[#2D2A3E] dark:bg-[#221F32] dark:text-white dark:placeholder:text-[#6B6480]"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-gray-400 dark:text-[#6B6480]">
          <span>
            {revealDate
              ? t("timeCapsule.revealNote").replace(
                  "{date}",
                  formatDateShort(revealDate)
                )
              : t("timeCapsule.noEndDate")}
          </span>
          <span>
            {draft.length}/{MAX_LEN}
          </span>
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={save}
            disabled={saving || !draft.trim() || !revealDate}
            className="inline-flex items-center gap-2 rounded-xl bg-kiiya-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("timeCapsule.saveSeal")}
          </button>
          <button
            onClick={() => {
              setWriting(false);
              setDraft("");
            }}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-kiiya-dark transition hover:bg-gray-50 dark:border-[#2D2A3E] dark:text-white dark:hover:bg-[#221F32]"
          >
            {t("timeCapsule.cancel")}
          </button>
        </div>
      </div>
    );
  }

  // ── A) No capsule yet ──
  if (!capsule) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 text-5xl">💌</div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          {t("timeCapsule.emptyTitle")}
        </h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-gray-400 dark:text-gray-500">
          {revealDate
            ? t("timeCapsule.emptySubtitle").replace(
                "{date}",
                formatDateShort(revealDate)
              )
            : t("timeCapsule.noEndDate")}
        </p>
        <button
          onClick={startWriting}
          disabled={!revealDate}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-kiiya-primary px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + {t("timeCapsule.writeMessage")}
        </button>
      </div>
    );
  }

  // ── C) Open (reveal date passed) ──
  if (isOpen) {
    return (
      <div
        className={`rounded-2xl border border-[#7C6EF5]/30 bg-gradient-to-br from-[#7C6EF5]/20 to-[#E8A0BF]/20 p-7 ${
          justRevealed ? "animate-slide-up" : "animate-fade-in"
        }`}
      >
        <div className="flex items-center gap-2 text-2xl">💌</div>
        <p className="mt-2 text-sm font-semibold text-kiiya-primary dark:text-[#A594F9]">
          {t("timeCapsule.fromPast")}{" "}
          <span className="font-normal text-gray-500 dark:text-[#A89EC9]">
            · {t("timeCapsule.written")} {formatDateShort(capsule.created_at)}
          </span>
        </p>
        <p className="mt-5 whitespace-pre-wrap font-serif text-lg italic leading-relaxed text-kiiya-dark dark:text-[#F0EEFF]">
          {capsule.message}
        </p>
        {capsule.opened_at && (
          <p className="mt-6 border-t border-[#7C6EF5]/20 pt-4 text-xs text-gray-400 dark:text-[#6B6480]">
            {t("timeCapsule.openedOn")} {formatDateShort(capsule.opened_at)}
          </p>
        )}
      </div>
    );
  }

  // ── B) Sealed ──
  return (
    <div>
      <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E1B2E] to-[#2D2A3E] p-10 text-center text-white">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-4xl">
          🔒
        </div>
        <p className="text-lg font-semibold">
          {t("timeCapsule.sealedUntil")} {formatDateShort(revealDate)}
        </p>
        <p className="mt-2 text-sm text-[#A594F9]">
          {daysLeft > 0
            ? t("timeCapsule.opensIn").replace("{days}", daysLeft)
            : t("timeCapsule.opensToday")}
        </p>
        <p className="mt-4 text-xs text-white/40">
          {t("timeCapsule.written")} {formatDateShort(capsule.created_at)}
        </p>
      </div>
      <div className="mt-3 text-center">
        <button
          onClick={startWriting}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 transition hover:text-kiiya-primary dark:text-[#6B6480]"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t("timeCapsule.editMessage")}
        </button>
      </div>
    </div>
  );
}
