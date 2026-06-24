"use client";
import AppLayout from "@/components/layout/AppLayout";

// AppLayout handles the auth gate (redirects to /login when there is no
// session) and renders the sidebar + topbar shell.
export default function DashboardLayout({ children }) {
  return <AppLayout>{children}</AppLayout>;
}
