"use client";
import { useLang } from "@/hooks/useLang";
import { LayoutDashboard } from "lucide-react";

export default function Dashboard() {
  useLang();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-kiiya-primary dark:bg-[#221F32] dark:text-[#A594F9]">
        <LayoutDashboard className="h-8 w-8" strokeWidth={1.6} />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-kiiya-dark dark:text-white">
        Dashboard
      </h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-[#A89EC9]">
        Your personal summary is coming in Phase 2.
      </p>
      <span className="mt-4 rounded-full border border-purple-100 bg-white px-3 py-1 text-xs font-medium text-kiiya-primary dark:border-[#2D2A3E] dark:bg-[#1A1825]">
        Coming in Phase 2
      </span>
    </div>
  );
}
