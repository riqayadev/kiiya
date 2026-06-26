"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Menu, X, PlayCircle } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { t } from "@/utils/i18n";
import LanguageToggle from "@/components/ui/LanguageToggle";

// Curated 3-up feature set (emoji + copy pulled from i18n where it fits).
const FEATURE_EMOJI = ["🗺️", "💰", "📸"];

const STEPS = [
  {
    n: "1",
    title: "Create an event",
    desc: "Pick a trip, wedding, or any life moment. Add a cover and you're set.",
  },
  {
    n: "2",
    title: "Plan every detail",
    desc: "Build day-by-day itineraries, track budgets, and invite your crew.",
  },
  {
    n: "3",
    title: "Live & remember",
    desc: "Enjoy the moment, then generate a beautiful card to share your story.",
  },
];

const AVATARS = [
  { e: "🌴", g: "from-[#F0956A] to-[#f7b89b]" },
  { e: "💍", g: "from-[#E8A0BF] to-[#f0c4d8]" },
  { e: "🎓", g: "from-[#7C6EF5] to-[#a594f9]" },
  { e: "✈️", g: "from-[#2DD4BF] to-[#7FC4DE]" },
  { e: "🤰", g: "from-[#a8d8ea] to-[#c5e8f5]" },
];

// Div-only mockup of the dashboard magazine grid (no screenshots).
function MagazineMockup() {
  const blocks = [
    { g: "from-[#F0956A] to-[#f7b89b]", e: "✈️", label: "Bali Trip 2026", big: true },
    { g: "from-[#E8A0BF] to-[#f0c4d8]", e: "💍", label: "Our Wedding" },
    { g: "from-[#7C6EF5] to-[#a594f9]", e: "🎓", label: "Graduation" },
    { g: "from-[#2DD4BF] to-[#7FC4DE]", e: "🤰", label: "Babymoon", wide: true },
  ];
  return (
    <div className="mx-auto mt-16 max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#1A1725] p-5 shadow-[0_40px_80px_rgba(124,110,245,0.3)]">
      {/* Fake topbar */}
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-red-400/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
        <span className="h-3 w-3 rounded-full bg-green-400/80" />
        <div className="ml-3">
          <p className="font-jakarta text-sm font-bold text-white">
            Good morning, Amara 👋
          </p>
          <p className="text-[11px] text-[#6B6480]">✈️ Bali Trip is in 12 days</p>
        </div>
      </div>

      {/* Magazine grid of gradient blocks */}
      <div className="mt-4 grid grid-cols-4 gap-3 [grid-auto-rows:74px]">
        {blocks.map((b) => (
          <div
            key={b.label}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${b.g} ${
              b.big ? "col-span-2 row-span-2" : b.wide ? "col-span-2" : ""
            }`}
          >
            <span className="absolute left-2 top-2 text-lg">{b.e}</span>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2">
              <p className="truncate text-[11px] font-semibold text-white">
                {b.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = t("features.items");

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-kiiya-dark">
      {/* ── NAVBAR ─────────────────────────────── */}
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "border-b border-white/10 bg-black/40 py-3 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent py-5"
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-1.5 font-jakarta text-xl font-extrabold text-white"
          >
            Kiiya <span className="text-base">✨</span>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <LanguageToggle className="border-white/20 bg-white/10" />
            <Link
              href="/login"
              className="rounded-xl border border-white/30 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/register"
              className="btn-primary rounded-xl bg-[#7C6EF5] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#6B5EE4]"
            >
              {t("nav.getStarted")}
            </Link>
          </div>

          <button
            type="button"
            className="text-white md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {menuOpen && (
          <div className="space-y-3 border-t border-white/10 bg-[#0F0D1A] px-6 py-4 md:hidden">
            <LanguageToggle className="border-white/20 bg-white/10" />
            <Link
              href="/login"
              className="block rounded-xl border border-white/30 px-5 py-2 text-center text-sm font-semibold text-white"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/register"
              className="block rounded-xl bg-[#7C6EF5] px-5 py-2 text-center text-sm font-semibold text-white"
            >
              {t("nav.getStarted")}
            </Link>
          </div>
        )}
      </header>

      {/* ── HERO — cinematic ───────────────────── */}
      <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#0F0D1A]">
        {/* Floating orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -left-20 top-10 h-96 w-96 animate-pulse rounded-full bg-[#7C6EF5] opacity-30 blur-[120px]"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="absolute -right-10 bottom-0 h-80 w-80 animate-pulse rounded-full bg-[#E8A0BF] opacity-30 blur-[120px]"
            style={{ animationDuration: "6s" }}
          />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-20 pt-36 text-center">
          {/* Eyebrow */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7C6EF5]/30 bg-[#7C6EF5]/20 px-4 py-1.5 text-sm font-medium text-[#A594F9]">
            <Sparkles className="h-4 w-4" />
            Life Event Planning, Reimagined
          </span>

          {/* Headline */}
          <h1 className="mt-6 font-jakarta text-5xl font-extrabold leading-[1.05] text-white md:text-7xl">
            Plan the moments
            <br />
            <span className="bg-gradient-to-r from-[#7C6EF5] to-[#E8A0BF] bg-clip-text italic text-transparent">
              that matter
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/60">
            {t("hero.sub")}
          </p>

          {/* CTA row */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="btn-primary btn-shimmer inline-flex items-center gap-2 rounded-2xl bg-[#7C6EF5] px-8 py-4 font-jakarta font-semibold text-white shadow-[0_8px_30px_rgba(124,110,245,0.4)] transition hover:bg-[#6B5EE4]"
            >
              Get Started Free <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-8 py-4 font-medium text-white/80 transition hover:bg-white/10"
            >
              <PlayCircle className="h-5 w-5" />
              See how it works
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {AVATARS.map((a, i) => (
                <span
                  key={i}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0F0D1A] bg-gradient-to-br text-sm ${a.g}`}
                >
                  {a.e}
                </span>
              ))}
            </div>
            <p className="text-sm text-white/50">
              Join 500+ people planning their life events
            </p>
          </div>

          {/* Floating app preview */}
          <MagazineMockup />
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────── */}
      <section id="features" className="bg-[#FAFAF8] py-24">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-jakarta text-3xl font-extrabold text-kiiya-dark md:text-4xl">
              {t("features.title")}
            </h2>
            <p className="mt-4 text-lg text-gray-500">{t("features.sub")}</p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {features.slice(0, 3).map((feature, i) => (
              <div
                key={feature.title}
                className="card-hover rounded-3xl bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)]"
              >
                <div className="text-4xl">{FEATURE_EMOJI[i]}</div>
                <h3 className="mt-4 font-jakarta text-xl font-bold text-kiiya-dark">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-jakarta text-3xl font-extrabold text-kiiya-dark md:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Three steps from idea to unforgettable memory.
            </p>
          </div>

          <div className="relative mt-16 grid grid-cols-1 gap-10 md:grid-cols-3">
            {/* Dashed connector (desktop) */}
            <div className="pointer-events-none absolute left-0 right-0 top-12 hidden border-t-2 border-dashed border-[#7C6EF5]/20 md:block" />
            {STEPS.map((step) => (
              <div key={step.n} className="relative text-center">
                <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-4 font-jakarta text-8xl font-extrabold text-[#7C6EF5]/10">
                  {step.n}
                </span>
                <div className="relative">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7C6EF5] font-jakarta text-lg font-bold text-white shadow-[0_8px_30px_rgba(124,110,245,0.3)]">
                    {step.n}
                  </span>
                  <h3 className="mt-5 font-jakarta text-xl font-bold text-kiiya-dark">
                    {step.title}
                  </h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────── */}
      <section className="bg-[#FAFAF8] px-4 py-16">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#7C6EF5] to-[#9B8FF7] p-12 text-center text-white shadow-[0_20px_60px_rgba(124,110,245,0.3)] md:p-16">
          <h2 className="font-jakarta text-3xl font-extrabold md:text-4xl">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-white/85">
            {t("cta.sub")}
          </p>
          <Link
            href="/register"
            className="btn-primary btn-shimmer mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-jakarta text-lg font-bold text-kiiya-primary shadow-lg transition hover:scale-105"
          >
            {t("cta.button")} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────── */}
      <footer className="border-t border-white/10 bg-[#0F0D1A] py-12 text-white">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
            <div className="text-center md:text-left">
              <p className="flex items-center justify-center gap-1.5 font-jakarta text-xl font-extrabold text-[#A594F9] md:justify-start">
                Kiiya <span className="text-base">✨</span>
              </p>
              <p className="mt-2 text-sm text-white/60">{t("footer.tagline")}</p>
            </div>
            <nav className="flex items-center gap-6 text-sm text-white/60">
              <Link href="#" className="transition hover:text-white">
                Privacy
              </Link>
              <Link href="#" className="transition hover:text-white">
                Terms
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-white"
              >
                GitHub
              </a>
            </nav>
          </div>
          <p className="mt-8 text-center text-sm text-white/40">
            {t("footer.copy")}
          </p>
        </div>
      </footer>
    </div>
  );
}
