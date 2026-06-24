// Lightweight achievement system backed by localStorage. Each unlock fires a
// window event so <AchievementToaster/> can show a celebratory toast.

export const ACHIEVEMENTS = [
  {
    id: "first_step",
    emoji: "🎯",
    name: "First Step",
    desc: "Created your first event",
  },
  {
    id: "planner_pro",
    emoji: "📋",
    name: "Planner Pro",
    desc: "Added 5+ activities to an itinerary",
  },
  {
    id: "budget_hero",
    emoji: "💰",
    name: "Budget Hero",
    desc: "Tracked your first expense",
  },
  {
    id: "check_master",
    emoji: "✅",
    name: "Check Master",
    desc: "Completed every checklist item",
  },
  {
    id: "jet_setter",
    emoji: "✈️",
    name: "Jet Setter",
    desc: "Created 3+ trip events",
  },
  {
    id: "the_one",
    emoji: "💍",
    name: "The One",
    desc: "Created a wedding event",
  },
];

const KEY = "kiiya_achievements";
export const ACHIEVEMENT_EVENT = "kiiya-achievement";

export function getUnlocked() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function isUnlocked(id) {
  return !!getUnlocked()[id];
}

// Unlocks an achievement if not already earned; returns true if newly unlocked.
export function unlockAchievement(id) {
  if (typeof window === "undefined") return false;
  const meta = ACHIEVEMENTS.find((a) => a.id === id);
  if (!meta) return false;
  const unlocked = getUnlocked();
  if (unlocked[id]) return false;
  unlocked[id] = Date.now();
  localStorage.setItem(KEY, JSON.stringify(unlocked));
  window.dispatchEvent(new CustomEvent(ACHIEVEMENT_EVENT, { detail: meta }));
  return true;
}

// ── Higher-level checks wired into CRUD flows ──
export function checkEventAchievements(events) {
  if (!Array.isArray(events)) return;
  if (events.length >= 1) unlockAchievement("first_step");
  if (events.filter((e) => e.type === "trip").length >= 3)
    unlockAchievement("jet_setter");
  if (events.some((e) => e.type === "wedding")) unlockAchievement("the_one");
}

export function checkBudgetAchievement() {
  unlockAchievement("budget_hero");
}

export function checkItineraryAchievement(totalActivities) {
  if (totalActivities >= 5) unlockAchievement("planner_pro");
}

export function checkChecklistAchievement(items) {
  if (items.length > 0 && items.every((i) => i.is_completed))
    unlockAchievement("check_master");
}
