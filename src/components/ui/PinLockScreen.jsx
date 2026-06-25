"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Delete } from "lucide-react";
import { hashPin } from "@/utils/theme";

const PIN_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Full-screen PIN gate shown before the dashboard when the user has a PIN set.
 *
 * Props:
 *  - pinHash:   stored salted-SHA-256 hash from profiles.pin_hash
 *  - profile:   { full_name, avatar_url } for the avatar + name
 *  - user:      auth user (for email fallback)
 *  - onUnlock:  called once the entered PIN matches
 *  - onSignOut: escape hatch when the PIN is forgotten
 */
export default function PinLockScreen({ pinHash, profile, user, onUnlock, onSignOut }) {
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [lockUntil, setLockUntil] = useState(0); // epoch ms; 0 = not locked
  const [remaining, setRemaining] = useState(0); // seconds left in lockout
  const [isMobile, setIsMobile] = useState(false);

  const inputRef = useRef(null);
  const errorTimer = useRef(null);
  const checkingRef = useRef(false);

  const locked = remaining > 0;

  const name =
    profile?.full_name || user?.email?.split("@")[0] || "Welcome back";

  // Detect mobile once on mount (numpad is only rendered on narrow viewports).
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  // Keep the hidden input focused so hardware-keyboard entry always works.
  const focusInput = useCallback(() => {
    if (!locked) inputRef.current?.focus();
  }, [locked]);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  // Lockout countdown ticker.
  useEffect(() => {
    if (lockUntil === 0) return;
    const tick = () => {
      const left = Math.ceil((lockUntil - Date.now()) / 1000);
      if (left <= 0) {
        // Lockout finished — reset everything.
        setLockUntil(0);
        setRemaining(0);
        setAttempts(0);
        setError(false);
        setPin("");
        inputRef.current?.focus();
      } else {
        setRemaining(left);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [lockUntil]);

  useEffect(() => {
    return () => clearTimeout(errorTimer.current);
  }, []);

  const flashError = useCallback(() => {
    setError(true);
    setShake(true);
    clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(false), 2000);
    setTimeout(() => setShake(false), 400);
  }, []);

  // Verify whenever a full PIN is entered.
  const submit = useCallback(
    async (value) => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        const hashed = await hashPin(value);
        if (hashed === pinHash) {
          onUnlock();
          return;
        }
        // Wrong PIN.
        setPin("");
        const next = attempts + 1;
        setAttempts(next);
        if (next >= MAX_ATTEMPTS) {
          setError(false);
          setShake(true);
          setTimeout(() => setShake(false), 400);
          setLockUntil(Date.now() + LOCKOUT_SECONDS * 1000);
        } else {
          flashError();
        }
      } finally {
        checkingRef.current = false;
      }
    },
    [attempts, pinHash, onUnlock, flashError]
  );

  // Centralised digit entry used by both keyboard and the on-screen numpad.
  const setPinValue = useCallback(
    (nextPin) => {
      if (locked) return;
      const clean = nextPin.replace(/\D/g, "").slice(0, PIN_LENGTH);
      setPin(clean);
      if (error) setError(false);
      if (clean.length === PIN_LENGTH) submit(clean);
    },
    [locked, error, submit]
  );

  const onKeyEntry = (e) => setPinValue(e.target.value);

  const pressDigit = (d) => setPinValue(pin + d);
  const pressBackspace = () => {
    if (locked) return;
    setPin((p) => p.slice(0, -1));
    if (error) setError(false);
  };

  const dotBase = "h-3 w-3 rounded-full border-2 border-white/30 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1E1B2E] px-6">
      {/* Wordmark */}
      <p className="absolute top-10 text-lg font-semibold text-white">✦ Kiiya</p>

      {/* Avatar + name */}
      <div className="flex flex-col items-center">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={name}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-white/15"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#7C6EF5] text-lg font-semibold text-white ring-2 ring-white/15">
            {getInitials(profile?.full_name || name)}
          </div>
        )}
        <p className="mt-3 text-sm font-medium text-white/70">{name}</p>
      </div>

      {/* Prompt */}
      <h1 className="mt-6 text-lg font-semibold text-white">Enter your PIN</h1>

      {/* Dots */}
      <div
        className={`mt-6 flex items-center gap-3 ${shake ? "animate-shake" : ""}`}
        onClick={focusInput}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            className={`${dotBase} ${
              i < pin.length ? "border-[#7C6EF5] bg-[#7C6EF5]" : ""
            }`}
          />
        ))}
      </div>

      {/* Hidden real input — captures hardware keyboard */}
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={PIN_LENGTH}
        value={pin}
        onChange={onKeyEntry}
        disabled={locked}
        aria-label="PIN"
        className="absolute h-0 w-0 opacity-0"
      />

      {/* Status line (fixed height so layout doesn't jump) */}
      <div className="mt-4 h-5 text-sm">
        {locked ? (
          <p className="font-medium text-amber-400">
            Too many attempts. Try again in {remaining}s
          </p>
        ) : error ? (
          <p className="font-medium text-red-400 transition-opacity">
            Incorrect PIN
          </p>
        ) : null}
      </div>

      {/* Numpad (mobile only) */}
      {isMobile && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => pressDigit(String(n))}
              disabled={locked}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-medium text-white transition active:bg-white/25 disabled:opacity-40"
            >
              {n}
            </button>
          ))}
          <span />
          <button
            type="button"
            onClick={() => pressDigit("0")}
            disabled={locked}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-medium text-white transition active:bg-white/25 disabled:opacity-40"
          >
            0
          </button>
          <button
            type="button"
            onClick={pressBackspace}
            disabled={locked || pin.length === 0}
            aria-label="Backspace"
            className="flex h-16 w-16 items-center justify-center rounded-full text-white transition active:bg-white/10 disabled:opacity-40"
          >
            <Delete className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Sign out escape hatch */}
      <button
        type="button"
        onClick={onSignOut}
        className="absolute bottom-10 text-sm font-medium text-white/40 transition hover:text-white/70"
      >
        Sign out
      </button>
    </div>
  );
}
