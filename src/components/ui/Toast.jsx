"use client";
import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

const TOAST_EVENT = "kiiya-toast";

// Fire-and-forget API usable from anywhere (hooks, components) without context.
export const toast = {
  success: (message) => emit("success", message),
  error: (message) => emit("error", message),
  info: (message) => emit("info", message),
};

function emit(type, message) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, { detail: { type, message, id: Date.now() + Math.random() } })
  );
}

const VARIANTS = {
  success: { icon: CheckCircle, ring: "border-green-200", accent: "text-green-600", bar: "bg-green-500" },
  error: { icon: AlertCircle, ring: "border-red-200", accent: "text-red-600", bar: "bg-red-500" },
  info: { icon: Info, ring: "border-purple-200", accent: "text-kiiya-primary", bar: "bg-kiiya-primary" },
};

function ToastItem({ t, onClose }) {
  const v = VARIANTS[t.type] ?? VARIANTS.info;
  const Icon = v.icon;
  useEffect(() => {
    const id = setTimeout(onClose, 3500);
    return () => clearTimeout(id);
  }, [onClose]);
  return (
    <div
      className={`pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 overflow-hidden rounded-xl border bg-white p-4 shadow-lg animate-toast-in dark:bg-[#1A1825] dark:shadow-black/40 ${v.ring}`}
      role="status"
    >
      <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${v.accent}`} />
      <p className="min-w-0 flex-1 text-sm font-medium text-kiiya-dark dark:text-white">
        {t.message}
      </p>
      <button
        onClick={onClose}
        aria-label="Dismiss"
        className="flex-shrink-0 text-gray-300 transition hover:text-kiiya-dark dark:hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const handler = (e) => setItems((prev) => [...prev, e.detail]);
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  const remove = (id) => setItems((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2">
      {items.map((t) => (
        <ToastItem key={t.id} t={t} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
}
