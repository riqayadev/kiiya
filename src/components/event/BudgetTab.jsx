"use client";
import { useMemo, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { getCategory, EXPENSE_CATEGORIES } from "@/utils/categories";
import { formatRupiah, formatDateShort } from "@/utils/format";

const EMPTY_EXPENSE = {
  title: "",
  amount: "",
  category: "other",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
};

function AddExpenseModal({ onSubmit, onClose }) {
  const [form, setForm] = useState(EMPTY_EXPENSE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) {
      setError("Title and amount are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        title: form.title.trim(),
        amount: parseInt(form.amount, 10) || 0,
        category: form.category,
        date: form.date || null,
        notes: form.notes.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add expense.");
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-kiiya-primary focus:ring-2 focus:ring-kiiya-primary/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-kiiya-dark">Add Expense</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 transition hover:text-kiiya-dark"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-kiiya-dark">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="e.g. Hotel booking"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-kiiya-dark">
                Amount (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => setField("amount", e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-kiiya-dark">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                className={inputCls}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {getCategory(c).label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-kiiya-dark">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setField("date", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-kiiya-dark">
              Notes
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Optional"
              className={`${inputCls} resize-none`}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-kiiya-dark transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-kiiya-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BudgetTab({ event, expenses, addExpense, deleteExpense }) {
  const [showModal, setShowModal] = useState(false);

  const budget = event?.budget || 0;
  const spent = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses]
  );
  const remaining = budget - spent;
  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;

  const barColor =
    pct < 70 ? "bg-green-500" : pct < 90 ? "bg-yellow-500" : "bg-red-500";

  const byCategory = useMemo(() => {
    const map = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] || 0) + (e.amount || 0);
    }
    return EXPENSE_CATEGORIES.map((c) => ({
      category: c,
      total: map[c] || 0,
    })).filter((c) => c.total > 0);
  }, [expenses]);

  const maxCat = Math.max(1, ...byCategory.map((c) => c.total));

  return (
    <div className="space-y-6 pb-24">
      {/* A) Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-purple-100 bg-white p-5">
          <p className="text-sm text-gray-500">Total Budget</p>
          <p className="mt-1 text-xl font-bold text-kiiya-dark">
            {formatRupiah(budget)}
          </p>
        </div>
        <div className="rounded-2xl border border-purple-100 bg-white p-5">
          <p className="text-sm text-gray-500">Total Spent</p>
          <p className="mt-1 text-xl font-bold text-kiiya-warm">
            {formatRupiah(spent)}
          </p>
        </div>
        <div className="rounded-2xl border border-purple-100 bg-white p-5">
          <p className="text-sm text-gray-500">Remaining</p>
          <p
            className={`mt-1 text-xl font-bold ${
              remaining < 0 ? "text-red-500" : "text-green-600"
            }`}
          >
            {formatRupiah(remaining)}
          </p>
        </div>
      </div>

      {/* B) Big progress bar */}
      <div className="rounded-2xl border border-purple-100 bg-white p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-kiiya-dark">Budget used</span>
          <span className="font-semibold text-gray-500">{pct}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      {/* C) Spending by category */}
      {byCategory.length > 0 && (
        <div className="rounded-2xl border border-purple-100 bg-white p-5">
          <h3 className="mb-4 font-bold text-kiiya-dark">Spending by category</h3>
          <div className="space-y-3">
            {byCategory.map(({ category, total }) => {
              const cat = getCategory(category);
              const Icon = cat.icon;
              return (
                <div key={category} className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `${cat.color}1A`,
                      color: cat.color,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-kiiya-dark">
                        {cat.label}
                      </span>
                      <span className="text-gray-500">
                        {formatRupiah(total)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(total / maxCat) * 100}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* D) Expense list */}
      <div className="rounded-2xl border border-purple-100 bg-white p-5">
        <h3 className="mb-4 font-bold text-kiiya-dark">Expenses</h3>
        {expenses.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            No expenses yet. Tap the + button to add one.
          </p>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => {
              const cat = getCategory(exp.category);
              const Icon = cat.icon;
              return (
                <div
                  key={exp.id}
                  className="group flex items-center gap-3 rounded-xl border border-gray-100 p-3"
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `${cat.color}1A`,
                      color: cat.color,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-kiiya-dark">
                      {exp.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDateShort(exp.date)}
                    </p>
                  </div>
                  <p className="flex-shrink-0 font-semibold text-kiiya-dark">
                    {formatRupiah(exp.amount)}
                  </p>
                  <button
                    onClick={() =>
                      deleteExpense(exp.id).catch((e) => alert(e.message))
                    }
                    aria-label="Delete expense"
                    className="flex-shrink-0 rounded-md p-1 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* E) Floating add button */}
      <button
        onClick={() => setShowModal(true)}
        aria-label="Add expense"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-kiiya-primary text-white shadow-lg transition hover:opacity-90"
      >
        <Plus className="h-6 w-6" />
      </button>

      {showModal && (
        <AddExpenseModal
          onSubmit={addExpense}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
