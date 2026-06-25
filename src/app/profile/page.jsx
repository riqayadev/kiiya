"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Camera, Check, KeyRound, Trash2 } from "lucide-react";
import AppLayout, { PROFILE_UPDATED_EVENT } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useEvents } from "@/hooks/useEvents";
import { useLang } from "@/hooks/useLang";
import { useTheme } from "@/hooks/useTheme";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/utils/i18n";
import { THEME_COLORS, applyThemeColor, hashPin } from "@/utils/theme";
import { toast } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";
import InlineEdit from "@/components/ui/InlineEdit";
import { OPEN_DIAGNOSTICS_EVENT } from "@/components/ui/DiagnosticsPanel";
import {
  ACHIEVEMENTS,
  getUnlocked,
  ACHIEVEMENT_EVENT,
} from "@/utils/achievements";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";
const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_TIME
  ? new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  : "—";

// ── Premium card shell (light + intentional dark variants) ──
function Card({ title, action, children }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:border dark:border-white/10 dark:bg-white/5">
      {title && (
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[100px_1fr] items-start gap-3 py-2 sm:grid-cols-[130px_1fr]">
      <span className="pt-1.5 text-sm font-medium text-gray-400 dark:text-gray-400">
        {label}
      </span>
      <div className="min-w-0 text-sm text-gray-800 dark:text-gray-100">
        {children}
      </div>
    </div>
  );
}

// Pill toggle button (language / theme mode).
function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-kiiya-primary text-white dark:bg-[#7C6EF5] dark:text-white"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
      }`}
    >
      {children}
    </button>
  );
}

export default function ProfilePage() {
  const { lang, switchLang } = useLang();
  const { isDark, setTheme } = useTheme();
  const { user } = useAuth();
  const { events } = useEvents();

  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const versionClicks = useRef([]);

  // Easter egg: 5 rapid clicks on the version string opens the diagnostics panel.
  const onVersionClick = () => {
    const now = Date.now();
    versionClicks.current = [...versionClicks.current, now].filter(
      (tms) => now - tms < 1500
    );
    if (versionClicks.current.length >= 5) {
      versionClicks.current = [];
      window.dispatchEvent(new Event(OPEN_DIAGNOSTICS_EVENT));
    }
  };

  // Password
  const [pwd, setPwd] = useState({ next: "", confirm: "" });
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  // PIN
  const [pinEditing, setPinEditing] = useState(false);
  const [pin, setPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");

  // Achievements (read from localStorage after mount to avoid hydration drift)
  const [unlocked, setUnlocked] = useState({});
  useEffect(() => {
    setUnlocked(getUnlocked());
    const handler = () => setUnlocked(getUnlocked());
    window.addEventListener(ACHIEVEMENT_EVENT, handler);
    return () => window.removeEventListener(ACHIEVEMENT_EVENT, handler);
  }, []);

  // ── Load profile ──
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (!active) return;
      setProfile(data || {});
      if (data?.theme_color) applyThemeColor(data.theme_color);
      setLoadingProfile(false);
    })();
    return () => {
      active = false;
    };
  }, [user, supabase]);

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "Guest";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const achievementsUnlocked = Object.keys(unlocked).length;
  const since = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(
        lang === "id" ? "id-ID" : "en-US",
        { month: "long", year: "numeric" }
      )
    : null;

  // ── Inline field save (profiles table) ──
  const saveProfileField = (field) => async (value) => {
    // Unique username guard (skip if cleared or unchanged).
    if (field === "username" && value) {
      const { data: taken } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", value)
        .neq("id", user.id)
        .maybeSingle();
      if (taken) throw new Error("That username is already taken.");
    }
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value })
      .eq("id", user.id);
    if (error) throw error;
    setProfile((p) => ({ ...p, [field]: value }));
    if (field === "full_name") {
      window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
    }
  };

  // ── Avatar upload (existing storage logic, restyled) ──
  const onAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate before uploading: images only, max 5MB.
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data.publicUrl;
      await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);
      setProfile((p) => ({ ...p, avatar_url: url }));
      window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
      toast.success("Photo updated!");
    } catch (err) {
      toast.error(
        err.message +
          " (Make sure the 'avatars' storage bucket exists and is public.)"
      );
    } finally {
      setUploading(false);
    }
  };

  // ── Theme color + language ──
  const selectTheme = async (key) => {
    applyThemeColor(key);
    setProfile((p) => ({ ...p, theme_color: key }));
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ theme_color: key })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Theme updated!");
    } catch (err) {
      toast.error(err.message || "Could not save theme.");
    }
  };

  const selectLang = async (next) => {
    switchLang(next);
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ preferred_lang: next })
        .eq("id", user.id);
      if (error) throw error;
    } catch (err) {
      toast.error(err.message || "Could not save language preference.");
    }
  };

  // ── Password ──
  const changePassword = async (e) => {
    e.preventDefault();
    setPwdMsg("");
    if (pwd.next.length < 6) {
      setPwdMsg("New password must be at least 6 characters.");
      return;
    }
    if (pwd.next !== pwd.confirm) {
      setPwdMsg("Passwords do not match.");
      return;
    }
    setPwdSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd.next });
      if (error) throw error;
      setPwd({ next: "", confirm: "" });
      setPwdMsg("Password updated.");
    } catch (err) {
      setPwdMsg(err.message);
    } finally {
      setPwdSaving(false);
    }
  };

  // ── PIN (SHA-256 hashed before storage; see utils/theme.js) ──
  const savePin = async (e) => {
    e.preventDefault();
    setPinMsg("");
    if (!/^\d{6}$/.test(pin)) {
      setPinMsg("PIN must be exactly 6 digits.");
      return;
    }
    try {
      const hash = await hashPin(pin);
      const { error } = await supabase
        .from("profiles")
        .update({ pin_hash: hash })
        .eq("id", user.id);
      if (error) throw error;
      setProfile((p) => ({ ...p, pin_hash: hash }));
      setPin("");
      setPinEditing(false);
      setPinMsg("PIN saved.");
    } catch (err) {
      setPinMsg(err.message || "Could not save PIN.");
    }
  };

  const removePin = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ pin_hash: null })
        .eq("id", user.id);
      if (error) throw error;
      setProfile((p) => ({ ...p, pin_hash: null }));
      setPinEditing(false);
      setPin("");
      setPinMsg("PIN removed.");
    } catch (err) {
      setPinMsg(err.message || "Could not remove PIN.");
    }
  };

  const deleteAccount = async () => {
    if (!confirm("Delete your account? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure? All your events will be lost."))
      return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ bio: "[account deletion requested]" })
        .eq("id", user.id);
      if (error) throw error;
      toast.info(
        "Account deletion requested. (Placeholder — requires admin action.)"
      );
    } catch (err) {
      toast.error(err.message || "Could not submit deletion request.");
    }
  };

  if (loadingProfile) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Left: identity card */}
            <aside className="lg:w-[280px] lg:flex-shrink-0">
              <div className="rounded-3xl bg-white p-6 dark:bg-[#1E1B2E]">
                <div className="flex justify-center">
                  <Skeleton className="h-24 w-24 rounded-full" />
                </div>
                <Skeleton className="mx-auto mt-4 h-5 w-32" />
                <Skeleton className="mx-auto mt-2 h-4 w-24" />
                <Skeleton className="mx-auto mt-4 h-4 w-40" />
              </div>
            </aside>

            {/* Right: content cards */}
            <div className="flex-1 space-y-6">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-kiiya-primary focus:ring-2 focus:ring-kiiya-primary/20 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-500";

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* ─── LEFT: Identity anchor ─── */}
          <aside className="lg:sticky lg:top-6 lg:w-[280px] lg:flex-shrink-0">
            {/* Gradient-bordered avatar card */}
            <div className="rounded-3xl bg-gradient-to-br from-[#7C6EF5] to-[#E8A0BF] p-[2px] shadow-sm">
              <div className="rounded-3xl bg-white p-6 dark:bg-[#1E1B2E]">
                {/* Avatar */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    aria-label={t("profile.uploadPhoto")}
                    className="group relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-[#7C6EF5]/30 ring-offset-2 ring-offset-white transition dark:ring-offset-[#1E1B2E]"
                  >
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7C6EF5] to-[#9B8DF8] text-2xl font-bold text-white">
                        {initials}
                      </span>
                    )}
                    {/* Hover / uploading overlay */}
                    <span
                      className={`absolute inset-0 flex items-center justify-center bg-black/40 text-white transition ${
                        uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {uploading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <Camera className="h-6 w-6" />
                      )}
                    </span>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onAvatarPick}
                  />
                </div>

                {/* Name + username (inline editable) */}
                <div className="mt-4 text-center text-xl font-bold text-kiiya-dark dark:text-white">
                  <InlineEdit
                    value={profile?.full_name || ""}
                    onSave={saveProfileField("full_name")}
                    display={displayName}
                    placeholder="Your name"
                    className="justify-center"
                  />
                </div>
                <div className="mt-0.5 text-center text-sm text-kiiya-primary dark:text-[#A594F9]">
                  <InlineEdit
                    value={profile?.username || ""}
                    onSave={saveProfileField("username")}
                    display={profile?.username ? `@${profile.username}` : undefined}
                    placeholder="@username"
                    className="justify-center"
                  />
                </div>

                {/* Bio (inline, 160 max + counter) */}
                <div className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
                  <InlineEdit
                    type="textarea"
                    value={profile?.bio || ""}
                    onSave={saveProfileField("bio")}
                    maxLength={160}
                    placeholder="Add a short bio…"
                    className="justify-center"
                  />
                </div>

                <div className="my-5 border-t border-gray-100 dark:border-white/10" />

                {/* Quick stats */}
                <div className="flex items-center justify-center gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
                    {events.length} Events
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
                    {achievementsUnlocked} Achievements
                  </span>
                </div>
                {since && (
                  <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
                    Since {since}
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* ─── RIGHT: Content cards ─── */}
          <div className="flex-1 space-y-6">
            {/* Personal Info */}
            <Card title={t("profile.personalInfo")}>
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                <Row label={t("profile.fullName")}>
                  <InlineEdit
                    value={profile?.full_name || ""}
                    onSave={saveProfileField("full_name")}
                    placeholder="Add your name"
                  />
                </Row>
                <Row label={t("profile.username")}>
                  <InlineEdit
                    value={profile?.username || ""}
                    onSave={saveProfileField("username")}
                    display={
                      profile?.username ? `@${profile.username}` : undefined
                    }
                    placeholder="Add a username"
                  />
                </Row>
                <Row label={t("profile.bio")}>
                  <InlineEdit
                    type="textarea"
                    value={profile?.bio || ""}
                    onSave={saveProfileField("bio")}
                    maxLength={160}
                    placeholder="Add a short bio…"
                  />
                </Row>
                <Row label={t("profile.email")}>
                  <span className="block px-2 py-1 text-gray-400">
                    {user?.email}
                  </span>
                </Row>
              </div>
            </Card>

            {/* Preferences */}
            <Card title={t("profile.preferences")}>
              <div className="space-y-6">
                {/* Language */}
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {t("profile.language")}
                  </p>
                  <div className="flex gap-2">
                    {["en", "id"].map((l) => (
                      <Pill
                        key={l}
                        active={lang === l}
                        onClick={() => selectLang(l)}
                      >
                        {l.toUpperCase()}
                      </Pill>
                    ))}
                  </div>
                </div>

                {/* Theme mode */}
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Theme
                  </p>
                  <div className="flex gap-2">
                    <Pill active={!isDark} onClick={() => setTheme("light")}>
                      Light
                    </Pill>
                    <Pill active={isDark} onClick={() => setTheme("dark")}>
                      Dark
                    </Pill>
                  </div>
                </div>

                {/* Theme color */}
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {t("profile.themeColor")}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {THEME_COLORS.map((c) => {
                      const active = (profile?.theme_color ?? "violet") === c.key;
                      return (
                        <button
                          key={c.key}
                          onClick={() => selectTheme(c.key)}
                          title={c.label}
                          className={`flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-offset-2 transition ring-offset-white dark:ring-offset-[#1E1B2E] ${
                            active ? "ring-gray-400 dark:ring-white/40" : "ring-transparent"
                          }`}
                          style={{ backgroundColor: c.hex }}
                        >
                          {active && <Check className="h-4 w-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>

            {/* Security */}
            <Card title={t("profile.security")}>
              {/* PIN */}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100 text-kiiya-primary dark:bg-white/10 dark:text-[#A594F9]">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-kiiya-dark dark:text-white">
                    {t("profile.pin")}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {profile?.pin_hash
                      ? "A 6-digit PIN protects your events."
                      : "Add a 6-digit PIN for extra protection."}
                  </p>

                  {pinEditing ? (
                    <form onSubmit={savePin} className="mt-3 flex flex-wrap items-center gap-2">
                      <input
                        type="password"
                        autoFocus
                        inputMode="numeric"
                        maxLength={6}
                        value={pin}
                        onChange={(e) =>
                          setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        placeholder="••••••"
                        className={`${inputCls} w-32 tracking-[0.4em]`}
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-kiiya-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        {t("profile.savePin")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPinEditing(false);
                          setPin("");
                          setPinMsg("");
                        }}
                        className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                      >
                        {t("editEvent.cancel")}
                      </button>
                    </form>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => setPinEditing(true)}
                        className="rounded-xl bg-kiiya-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        {profile?.pin_hash
                          ? t("profile.changePin")
                          : "Set PIN"}
                      </button>
                      {profile?.pin_hash && (
                        <button
                          onClick={removePin}
                          className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                        >
                          {t("profile.removePin")}
                        </button>
                      )}
                    </div>
                  )}
                  {pinMsg && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {pinMsg}
                    </p>
                  )}
                </div>
              </div>

              <div className="my-5 border-t border-gray-100 dark:border-white/10" />

              {/* Password */}
              <form onSubmit={changePassword} className="space-y-3">
                <p className="text-sm font-semibold text-kiiya-dark dark:text-white">
                  {t("profile.changePassword")}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="password"
                    value={pwd.next}
                    onChange={(e) =>
                      setPwd((p) => ({ ...p, next: e.target.value }))
                    }
                    placeholder={t("profile.newPassword")}
                    className={inputCls}
                  />
                  <input
                    type="password"
                    value={pwd.confirm}
                    onChange={(e) =>
                      setPwd((p) => ({ ...p, confirm: e.target.value }))
                    }
                    placeholder={t("profile.confirmPassword")}
                    className={inputCls}
                  />
                </div>
                {pwdMsg && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {pwdMsg}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={pwdSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-kiiya-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {pwdSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("profile.updatePassword")}
                </button>
              </form>
            </Card>

            {/* Achievements */}
            <Card title="Achievements 🏆">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {ACHIEVEMENTS.map((a) => {
                  const ts = unlocked[a.id];
                  const isOn = !!ts;
                  return (
                    <div
                      key={a.id}
                      className={`rounded-xl border p-4 text-center transition ${
                        isOn
                          ? "border-transparent bg-gradient-to-br from-[#7C6EF5]/10 to-[#E8A0BF]/10 dark:from-[#7C6EF5]/15 dark:to-[#E8A0BF]/15"
                          : "border-gray-100 bg-gray-50 opacity-40 grayscale dark:border-white/10 dark:bg-white/5"
                      }`}
                    >
                      <div className="text-3xl">{isOn ? a.emoji : "🔒"}</div>
                      <p
                        className={`mt-2 text-sm font-semibold ${
                          isOn
                            ? "text-kiiya-dark dark:text-white"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {a.name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        {a.desc}
                      </p>
                      {isOn && (
                        <p className="mt-1.5 text-[11px] font-medium text-kiiya-primary dark:text-[#A594F9]">
                          {new Date(ts).toLocaleDateString(
                            lang === "id" ? "id-ID" : "en-US",
                            { day: "numeric", month: "short", year: "numeric" }
                          )}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Danger zone */}
            <Card title={t("profile.dangerZone")}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("profile.deleteAccountDesc")}
                </p>
                <button
                  onClick={deleteAccount}
                  className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("profile.deleteAccount")}
                </button>
              </div>
            </Card>
          </div>
        </div>

        {/* Version stamp — no label; clicking 5× rapidly opens diagnostics. */}
        <button
          type="button"
          onClick={onVersionClick}
          className="mx-auto mt-10 block select-none text-center text-[11px] text-gray-300 transition dark:text-white/20"
        >
          v{APP_VERSION} · {BUILD_DATE}
        </button>
      </div>
    </AppLayout>
  );
}
