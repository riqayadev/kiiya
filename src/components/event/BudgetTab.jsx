"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { getCategory, EXPENSE_CATEGORIES } from "@/utils/categories";
import { formatRupiah } from "@/utils/format";
import { toast } from "@/components/ui/Toast";

const today = () => new Date().toISOString().slice(0, 10);

function CategoryPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cat = getCategory(value);
  const Icon = cat.icon;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${cat.color}1A`, color: cat.color }}
        aria-label="Category"
      >
        <Icon className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg dark:border-[#2D2A3E] dark:bg-[#1A1825]">
          {EXPENSE_CATEGORIES.map((c) => {
            const meta = getCategory(c);
            const MIcon = meta.icon;
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-kiiya-dark transition hover:bg-purple-50 dark:text-[#F0EEFF] dark:hover:bg-[#221F32]"
              >
                <span style={{ color: meta.color }}>
                  <MIcon className="h-4 w-4" />
                </span>
                {meta.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExpenseRow({ expense, onUpdate, onDelete }) {
  const [title, setTitle] = useState(expense.title || "");
  const [amount, setAmount] = useState(
    expense.amount ? String(expense.amount) : ""
  );

  useEffect(() => setTitle(expense.title || ""), [expense.title]);
  useEffect(
    () => setAmount(expense.amount ? String(expense.amount) : ""),
    [expense.amount]
  );

  const saveTitle = () => {
    const next = title.trim();
    if (next && next !== expense.title) onUpdate({ title: next });
  };
  const saveAmount = () => {
    const next = amount ? parseInt(amount, 10) : 0;
    if (next !== (expense.amount || 0)) onUpdate({ amount: next });
  };

  return (
    <div className="group flex items-center gap-2 rounded-lg px-1 py-1.5 transition hover:bg-purple-50/40 dark:hover:bg-[#221F32]/60">
      <CategoryPicker
        value={expense.category}
        onChange={(c) => onUpdate({ category: c })}
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        placeholder="Expense…"
        className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-kiiya-dark outline-none dark:text-white transition hover:border-gray-200 focus:border-kiiya-primary"
      />
      <input
        type="date"
        value={expense.date || ""}
        onChange={(e) => onUpdate({ date: e.target.value || null })}
        className="w-[130px] flex-shrink-0 rounded-md border border-transparent bg-transparent px-1 py-1 text-xs text-gray-400 outline-none transition hover:border-gray-200 focus:border-kiiya-primary"
      />
      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onBlur={saveAmount}
        placeholder="Rp"
        className="w-24 flex-shrink-0 rounded-md border border-transparent bg-transparent px-1 py-1 text-right text-sm font-semibold text-kiiya-dark outline-none dark:text-white transition hover:border-gray-200 focus:border-kiiya-primary"
      />
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete expense"
        className="flex-shrink-0 rounded p-1 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function NewExpenseRow({ onAdd }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const titleRef = useRef(null);

  const commit = async () => {
    if (!title.trim() || !amount) return;
    const payload = {
      title: title.trim(),
      amount: parseInt(amount, 10) || 0,
      category: "other",
      date: today(),
    };
    setTitle("");
    setAmount("");
    try {
      await onAdd(payload);
      titleRef.current?.focus();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="flex items-center gap-2 px-1 py-1.5">
      <Plus className="ml-1 h-4 w-4 flex-shrink-0 text-gray-300" />
      <input
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add expense…"
        className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-gray-500 outline-none transition hover:border-gray-200 focus:border-kiiya-primary"
      />
      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
        placeholder="Rp"
        className="w-24 flex-shrink-0 rounded-md border border-transparent bg-transparent px-1 py-1 text-right text-sm outline-none transition hover:border-gray-200 focus:border-kiiya-primary"
      />
    </div>
  );
}

export default function BudgetTab({
  event,
  expenses,
  addExpense,
  updateExpense,
  deleteExpense,
}) {
  const [grouped, setGrouped] = useState(false);

  const budget = event?.budget || 0;
  const spent = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses]
  );
  const remaining = budget - spent;
  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const barColor =
    pct < 70 ? "bg-green-500" : pct < 90 ? "bg-yellow-500" : "bg-red-500";

  const groups = useMemo(() => {
    if (!grouped) return null;
    const map = new Map();
    for (const e of expenses) {
      const key = e.category || "other";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    return Array.from(map.entries());
  }, [grouped, expenses]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-2xl border border-purple-100 bg-white p-5 dark:border-[#2D2A3E] dark:bg-[#1A1825]">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-500">Budget</p>
            <p className="mt-1 text-lg font-bold text-kiiya-dark dark:text-white">
              {formatRupiah(budget)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Spent</p>
            <p className="mt-1 text-lg font-bold text-kiiya-warm">
              {formatRupiah(spent)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Remaining</p>
            <p
              className={`mt-1 text-lg font-bold ${
                remaining < 0 ? "text-red-500" : "text-green-600"
              }`}
            >
              {formatRupiah(remaining)}
            </p>
          </div>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-[#221F32]">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      {/* Expense list */}
      <div className="rounded-2xl border border-purple-100 bg-white p-5 dark:border-[#2D2A3E] dark:bg-[#1A1825]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-kiiya-dark dark:text-white">Expenses</h3>
          <button
            onClick={() => setGrouped((g) => !g)}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
              grouped
                ? "bg-kiiya-primary text-white"
                : "border border-purple-100 text-kiiya-dark/70 hover:border-kiiya-primary/40 dark:border-[#2D2A3E] dark:text-[#A89EC9]"
            }`}
          >
            <ChevronDown className="h-3 w-3" />
            Group by category
          </button>
        </div>

        {grouped ? (
          <div className="space-y-4">
            {groups.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-400">
                No expenses yet.
              </p>
            )}
            {groups.map(([cat, items]) => {
              const meta = getCategory(cat);
              const subtotal = items.reduce((s, e) => s + (e.amount || 0), 0);
              return (
                <div key={cat}>
                  <div className="mb-1 flex items-center justify-between px-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      {meta.label}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      {formatRupiah(subtotal)}
                    </span>
                  </div>
                  {items.map((exp) => (
                    <ExpenseRow
                      key={exp.id}
                      expense={exp}
                      onUpdate={(u) =>
                        updateExpense(exp.id, u).catch((e) => toast.error(e.message))
                      }
                      onDelete={() =>
                        deleteExpense(exp.id).catch((e) => toast.error(e.message))
                      }
                    />
                  ))}
                </div>
              );
            })}
            <NewExpenseRow onAdd={addExpense} />
          </div>
        ) : (
          <div className="space-y-0.5">
            {expenses.length === 0 && (
              <p className="px-1 py-2 text-sm text-gray-400">
                💸 No expenses yet — start tracking below.
              </p>
            )}
            {expenses.map((exp) => (
              <ExpenseRow
                key={exp.id}
                expense={exp}
                onUpdate={(u) =>
                  updateExpense(exp.id, u).catch((e) => toast.error(e.message))
                }
                onDelete={() =>
                  deleteExpense(exp.id).catch((e) => toast.error(e.message))
                }
              />
            ))}
            <NewExpenseRow onAdd={addExpense} />
          </div>
        )}
      </div>
    </div>
  );
}
