import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detect the OAuth redirect hash (e.g. /dashboard#access_token=...).
    // The Supabase JS client parses the hash automatically on init, so we
    // just need to resolve the session, then clean the hash out of the URL.
    const hasOAuthHash =
      typeof window !== "undefined" &&
      window.location.hash.includes("access_token");

    // Load any existing session on mount (also resolves the OAuth hash).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);

      if (hasOAuthHash) {
        // Strip the token hash so it isn't left in the address bar / history.
        window.history.replaceState({}, "", window.location.pathname);
        // Land the freshly-authenticated user on the dashboard.
        if (data.session) {
          navigate("/dashboard", { replace: true });
        }
      }
    });

    // Keep state in sync with auth changes (refresh, sign-in, sign-out).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = { user, session, loading, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
