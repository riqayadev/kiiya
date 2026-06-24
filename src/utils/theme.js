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

// Tiny non-cryptographic hash for a client-side PIN placeholder (djb2).
// Not for real security — used to avoid storing the PIN in plain text.
export function hashPin(pin) {
  let h = 5381;
  for (let i = 0; i < pin.length; i++) {
    h = (h * 33) ^ pin.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}
