// Server-component layout: force-dynamic here makes the client /login page
// render dynamically instead of being statically prerendered at build time
// (which would create the Supabase browser client without env vars and crash).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign In",
  description: "Sign in to Kiiya to access your life event planner.",
};

export default function LoginLayout({ children }) {
  return children;
}
