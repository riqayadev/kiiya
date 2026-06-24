"use client";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

/**
 * Sun/Moon theme toggle with a smooth icon swap.
 * Shows the icon for the mode you'd switch *to* is avoided — instead it shows
 * the current state (Moon = currently dark-capable target). We display the icon
 * representing the action's result: Sun when dark (tap → light), Moon when light.
 */
export default function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full border border-purple-100 bg-white/70 text-kiiya-dark transition-colors hover:bg-purple-50 dark:border-[#2D2A3E] dark:bg-[#221F32] dark:text-[#F0EEFF] dark:hover:bg-[#2D2A3E] ${className}`}
    >
      <Sun
        className={`absolute h-[18px] w-[18px] transition-all duration-300 ${
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        }`}
        strokeWidth={1.8}
      />
      <Moon
        className={`absolute h-[18px] w-[18px] transition-all duration-300 ${
          isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        }`}
        strokeWidth={1.8}
      />
    </button>
  );
}
