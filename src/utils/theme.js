// Light/dark surface tokens. Tailwind `dark:` variants are the primary styling
// mechanism; this map documents the palette and is available for any component
// that wants to read raw values (e.g. inline styles, canvas, charts).
export const THEMES = {
  light: {
    bg: "#F7F5FF",
    bgSecondary: "#FFFFFF",
    bgTertiary: "#F0EEFF",
    text: "#1E1B2E",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    border: "#E5E0FF",
    borderHover: "#C4B8FF",
    cardBg: "#FFFFFF",
    cardBorder: "#EDE9FF",
    sidebarBg: "#FFFFFF",
    sidebarBorder: "#EDE9FF",
  },
  dark: {
    bg: "#0F0E17",
    bgSecondary: "#1A1825",
    bgTertiary: "#221F32",
    text: "#F0EEFF",
    textSecondary: "#A89EC9",
    textMuted: "#6B6480",
    border: "#2D2A3E",
    borderHover: "#4A4560",
    cardBg: "#1A1825",
    cardBorder: "#2D2A3E",
    sidebarBg: "#13111E",
    sidebarBorder: "#2D2A3E",
  },
};

// Theme color options used by the Profile → Preferences section.
export const THEME_COLORS = [
  { key: "violet", label: "Violet", hex: "#7C6EF5" },
  { key: "rose", label: "Rose", hex: "#F43F5E" },
  { key: "blue", label: "Blue", hex: "#3B82F6" },
  { key: "green", label: "Green", hex: "#10B981" },
  { key: "orange", label: "Orange", hex: "#F97316" },
  { key: "teal", label: "Teal", hex: "#14B8A6" },
];

export function getThemeHex(key) {
  return (THEME_COLORS.find((c) => c.key === key) ?? THEME_COLORS[0]).hex;
}

// Applies the chosen color as a CSS variable on :root. Note: existing
// `kiiya-primary` Tailwind classes are static; this exposes --color-primary
// for components that opt into dynamic theming.
export function applyThemeColor(key) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--color-primary", getThemeHex(key));
}

// Hashes a client-side PIN with SHA-256 (Web Crypto) before it is stored, so
// the raw PIN never touches the database. A static app-level salt is mixed in
// to defeat trivial rainbow tables.
//
// NOTE: a 6-digit PIN only has 1,000,000 possible values, so any hash is
// brute-forceable offline by an attacker who can read the row. Confidentiality
// of `profiles.pin_hash` therefore still relies on the row-level security
// policy that restricts a profile to its owner — this hashing is defense in
// depth, not a substitute for it.
const PIN_SALT = "kiiya::pin::v1";

export async function hashPin(pin) {
  const data = new TextEncoder().encode(`${PIN_SALT}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
