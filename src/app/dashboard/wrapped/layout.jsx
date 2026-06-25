// The /dashboard segment layout already provides the AppLayout shell + auth
// gate. This child layout only re-affirms dynamic rendering so the Supabase
// browser client is never created at build time.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Year Wrapped",
  description: "Your year in life events, beautifully summarized.",
};

export default function WrappedLayout({ children }) {
  return children;
}
