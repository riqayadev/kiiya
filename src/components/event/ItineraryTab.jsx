"use client";
import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Loader2,
  Trash2,
  GripVertical,
  ChevronDown,
} from "lucide-react";
import { getCategory, ACTIVITY_CATEGORIES } from "@/utils/categories";
import { formatRupiah, formatDateShort } from "@/utils/format";

function timeValue(time) {
  // DB returns "HH:MM:SS"; <input type=time> wants "HH:MM".
  return time ? time.slice(0, 5) : "";
}

// Small dropdown to pick an activity category by icon.
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
        <div className="absolute left-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
          {ACTIVITY_CATEGORIES.map((c) => {
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
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-kiiya-dark transition hover:bg-purple-50"
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

function ActivityRow({
  activity,
  onUpdate,
  onToggle,
  onDelete,
  onEnter,
  registerInput,
}) {
  const [title, setTitle] = useState(activity.title || "");
  const [cost, setCost] = useState(
    activity.estimated_cost ? String(activity.estimated_cost) : ""
  );
  const [expanded, setExpanded] = useState(false);

  useEffect(() => setTitle(activity.title || ""), [activity.title]);

  const saveTitle = () => {
    const next = title.trim();
    if (next !== (activity.title || "")) onUpdate({ title: next });
  };
  const saveCost = () => {
    const next = cost ? parseInt(cost, 10) : 0;
    if (next !== (activity.estimated_cost || 0))
      onUpdate({ estimated_cost: next });
  };

  return (
    <div className="group rounded-lg transition hover:bg-purple-50/40">
      <div className="flex items-center gap-2 px-1 py-1.5">
        {/* Drag handle (visual affordance) */}
        <span className="cursor-grab text-gray-300 opacity-0 transition group-hover:opacity-100">
          <GripVertical className="h-4 w-4" />
        </span>

        {/* Time */}
        <input
          type="time"
          value={timeValue(activity.start_time)}
          onChange={(e) =>
            onUpdate({ start_time: e.target.value || null })
          }
          className="w-[68px] flex-shrink-0 rounded-md border border-transparent bg-transparent px-1 py-1 text-xs text-gray-500 outline-none transition hover:border-gray-200 focus:border-kiiya-primary"
        />

        {/* Category */}
        <CategoryPicker
          value={activity.category}
          onChange={(c) => onUpdate({ category: c })}
        />

        {/* Title */}
        <input
          ref={registerInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              saveTitle();
              onEnter();
            } else if (e.key === "Backspace" && title === "") {
              e.preventDefault();
              onDelete();
            }
          }}
          placeholder="Activity…"
          className={`min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-kiiya-dark outline-none transition hover:border-gray-200 focus:border-kiiya-primary ${
            activity.is_completed ? "line-through opacity-50" : ""
          }`}
        />

        {/* Cost */}
        <input
          type="number"
          min="0"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          onBlur={saveCost}
          placeholder="Rp"
          className="w-20 flex-shrink-0 rounded-md border border-transparent bg-transparent px-1 py-1 text-right text-xs text-kiiya-warm outline-none transition hover:border-gray-200 focus:border-kiiya-primary"
        />

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded((x) => !x)}
          aria-label="Details"
          className={`flex-shrink-0 rounded p-1 text-gray-300 transition hover:text-kiiya-dark ${
            expanded ? "rotate-180" : ""
          }`}
        >
          <ChevronDown className="h-4 w-4" />
        </button>

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={!!activity.is_completed}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4 flex-shrink-0 accent-kiiya-primary"
        />

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete activity"
          className="flex-shrink-0 rounded p-1 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Expanded detail editor */}
      {expanded && (
        <div className="space-y-2 px-9 pb-2">
          <input
            defaultValue={activity.location || ""}
            onBlur={(e) =>
              onUpdate({ location: e.target.value.trim() || null })
            }
            placeholder="Location"
            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-kiiya-primary"
          />
          <textarea
            rows={2}
            defaultValue={activity.description || ""}
            onBlur={(e) =>
              onUpdate({ description: e.target.value.trim() || null })
            }
            placeholder="Description"
            className="w-full resize-none rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-kiiya-primary"
          />
        </div>
      )}
    </div>
  );
}

