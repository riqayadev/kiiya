// Lightweight client-side error logger. Stores the last 50 entries in a
// localStorage circular buffer — no external SDK, no network calls.
//
// Never log secrets here: callers must not pass tokens/passwords/PIN hashes in
// `context`, and we never read them.

const ERROR_KEY = "kiiya_error_log";
const MAX_ENTRIES = 50;
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

function readLog() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ERROR_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLog(entries) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ERROR_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    /* quota / disabled storage — drop silently */
  }
}

function record(type, message, error, context) {
  if (typeof window === "undefined") return;
  const entry = {
    timestamp: new Date().toISOString(),
    type,
    message: String(message ?? ""),
    stack: error?.stack || error?.message || null,
    url: typeof window.location !== "undefined" ? window.location.href : null,
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : null,
    appVersion: APP_VERSION,
  };
  if (context && Object.keys(context).length) entry.context = context;
  const entries = readLog();
  entries.push(entry);
  writeLog(entries);
}

export const logger = {
  error: (message, error, context = {}) =>
    record("error", message, error, context),
  warn: (message, context = {}) => record("warn", message, null, context),
  info: (message, context = {}) => record("info", message, null, context),
  getLog: () => readLog(),
  clearLog: () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(ERROR_KEY);
    } catch {
      /* ignore */
    }
  },
};
