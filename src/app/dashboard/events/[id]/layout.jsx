import { createClient } from "@/lib/supabase/server";

// Dynamic: the page reads per-user data and metadata is fetched server-side.
export const dynamic = "force-dynamic";

// Builds <title>/OG tags from the event itself. RLS still applies (the request
// carries the viewer's cookies), so only the owner resolves a real title;
// anyone else falls back to a generic "Event".
export async function generateMetadata({ params }) {
  try {
    const supabase = createClient();
    const { data: event } = await supabase
      .from("events")
      .select("title, type, description")
      .eq("id", params.id)
      .single();

    if (!event) return { title: "Event" };

    const description = event.description || `${event.type} event on Kiiya`;
    return {
      title: event.title,
      description,
      openGraph: {
        title: event.title,
        description,
      },
    };
  } catch {
    return { title: "Event" };
  }
}

export default function EventDetailLayout({ children }) {
  return children;
}
