"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Settings,
  LogOut,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { t } from "@/utils/i18n";
import LanguageToggle from "@/components/ui/LanguageToggle";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, key: "dashboard.nav.dashboard" },
  { to: "/calendar", icon: CalendarDays, key: "dashboard.nav.calendar" },
  { to: "/settings", icon: Settings, key: "dashboard.nav.settings" },
];

function getDisplayName(user) {
  return (
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest"
  );
}

function getInitials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SidebarContent({ user, signOut, pathname, onNavigate }) {
  const name = getDisplayName(user);

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="p-6 text-xl font-bold text-kiiya-primary"
      >
        ✦ Kiiya
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, icon: Icon, key }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              href={to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-purple-50 text-kiiya-primary"
                  : "text-kiiya-dark/70 hover:bg-purple-50/60"
              }`}
            >
              <Icon className="h-5 w-5" />
              {t(key)}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-4 border-t border-purple-100 p-4">
        <LanguageToggle />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-kiiya-primary text-sm font-semibold text-white">
            {getInitials(name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-kiiya-dark">
              {name}
            </p>
            <p className="truncate text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          {t("dashboard.nav.signOut")}
        </button>
      </div>
    </div>
  );
}

export default function AppLayout({ children }) {
  useLang();
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Auth gate: redirect to /login once we know there is no session.
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  // While checking the session (or redirecting), show a lightweight loader.
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-kiiya-bg text-kiiya-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const name = getDisplayName(user);

  return (
    <div className="min-h-screen bg-kiiya-bg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-purple-100 bg-white md:block">
        <SidebarContent
          user={user}
          signOut={handleSignOut}
          pathname={pathname}
        />
      </aside>

      {/* Mobile topbar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-purple-100 bg-white px-4 py-3 md:hidden">
        <Link href="/dashboard" className="text-lg font-bold text-kiiya-primary">
          ✦ Kiiya
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-kiiya-primary text-xs font-semibold text-white">
            {getInitials(name)}
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="text-kiiya-dark"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 text-kiiya-dark"
            >
              <X className="h-6 w-6" />
            </button>
            <SidebarContent
              user={user}
              signOut={handleSignOut}
              pathname={pathname}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="min-h-screen p-6 md:ml-64 md:p-8">{children}</main>
    </div>
  );
}
