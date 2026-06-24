"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Map, Wallet, Camera, Users, Menu, X, Star, ChevronDown, Sparkles, PlayCircle } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { t } from "@/utils/i18n";
import LanguageToggle from "@/components/ui/LanguageToggle";
import ThemeToggle from "@/components/ui/ThemeToggle";

const FEATURE_ICONS = [Map, Wallet, Camera, Users];

const PILL_COLORS = [
  "bg-kiiya-primary text-white",
  "bg-kiiya-warm text-white",
  "bg-kiiya-romantic text-white",
];

const TESTIMONIALS = [
  {
    name: "Amara R.",
    role: "Honeymoon in Bali",
    quote:
      "Kiiya kept our whole trip — itinerary, budget, packing — in one place. Zero stress, all magic.",
    emoji: "🌴",
  },
  {
    name: "Devin & Mei",
    role: "Wedding 2026",
    quote:
      "We planned our wedding together from two cities. The collaboration features are a lifesaver.",
    emoji: "💍",
  },
  {
    name: "Priya S.",
    role: "Graduation trip",
    quote:
      "The memory card I made after the trip got 200 likes on my story. Obsessed with this app.",
    emoji: "🎓",
  },
];

const FAQS = [
  {
    q: "Is Kiiya free?",
    a: "Yes! You can create events, build itineraries, track budgets, and collaborate completely free.",
  },
  {
    q: "Can I collaborate with friends?",
    a: "Absolutely. Invite friends or family as editors or viewers and plan every detail together.",
  },
  {
    q: "What events can I plan?",
    a: "Trips, weddings, anniversaries, babymoons, graduations, or any custom life moment you can dream up.",
  },
  {
    q: "Can I use Kiiya on my phone?",
    a: "Yes — Kiiya is a progressive web app, so you can install it on your phone and use it like a native app.",
  },
  {
    q: "What happens after my event?",
    a: "Generate a beautiful shareable memory card to celebrate and share your story on social media.",
  },
];

function FaqItem({ faq, open, onToggle }) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-white dark:border-[#2D2A3E] dark:bg-[#1A1825]">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-semibold text-kiiya-dark dark:text-white">
          {faq.q}
        </span>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-kiiya-primary transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <p className="px-5 pb-4 text-sm leading-relaxed text-gray-500 animate-fade-in dark:text-[#A89EC9]">
          {faq.a}
        </p>
      )}
    </div>
  );
}

