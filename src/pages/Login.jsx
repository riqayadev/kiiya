import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold text-kiiya-primary">Login</h1>
      <p className="text-kiiya-dark/70">Coming soon.</p>
      <Link to="/" className="text-sm text-kiiya-primary hover:underline">
        ← Back home
      </Link>
    </div>
  );
}
