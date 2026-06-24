"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/hooks/useLang";
import { t } from "@/utils/i18n";
import AuthLayout from "@/components/layout/AuthLayout";
import GoogleIcon from "@/components/ui/GoogleIcon";

export default function Register() {
  useLang();
  const [supabase] = useState(() => createClient());

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setSuccess(true);
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout quote="Your story starts with a single moment. Welcome aboard.">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-kiiya-primary">
            <MailCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-kiiya-dark dark:text-white">
            Check your email to confirm your account
          </h1>
          <p className="mt-3 text-gray-500 dark:text-[#A89EC9]">
            We sent a confirmation link to{" "}
            <span className="font-semibold text-kiiya-dark dark:text-white">
              {email}
            </span>
            .
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-xl bg-kiiya-primary px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            {t("auth.signIn")}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout quote="Your story starts with a single moment. Welcome aboard.">
      <h1 className="text-2xl font-bold text-kiiya-dark dark:text-white">
        {t("auth.registerTitle")}
      </h1>
      <p className="mt-2 text-gray-500 dark:text-[#A89EC9]">{t("auth.registerSub")}</p>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 py-3 font-semibold text-kiiya-dark transition hover:bg-gray-50 disabled:opacity-60 dark:border-[#2D2A3E] dark:text-white dark:hover:bg-[#221F32]"
      >
        {googleLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        {t("auth.googleBtn")}
      </button>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-gray-200 dark:bg-[#2D2A3E]" />
        <span className="text-sm text-gray-400 dark:text-[#6B6480]">
          {t("auth.orContinue")}
        </span>
        <span className="h-px flex-1 bg-gray-200 dark:bg-[#2D2A3E]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
            {t("auth.fullName")}
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-kiiya-primary focus:ring-2 focus:ring-kiiya-primary/20 dark:border-[#2D2A3E] dark:bg-[#1A1825] dark:text-white dark:placeholder:text-[#6B6480]"
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
            {t("auth.email")}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-kiiya-primary focus:ring-2 focus:ring-kiiya-primary/20 dark:border-[#2D2A3E] dark:bg-[#1A1825] dark:text-white dark:placeholder:text-[#6B6480]"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-kiiya-dark dark:text-[#F0EEFF]">
            {t("auth.password")}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 outline-none transition focus:border-kiiya-primary focus:ring-2 focus:ring-kiiya-primary/20 dark:border-[#2D2A3E] dark:bg-[#1A1825] dark:text-white dark:placeholder:text-[#6B6480]"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-kiiya-primary"
              aria-label="Toggle password visibility"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-kiiya-primary py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          {t("auth.registerBtn")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        {t("auth.hasAccount")}{" "}
        <Link
          href="/login"
          className="font-semibold text-kiiya-primary hover:underline"
        >
          {t("auth.signIn")}
        </Link>
      </p>
    </AuthLayout>
  );
}
