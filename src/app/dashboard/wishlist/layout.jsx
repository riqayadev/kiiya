// The /dashboard segment layout already provides the AppLayout shell + auth
// gate. This child layout only re-affirms dynamic rendering so the Supabase
// browser client is never created at build time.
export const dynamic = "force-dynamic";

export default function WishlistLayout({ children }) {
  return children;
}