function DayCard({
  day,
  onAddActivity,
  onUpdateActivity,
  onToggleActivity,
  onDeleteActivity,
  onUpdateDay,
  onDeleteDay,
}) {
  const [dayTitle, setDayTitle] = useState(day.title || "");
  const newInputRef = useRef(null);
  const [newTitle, setNewTitle] = useState("");
  const rowRefs = useRef({});

  useEffect(() => setDayTitle(day.title || ""), [day.title]);

  const commitNew = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle("");
    try {
      await onAddActivity({ title, category: "activity" });
      newInputRef.current?.focus();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="group/day rounded-2xl border border-purple-100 bg-white p-5">
      {/* Day header */}
      <div className="flex items-center gap-2">
        <h3 className="flex-shrink-0 text-lg font-bold text-kiiya-dark">
          Day {day.day_number}
        </h3>
        {day.date && (
          <span className="flex-shrink-0 text-sm font-medium text-gray-400">
            {formatDateShort(day.date)}
          </span>
        )}
        <input
          value={dayTitle}
          onChange={(e) => setDayTitle(e.target.value)}
          onBlur={() => {
            if (dayTitle.trim() !== (day.title || ""))
              onUpdateDay({ title: dayTitle.trim() || null });
          }}
          placeholder="Day title…"
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-kiiya-primary outline-none transition hover:border-gray-200 focus:border-kiiya-primary"
        />
        <button
          type="button"
          onClick={() => {
            if (confirm(`Delete Day ${day.day_number}?`)) onDeleteDay();
          }}
          aria-label="Delete day"
          className="flex-shrink-0 rounded p-1 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover/day:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Activities */}
      <div className="mt-3 space-y-0.5">
        {day.activities.map((activity) => (
          <ActivityRow
            key={activity.id}
            activity={activity}
            registerInput={(el) => (rowRefs.current[activity.id] = el)}
            onUpdate={(updates) =>
              onUpdateActivity(activity.id, updates).catch((e) =>
                alert(e.message)
              )
            }
            onToggle={(val) =>
              onToggleActivity(activity.id, val).catch((e) => alert(e.message))
            }
            onDelete={() =>
              onDeleteActivity(activity.id).catch((e) => alert(e.message))
            }
            onEnter={() => newInputRef.current?.focus()}
          />
        ))}

        {/* Add activity row */}
        <div className="flex items-center gap-2 px-1 py-1.5">
          <span className="w-4 flex-shrink-0" />
          <Plus className="h-4 w-4 flex-shrink-0 text-gray-300" />
          <input
            ref={newInputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitNew();
              }
            }}
            onBlur={commitNew}
            placeholder="Add activity…"
            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-gray-500 outline-none transition hover:border-gray-200 focus:border-kiiya-primary"
          />
        </div>
      </div>
    </div>
  );
}

export default function ItineraryTab({
  itineraryDays,
  addDay,
  addActivity,
  updateActivity,
  toggleActivity,
  deleteActivity,
  updateDay,
  deleteDay,
}) {
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
          <p className="mt-3 font-semibold text-kiiya-dark">
            No days planned yet
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Add your first day to start building the itinerary.
          </p>
        </div>
      )}

      {itineraryDays.map((day) => (
        <DayCard
          key={day.id}
          day={day}
          onAddActivity={(payload) => addActivity(day.id, payload)}
          onUpdateActivity={(id, updates) => updateActivity(day.id, id, updates)}
          onToggleActivity={(id, val) => toggleActivity(day.id, id, val)}
          onDeleteActivity={(id) => deleteActivity(day.id, id)}
          onUpdateDay={(updates) => updateDay(day.id, updates)}
          onDeleteDay={() =>
            deleteDay(day.id).catch((e) => alert(e.message))
          }
        />
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
