"use client";
import { useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";

const TYPE_PILLS = ["✈️", "💍", "💑", "🤰", "🎓", "⭐"];

// Simple inline SVG illustrations (no external assets).
function WaveIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="#EFEAFC" />
      <circle cx="60" cy="48" r="20" fill="#7C6EF5" />
      <path d="M30 96c0-17 13-28 30-28s30 11 30 28" fill="#9B8AFB" />
      <path
        d="M88 30c6-3 12 0 12 0s-3 7-9 8"
        stroke="#F0956A"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
function CalendarIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="#FDEEE6" />
      <rect x="34" y="36" width="52" height="48" rx="8" fill="#fff" stroke="#F0956A" strokeWidth="3" />
      <rect x="34" y="36" width="52" height="14" rx="7" fill="#F0956A" />
      <circle cx="48" cy="64" r="4" fill="#7C6EF5" />
      <circle cx="60" cy="64" r="4" fill="#E8A0BF" />
      <circle cx="72" cy="64" r="4" fill="#F0956A" />
      <text x="86" y="34" fontSize="18">🎊</text>
    </svg>
  );
}
function RocketIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="#EAF7F1" />
      <path d="M60 28c14 8 20 24 16 44l-16 8-16-8c-4-20 2-36 16-44z" fill="#7C6EF5" />
      <circle cx="60" cy="54" r="7" fill="#fff" />
      <path d="M52 78l-8 14 16-6 16 6-8-14" fill="#F0956A" />
    </svg>
  );
}

const STEPS = [
  {
    Illustration: WaveIllustration,
    title: "Welcome to Kiiya! 🎉",
    heading: "Your personal life event planner",
    body: "Keep every trip, celebration, and milestone organized in one beautiful place.",
  },
  {
    Illustration: CalendarIllustration,
    title: "Start with your first event",
    heading: "Trip, wedding, anniversary — plan any life moment",
    body: "Build day-by-day itineraries, track budgets, and check off your to-dos.",
    showPills: true,
  },
  {
    Illustration: RocketIllustration,
    title: "You're all set!",
    heading: "Let's create your first event",
    body: "Jump in and start planning — your story begins now.",
  },
];

export default function OnboardingModal({ isOpen, onClose, onCreateEvent }) {
  const [step, setStep] = useState(0);
  if (!isOpen) return null;

  const isLast = step === STEPS.length - 1;
  const s = STEPS[step];
  const Illustration = s.Illustration;

  const next = () => setStep((x) => Math.min(x + 1, STEPS.length - 1));
  const back = () => setStep((x) => Math.max(x - 1, 0));

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-backdrop-in" />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 text-center shadow-xl animate-modal-in">
        <div className="flex justify-center">
          <Illustration />
        </div>

        <h2 className="mt-4 text-2xl font-bold text-kiiya-dark">{s.title}</h2>
        <p className="mt-2 font-semibold text-kiiya-primary">{s.heading}</p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-gray-500">{s.body}</p>

        {s.showPills && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {TYPE_PILLS.map((p) => (
              <span
                key={p}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-xl"
              >
                {p}
              </span>
            ))}
          </div>
        )}

        {/* Progress dots */}
        <div className="mt-6 flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-6 bg-kiiya-primary" : "w-2 bg-purple-200"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              onClick={back}
              className="inline-flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 transition hover:text-kiiya-dark"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-400 transition hover:text-kiiya-dark"
            >
              Skip
            </button>
          )}

          {isLast ? (
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-kiiya-dark transition hover:bg-gray-50"
              >
                Explore Dashboard
              </button>
              <button
                onClick={onCreateEvent}
                className="rounded-xl bg-kiiya-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Create First Event
              </button>
            </div>
          ) : (
            <button
              onClick={next}
              className="inline-flex items-center gap-1 rounded-xl bg-kiiya-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
