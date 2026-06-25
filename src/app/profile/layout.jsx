// Server-component layout: force-dynamic opts the client /profile page out of
// static prerender so the Supabase browser client isn't created at build time.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile",
  description: "Manage your account and preferences.",
};

export default function ProfileLayout({ children }) {
  return children;
}
