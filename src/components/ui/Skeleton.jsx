"use client";

/**
 * Reusable shimmer placeholder. Size/shape comes entirely from `className`.
 *
 *   <Skeleton className="h-4 w-32" />
 *   <Skeleton className="h-40 w-full rounded-2xl" />
 */
export default function Skeleton({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`}
    />
  );
}
