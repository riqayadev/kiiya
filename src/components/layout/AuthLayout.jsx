"use client";
import Link from "next/link";
import { Star } from "lucide-react";
import LanguageToggle from "@/components/ui/LanguageToggle";
import ThemeToggle from "@/components/ui/ThemeToggle";

const FLOATING_CARDS = [
  {
    emoji: "✈️",
    title: "Bali Trip 2026",
    tag: "Upcoming",
    tagCls: "bg-blue-400/30 text-blue-100",
    anim: "animate-float",
    pos: "ml-0",
  },
  {
    emoji: "💍",
    title: "Wedding Day",
    tag: "Planning",
    tagCls: "bg-pink-400/30 text-pink-100",
    anim: "animate-float-delayed",
    pos: "ml-12",
  },
  {
    emoji: "🎓",
    title: "Graduation Trip",
    tag: "Completed",
    tagCls: "bg-green-400/30 text-green-100",
    anim: "animate-float-slow",
    pos: "ml-4",
  },
];

/**
 * Split-screen shell for the auth pages.
 * Left: dark gradient brand panel with floating event cards (desktop only).
 * Right: the form, with a theme toggle in the corner.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#1E1B2E] via-[#2D1B69] to-[#1E1B2E] p-12 text-white md:flex">
        <div className="pointer-events-none absolute -left-10 top-1/4 h-72 w-72 rounded-full bg-kiiya-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-1/4 h-72 w-72 rounded-full bg-kiiya-romantic/20 blur-3xl" />

        <div className="relative z-10 w-full max-w-sm">
          <Link href="/" className="text-3xl font-bold">
            ✦ Kiiya
          </Link>
          <p className="mt-3 text-lg italic text-kiiya-romantic">
            Every chapter of your story, beautifully planned.
          </p>

          <div className="mt-12 space-y-4">
            {FLOATING_CARDS.map((c) => (
              <div
                key={c.title}
                className={`${c.anim} ${c.pos} flex max-w-[260px] items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur`}
              >
                <span className="text-2xl">{c.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.title}</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.tagCls}`}
                  >
                    {c.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-2 text-sm text-white/70">
            <div className="flex text-kiiya-warm">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            Trusted by life planners worldwide
          </div>
        </div>
      </div>

      {/* Right form area */}
      <div className="relative flex w-full flex-col bg-white dark:bg-[#0F0E17] md:w-1/2">
        <div className="absolute right-5 top-5 z-10 flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-20">
          <div className="w-full max-w-sm">
            <Link
              href="/"
              className="mb-8 block text-xl font-bold text-kiiya-primary md:hidden"
            >
              ✦ Kiiya
            </Link>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
