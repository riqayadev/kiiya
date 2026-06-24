"use client";
import { useState, useEffect } from "react";
import { getLang, setLang, LANG_EVENT } from "../utils/i18n";

/**
 * Subscribes the component to language changes so all t() calls re-render
 * when the user toggles EN/ID anywhere in the app.
 */
export function useLang() {
  const [lang, setLangState] = useState("en");

  // Read the persisted language only after mount to keep server/client
  // markup identical (avoids hydration mismatch).
  useEffect(() => {
    setLangState(getLang());
    const handler = () => setLangState(getLang());
    window.addEventListener(LANG_EVENT, handler);
    return () => window.removeEventListener(LANG_EVENT, handler);
  }, []);

  const switchLang = (next) => {
    setLang(next); // fires LANG_EVENT -> updates every subscriber
  };

  return { lang, switchLang };
}
