"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  Camera,
  Check,
  Calendar,
  CheckCircle,
  Wallet,
  Clock,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useEvents } from "@/hooks/useEvents";
import { useLang } from "@/hooks/useLang";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/utils/i18n";
import { THEME_COLORS, applyThemeColor, hashPin } from "@/utils/theme";
import { formatRupiah, formatDateShort } from "@/utils/format";
import { toast } from "@/components/ui/Toast";
import {
  ACHIEVEMENTS,
  getUnlocked,
  ACHIEVEMENT_EVENT,
} from "@/utils/achievements";

function Card({ id, title, children }) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-purple-100 bg-white p-6 dark:border-[#2D2A3E] dark:bg-[#1A1825]"
    >
      <h2 className="mb-4 text-lg font-bold text-kiiya-dark dark:text-white">{title}</h2>
      {children}
    </section>
  );
}

const inputCls =
  "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-kiiya-primary focus:ring-2 focus:ring-kiiya-primary/20 dark:border-[#2D2A3E] dark:bg-[#221F32] dark:text-white dark:placeholder:text-[#6B6480]";

export default function ProfilePage() {
  const { lang, switchLang } = useLang();
  const { user, signOut } = useAuth();
  const { events } = useEvents();

  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [form, setForm] = useState({ full_name: "", username: "", bio: "" });
  const [savingInfo, setSavingInfo] = useState(false);
  const [savedInfo, setSavedInfo] = useState(false);
  const [infoError, setInfoError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // Password
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  // PIN
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
      setForm({
        full_name: data?.full_name ?? user.user_metadata?.full_name ?? "",
        username: data?.username ?? "",
        bio: data?.bio ?? "",
      });
      if (data?.theme_color) applyThemeColor(data.theme_color);
      setLoadingProfile(false);
    })();
    return () => {
      active = false;
    };
  }, [user, supabase]);

  const stats = useMemo(() => {
    return {
      total: events.length,
      completed: events.filter((e) => e.status === "completed").length,
      budget: events.reduce((s, e) => s + (e.budget || 0), 0),
    };
  }, [events]);

  const displayName = form.full_name || user?.email?.split("@")[0] || "Guest";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ── Save personal info ──
  const saveInfo = async () => {
    setSavingInfo(true);
    setInfoError("");
    setSavedInfo(false);
    try {
      // Unique username check (skip if unchanged or empty).
      if (form.username && form.username !== profile?.username) {
        const { data: taken } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", form.username.trim())
          .neq("id", user.id)
          .maybeSingle();
        if (taken) {
          setInfoError("That username is already taken.");
          setSavingInfo(false);
          return;
        }
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim() || null,
          username: form.username.trim() || null,
          bio: form.bio.trim() || null,
        })
        .eq("id", user.id);
      if (error) throw error;
      setProfile((p) => ({ ...p, ...form }));
      setSavedInfo(true);
      toast.success("Changes saved!");
      setTimeout(() => setSavedInfo(false), 2000);
    } catch (e) {
      setInfoError(e.message || "Failed to save.");
      toast.error(e.message || "Failed to save.");
    } finally {
      setSavingInfo(false);
    }
  };

  // ── Avatar upload ──
  const onAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      setProfile((p) => ({ ...p, avatar_url: url }));
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

  // ── Theme + language ──
  const selectTheme = async (key) => {
    applyThemeColor(key);
    setProfile((p) => ({ ...p, theme_color: key }));
    await supabase.from("profiles").update({ theme_color: key }).eq("id", user.id);
    toast.success("Theme updated!");
  };

  const selectLang = async (next) => {
    switchLang(next);
    if (user)
      await supabase
        .from("profiles")
        .update({ preferred_lang: next })
        .eq("id", user.id);
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
      setPwd({ current: "", next: "", confirm: "" });
      setPwdMsg("Password updated.");
    } catch (err) {
      setPwdMsg(err.message);
    } finally {
      setPwdSaving(false);
    }
  };

  // ── PIN ──
  const savePin = async (e) => {
    e.preventDefault();
    setPinMsg("");
    if (!/^\d{6}$/.test(pin)) {
      setPinMsg("PIN must be exactly 6 digits.");
      return;
    }
    await supabase
      .from("profiles")
      .update({ pin_hash: hashPin(pin) })
      .eq("id", user.id);
    setProfile((p) => ({ ...p, pin_hash: hashPin(pin) }));
    setPin("");
    setPinMsg("PIN saved.");
  };

  const removePin = async () => {
    await supabase.from("profiles").update({ pin_hash: null }).eq("id", user.id);
    setProfile((p) => ({ ...p, pin_hash: null }));
    setPinMsg("PIN removed.");
  };

  const deleteAccount = async () => {
    if (!confirm("Delete your account? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure? All your events will be lost."))
      return;
    // Placeholder: flag the profile. Real deletion needs a server/admin call.
    await supabase
      .from("profiles")
      .update({ bio: "[account deletion requested]" })
      .eq("id", user.id);
    toast.info("Account deletion requested. (Placeholder — requires admin action.)");
  };

  if (loadingProfile) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-kiiya-primary">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const statCards = [
    { icon: Calendar, label: t("profile.totalEvents"), value: stats.total },
    {
      icon: CheckCircle,
      label: t("profile.eventsCompleted"),
      value: stats.completed,
    },
    {
      icon: Wallet,
      label: t("profile.totalBudget"),
      value: formatRupiah(stats.budget),
    },
    {
      icon: Clock,
      label: t("profile.memberSince"),
      value: profile?.created_at ? formatDateShort(profile.created_at) : "—",
    },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* A) Header */}
        <div className="flex items-center gap-5 rounded-2xl border border-purple-100 bg-white p-6 dark:border-[#2D2A3E] dark:bg-[#1A1825]">
          <div className="relative">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-kiiya-primary text-2xl font-bold text-white">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label={t("profile.uploadPhoto")}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-kiiya-primary shadow ring-1 ring-purple-100 transition hover:bg-purple-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onAvatarPick}
            />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-kiiya-dark dark:text-white">
              {displayName}
            </h1>
            {form.username && (
              <p className="text-sm text-kiiya-primary">@{form.username}</p>
            )}
            <p className="truncate text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        {/* B) Personal info */}
        <Card id="personal" title={t("profile.personalInfo")}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
                {t("profile.fullName")}
              </label>
              <input
                value={form.full_name}
                onChange={(e) => setField("full_name", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
                {t("profile.username")}
              </label>
              <input
                value={form.username}
                onChange={(e) => setField("username", e.target.value)}
                placeholder="username"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
                {t("profile.bio")}
              </label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setField("bio", e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
                {t("profile.email")}
              </label>
              <input value={user?.email || ""} disabled className={`${inputCls} bg-gray-50 text-gray-400 dark:bg-[#13111E]`} />
            </div>
            {infoError && <p className="text-sm text-red-600">{infoError}</p>}
            <button
              onClick={saveInfo}
              disabled={savingInfo}
              className="inline-flex items-center gap-2 rounded-xl bg-kiiya-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {savingInfo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : savedInfo ? (
                <Check className="h-4 w-4" />
              ) : null}
              {savedInfo ? t("profile.saved") : t("profile.save")}
            </button>
          </div>
        </Card>

        {/* C) Preferences */}
        <Card id="preferences" title={t("profile.preferences")}>
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
                {t("profile.language")}
              </p>
              <div className="inline-flex rounded-full border border-purple-100 p-1 dark:border-[#2D2A3E]">
                {["en", "id"].map((l) => (
                  <button
                    key={l}
                    onClick={() => selectLang(l)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold uppercase transition ${
                      lang === l
                        ? "bg-kiiya-primary text-white"
                        : "text-kiiya-dark/70 dark:text-[#A89EC9]"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
                {t("profile.themeColor")}
              </p>
              <div className="flex flex-wrap gap-3">
                {THEME_COLORS.map((c) => {
                  const active = (profile?.theme_color ?? "violet") === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => selectTheme(c.key)}
                      title={c.label}
                      className={`flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-offset-2 transition ${
                        active ? "ring-kiiya-dark/30" : "ring-transparent"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {active && <Check className="h-5 w-5 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* D) Security */}
        <Card id="security" title={t("profile.security")}>
          <form onSubmit={changePassword} className="space-y-4">
            <p className="text-sm font-semibold text-kiiya-dark dark:text-white">
              {t("profile.changePassword")}
            </p>
            <input
              type="password"
              value={pwd.current}
              onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
              placeholder={t("profile.currentPassword")}
              className={inputCls}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="password"
                value={pwd.next}
                onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
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
            {pwdMsg && <p className="text-sm text-gray-600">{pwdMsg}</p>}
            <button
              type="submit"
              disabled={pwdSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-kiiya-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {pwdSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("profile.updatePassword")}
            </button>
          </form>

          <div className="my-5 border-t border-gray-100" />

          <form onSubmit={savePin} className="space-y-3">
            <p className="text-sm font-semibold text-kiiya-dark dark:text-white">
              {t("profile.pin")}
            </p>
            <p className="text-sm text-gray-500">
              {profile?.pin_hash ? t("profile.changePin") : t("profile.setupPin")}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder={t("profile.pinPlaceholder")}
                className={`${inputCls} sm:w-48`}
              />
              <button
                type="submit"
                className="rounded-xl bg-kiiya-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {t("profile.savePin")}
              </button>
              {profile?.pin_hash && (
                <button
                  type="button"
                  onClick={removePin}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                >
                  {t("profile.removePin")}
                </button>
              )}
            </div>
            {pinMsg && <p className="text-sm text-gray-600">{pinMsg}</p>}
          </form>
        </Card>

        {/* E) Stats */}
        <Card id="stats" title={t("profile.stats")}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {statCards.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl bg-purple-50/50 p-4 dark:bg-[#221F32]">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-kiiya-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-2 text-lg font-bold text-kiiya-dark dark:text-white">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Achievements */}
        <Card id="achievements" title="Achievements 🏆">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ACHIEVEMENTS.map((a) => {
              const isOn = !!unlocked[a.id];
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                    isOn
                      ? "border-purple-100 bg-purple-50/50 dark:border-[#2D2A3E] dark:bg-[#221F32]"
                      : "border-gray-100 bg-gray-50 dark:border-[#2D2A3E] dark:bg-[#221F32]"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl ${
                      isOn ? "bg-white shadow-sm" : "grayscale"
                    }`}
                  >
                    {isOn ? a.emoji : "🔒"}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`truncate text-sm font-semibold ${
                        isOn ? "text-kiiya-dark dark:text-white" : "text-gray-400"
                      }`}
                    >
                      {isOn ? a.name : "???"}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {isOn ? a.desc : "Locked"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* F) Danger zone */}
        <section className="rounded-2xl border border-red-200 bg-red-50/40 p-6 dark:border-red-500/20 dark:bg-red-500/5">
          <h2 className="mb-1 text-lg font-bold text-red-600">
            {t("profile.dangerZone")}
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            {t("profile.deleteAccountDesc")}
          </p>
          <button
            onClick={deleteAccount}
            className="rounded-xl border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            {t("profile.deleteAccount")}
          </button>
        </section>
      </div>
    </AppLayout>
  );
}
