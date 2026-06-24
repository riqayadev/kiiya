// Server component: route segment config is only honored here (not in
// 'use client' files). force-dynamic opts /dashboard out of static prerender
// so the Supabase browser client is never created at build time.
export const dynamic = "force-dynamic";

import AppLayout from "@/components/layout/AppLayout";

// AppLayout (a client component) handles the auth gate + sidebar/topbar shell.
export default function DashboardLayout({ children }) {
  return <AppLayout>{children}</AppLayout>;
}
