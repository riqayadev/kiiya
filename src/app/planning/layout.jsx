// Server component: route segment config is only honored here (not in
// 'use client' files). force-dynamic opts /planning out of static prerender
// so the Supabase browser client is never created at build time.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Planning",
  description: "Plan and organize your upcoming life events.",
};

import AppLayout from "@/components/layout/AppLayout";

// AppLayout (a client component) handles the auth gate + sidebar/topbar shell.
export default function PlanningLayout({ children }) {
  return <AppLayout>{children}</AppLayout>;
}
