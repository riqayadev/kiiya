import { Link } from "react-router-dom";
import LanguageToggle from "../ui/LanguageToggle";

/**
 * Split-screen shell for the auth pages.
 * Left: gradient brand panel (desktop only). Right: the form.
 */
export default function AuthLayout({ quote, children }) {
  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-kiiya-primary to-kiiya-romantic p-12 text-white md:flex">
        <Link to="/" className="text-2xl font-bold">
          ✦ Kiiya
        </Link>
        <div>
          <p className="text-3xl font-bold leading-snug">
            Life happens. <br /> Plan it beautifully.
          </p>
          <p className="mt-6 max-w-sm text-lg italic text-white/80">
            “{quote}”
          </p>
        </div>
        <p className="text-sm text-white/60">
          © 2026 Kiiya. This is your story.
        </p>
      </div>

      {/* Right form area */}
      <div className="flex w-full flex-col bg-white md:w-1/2">
        <div className="flex items-center justify-between px-6 py-6">
          <Link to="/" className="text-xl font-bold text-kiiya-primary md:hidden">
            ✦ Kiiya
          </Link>
          <div className="ml-auto">
            <LanguageToggle />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
