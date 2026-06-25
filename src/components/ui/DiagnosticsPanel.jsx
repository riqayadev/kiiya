"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/utils/logger";
import { perf } from "@/utils/perf";

export const OPEN_DIAGNOSTICS_EVENT = "kiiya-open-diagnostics";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || null;
const IS_DEV = process.env.NODE_ENV === "development";

function maskId(id) {
  if (!id) return "—";
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function durationColor(ms) {
  if (ms < 500) return "text-green-400";
  if (ms < 2000) return "text-amber-400";
  return "text-red-400";
}

const TYPE_COLOR = {
  error: "text-red-400",
  warn: "text-amber-400",
  info: "text-blue-400",
};

function Section({ title, action, children }) {
  return (
    <div className="border-b border-white/10 px-4 py-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function DiagnosticsPanel() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0); // bump to re-read logs
  const [expanded, setExpanded] = useState(null); // error index expanded
  const [confirmClear, setConfirmClear] = useState(false);

  const [account, setAccount] = useState({ userId: null, session: "unknown" });
  const [ping, setPing] = useState(null); // { ok, ms, at }
  const [sw, setSw] = useState({ status: "checking…", caches: [] });

  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();

  // ── Open/close: keyboard shortcut + easter-egg event ──
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_DIAGNOSTICS_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_DIAGNOSTICS_EVENT, onOpen);
    };
  }, []);

  // ── On open: refresh account + service worker info ──
  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      try {
        const {
          data: { session },
        } = await supabaseRef.current.auth.getSession();
        if (!active) return;
        setAccount({
          userId: session?.user?.id || null,
          session: session
            ? session.expires_at && session.expires_at * 1000 < Date.now()
              ? "expired"
              : "active"
            : "signed out",
        });
      } catch {
        if (active) setAccount({ userId: null, session: "error" });
      }
    })();

    (async () => {
      if (!("serviceWorker" in navigator)) {
        if (active) setSw({ status: "unsupported", caches: [] });
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const cacheNames =
          typeof caches !== "undefined" ? await caches.keys() : [];
        if (!active) return;
        setSw({
          status: reg ? "registered" : "not registered",
          caches: cacheNames,
        });
      } catch {
        if (active) setSw({ status: "error", caches: [] });
      }
    })();

    return () => {
      active = false;
    };
  }, [open, tick]);

  const perfLog = open ? perf.getLog() : [];
  const errorLog = open ? logger.getLog() : [];

  const lsKeys =
    open && typeof window !== "undefined"
      ? Object.keys(localStorage)
          .filter((k) => k.startsWith("kiiya_"))
          .map((k) => ({ key: k, size: (localStorage.getItem(k) || "").length }))
      : [];

  const pingSupabase = useCallback(async () => {
    const started = performance.now();
    try {
      const { error } = await supabaseRef.current
        .from("profiles")
        .select("id")
        .limit(1);
      const ms = Math.round(performance.now() - started);
      setPing({ ok: !error, ms, at: new Date().toLocaleTimeString() });
    } catch (err) {
      const ms = Math.round(performance.now() - started);
      logger.error("Diagnostics ping failed", err);
      setPing({ ok: false, ms, at: new Date().toLocaleTimeString() });
    }
  }, []);

  const forceSwUpdate = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.update();
      setSw((s) => ({ ...s, status: "update requested" }));
    }
  }, []);

  const clearKiiyaKeys = () => {
    if (typeof window === "undefined") return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith("kiiya_"))
      .forEach((k) => localStorage.removeItem(k));
    setConfirmClear(false);
    setTick((t) => t + 1);
  };

  if (!open) return null;

  const rowCls = "font-mono text-[11px] leading-relaxed text-white/80";

  return (
    <div className="fixed right-0 top-0 z-[999] h-full w-96 max-w-[100vw] overflow-y-auto border-l border-white/10 bg-[#1E1B2E] text-white shadow-2xl">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#1E1B2E] px-4 py-3">
        <div>
          <p className="text-sm font-bold">🔧 Kiiya Diagnostics</p>
          <p className="text-[10px] text-white/40">⌘⇧D / Ctrl⇧D</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close diagnostics"
          className="rounded-lg px-2 py-1 text-lg text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          ×
        </button>
      </div>

      {/* A — App Info */}
      <Section title="App Info">
        <dl className={`${rowCls} space-y-1`}>
          <div className="flex justify-between gap-3">
            <dt className="text-white/40">version</dt>
            <dd>{APP_VERSION}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/40">build time</dt>
            <dd className="truncate">{BUILD_TIME || "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/40">env</dt>
            <dd>{IS_DEV ? "development" : "production"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/40">route</dt>
            <dd className="truncate">{pathname}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/40">user id</dt>
            <dd>{maskId(account.userId)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-white/40">session</dt>
            <dd>{account.session}</dd>
          </div>
        </dl>
      </Section>

      {/* B — Performance Log */}
      <Section
        title={`Performance (${perfLog.length})`}
        action={
          <button
            onClick={() => {
              perf.clearLog();
              setTick((t) => t + 1);
            }}
            className="text-[10px] font-semibold text-white/50 transition hover:text-white"
          >
            Clear
          </button>
        }
      >
        {perfLog.length === 0 ? (
          <p className="text-[11px] text-white/30">No measurements yet.</p>
        ) : (
          <div className="space-y-1">
            {[...perfLog].reverse().map((m, i) => (
              <div key={i} className={`flex justify-between gap-2 ${rowCls}`}>
                <span className="truncate text-white/70">{m.name}</span>
                <span className={durationColor(m.duration)}>{m.duration}ms</span>
                <span className="text-white/30">
                  {new Date(m.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* C — Error Log */}
      <Section
        title={`Errors (${errorLog.length})`}
        action={
          <button
            onClick={() => {
              logger.clearLog();
              setTick((t) => t + 1);
            }}
            className="text-[10px] font-semibold text-white/50 transition hover:text-white"
          >
            Clear
          </button>
        }
      >
        {errorLog.length === 0 ? (
          <p className="text-[11px] text-white/30">No errors logged. 🎉</p>
        ) : (
          <div className="space-y-1">
            {errorLog
              .map((entry, idx) => ({ entry, idx }))
              .reverse()
              .map(({ entry, idx }) => (
                <div key={idx} className={rowCls}>
                  <button
                    onClick={() => setExpanded(expanded === idx ? null : idx)}
                    className="flex w-full items-start gap-2 text-left transition hover:bg-white/5"
                  >
                    <span className="text-white/30">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`font-bold uppercase ${
                        TYPE_COLOR[entry.type] || "text-white/60"
                      }`}
                    >
                      {entry.type}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-white/80">
                      {entry.message.slice(0, 80)}
                    </span>
                  </button>
                  {expanded === idx && (
                    <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-black/40 p-2 text-[10px] text-white/60">
                      {entry.message}
                      {entry.stack ? `\n\n${entry.stack}` : ""}
                      {entry.url ? `\n\n${entry.url}` : ""}
                    </pre>
                  )}
                </div>
              ))}
          </div>
        )}
      </Section>

      {/* D — Supabase Health */}
      <Section title="Supabase Health">
        <button
          onClick={pingSupabase}
          className="rounded-lg bg-[#7C6EF5] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:opacity-90"
        >
          Ping Supabase
        </button>
        {ping && (
          <p className={`mt-2 ${rowCls}`}>
            <span className={ping.ok ? "text-green-400" : "text-red-400"}>
              {ping.ok ? "ok" : "error"}
            </span>{" "}
            · <span className={durationColor(ping.ms)}>{ping.ms}ms</span> ·{" "}
            <span className="text-white/40">{ping.at}</span>
          </p>
        )}
      </Section>

      {/* E — localStorage Inspector */}
      <Section
        title={`localStorage (${lsKeys.length})`}
        action={
          confirmClear ? (
            <span className="flex items-center gap-2 text-[10px]">
              <button
                onClick={clearKiiyaKeys}
                className="font-semibold text-red-400 hover:text-red-300"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="text-white/50 hover:text-white"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-[10px] font-semibold text-white/50 transition hover:text-white"
            >
              Clear all
            </button>
          )
        }
      >
        {lsKeys.length === 0 ? (
          <p className="text-[11px] text-white/30">No kiiya_* keys.</p>
        ) : (
          <div className="space-y-1">
            {lsKeys.map((k) => (
              <div key={k.key} className={`flex justify-between gap-2 ${rowCls}`}>
                <span className="truncate text-white/70">{k.key}</span>
                <span className="text-white/40">{k.size} ch</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* F — Service Worker */}
      <Section
        title="Service Worker"
        action={
          <button
            onClick={forceSwUpdate}
            className="text-[10px] font-semibold text-white/50 transition hover:text-white"
          >
            Force update
          </button>
        }
      >
        <p className={rowCls}>
          <span className="text-white/40">status: </span>
          {sw.status}
        </p>
        {sw.caches.length > 0 && (
          <div className="mt-1">
            <p className="text-[10px] text-white/40">caches:</p>
            {sw.caches.map((c) => (
              <p key={c} className={`${rowCls} truncate`}>
                {c}
              </p>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
