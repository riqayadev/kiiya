"use client";
import { useMemo, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";

function ChecklistRow({ item, onToggle, onDelete }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
      <input
        type="checkbox"
        checked={!!item.is_completed}
        onChange={(e) => onToggle(item.id, e.target.checked)}
        className="h-4 w-4 flex-shrink-0 accent-kiiya-primary"
      />
      <span
        className={`min-w-0 flex-1 text-sm font-medium text-kiiya-dark ${
          item.is_completed ? "line-through opacity-50" : ""
        }`}
      >
        {item.title}
      </span>
      <button
        onClick={() => onDelete(item.id)}
        aria-label="Delete item"
        className="flex-shrink-0 rounded-md p-1 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ChecklistTab({
  checklist,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const completed = checklist.filter((c) => c.is_completed).length;
  const total = checklist.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Group by category (preserve first-seen order).
  const groups = useMemo(() => {
    const map = new Map();
    for (const item of checklist) {
      const key = item.category || "general";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return Array.from(map.entries());
  }, [checklist]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await addChecklistItem(title.trim(), category.trim() || "general");
      setTitle("");
      setCategory("");
    } catch (err) {
      alert(err.message || "Failed to add item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="rounded-2xl border border-purple-100 bg-white p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-kiiya-dark">
            {completed} of {total} completed
          </span>
          <span className="font-semibold text-gray-500">{pct}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-kiiya-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Grouped list */}
      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-purple-200 bg-white py-12 text-center">
          <span className="text-4xl">✅</span>
          <p className="mt-3 font-semibold text-kiiya-dark">
            Your checklist is empty
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Add items below to keep track of what&apos;s left to do.
          </p>
        </div>
      ) : (
        groups.map(([cat, items]) => (
          <div
            key={cat}
            className="rounded-2xl border border-purple-100 bg-white p-5"
          >
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">
              {cat}
            </h3>
            <div className="space-y-2">
              {items.map((item) => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  onToggle={(id, val) =>
                    toggleChecklistItem(id, val).catch((e) => alert(e.message))
                  }
                  onDelete={(id) =>
                    deleteChecklistItem(id).catch((e) => alert(e.message))
                  }
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add item */}
      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-2 rounded-2xl border border-purple-100 bg-white p-4 sm:flex-row"
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add an item…"
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-kiiya-primary focus:ring-2 focus:ring-kiiya-primary/20"
        />
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-kiiya-primary focus:ring-2 focus:ring-kiiya-primary/20 sm:w-40"
        />
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="flex items-center justify-center gap-2 rounded-xl bg-kiiya-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add Item
        </button>
      </form>
    </div>
  );
}
