"use client";
import { Component } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Lightweight error boundary for individual sections (tabs, widgets). A crash
 * in one section shows an inline card with a Retry button instead of taking
 * down the whole page.
 *
 * Props:
 *  - children
 *  - fallback (optional): custom node rendered instead of the default card.
 */
export default class AsyncErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.retry = this.retry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error("AsyncErrorBoundary caught an error:", error, errorInfo);
  }

  retry() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-900/10">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-800 dark:text-red-200">
              Failed to load this section
            </p>
            <button
              type="button"
              onClick={this.retry}
              className="mt-3 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
}
