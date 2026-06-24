"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "kiiya_theme";
const THEME_EVENT = "kiiya-theme";

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

// Resolve a stored mode ('light' | 'dark' | 'system') to a boolean.
export function resolveDark(mode) {
  return mode === "dark" || (mode === "system" && systemPrefersDark());
}

// Toggle the `dark` class on <html> based on a mode.
export function applyTheme(mode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolveDark(mode));
}

function readStored() {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem(STORAGE_KEY) || "light";
}

/**
 * Theme controller backed by localStorage and synced to profiles.theme_mode.
 * Subscribes to a window event so every toggle re-renders all consumers.
 * Exposes: { theme, isDark, toggleTheme, setTheme }.
 */
export function useTheme() {
  const [theme, setThemeState] = useState("light");

  // Read persisted theme only after mount (keeps SSR markup stable).
  useEffect(() => {
    const stored = readStored();
    setThemeState(stored);
    applyTheme(stored);

    const handler = () => setThemeState(readStored());
    window.addEventListener(THEME_EVENT, handler);

    // Keep "system" mode reactive to OS changes.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMq = () => {
      if (readStored() === "system") applyTheme("system");
    };
    mq.addEventListener?.("change", onMq);

    return () => {
      window.removeEventListener(THEME_EVENT, handler);
      mq.removeEventListener?.("change", onMq);
    };
  }, []);

  const setTheme = useCallback((mode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    applyTheme(mode);
    window.dispatchEvent(new Event(THEME_EVENT));

    // Best-effort persist to the user's profile (ignored when signed out).
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("profiles")
            .update({ theme_mode: mode })
            .eq("id", user.id);
        }
      } catch {
        /* offline / no session — localStorage is the source of truth */
      }
    })();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolveDark(readStored()) ? "light" : "dark");
  }, [setTheme]);

  return { theme, isDark: resolveDark(theme), toggleTheme, setTheme };
}
