// Lightweight performance logger built on the Web Performance API. Stores the
// last 20 measurements in a localStorage circular buffer.

const PERF_KEY = "kiiya_perf_log";
const MAX_ENTRIES = 20;

function hasPerf() {
  return typeof window !== "undefined" && typeof performance !== "undefined";
}

function readLog() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PERF_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLog(entries) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PERF_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    /* ignore */
  }
}

export const perf = {
  mark: (name) => {
    if (!hasPerf()) return;
    try {
      performance.mark(name);
    } catch {
      /* mark name clash — ignore */
    }
  },
  // Measures between two marks and persists the result. Returns duration (ms).
  measure: (name, start, end) => {
    if (!hasPerf()) return null;
    try {
      performance.measure(name, start, end);
      const entries = performance.getEntriesByName(name, "measure");
      const last = entries[entries.length - 1];
      const duration = last ? Math.round(last.duration) : 0;
      const log = readLog();
      log.push({ name, duration, timestamp: new Date().toISOString() });
      writeLog(log);
      return duration;
    } catch {
      // Missing start/end mark (e.g. navigated away mid-load) — skip quietly.
      return null;
    }
  },
  getLog: () => readLog(),
  clearLog: () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(PERF_KEY);
    } catch {
      /* ignore */
    }
  },
};
