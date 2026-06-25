"use client";
import dynamic from "next/dynamic";
import AppLayout from "@/components/layout/AppLayout";
import CalendarSkeleton from "./_components/CalendarSkeleton";

// FullCalendar (+ 4 plugins, ~270KB) is the single heaviest feature library.
// Load it client-side only, behind a layout-matching skeleton, so it stays out
// of the initial bundle for this route until the calendar actually renders.
const CalendarClient = dynamic(() => import("./_components/CalendarClient"), {
  ssr: false,
  loading: () => <CalendarSkeleton />,
});

export default function CalendarPage() {
  return (
    <AppLayout>
      <CalendarClient />
    </AppLayout>
  );
}
