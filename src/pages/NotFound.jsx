import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-5xl font-bold text-kiiya-primary">404</h1>
      <p className="text-kiiya-dark/70">Page not found.</p>
      <Link
        to="/"
        className="rounded-lg bg-kiiya-primary px-5 py-2 font-medium text-white transition hover:opacity-90"
      >
        Back home
      </Link>
    </div>
  );
}
