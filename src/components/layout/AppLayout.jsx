"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  CalendarDays,
  Star,
  Sparkles,
  UserCircle,
  LogOut,
  Menu,
  X,
  Loader2,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/utils/i18n";
import LanguageToggle from "@/components/ui/LanguageToggle";
import ThemeToggle from "@/components/ui/ThemeToggle";
import PinLockScreen from "@/components/ui/PinLockScreen";

// Fired by the profile page after a successful save so the sidebar re-fetches
// without a full reload (the layout persists across route changes).
export const PROFILE_UPDATED_EVENT = "kiiya-profile-updated";

// sessionStorage key remembering that the PIN was entered this tab session.
const PIN_UNLOCKED_KEY = "kiiya_pin_unlocked";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, key: "dashboard.nav.dashboard" },
  { to: "/planning", icon: MapPin, key: "dashboard.nav.planning" },
  { to: "/calendar", icon: CalendarDays, key: "dashboard.nav.calendar" },
  { to: "/dashboard/wishlist", icon: Star, key: "dashboard.nav.wishlist" },
  { to: "/dashboard/wrapped", icon: Sparkles, key: "dashboard.nav.wrapped" },
];

function getDisplayName(user, profile) {
  return (
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Guest"
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

function SidebarContent({ user, profile, signOut, pathname, onNavigate }) {
  const name = getDisplayName(user, profile);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the avatar dropdown on outside-click and ESC.
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div className="flex h-full flex-col">
      {/* Top — brand */}
      <div className="px-5 pb-2 pt-6">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-1.5 font-jakarta text-xl font-extrabold text-[#7C6EF5]"
        >
          Kiiya <span className="text-base">✨</span>
        </Link>
        <p className="mt-1 text-xs font-medium text-gray-400 dark:text-[#6B6480]">
          Life Event Planner
        </p>
      </div>

      {/* Nav */}
      <nav className="mt-4 flex-1 space-y-1 px-2">
        {NAV_ITEMS.map(({ to, icon: Icon, key }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              href={to}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`relative mx-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all ${
                isActive
                  ? "bg-[#7C6EF5]/15 font-semibold text-[#7C6EF5] before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-[#7C6EF5] before:content-[''] dark:bg-[#7C6EF5]/20"
                  : "text-gray-500 hover:bg-[#7C6EF5]/8 hover:text-[#7C6EF5] dark:text-[#A89EC9] dark:hover:bg-white/5"
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-colors ${
                  isActive ? "text-[#7C6EF5]" : "text-gray-400"
                }`}
                strokeWidth={1.9}
              />
              {t(key)}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — user card with dropdown (profile / theme / language / sign out) */}
      <div className="relative p-3" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex w-full items-center gap-3 rounded-2xl bg-[#7C6EF5]/8 p-3 text-left transition hover:bg-[#7C6EF5]/15 dark:bg-white/5 dark:hover:bg-white/10"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={name}
              loading="lazy"
              decoding="async"
              className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-kiiya-primary text-xs font-semibold text-white">
              {getInitials(name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-jakarta text-sm font-semibold text-kiiya-dark dark:text-[#F0EEFF]">
              {name}
            </p>
            <p className="truncate text-xs text-gray-400 dark:text-[#6B6480]">
              {user?.email}
            </p>
          </div>
          <ChevronUp
            className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform dark:text-[#6B6480] ${
              menuOpen ? "" : "rotate-180"
            }`}
          />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute bottom-[88px] left-3 right-3 z-20 rounded-2xl border border-purple-100 bg-white p-2 shadow-xl dark:border-[#2D2A3E] dark:bg-[#1A1825]"
          >
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onNavigate?.();
              }}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-kiiya-dark transition hover:bg-purple-50 dark:text-[#F0EEFF] dark:hover:bg-[#221F32]"
            >
              <UserCircle className="h-4 w-4" strokeWidth={1.8} />
              {t("dashboard.nav.profile")}
            </Link>

            {/* Theme + language controls */}
            <div className="mt-1 flex items-center justify-between gap-2 rounded-xl px-3 py-2">
              <ThemeToggle />
              <LanguageToggle className="dark:border-[#2D2A3E] dark:bg-[#221F32]" />
            </div>

            <div className="my-1 border-t border-purple-100 dark:border-[#2D2A3E]" />

            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.8} />
              {t("dashboard.nav.signOut")}
            </button>
          </div>
        )}
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
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [pinUnlocked, setPinUnlocked] = useState(false);

  // Auth gate: redirect to /login once we know there is no session.
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Read the per-tab unlock flag once on mount (sessionStorage is unavailable
  // during SSR, so this can't run in the initial state).
  useEffect(() => {
    setPinUnlocked(sessionStorage.getItem(PIN_UNLOCKED_KEY) === "true");
  }, []);

  // Pull display name/avatar/pin from the profiles table (useAuth only sees the
  // auth user, so profile edits wouldn't otherwise reflect in the sidebar).
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const load = () => {
      supabase
        .from("profiles")
        .select("full_name, avatar_url, pin_hash")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
          setProfileLoaded(true);
        })
        .catch(() => {
          // Don't trap the user on the loader if the profile fetch fails —
          // fall through to the app shell (PIN gate degrades to "no PIN").
          setProfileLoaded(true);
        });
    };
    load();
    // Re-fetch when the profile page reports a save.
    window.addEventListener(PROFILE_UPDATED_EVENT, load);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, load);
  }, [user]);

  const handleSignOut = async () => {
    sessionStorage.removeItem(PIN_UNLOCKED_KEY);
    await signOut();
    router.replace("/login");
  };

  const handleUnlock = () => {
    sessionStorage.setItem(PIN_UNLOCKED_KEY, "true");
    setPinUnlocked(true);
  };

  // While checking the session (or redirecting), show a lightweight loader.
  // Also wait for the profile fetch so we never flash the dashboard before the
  // PIN lock screen for users who have a PIN set.
  if (loading || !user || !profileLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-kiiya-bg text-kiiya-primary dark:bg-[#0F0E17]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // PIN gate: a PIN is set and this tab hasn't been unlocked yet.
  if (profile?.pin_hash && !pinUnlocked) {
    return (
      <PinLockScreen
        pinHash={profile.pin_hash}
        profile={profile}
        user={user}
        onUnlock={handleUnlock}
        onSignOut={handleSignOut}
      />
    );
  }

  const name = getDisplayName(user, profile);

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0F0D1A]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#E8E4FF] bg-[#F4F2FF] dark:border-white/8 dark:bg-[#0F0D1A] md:block">
        <SidebarContent
          user={user}
          profile={profile}
          signOut={handleSignOut}
          pathname={pathname}
        />
      </aside>

      {/* Mobile topbar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#E8E4FF] bg-[#F4F2FF] px-4 dark:border-white/8 dark:bg-[#0F0D1A] md:hidden">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 font-jakarta text-lg font-extrabold text-[#7C6EF5]"
        >
          Kiiya <span className="text-sm">✨</span>
        </Link>
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={name}
              loading="lazy"
              decoding="async"
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-kiiya-primary text-xs font-semibold text-white">
              {getInitials(name)}
            </div>
          )}
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
          <div className="absolute inset-y-0 left-0 w-64 bg-[#F4F2FF] shadow-xl dark:bg-[#0F0D1A]">
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 z-10 text-kiiya-dark dark:text-[#F0EEFF]"
            >
              <X className="h-6 w-6" />
            </button>
            <SidebarContent
              user={user}
              profile={profile}
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
        className="page-enter min-h-screen p-6 md:ml-64 md:p-8"
      >
        {children}
      </main>
    </div>
  );
}
