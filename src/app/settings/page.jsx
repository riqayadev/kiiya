import { redirect } from "next/navigation";

// Settings has been folded into the redesigned Profile page (the personal
// command center). Permanently send /settings → /profile.
export default function SettingsPage() {
  redirect("/profile");
}
