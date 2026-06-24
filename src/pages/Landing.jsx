import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex items-center gap-2 text-kiiya-primary">
        <Sparkles className="h-8 w-8" />
        <h1 className="text-4xl font-bold">Kiiya</h1>
      </div>
      <p className="text-lg text-kiiya-dark/70">
        Your Life Event Planner — Coming soon.
      </p>
      <div className="flex gap-3">
        <Link
          to="/login"
          className="rounded-lg bg-kiiya-primary px-5 py-2 font-medium text-white transition hover:opacity-90"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="rounded-lg border border-kiiya-primary px-5 py-2 font-medium text-kiiya-primary transition hover:bg-kiiya-primary/10"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
