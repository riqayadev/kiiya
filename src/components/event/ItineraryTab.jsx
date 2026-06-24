"use client";
import { useState } from "react";
import { Plus, X, Loader2, Clock } from "lucide-react";
import { getCategory, ACTIVITY_CATEGORIES } from "@/utils/categories";
import { formatRupiah, formatDateShort } from "@/utils/format";

function formatTime(time) {
  if (!time) return "";
  // time comes back as "HH:MM:SS" — keep HH:MM.
  return time.slice(0, 5);
}

const EMPTY_ACTIVITY = {
  title: "",
  category: "activity",
  start_time: "",
  end_time: "",
  estimated_cost: "",
  description: "",
};

function AddActivityForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY_ACTIVITY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        title: form.title.trim(),
        category: form.category,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        estimated_cost: form.estimated_cost
          ? parseInt(form.estimated_cost, 10)
          : 0,
        description: form.description.trim() || null,
      });
      onCancel();
    } catch (err) {
      setError(err.message || "Failed to add activity.");
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-kiiya-primary focus:ring-2 focus:ring-kiiya-primary/20";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-3 rounded-xl border border-purple-100 bg-purple-50/40 p-4"
    >
      <input
        autoFocus
        type="text"
        value={form.title}
        onChange={(e) => setField("title", e.target.value)}
        placeholder="Activity title *"
        className={inputCls}
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={form.category}
          onChange={(e) => setField("category", e.target.value)}
          className={inputCls}
        >
          {ACTIVITY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {getCategory(c).label}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          value={form.estimated_cost}
          onChange={(e) => setField("estimated_cost", e.target.value)}
          placeholder="Est. cost (Rp)"
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-medium text-gray-500">
          Start
          <input
            type="time"
            value={form.start_time}
            onChange={(e) => setField("start_time", e.target.value)}
            className={`${inputCls} mt-1`}
          />
        </label>
        <label className="text-xs font-medium text-gray-500">
          End
          <input
            type="time"
            value={form.end_time}
            onChange={(e) => setField("end_time", e.target.value)}
            className={`${inputCls} mt-1`}
          />
        </label>
      </div>
      <textarea
        rows={2}
        value={form.description}
        onChange={(e) => setField("description", e.target.value)}
        placeholder="Description (optional)"
        className={`${inputCls} resize-none`}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-kiiya-dark transition hover:bg-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-kiiya-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Add
        </button>
      </div>
    </form>
  );
}

function ActivityRow({ activity, onToggle, onDelete }) {
  const cat = getCategory(activity.category);
  const Icon = cat.icon;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 p-3">
      <input
        type="checkbox"
        checked={!!activity.is_completed}
        onChange={(e) => onToggle(activity.id, e.target.checked)}
        className="mt-1 h-4 w-4 flex-shrink-0 accent-kiiya-primary"
      />
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${cat.color}1A`, color: cat.color }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2">
          <p
            className={`font-semibold text-kiiya-dark ${
              activity.is_completed ? "line-through opacity-50" : ""
            }`}
          >
            {activity.title}
          </p>
          {(activity.start_time || activity.end_time) && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              {formatTime(activity.start_time)}
              {activity.end_time ? ` – ${formatTime(activity.end_time)}` : ""}
            </span>
          )}
        </div>
        {activity.description && (
          <p className="mt-0.5 text-sm text-gray-500">{activity.description}</p>
        )}
        {activity.estimated_cost > 0 && (
          <p className="mt-1 text-sm font-medium text-kiiya-warm">
            {formatRupiah(activity.estimated_cost)}
          </p>
        )}
      </div>
      <button
        onClick={() => onDelete(activity.id)}
        aria-label="Delete activity"
        className="flex-shrink-0 rounded-md p-1 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ItineraryTab({
  itineraryDays,
  addDay,
  addActivity,
  toggleActivity,
  deleteActivity,
}) {
  const [openFormDayId, setOpenFormDayId] = useState(null);
  const [addingDay, setAddingDay] = useState(false);

  const handleAddDay = async () => {
    setAddingDay(true);
    try {
      await addDay();
    } catch (err) {
      alert(err.message || "Failed to add day");
    } finally {
      setAddingDay(false);
    }
  };

  return (
    <div className="space-y-4">
      {itineraryDays.length === 0 && (
        <div className="rounded-2xl border border-dashed border-purple-200 bg-white py-12 text-center">
          <span className="text-4xl">🗓️</span>
          <p className="mt-3 font-semibold text-kiiya-dark">No days planned yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Add your first day to start building the itinerary.
          </p>
        </div>
      )}

      {itineraryDays.map((day) => (
        <div
          key={day.id}
          className="rounded-2xl border border-purple-100 bg-white p-5"
        >
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-bold text-kiiya-dark">
              Day {day.day_number}
              {day.date && (
                <span className="ml-2 text-sm font-medium text-gray-400">
                  {formatDateShort(day.date)}
                </span>
              )}
            </h3>
          </div>
          {day.title && (
            <p className="mt-0.5 text-sm font-medium text-kiiya-primary">
              {day.title}
            </p>
          )}

          <div className="mt-4 space-y-2">
            {day.activities.length === 0 && openFormDayId !== day.id && (
              <p className="text-sm text-gray-400">No activities yet.</p>
            )}
            {day.activities.map((activity) => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                onToggle={(id, val) =>
                  toggleActivity(day.id, id, val).catch((e) =>
                    alert(e.message)
                  )
                }
                onDelete={(id) =>
                  deleteActivity(day.id, id).catch((e) => alert(e.message))
                }
              />
            ))}
          </div>

          {openFormDayId === day.id ? (
            <AddActivityForm
              onSubmit={(payload) => addActivity(day.id, payload)}
              onCancel={() => setOpenFormDayId(null)}
            />
          ) : (
            <button
              onClick={() => setOpenFormDayId(day.id)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-kiiya-primary transition hover:opacity-80"
            >
              <Plus className="h-4 w-4" />
              Add Activity
            </button>
          )}
        </div>
      ))}

      <button
        onClick={handleAddDay}
        disabled={addingDay}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-purple-200 bg-white py-4 font-semibold text-kiiya-primary transition hover:border-kiiya-primary/50 hover:bg-purple-50/40 disabled:opacity-60"
      >
        {addingDay ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Plus className="h-5 w-5" />
        )}
        Add Day
      </button>
    </div>
  );
}
