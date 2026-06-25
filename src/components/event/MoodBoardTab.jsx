"use client";
import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Palette, Link2, StickyNote, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { t } from "@/utils/i18n";
import { toast } from "@/components/ui/Toast";
import UnsplashModal from "@/components/ui/UnsplashModal";

export default function MoodBoardTab({ eventId, eventType }) {
  useLang();
  const { user } = useAuth();
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUnsplash, setShowUnsplash] = useState(false);
  const [adding, setAdding] = useState(null); // null | 'color' | 'link' | 'note'
  const [confirmId, setConfirmId] = useState(null);
  const dragIndex = useRef(null);

  // Inline-form drafts
  const [colorDraft, setColorDraft] = useState({ hex: "#7C6EF5", label: "" });
  const [linkDraft, setLinkDraft] = useState({ url: "", label: "" });
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("mood_board_items")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (!active) return;
      if (error) toast.error(error.message);
      setItems(data || []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase, eventId]);

  const addItem = async (payload) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("mood_board_items")
      .insert([
        {
          ...payload,
          event_id: eventId,
          user_id: user.id,
          sort_order: items.length,
        },
      ])
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((prev) => [...prev, data]);
  };

  const deleteItem = async (id) => {
    setConfirmId(null);
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id)); // optimistic
    const { error } = await supabase.from("mood_board_items").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      setItems(prev); // rollback
    }
  };

  // ── Drag reorder ──
  const onDrop = async (toIdx) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === toIdx) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(toIdx, 0, moved);
    setItems(next);
    // Persist new order for affected rows.
    await Promise.all(
      next.map((it, i) =>
        it.sort_order === i
          ? null
          : supabase.from("mood_board_items").update({ sort_order: i }).eq("id", it.id)
      )
    );
  };

  // ── Add-form handlers ──
  const saveColor = () => {
    addItem({ type: "color", content: colorDraft.hex, label: colorDraft.label.trim() || null, source: "manual" });
    setColorDraft({ hex: "#7C6EF5", label: "" });
    setAdding(null);
  };
  const saveLink = () => {
    const url = linkDraft.url.trim();
    if (!url) return;
    // Only accept http(s). Anything with a different explicit scheme
    // (javascript:, data:, vbscript:, …) is rejected so it can never be
    // rendered into an <a href> that executes script.
    const scheme = url.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
    if (scheme && scheme !== "http" && scheme !== "https") {
      toast.error("Only http(s) links are allowed.");
      return;
    }
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    addItem({ type: "link", content: href, label: linkDraft.label.trim() || null, source: "url" });
    setLinkDraft({ url: "", label: "" });
    setAdding(null);
  };
  const saveNote = () => {
    const text = noteDraft.trim();
    if (!text) return;
    addItem({ type: "note", content: text, source: "manual" });
    setNoteDraft("");
    setAdding(null);
  };

  const toolbarBtn =
    "inline-flex items-center gap-1.5 rounded-full border border-purple-100 bg-white px-3 py-1.5 text-sm font-semibold text-kiiya-dark/70 transition hover:border-kiiya-primary/50 hover:text-kiiya-primary dark:border-[#2D2A3E] dark:bg-[#1A1825] dark:text-[#A89EC9]";
  const fieldCls =
    "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-kiiya-primary dark:border-[#2D2A3E] dark:bg-[#221F32] dark:text-white dark:placeholder:text-[#6B6480]";

  // Wrapper for any item: drag + hover delete + inline confirm.
  const ItemShell = ({ item, index, children, padded }) => (
    <div
      draggable
      onDragStart={() => (dragIndex.current = index)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(index)}
      className={`group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl border border-purple-100 dark:border-[#2D2A3E] ${
        padded ? "bg-white dark:bg-[#1A1825]" : ""
      }`}
    >
      {children}
      {/* Delete button */}
      <button
        onClick={() => setConfirmId(item.id)}
        aria-label="Delete item"
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur transition hover:bg-red-500 group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
      {/* Inline confirm */}
      {confirmId === item.id && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/60 p-3 text-center backdrop-blur-sm">
          <p className="text-sm font-medium text-white">{t("moodboard.deleteConfirm")}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmId(null)}
              className="rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteItem(item.id)}
              className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button className={toolbarBtn} onClick={() => setShowUnsplash(true)}>
          <ImageIcon className="h-4 w-4" /> {t("moodboard.addPhoto")}
        </button>
        <button className={toolbarBtn} onClick={() => setAdding(adding === "color" ? null : "color")}>
          <Palette className="h-4 w-4" /> {t("moodboard.addColor")}
        </button>
        <button className={toolbarBtn} onClick={() => setAdding(adding === "link" ? null : "link")}>
          <Link2 className="h-4 w-4" /> {t("moodboard.addLink")}
        </button>
        <button className={toolbarBtn} onClick={() => setAdding(adding === "note" ? null : "note")}>
          <StickyNote className="h-4 w-4" /> {t("moodboard.addNote")}
        </button>
      </div>

      {/* Inline add forms */}
      {adding === "color" && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-purple-100 bg-white p-4 dark:border-[#2D2A3E] dark:bg-[#1A1825]">
          <input
            type="color"
            value={colorDraft.hex}
            onChange={(e) => setColorDraft((d) => ({ ...d, hex: e.target.value }))}
            className="h-10 w-14 cursor-pointer rounded-lg border border-gray-200 bg-transparent dark:border-[#2D2A3E]"
          />
          <input
            value={colorDraft.label}
            onChange={(e) => setColorDraft((d) => ({ ...d, label: e.target.value }))}
            placeholder="Label (optional)"
            className={`flex-1 ${fieldCls}`}
          />
          <button onClick={saveColor} className="rounded-xl bg-kiiya-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
            Save
          </button>
        </div>
      )}
      {adding === "link" && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-purple-100 bg-white p-4 dark:border-[#2D2A3E] dark:bg-[#1A1825]">
          <input
            value={linkDraft.url}
            onChange={(e) => setLinkDraft((d) => ({ ...d, url: e.target.value }))}
            placeholder="https://…"
            className={`flex-1 ${fieldCls}`}
          />
          <input
            value={linkDraft.label}
            onChange={(e) => setLinkDraft((d) => ({ ...d, label: e.target.value }))}
            placeholder="Label (optional)"
            className={`flex-1 ${fieldCls}`}
          />
          <button onClick={saveLink} className="rounded-xl bg-kiiya-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
            Save
          </button>
        </div>
      )}
      {adding === "note" && (
        <div className="mb-5 rounded-2xl border border-purple-100 bg-white p-4 dark:border-[#2D2A3E] dark:bg-[#1A1825]">
          <textarea
            rows={3}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Write a note…"
            className={`${fieldCls} resize-none`}
          />
          <div className="mt-2 flex justify-end">
            <button onClick={saveNote} className="rounded-xl bg-kiiya-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
              Save
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16 text-kiiya-primary">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 text-5xl">🎨</div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {t("moodboard.emptyTitle")}
          </h3>
          <p className="mx-auto mt-1 max-w-xs text-sm text-gray-400 dark:text-gray-500">
            {t("moodboard.emptySubtitle")}
          </p>
          <button
            onClick={() => setShowUnsplash(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-kiiya-primary px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            + {t("moodboard.emptyCta")}
          </button>
        </div>
      ) : (
        <div className="columns-2 gap-3 md:columns-3">
          {items.map((item, index) => {
            if (item.type === "image") {
              return (
                <ItemShell key={item.id} item={item} index={index}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.content} alt={item.label || "Mood image"} loading="lazy" className="w-full object-cover" />
                  {(item.label || item.unsplash_author) && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      {item.label && <p className="truncate text-xs font-medium text-white">{item.label}</p>}
                      {item.unsplash_author && (
                        <p className="truncate text-[10px] text-white/80">📷 {item.unsplash_author}</p>
                      )}
                    </div>
                  )}
                </ItemShell>
              );
            }
            if (item.type === "color") {
              return (
                <ItemShell key={item.id} item={item} index={index} padded>
                  <div className="w-full" style={{ aspectRatio: "1 / 1", backgroundColor: item.content }} />
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-medium text-kiiya-dark dark:text-white">
                      {item.label || item.content}
                    </p>
                    <p className="text-xs uppercase text-gray-400 dark:text-gray-500">{item.content}</p>
                  </div>
                </ItemShell>
              );
            }
            if (item.type === "link") {
              return (
                <ItemShell key={item.id} item={item} index={index} padded>
                  <a href={item.content} target="_blank" rel="noopener noreferrer" className="block p-4">
                    <div className="flex items-center gap-2 text-kiiya-primary">
                      <Link2 className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate text-sm font-semibold">{item.label || "Link"}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-gray-400 dark:text-gray-500">{item.content}</p>
                  </a>
                </ItemShell>
              );
            }
            // note
            return (
              <ItemShell key={item.id} item={item} index={index}>
                <div className="bg-amber-50 p-4 dark:bg-amber-900/20">
                  <p className="whitespace-pre-wrap text-sm text-amber-900 dark:text-amber-100">
                    {item.content}
                  </p>
                </div>
              </ItemShell>
            );
          })}
        </div>
      )}

      <UnsplashModal
        isOpen={showUnsplash}
        eventType={eventType}
        onClose={() => setShowUnsplash(false)}
        onSelect={(url) => addItem({ type: "image", content: url, source: "unsplash" })}
      />
    </div>
  );
}
