"use client";
import { Component } from "react";

/**
 * App-wide error boundary. Catches uncaught render errors anywhere below it and
 * shows a full-page recovery screen instead of a blank white page.
 *
 * Error boundaries must be class components — hooks are not available here.
 *
 * Props:
 *  - children
 *  - fallback (optional): custom node rendered instead of the default screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Surface in the console for debugging / log capture.
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const isDev = process.env.NODE_ENV === "development";
    const { error, errorInfo } = this.state;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F5FF] px-6 dark:bg-[#1E1B2E]">
        <div className="text-6xl">😵</div>
        <h1 className="mt-6 text-xl font-semibold text-gray-800 dark:text-gray-100">
          Something went wrong
        </h1>
        <p className="mt-2 max-w-sm text-center text-sm text-gray-500 dark:text-gray-400">
          An unexpected error occurred. Try refreshing the page.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-[#7C6EF5] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Refresh page
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/dashboard";
            }}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/5"
          >
            Go to Dashboard
          </button>
        </div>

        {isDev && (error || errorInfo) && (
          <details className="mt-8 w-full max-w-2xl rounded-xl border border-red-100 bg-red-50 p-4 text-left text-xs text-red-800 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-200">
            <summary className="cursor-pointer font-semibold">
              Error details (development only)
            </summary>
            <pre className="mt-3 overflow-auto whitespace-pre-wrap">
              {error?.message}
              {errorInfo?.componentStack}
            </pre>
          </details>
        )}
      </div>
    );
  }
}
