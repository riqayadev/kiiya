"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Map, Wallet, Camera, Users, Menu, X, Star, ChevronDown } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { t } from "@/utils/i18n";
import LanguageToggle from "@/components/ui/LanguageToggle";

const FEATURE_ICONS = [Map, Wallet, Camera, Users];

const FLOATING_CARDS = [
  { emoji: "✈️", label: "Trip", pos: "-top-6 -left-6", delay: "0s" },
  { emoji: "💍", label: "Wedding", pos: "top-10 -right-8", delay: "0.8s" },
  { emoji: "🎓", label: "Graduation", pos: "-bottom-6 -left-4", delay: "1.6s" },
];

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
    <div className="rounded-2xl border border-purple-100 bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-semibold text-kiiya-dark">{faq.q}</span>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-kiiya-primary transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <p className="px-5 pb-4 text-sm leading-relaxed text-gray-500 animate-fade-in">
          {faq.a}
        </p>
      )}
    </div>
  );
}

export default function Landing() {
  useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // Navbar transparent → white/blur after scrolling past 50px.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = t("features.items");
  const eventTypes = t("eventTypes.items");

  return (
    <div className="min-h-screen bg-white text-kiiya-dark">
      {/* ── A) NAVBAR ───────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all ${
          scrolled
            ? "border-b border-purple-100 bg-white/80 shadow-sm backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
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

          <button
            type="button"
            className="text-kiiya-dark md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {/* Mobile slide-in menu */}
        {menuOpen && (
          <div className="space-y-3 border-t border-purple-100 bg-white px-6 py-4 animate-fade-in md:hidden">
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
      <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-b from-kiiya-bg to-white">
        {/* Animated background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-blob absolute -left-20 top-10 h-72 w-72 rounded-full bg-kiiya-primary/10 blur-3xl" />
          <div
            className="animate-blob absolute right-0 top-1/3 h-80 w-80 rounded-full bg-kiiya-romantic/10 blur-3xl"
            style={{ animationDelay: "3s" }}
          />
          <div
            className="animate-blob absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-kiiya-warm/10 blur-3xl"
            style={{ animationDelay: "6s" }}
          />
        </div>

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

          {/* Fake browser window mockup */}
          <div className="relative hidden md:block">
            {FLOATING_CARDS.map((card) => (
              <div
                key={card.label}
                className={`animate-float absolute z-10 ${card.pos} flex items-center gap-2 rounded-2xl border border-purple-100 bg-white px-4 py-3 shadow-lg`}
                style={{ animationDelay: card.delay }}
              >
                <span className="text-2xl">{card.emoji}</span>
                <span className="text-sm font-semibold text-kiiya-dark">
                  {card.label}
                </span>
              </div>
            ))}

            <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-2xl">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
                <div className="ml-3 flex-1 rounded-md bg-white px-3 py-1 text-xs text-gray-400">
                  kiiya.vercel.app/dashboard
                </div>
              </div>
              {/* Mini dashboard mockup */}
              <div className="bg-kiiya-bg p-5">
                <p className="text-sm font-bold text-kiiya-dark">
                  Good morning, Amara! 👋
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { v: "5", l: "Events" },
                    { v: "2", l: "Upcoming" },
                    { v: "3", l: "Done" },
                  ].map((s) => (
                    <div
                      key={s.l}
                      className="rounded-xl border border-purple-100 bg-white p-3"
                    >
                      <p className="text-lg font-bold text-kiiya-dark">{s.v}</p>
                      <p className="text-[10px] text-gray-400">{s.l}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { e: "✈️", g: "from-[#F0956A] to-[#f7b89b]", t: "Bali Trip" },
                    { e: "💍", g: "from-[#E8A0BF] to-[#f0c4d8]", t: "Our Wedding" },
                  ].map((c) => (
                    <div
                      key={c.t}
                      className="overflow-hidden rounded-xl border border-purple-100 bg-white"
                    >
                      <div
                        className={`flex h-12 items-center justify-center bg-gradient-to-br text-2xl ${c.g}`}
                      >
                        {c.e}
                      </div>
                      <p className="px-2 py-2 text-xs font-semibold text-kiiya-dark">
                        {c.t}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
                  className="rounded-2xl border border-purple-100 p-6 transition hover:-translate-y-1 hover:shadow-md"
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

      {/* ── D) SOCIAL PROOF ─────────────────────── */}
      <section className="bg-white pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-kiiya-dark md:text-4xl">
              Trusted by life planners worldwide
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((tm) => (
              <div
                key={tm.name}
                className="rounded-2xl border border-purple-100 bg-kiiya-bg/50 p-6"
              >
                <div className="flex gap-0.5 text-kiiya-warm">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-kiiya-dark">
                  “{tm.quote}”
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                    {tm.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-kiiya-dark">
                      {tm.name}
                    </p>
                    <p className="text-xs text-gray-400">{tm.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── E) EVENT TYPES ──────────────────────── */}
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

      {/* ── F) FAQ ──────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-center text-3xl font-bold text-kiiya-dark md:text-4xl">
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

      {/* ── G) CTA ──────────────────────────────── */}
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

      {/* ── H) FOOTER ───────────────────────────── */}
      <footer className="bg-kiiya-dark py-12 text-white">
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
