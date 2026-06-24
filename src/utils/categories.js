import {
  Car,
  Hotel,
  Utensils,
  Star,
  ShoppingBag,
  MoreHorizontal,
} from "lucide-react";

// Shared category metadata used by the Itinerary and Budget tabs.
// Icons follow the brief; "general" falls back to the "other" look.
export const categoryMeta = {
  transport: { icon: Car, label: "Transport", color: "#7C6EF5" },
  accommodation: { icon: Hotel, label: "Accommodation", color: "#E8A0BF" },
  food: { icon: Utensils, label: "Food", color: "#F0956A" },
  activity: { icon: Star, label: "Activity", color: "#6EC7F5" },
  shopping: { icon: ShoppingBag, label: "Shopping", color: "#9B8AFB" },
  other: { icon: MoreHorizontal, label: "Other", color: "#94A3B8" },
  general: { icon: MoreHorizontal, label: "General", color: "#94A3B8" },
};

export function getCategory(category) {
  return categoryMeta[category] ?? categoryMeta.other;
}

// Categories selectable for itinerary activities (includes "general").
export const ACTIVITY_CATEGORIES = [
  "transport",
  "accommodation",
  "food",
  "activity",
  "shopping",
  "other",
];

// Categories used for expenses (no "general").
export const EXPENSE_CATEGORIES = [
  "transport",
  "accommodation",
  "food",
  "activity",
  "shopping",
  "other",
];
