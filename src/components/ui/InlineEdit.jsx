"use client";
import { useEffect, useRef, useState } from "react";
import { Pencil, Loader2, Check } from "lucide-react";

/**
 * Notion-style inline-editable value.
 *
 * Props:
 *  - value: the raw current value (string | number)
 *  - onSave(next): async; persist the new value. Throwing reverts + flashes red.
 *  - type: 'text' | 'date' | 'select' | 'currency' | 'textarea'
 *  - options: [{ value, label }] (select only)
 *  - prefix: e.g. 'IDR' (currency only)
 *  - placeholder: shown when empty
 *  - display: optional node/string rendered in display mode (formatted value)
 *  - className: extra classes on the display row
 *
 * Display mode shows the value with a pencil that fades in on hover. Click to
 * edit; blur / Enter saves (textarea & date save on blur), Escape cancels.
 */
export default function InlineEdit({
  value,
  onSave,
  type = "text",
  options = [],
  prefix,
  placeholder = "Empty",
  display,
  className = "",
  maxLength,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [status, setStatus] = useState("idle"); // idle | saving | success | error
  const inputRef = useRef(null);

  // Keep the draft in sync when the underlying value changes elsewhere.
  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  // Focus (and size) the field on entering edit mode.
  useEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    if (type === "textarea") {
      autoResize(el);
      const len = el.value.length;
      el.setSelectionRange?.(len, len);
    } else if (type === "text" || type === "currency") {
      const len = String(el.value).length;
      el.setSelectionRange?.(len, len);
    }
  }, [editing, type]);

  const autoResize = (el) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  // Normalize the draft into the value we persist for this field type.
  const normalize = (raw) => {
    if (type === "currency") {
      const n = parseInt(raw, 10);
      return Number.isFinite(n) ? n : 0;
    }
    if (type === "text" || type === "textarea") {
      return String(raw).trim() || null;
    }
    if (type === "date") return raw || null;
    return raw; // select
  };

  const isUnchanged = (next) => {
    if (type === "currency") return next === (value || 0);
    if (type === "text" || type === "textarea")
      return next === ((value ?? "").trim() || null);
    return next === (value ?? null);
  };

  const commit = async (raw) => {
    const next = normalize(raw);
    if (isUnchanged(next)) {
      setEditing(false);
      return;
    }
    setStatus("saving");
    setEditing(false);
    try {
      await onSave(next);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 1200);
    } catch {
      setStatus("error");
      setDraft(value ?? "");
      setTimeout(() => setStatus("idle"), 1500);
    }
  };

  const cancel = () => {
    setDraft(value ?? "");
    setEditing(false);
  };

  const editCls =
    "w-full border-0 border-b-2 border-kiiya-primary bg-transparent px-0 py-1 text-sm text-gray-800 outline-none dark:text-gray-200";

  // ── Edit mode ──
  if (editing) {
    if (type === "select") {
      return (
        <select
          ref={inputRef}
          value={draft}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === "Escape" && cancel()}
          className={editCls}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === "textarea") {
      return (
        <div>
          <textarea
            ref={inputRef}
            rows={1}
            maxLength={maxLength}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              autoResize(e.target);
            }}
            onBlur={() => commit(draft)}
            onKeyDown={(e) => e.key === "Escape" && cancel()}
            placeholder={placeholder}
            className={`${editCls} resize-none`}
          />
          {maxLength && (
            <p className="mt-1 text-right text-[11px] text-gray-400">
              {draft.length}/{maxLength}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5">
        {type === "currency" && prefix && (
          <span className="text-sm text-gray-400">{prefix}</span>
        )}
        <input
          ref={inputRef}
          type={type === "currency" ? "number" : type === "date" ? "date" : "text"}
          min={type === "currency" ? "0" : undefined}
          maxLength={type === "currency" || type === "date" ? undefined : maxLength}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(draft);
            }
            if (e.key === "Escape") cancel();
          }}
          placeholder={placeholder}
          className={editCls}
        />
      </div>
    );
  }

  // ── Display mode ──
  const isEmpty =
    value === null || value === undefined || value === "" || (type === "currency" && !value);
  const shown = display ?? (isEmpty ? placeholder : value);

  return (
    <div
      onClick={() => setEditing(true)}
      className={`group -mx-2 flex cursor-text items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-gray-50/50 dark:hover:bg-white/5 ${
        status === "error" ? "ring-1 ring-red-400" : ""
      } ${className}`}
    >
      <span className={`min-w-0 truncate ${isEmpty ? "text-gray-400" : ""}`}>
        {shown}
      </span>
      {status === "saving" ? (
        <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-kiiya-primary" />
      ) : status === "success" ? (
        <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
      ) : (
        <Pencil className="h-3.5 w-3.5 flex-shrink-0 text-gray-300 opacity-0 transition group-hover:opacity-100" />
      )}
    </div>
  );
}
