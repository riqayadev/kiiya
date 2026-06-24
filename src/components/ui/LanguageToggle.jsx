"use client";
import { useLang } from "@/hooks/useLang";

export default function LanguageToggle({ className = "" }) {
  const { lang, switchLang } = useLang();

  const base =
    "px-3 py-1 text-sm font-semibold rounded-full transition-colors";
  const active = "bg-kiiya-primary text-white";
  const inactive =
    "text-kiiya-dark/60 hover:text-kiiya-primary dark:text-[#A89EC9] dark:hover:text-[#A594F9]";

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-purple-100 bg-white/70 p-1 dark:border-[#2D2A3E] dark:bg-[#221F32] ${className}`}
    >
      <button
        type="button"
        onClick={() => switchLang("en")}
        className={`${base} ${lang === "en" ? active : inactive}`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchLang("id")}
        className={`${base} ${lang === "id" ? active : inactive}`}
        aria-pressed={lang === "id"}
      >
        ID
      </button>
    </div>
  );
}
