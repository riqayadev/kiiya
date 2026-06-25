import Link from "next/link";

// Server component (App Router not-found convention). No hooks / "use client".
export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F5FF] px-6 dark:bg-[#1E1B2E]">
      <p className="text-8xl font-bold text-[#7C6EF5]">404</p>
      <div className="mt-2 text-5xl">🗺️</div>
      <h1 className="mt-4 text-2xl font-semibold text-gray-800 dark:text-gray-100">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-center text-gray-500 dark:text-gray-400">
        Looks like this page doesn&apos;t exist or has been moved.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl bg-[#7C6EF5] px-6 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-gray-200 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/5"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
