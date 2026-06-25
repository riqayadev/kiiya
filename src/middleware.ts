import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require an authenticated session. A path matches if it equals the
// prefix or starts with "<prefix>/" (so subroutes are covered too).
const PROTECTED_PREFIXES = ["/dashboard", "/planning", "/calendar", "/profile"];

// Auth pages that an already-signed-in user should be bounced away from.
const AUTH_PAGES = ["/login", "/register"];

function pathMatches(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always let the OAuth/email callback through untouched — it does the code
  // exchange and sets the session cookies itself.
  if (pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  // Start from a passthrough response we can attach refreshed cookies to.
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured, don't block anything — fall through.
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Write refreshed cookies onto both the request (for any downstream
        // read in this pass) and the outgoing response (so the browser keeps
        // the rotated tokens) — the @supabase/ssr middleware pattern.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: getUser() revalidates the token with Supabase (and triggers a
  // refresh via setAll above). getSession() only reads the cookie and is not
  // trustworthy server-side.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = pathMatches(pathname, PROTECTED_PREFIXES);
  const isAuthPage = pathMatches(pathname, AUTH_PAGES);

  // No session on a protected route → send to login (remember where they were).
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Already signed in but sitting on an auth page → send to the dashboard.
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match everything except Next internals and static image assets, so the
     * middleware (and token refresh) runs on real navigations only.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
