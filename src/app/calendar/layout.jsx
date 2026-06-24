// Server-component layout: force-dynamic opts the client /calendar page out of
// static prerender so the Supabase browser client isn't created at build time.
export const dynamic = "force-dynamic";

export default function CalendarLayout({ children }) {
  return children;
}