// Div-based mini dashboard render that matches the app's dark mode.
function DashboardMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#2D2A3E] bg-[#0F0E17] shadow-2xl shadow-black/40">
      {/* Chrome bar */}
      <div className="flex h-10 items-center gap-2 bg-[#1A1825] px-4">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <div className="mx-4 flex h-6 flex-1 items-center rounded-lg bg-[#2D2A3E] px-3 text-xs text-gray-500">
          kiiya.vercel.app/dashboard
        </div>
      </div>
      {/* Body */}
      <div className="flex h-[260px]">
        {/* Mini sidebar */}
        <div className="hidden w-40 flex-shrink-0 flex-col gap-1 bg-[#13111E] p-4 sm:flex">
          <p className="text-sm font-semibold text-kiiya-primary">✦ Kiiya</p>
          <div className="mt-4 space-y-1">
            <div className="rounded-lg bg-[#221F32] px-2 py-1.5 text-xs font-medium text-[#A594F9]">
              Dashboard
            </div>
            <div className="px-2 py-1.5 text-xs text-[#A89EC9]">Calendar</div>
            <div className="px-2 py-1.5 text-xs text-[#A89EC9]">Profile</div>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 p-5">
          <p className="text-sm font-bold text-white">Good morning, Amara 👋</p>
          <p className="text-[11px] text-[#6B6480]">5 events · 2 upcoming · 3 completed</p>
          <div className="mt-4 space-y-2">
            {[
              { e: "✈️", g: "from-[#F0956A] to-[#f7b89b]", t: "Bali Trip 2026", s: "Upcoming", sc: "bg-blue-500/20 text-blue-300" },
              { e: "💍", g: "from-[#E8A0BF] to-[#f0c4d8]", t: "Our Wedding", s: "Planning", sc: "bg-pink-500/20 text-pink-300" },
              { e: "🎓", g: "from-[#7C6EF5] to-[#a594f9]", t: "Graduation", s: "Done", sc: "bg-gray-500/20 text-gray-300" },
            ].map((c) => (
              <div
                key={c.t}
                className="flex items-center gap-3 rounded-xl border border-[#2D2A3E] bg-[#1A1825] p-2.5"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-base ${c.g}`}>
                  {c.e}
                </div>
                <p className="flex-1 truncate text-xs font-medium text-white">{c.t}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.sc}`}>
                  {c.s}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = t("features.items");
  const eventTypes = t("eventTypes.items");

  return (
    <div className="min-h-screen bg-white text-kiiya-dark dark:bg-[#0F0E17] dark:text-white">
      {/* ── NAVBAR ─────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all ${
          scrolled
            ? "border-b border-purple-100 bg-white/80 shadow-sm backdrop-blur-md dark:border-[#2D2A3E] dark:bg-[#0F0E17]/80"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-kiiya-primary">
            ✦ Kiiya
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <LanguageToggle />
            <ThemeToggle />
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

          <button
            type="button"
            className="text-kiiya-dark dark:text-white md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {menuOpen && (
          <div className="space-y-3 border-t border-purple-100 bg-white px-6 py-4 animate-fade-in dark:border-[#2D2A3E] dark:bg-[#0F0E17] md:hidden">
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
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

      {/* ── HERO ───────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F7F5FF] via-[#EDE9FF] to-[#F7F5FF] dark:from-[#0F0E17] dark:via-[#1A1458] dark:to-[#0F0E17]">
        {/* Animated blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-10 h-72 w-72 animate-pulse rounded-full bg-kiiya-primary/20 blur-3xl" />
          <div
            className="absolute right-0 top-1/4 h-80 w-80 animate-pulse rounded-full bg-kiiya-romantic/20 blur-3xl"
            style={{ animationDelay: "1.5s" }}
          />
          <div
            className="absolute bottom-0 left-1/3 h-64 w-64 animate-pulse rounded-full bg-kiiya-warm/20 blur-3xl"
            style={{ animationDelay: "3s" }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-20 text-center md:pt-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-kiiya-primary/20 bg-kiiya-primary/10 px-4 py-1.5 text-sm font-medium text-kiiya-primary">
            <Sparkles className="h-4 w-4" />
            Now in Beta
          </span>

          <h1 className="mt-6 text-5xl font-extrabold leading-tight md:text-7xl">
            <span className="text-kiiya-dark dark:text-white">
              Your life moments,
            </span>
            <br />
            <span className="bg-gradient-to-r from-kiiya-primary to-kiiya-romantic bg-clip-text text-transparent">
              planned &amp; remembered.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-lg text-gray-500 dark:text-[#A89EC9]">
            {t("hero.sub")}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="rounded-2xl bg-kiiya-primary px-8 py-4 font-semibold text-white shadow-primary transition hover:bg-[#6B5EE4]"
            >
              Start Planning Free
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 px-8 py-4 font-medium text-gray-600 transition hover:bg-gray-50 dark:border-[#2D2A3E] dark:text-gray-300 dark:hover:bg-[#1A1825]"
            >
              <PlayCircle className="h-5 w-5" />
              See how it works
            </Link>
          </div>

          {/* Mockup */}
          <div className="mt-16">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────── */}
      <section id="features" className="bg-white py-20 dark:bg-[#0F0E17]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-kiiya-dark dark:text-white md:text-4xl">
              {t("features.title")}
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-[#A89EC9]">
              {t("features.sub")}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-purple-100 p-6 transition hover:-translate-y-1 hover:shadow-card-hover dark:border-[#2D2A3E] dark:bg-[#1A1825]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-kiiya-primary dark:bg-[#221F32] dark:text-[#A594F9]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-kiiya-dark dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-[#A89EC9]">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ───────────────────────── */}
      <section className="bg-white pb-20 dark:bg-[#0F0E17]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-kiiya-dark dark:text-white md:text-4xl">
              Trusted by life planners worldwide
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((tm) => (
              <div
                key={tm.name}
                className="rounded-2xl border border-purple-100 bg-kiiya-bg/50 p-6 dark:border-[#2D2A3E] dark:bg-[#1A1825]"
              >
                <div className="flex gap-0.5 text-kiiya-warm">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-kiiya-dark dark:text-[#E5E0FF]">
                  “{tm.quote}”
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm dark:bg-[#221F32]">
                    {tm.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-kiiya-dark dark:text-white">
                      {tm.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-[#6B6480]">
                      {tm.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVENT TYPES ────────────────────────── */}
      <section className="bg-kiiya-bg py-16 dark:bg-[#13111E]">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-3xl font-bold text-kiiya-dark dark:text-white md:text-4xl">
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

      {/* ── FAQ ────────────────────────────────── */}
      <section className="bg-white py-20 dark:bg-[#0F0E17]">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-center text-3xl font-bold text-kiiya-dark dark:text-white md:text-4xl">
            Frequently asked questions
          </h2>
          <div className="mt-10 space-y-3">
            {FAQS.map((faq, i) => (
              <FaqItem
                key={faq.q}
                faq={faq}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────── */}
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

      {/* ── FOOTER ─────────────────────────────── */}
      <footer className="bg-kiiya-dark py-12 text-white dark:bg-[#13111E]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-start">
            <div className="text-center md:text-left">
              <p className="text-xl font-bold text-kiiya-primary">✦ Kiiya</p>
              <p className="mt-2 text-sm text-white/70">{t("footer.tagline")}</p>
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
