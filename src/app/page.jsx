"use client";
import { useState } from "react";
import Link from "next/link";
import { Map, Wallet, Camera, Users, Menu, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { t } from "@/utils/i18n";
import LanguageToggle from "@/components/ui/LanguageToggle";

const FEATURE_ICONS = [Map, Wallet, Camera, Users];

const FLOATING_CARDS = [
  { emoji: "✈️", label: "Trip", pos: "top-0 left-4", delay: "0s" },
  { emoji: "💍", label: "Wedding", pos: "top-16 right-0", delay: "0.8s" },
  { emoji: "💑", label: "Anniversary", pos: "top-44 left-0", delay: "1.6s" },
  { emoji: "🎓", label: "Graduation", pos: "bottom-8 right-6", delay: "2.2s" },
];

const PILL_COLORS = [
  "bg-kiiya-primary text-white",
  "bg-kiiya-warm text-white",
  "bg-kiiya-romantic text-white",
];

export default function Landing() {
  // Subscribe to language changes so every t() call below re-renders.
  useLang();
  const [menuOpen, setMenuOpen] = useState(false);

  const features = t("features.items");
  const eventTypes = t("eventTypes.items");

  return (
    <div className="min-h-screen bg-white text-kiiya-dark">
      {/* ── A) NAVBAR ───────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-purple-100 bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-kiiya-primary">
            ✦ Kiiya
          </Link>

          <div className="hidden items-center gap-4 md:flex">
            <LanguageToggle />
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-full border border-kiiya-primary px-5 py-2 text-sm font-semibold text-kiiya-primary transition hover:bg-kiiya-primary/10"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-kiiya-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {t("nav.getStarted")}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="text-kiiya-dark md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {menuOpen && (
          <div className="space-y-3 border-t border-purple-100 bg-white px-6 py-4 md:hidden">
            <LanguageToggle />
            <Link
              href="/login"
              className="block rounded-full border border-kiiya-primary px-5 py-2 text-center text-sm font-semibold text-kiiya-primary"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/register"
              className="block rounded-full bg-kiiya-primary px-5 py-2 text-center text-sm font-semibold text-white"
            >
              {t("nav.getStarted")}
            </Link>
          </div>
        )}
      </header>

      {/* ── B) HERO ─────────────────────────────── */}
      <section className="relative flex min-h-screen items-center bg-gradient-to-b from-kiiya-bg to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
          <div className="text-center md:text-left">
            <span className="inline-block rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-kiiya-primary">
              {t("hero.badge")}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-kiiya-dark md:text-6xl">
              {t("hero.headline")}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-gray-500 md:mx-0">
              {t("hero.sub")}
            </p>
            <div className="mt-8 flex flex-col items-center gap-2 md:items-start">
              <Link
                href="/register"
                className="inline-block rounded-full bg-kiiya-primary px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-kiiya-primary/30 transition hover:scale-105 hover:opacity-95"
              >
                {t("hero.cta")}
              </Link>
              <span className="text-sm text-gray-400">{t("hero.ctaSub")}</span>
            </div>
          </div>

          {/* Decorative floating emoji cards */}
          <div className="relative hidden h-96 md:block">
            {FLOATING_CARDS.map((card) => (
              <div
                key={card.label}
                className={`animate-float absolute ${card.pos} flex items-center gap-3 rounded-2xl border border-purple-100 bg-white px-5 py-4 shadow-lg`}
                style={{ animationDelay: card.delay }}
              >
                <span className="text-3xl">{card.emoji}</span>
                <span className="font-semibold text-kiiya-dark">
                  {card.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── C) FEATURES ─────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-kiiya-dark md:text-4xl">
              {t("features.title")}
            </h2>
            <p className="mt-4 text-lg text-gray-500">{t("features.sub")}</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-purple-100 p-6 transition hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-kiiya-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-kiiya-dark">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── D) EVENT TYPES ──────────────────────── */}
      <section className="bg-kiiya-bg py-16">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-3xl font-bold text-kiiya-dark md:text-4xl">
            {t("eventTypes.title")}
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {eventTypes.map((label, i) => (
              <span
                key={label}
                className={`rounded-full px-6 py-3 text-base font-semibold shadow-sm ${
                  PILL_COLORS[i % PILL_COLORS.length]
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── E) CTA ──────────────────────────────── */}
      <section className="bg-gradient-to-r from-kiiya-primary to-kiiya-warm py-20 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">{t("cta.title")}</h2>
          <p className="mt-4 text-lg text-white/90">{t("cta.sub")}</p>
          <Link
            href="/register"
            className="mt-8 inline-block rounded-full bg-white px-8 py-4 text-lg font-semibold text-kiiya-primary shadow-lg transition hover:scale-105"
          >
            {t("cta.button")}
          </Link>
        </div>
      </section>

      {/* ── F) FOOTER ───────────────────────────── */}
      <footer className="bg-kiiya-dark py-12 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-start">
            <div className="text-center md:text-left">
              <p className="text-xl font-bold text-kiiya-primary">✦ Kiiya</p>
              <p className="mt-2 text-sm text-white/70">
                {t("footer.tagline")}
              </p>
            </div>
          </div>
          <p className="mt-8 text-center text-sm text-white/50">
            {t("footer.copy")}
          </p>
        </div>
      </footer>
    </div>
  );
}
