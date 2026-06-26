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
import { t } from "@/utils/i18n";
import { toast } from "@/components/ui/Toast";

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
        <div className="absolute left-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg dark:border-[#2D2A3E] dark:bg-[#1A1825]">
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
    <div className="group rounded-2xl border-l-2 border-transparent bg-[#FAFAF8] transition hover:border-[#7C6EF5] dark:bg-[#252235]">
      <div className="flex items-center gap-2 px-3 py-2">
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
          placeholder={t("placeholders.activityTitle")}
          className={`min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-kiiya-dark outline-none dark:text-white transition hover:border-gray-200 focus:border-kiiya-primary ${
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
          className={`flex-shrink-0 rounded p-1 text-gray-300 transition hover:text-kiiya-dark dark:hover:text-white ${
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
        <div className="space-y-2 px-3 pb-3">
          <input
            defaultValue={activity.location || ""}
            onBlur={(e) =>
              onUpdate({ location: e.target.value.trim() || null })
            }
            placeholder="Location"
            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-kiiya-primary dark:border-[#2D2A3E] dark:bg-[#221F32] dark:text-white dark:placeholder:text-[#6B6480]"
          />
          <textarea
            rows={2}
            defaultValue={activity.description || ""}
            onBlur={(e) =>
              onUpdate({ description: e.target.value.trim() || null })
            }
            placeholder="Description"
            className="w-full resize-none rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-kiiya-primary dark:border-[#2D2A3E] dark:bg-[#221F32] dark:text-white dark:placeholder:text-[#6B6480]"
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
      toast.error(e.message);
    }
  };

  return (
    <div className="group/day rounded-3xl bg-white p-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:bg-[#1A1725]">
      {/* Day header */}
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-kiiya-primary text-sm font-bold text-white">
          {day.day_number}
        </span>
        <div className="flex-shrink-0">
          <h3 className="font-jakarta text-lg font-bold leading-tight text-kiiya-dark dark:text-white">
            Day {day.day_number}
          </h3>
          {day.date && (
            <span className="text-xs font-medium text-gray-400">
              {formatDateShort(day.date)}
            </span>
          )}
        </div>
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

      {/* Activities — vertical timeline */}
      <div className="ml-4 mt-4 space-y-3 border-l-2 border-[#7C6EF5]/20 pl-6">
        {day.activities.map((activity) => (
          <ActivityRow
            key={activity.id}
            activity={activity}
            registerInput={(el) => (rowRefs.current[activity.id] = el)}
            onUpdate={(updates) =>
              onUpdateActivity(activity.id, updates).catch((e) =>
                toast.error(e.message)
              )
            }
            onToggle={(val) =>
              onToggleActivity(activity.id, val).catch((e) => toast.error(e.message))
            }
            onDelete={() =>
              onDeleteActivity(activity.id).catch((e) => toast.error(e.message))
            }
            onEnter={() => newInputRef.current?.focus()}
          />
        ))}

        {/* Add activity row — dashed */}
        <div className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-[#7C6EF5]/30 px-3 py-2.5 transition focus-within:border-[#7C6EF5]/60 hover:border-[#7C6EF5]/60 hover:bg-[#7C6EF5]/5">
          <Plus className="h-4 w-4 flex-shrink-0 text-kiiya-primary" />
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
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-kiiya-primary outline-none placeholder:text-kiiya-primary/60"
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
      toast.error(err.message || "Failed to add day");
    } finally {
      setAddingDay(false);
    }
  };

  return (
    <div className="space-y-4">
      {itineraryDays.length === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-[#7C6EF5]/30 bg-white py-12 text-center shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:bg-[#1A1725]">
          <span className="text-5xl">🗓️</span>
          <p className="mt-3 font-jakarta font-bold text-kiiya-dark dark:text-white">
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
            deleteDay(day.id).catch((e) => toast.error(e.message))
          }
        />
      ))}

      <button
        onClick={handleAddDay}
        disabled={addingDay}
        className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-[#7C6EF5]/30 py-4 font-jakarta font-semibold text-kiiya-primary transition hover:border-[#7C6EF5]/60 hover:bg-[#7C6EF5]/5 disabled:opacity-60"
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
