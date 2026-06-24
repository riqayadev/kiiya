export const eventColors = {
  trip: {
    gradient: "from-[#F0956A] to-[#f7b89b]",
    badge: "bg-orange-100 text-orange-700",
    icon: "✈️",
    hex: "#F0956A",
  },
  wedding: {
    gradient: "from-[#E8A0BF] to-[#f0c4d8]",
    badge: "bg-pink-100 text-pink-700",
    icon: "💍",
    hex: "#E8A0BF",
  },
  anniversary: {
    gradient: "from-[#E8A0BF] to-[#c084a8]",
    badge: "bg-rose-100 text-rose-700",
    icon: "💑",
    hex: "#C084A8",
  },
  babymoon: {
    gradient: "from-[#a8d8ea] to-[#c5e8f5]",
    badge: "bg-blue-100 text-blue-700",
    icon: "🤰",
    hex: "#7FC4DE",
  },
  graduation: {
    gradient: "from-[#7C6EF5] to-[#a594f9]",
    badge: "bg-purple-100 text-purple-700",
    icon: "🎓",
    hex: "#7C6EF5",
  },
  custom: {
    gradient: "from-[#94a3b8] to-[#cbd5e1]",
    badge: "bg-gray-100 text-gray-700",
    icon: "⭐",
    hex: "#94A3B8",
  },
};

// Since event types are now free text, resolve a color theme by matching
// keywords (EN + ID) against the typed value. Falls back to the custom theme.
const TYPE_KEYWORDS = [
  { key: "trip", words: ["trip", "travel", "wisata", "jalan"] },
  { key: "wedding", words: ["wedding", "nikah", "married", "kawin"] },
  { key: "anniversary", words: ["anniversary", "anniv", "ulang tahun"] },
  { key: "graduation", words: ["graduation", "wisuda", "lulus"] },
  { key: "babymoon", words: ["babymoon", "baby", "hamil", "maternity"] },
];

export function getEventColor(type) {
  const normalized = (type || "").toLowerCase().trim();
  for (const { key, words } of TYPE_KEYWORDS) {
    if (words.some((w) => normalized.includes(w))) return eventColors[key];
  }
  return eventColors.custom;
}

// Status pill colors (upcoming=blue, ongoing=green, completed=gray, archived=amber)
export const statusColors = {
  upcoming: "bg-blue-100 text-blue-700",
  ongoing: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  archived: "bg-amber-100 text-amber-700",
};
