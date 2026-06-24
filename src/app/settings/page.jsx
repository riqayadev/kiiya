"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserCircle,
  SlidersHorizontal,
  Shield,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { t } from "@/utils/i18n";

const APP_VERSION = "0.1.0";

function Row({ href, icon: Icon, title, desc }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border border-purple-100 bg-white p-5 transition hover:border-kiiya-primary/40 hover:shadow-sm"
    >
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100 text-kiiya-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-kiiya-dark">{title}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
      <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-300" />
    </Link>
  );
}

export default function SettingsPage() {
  useLang();
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-kiiya-dark">
          {t("settings.title")}
        </h1>

        <div className="mt-6 space-y-3">
          <Row
            href="/profile#personal"
            icon={UserCircle}
            title={t("settings.accountProfile")}
            desc={t("settings.accountProfileDesc")}
          />
          <Row
            href="/profile#preferences"
            icon={SlidersHorizontal}
            title={t("settings.preferences")}
            desc={t("settings.preferencesDesc")}
          />
          <Row
            href="/profile#security"
            icon={Shield}
            title={t("settings.security")}
            desc={t("settings.securityDesc")}
          />
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-purple-100 bg-white p-5">
          <span className="text-sm text-gray-500">{t("settings.version")}</span>
          <span className="text-sm font-semibold text-kiiya-dark">
            v{APP_VERSION}
          </span>
        </div>

        <button
          onClick={handleSignOut}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white py-3 font-semibold text-red-500 transition hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          {t("settings.signOut")}
        </button>
      </div>
    </AppLayout>
  );
}
