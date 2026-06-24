"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, GripVertical, FolderPlus } from "lucide-react";
import { toast } from "@/components/ui/Toast";

function ChecklistRow({
  item,
  onUpdate,
  onToggle,
  onDelete,
  onEnter,
  registerInput,
  dragHandlers,
}) {
  const [label, setLabel] = useState(item.title || "");
  useEffect(() => setLabel(item.title || ""), [item.title]);

  const save = () => {
    const next = label.trim();
    if (next !== (item.title || "")) onUpdate({ title: next });
  };

  return (
    <div
      className="group flex items-center gap-2 rounded-lg px-1 py-1 transition hover:bg-purple-50/40 dark:hover:bg-[#221F32]/60"
      draggable
      {...dragHandlers}
    >
      <span className="cursor-grab text-gray-300 opacity-0 transition group-hover:opacity-100">
        <GripVertical className="h-4 w-4" />
      </span>
      <input
        type="checkbox"
        checked={!!item.is_completed}
        onChange={(e) => onToggle(e.target.checked)}
        className="h-4 w-4 flex-shrink-0 accent-kiiya-primary"
      />
      <input
        ref={registerInput}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            save();
            onEnter();
          } else if (e.key === "Backspace" && label === "") {
            e.preventDefault();
            onDelete();
          }
        }}
        placeholder="List item…"
        className={`min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-kiiya-dark outline-none dark:text-white transition hover:border-gray-200 focus:border-kiiya-primary ${
          item.is_completed ? "line-through opacity-50" : ""
        }`}
      />
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete item"
        className="flex-shrink-0 rounded p-1 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function Section({
  name,
  items,
  onAdd,
  onUpdateItem,
  onToggleItem,
  onDeleteItem,
  onRenameSection,
  onReorder,
}) {
  const [newTitle, setNewTitle] = useState("");
  const [sectionName, setSectionName] = useState(name);
  const newRef = useRef(null);
  const dragIndex = useRef(null);

  useEffect(() => setSectionName(name), [name]);

  const commitNew = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle("");
    try {
      await onAdd(title);
      newRef.current?.focus();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-5 dark:border-[#2D2A3E] dark:bg-[#1A1825]">
      <input
        value={sectionName}
        onChange={(e) => setSectionName(e.target.value)}
        onBlur={() => {
          const next = sectionName.trim() || "general";
          if (next !== name) onRenameSection(next);
        }}
        className="mb-2 w-full rounded-md border border-transparent bg-transparent px-1 text-sm font-bold uppercase tracking-wide text-gray-400 outline-none transition hover:border-gray-200 focus:border-kiiya-primary"
      />
      <div className="space-y-0.5">
        {items.map((item, idx) => (
          <ChecklistRow
            key={item.id}
            item={item}
            onUpdate={(u) =>
              onUpdateItem(item.id, u).catch((e) => toast.error(e.message))
            }
            onToggle={(val) =>
              onToggleItem(item.id, val).catch((e) => toast.error(e.message))
            }
            onDelete={() =>
              onDeleteItem(item.id).catch((e) => toast.error(e.message))
            }
            onEnter={() => newRef.current?.focus()}
            dragHandlers={{
              onDragStart: () => (dragIndex.current = idx),
              onDragOver: (e) => e.preventDefault(),
              onDrop: () => {
                if (dragIndex.current !== null && dragIndex.current !== idx) {
                  onReorder(dragIndex.current, idx);
                }
                dragIndex.current = null;
              },
            }}
          />
        ))}

        {/* Add item row */}
        <div className="flex items-center gap-2 px-1 py-1">
          <span className="w-4 flex-shrink-0" />
          <Plus className="h-4 w-4 flex-shrink-0 text-gray-300" />
          <input
            ref={newRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitNew();
              } else if (e.key === "Escape") {
                setNewTitle("");
              }
            }}
            onBlur={commitNew}
            placeholder="Add item…"
            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-gray-500 outline-none transition hover:border-gray-200 focus:border-kiiya-primary"
          />
        </div>
      </div>
    </div>
  );
}

export default function ChecklistTab({
  checklist,
  addChecklistItem,
  updateChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
}) {
  const completed = checklist.filter((c) => c.is_completed).length;
  const total = checklist.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Group by category (section), preserving first-seen order.
  const groups = [];
  const seen = new Map();
  for (const item of checklist) {
    const key = item.category || "general";
    if (!seen.has(key)) {
      seen.set(key, []);
      groups.push([key, seen.get(key)]);
    }
    seen.get(key).push(item);
  }

  const handleReorder = (items, from, to) => {
    const reordered = [...items];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    // Persist new sort_order for the section.
    reordered.forEach((it, i) => {
      if (it.sort_order !== i)
        updateChecklistItem(it.id, { sort_order: i }).catch(() => {});
    });
  };

  const addSection = async () => {
    const name = prompt("Section name (e.g. Packing, Documents)");
    if (!name || !name.trim()) return;
    try {
      await addChecklistItem("", name.trim());
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="rounded-2xl border border-purple-100 bg-white p-5 dark:border-[#2D2A3E] dark:bg-[#1A1825]">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-kiiya-dark dark:text-white">
            {completed} of {total} completed
          </span>
          <span className="font-semibold text-gray-500">{pct}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-[#221F32]">
          <div
            className="h-full rounded-full bg-kiiya-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Empty state */}
      {total === 0 && (
        <div className="rounded-2xl border border-dashed border-purple-200 bg-white py-12 text-center dark:border-[#2D2A3E] dark:bg-[#1A1825]">
          <span className="text-4xl">✅</span>
          <p className="mt-3 font-semibold text-kiiya-dark dark:text-white">
            Your checklist is empty
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Add items below to keep track of what&apos;s left to do.
          </p>
        </div>
      )}

      {/* Sections */}
      {groups.map(([name, items]) => (
        <Section
          key={name}
          name={name}
          items={items}
          onAdd={(title) => addChecklistItem(title, name)}
          onUpdateItem={updateChecklistItem}
          onToggleItem={toggleChecklistItem}
          onDeleteItem={deleteChecklistItem}
          onRenameSection={(next) =>
            items.forEach((it) =>
              updateChecklistItem(it.id, { category: next }).catch(() => {})
            )
          }
          onReorder={(from, to) => handleReorder(items, from, to)}
        />
      ))}

      {/* If no sections yet, still offer a default add row */}
      {groups.length === 0 && (
        <Section
          name="general"
          items={[]}
          onAdd={(title) => addChecklistItem(title, "general")}
          onUpdateItem={updateChecklistItem}
          onToggleItem={toggleChecklistItem}
          onDeleteItem={deleteChecklistItem}
          onRenameSection={() => {}}
          onReorder={() => {}}
        />
      )}

      {/* Add section */}
      <button
        onClick={addSection}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-purple-200 bg-white py-3 dark:border-[#2D2A3E] dark:bg-[#1A1825] text-sm font-semibold text-kiiya-primary transition hover:border-kiiya-primary/50 hover:bg-purple-50/40 dark:hover:bg-[#221F32]/60"
      >
        <FolderPlus className="h-4 w-4" />
        Add Section
      </button>
    </div>
  );
}
