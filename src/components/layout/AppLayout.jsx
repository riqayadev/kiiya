"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  CalendarDays,
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

// Fired by the profile page after a successful save so the sidebar re-fetches
// without a full reload (the layout persists across route changes).
export const PROFILE_UPDATED_EVENT = "kiiya-profile-updated";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, key: "dashboard.nav.dashboard" },
  { to: "/planning", icon: MapPin, key: "dashboard.nav.planning" },
  { to: "/calendar", icon: CalendarDays, key: "dashboard.nav.calendar" },
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
      <div className="relative border-t border-purple-100 p-4 dark:border-[#2D2A3E]">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle className="dark:border-[#2D2A3E] dark:bg-[#221F32]" />
        </div>

        <div className="my-3 border-t border-purple-100 dark:border-[#2D2A3E]" />

        {/* Avatar — opens the dropdown menu upward */}
        <div ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex w-full items-center gap-3 rounded-xl p-1 text-left transition hover:bg-purple-50 dark:hover:bg-[#221F32]"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={name}
                className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-kiiya-primary text-xs font-semibold text-white">
                {getInitials(name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-kiiya-dark dark:text-[#F0EEFF]">
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
              className="absolute bottom-16 left-4 z-20 min-w-[180px] rounded-xl border border-purple-100 bg-white p-1 shadow-xl dark:border-[#2D2A3E] dark:bg-[#1A1825]"
            >
              <Link
                href="/profile"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onNavigate?.();
                }}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-kiiya-dark transition hover:bg-purple-50 dark:text-[#F0EEFF] dark:hover:bg-[#221F32]"
              >
                <UserCircle className="h-4 w-4" strokeWidth={1.8} />
                {t("dashboard.nav.profile")}
              </Link>

              <div className="my-1 border-t border-purple-100 dark:border-[#2D2A3E]" />

              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.8} />
                {t("dashboard.nav.signOut")}
              </button>
            </div>
          )}
        </div>
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

  // Auth gate: redirect to /login once we know there is no session.
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Pull display name/avatar from the profiles table (useAuth only sees the
  // auth user, so profile edits wouldn't otherwise reflect in the sidebar).
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const load = () => {
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    };
    load();
    // Re-fetch when the profile page reports a save.
    window.addEventListener(PROFILE_UPDATED_EVENT, load);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, load);
  }, [user]);

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

  const name = getDisplayName(user, profile);

  return (
    <div className="min-h-screen bg-kiiya-bg dark:bg-[#0F0E17]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-purple-100 bg-white dark:border-[#2D2A3E] dark:bg-[#13111E] md:block">
        <SidebarContent
          user={user}
          profile={profile}
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
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={name}
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
        className="min-h-screen animate-fade-in p-6 md:ml-60 md:p-8"
      >
        {children}
      </main>
    </div>
  );
}
