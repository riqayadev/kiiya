"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  UserCircle,
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
import ThemeToggle from "@/components/ui/ThemeToggle";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, key: "dashboard.nav.dashboard" },
  { to: "/calendar", icon: CalendarDays, key: "dashboard.nav.calendar" },
  { to: "/profile", icon: UserCircle, key: "dashboard.nav.profile" },
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
      {/* Top — brand */}
      <div className="p-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="block text-lg font-semibold text-kiiya-primary"
        >
          ✦ Kiiya
        </Link>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-[#6B6480]">
          Life Event Planner
        </p>
      </div>

      {/* Nav */}
      <nav className="mt-1 flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, icon: Icon, key }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              href={to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? "bg-purple-50 font-medium text-kiiya-primary dark:bg-[#221F32] dark:text-[#A594F9]"
                  : "text-gray-600 hover:bg-purple-50 dark:text-[#A89EC9] dark:hover:bg-[#221F32]"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              {t(key)}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-purple-100 p-4 dark:border-[#2D2A3E]">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle className="dark:border-[#2D2A3E] dark:bg-[#221F32]" />
        </div>

        <div className="my-3 border-t border-purple-100 dark:border-[#2D2A3E]" />

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-kiiya-primary text-xs font-semibold text-white">
            {getInitials(name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-kiiya-dark dark:text-[#F0EEFF]">
              {name}
            </p>
            <p className="truncate text-xs text-gray-400 dark:text-[#6B6480]">
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={signOut}
          className="mt-2 flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-medium text-red-400 transition hover:text-red-500"
        >
          <LogOut className="h-3.5 w-3.5" />
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
      <div className="flex min-h-screen items-center justify-center bg-kiiya-bg text-kiiya-primary dark:bg-[#0F0E17]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const name = getDisplayName(user);

  return (
    <div className="min-h-screen bg-kiiya-bg dark:bg-[#0F0E17]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-purple-100 bg-white dark:border-[#2D2A3E] dark:bg-[#13111E] md:block">
        <SidebarContent
          user={user}
          signOut={handleSignOut}
          pathname={pathname}
        />
      </aside>

      {/* Mobile topbar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-purple-100 bg-white px-4 dark:border-[#2D2A3E] dark:bg-[#13111E] md:hidden">
        <Link href="/dashboard" className="text-lg font-semibold text-kiiya-primary">
          ✦ Kiiya
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-kiiya-primary text-xs font-semibold text-white">
            {getInitials(name)}
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="text-kiiya-dark dark:text-[#F0EEFF]"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-60 bg-white shadow-xl dark:bg-[#13111E]">
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 z-10 text-kiiya-dark dark:text-[#F0EEFF]"
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

      {/* Main content (re-fades on each route change) */}
      <main
        key={pathname}
        className="min-h-screen animate-fade-in p-6 md:ml-60 md:p-8"
      >
        {children}
      </main>
    </div>
  );
}
