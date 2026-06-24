import { useAuth } from "../hooks/useAuth";

export default function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold text-kiiya-primary">Dashboard</h1>
      <p className="text-kiiya-dark/70">Coming soon.</p>
      {user?.email && (
        <p className="text-sm text-kiiya-dark/50">Signed in as {user.email}</p>
      )}
      <button
        onClick={signOut}
        className="rounded-lg bg-kiiya-primary px-5 py-2 font-medium text-white transition hover:opacity-90"
      >
        Sign out
      </button>
    </div>
  );
}
