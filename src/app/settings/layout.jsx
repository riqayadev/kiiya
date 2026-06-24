// Server-component layout: force-dynamic opts the client /settings page out of
// static prerender so the Supabase browser client isn't created at build time.
export const dynamic = "force-dynamic";

export default function SettingsLayout({ children }) {
  return children;
}
