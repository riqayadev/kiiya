"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Star, Pencil, Trash2, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useAuth } from "@/hooks/useAuth";
import { useEvents } from "@/hooks/useEvents";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/utils/i18n";
import { getEventColor } from "@/utils/eventColors";
import { toast } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";
import WishModal from "@/components/ui/WishModal";
import NewEventModal from "@/components/ui/NewEventModal";

const PRIORITY = {
  1: { emoji: "🔴", key: "wishlist.priorityHigh", badge: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300" },
  2: { emoji: "🟡", key: "wishlist.priorityMedium", badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  3: { emoji: "🟢", key: "wishlist.priorityLow", badge: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300" },
};

function Thumb({ wish }) {
  const colors = getEventColor(wish.type);
  if (wish.cover_image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={wish.cover_image_url} alt={wish.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
    );
  }
  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br text-5xl ${colors.gradient}`}>
      {wish.cover_emoji || colors.icon}
    </div>
  );
}

export default function WishlistPage() {
  useLang();
  const router = useRouter();
  const { user } = useAuth();
  const { createEvent } = useEvents();

  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWish, setEditingWish] = useState(null);
  const [converting, setConverting] = useState(null);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("wishes")
        .select("*")
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) toast.error(error.message);
      setWishes(data || []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  const filtered = useMemo(() => {
    if (filter === "all") return wishes;
    if (filter === "converted") return wishes.filter((w) => w.converted_event_id);
    return wishes.filter((w) => w.priority === filter);
  }, [wishes, filter]);

  const openAdd = () => {
    setEditingWish(null);
    setModalOpen(true);
  };
  const openEdit = (wish) => {
    setEditingWish(wish);
    setModalOpen(true);
  };

  const saveWish = async (payload) => {
    if (editingWish) {
      const { data, error } = await supabase
        .from("wishes")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingWish.id)
        .select()
        .single();
      if (error) throw error;
      setWishes((prev) => prev.map((w) => (w.id === data.id ? data : w)));
      toast.success("Wish updated!");
    } else {
      const { data, error } = await supabase
        .from("wishes")
        .insert([{ ...payload, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      setWishes((prev) => [data, ...prev]);
      toast.success("Wish added!");
    }
  };

  const deleteWish = async (id) => {
    setConfirmId(null);
    const prev = wishes;
    setWishes((p) => p.filter((w) => w.id !== id));
    const { error } = await supabase.from("wishes").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      setWishes(prev);
    }
  };

  const startConvert = (wish) => {
    setConverting(wish);
    setShowNewEvent(true);
  };

  const convertValues = useMemo(
    () =>
      converting
        ? {
            title: converting.title,
            type: converting.type || "",
            coverEmoji: converting.cover_emoji || "✨",
          }
        : undefined,
    [converting]
  );

  const onEventCreated = async (newEvent) => {
    if (converting) {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("wishes")
        .update({ converted_event_id: newEvent.id, converted_at: nowIso, updated_at: nowIso })
        .eq("id", converting.id)
        .select()
        .single();
      if (!error && data) {
        setWishes((prev) => prev.map((w) => (w.id === data.id ? data : w)));
        toast.success("Wish converted to event!");
      }
      setConverting(null);
    }
  };

  const FILTERS = [
    { key: "all", label: t("wishlist.filterAll") },
    { key: 1, label: t("wishlist.priorityHigh") },
    { key: 2, label: t("wishlist.priorityMedium") },
    { key: 3, label: t("wishlist.priorityLow") },
    { key: "converted", label: t("wishlist.filterConverted") },
  ];

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kiiya-dark dark:text-white">
            {t("wishlist.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-[#A89EC9]">
            {t("wishlist.subtitle")}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-kiiya-primary px-5 py-3 font-semibold text-white shadow-primary transition hover:bg-[#6B5EE4]"
        >
          <Plus className="h-5 w-5" />
          {t("wishlist.addWish")}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={String(f.key)}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                active
                  ? "bg-kiiya-primary text-white"
                  : "border border-purple-100 bg-white text-kiiya-dark/70 hover:border-kiiya-primary/40 dark:border-[#2D2A3E] dark:bg-[#1A1825] dark:text-[#A89EC9]"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 text-5xl">⭐</div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {t("wishlist.emptyTitle")}
          </h3>
          <p className="mx-auto mt-1 max-w-xs text-sm text-gray-400 dark:text-gray-500">
            {t("wishlist.emptySubtitle")}
          </p>
          <button
            onClick={openAdd}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-kiiya-primary px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            <Plus className="h-5 w-5" />
            {t("wishlist.addWish")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((wish) => {
            const prio = PRIORITY[wish.priority] || PRIORITY[2];
            const planned = !!wish.converted_event_id;
            return (
              <div
                key={wish.id}
                className="group relative overflow-hidden rounded-2xl border border-purple-100 bg-white transition hover:shadow-card-hover dark:border-[#2D2A3E] dark:bg-[#1A1825]"
              >
                {/* Cover */}
                <div className="relative h-32">
                  <Thumb wish={wish} />
                  {planned && (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-green-500 px-2.5 py-1 text-xs font-semibold text-white shadow">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t("wishlist.planned")}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${prio.badge}`}>
                      {prio.emoji} {t(prio.key)}
                    </span>
                  </div>
                  <h3 className="mt-2 truncate text-base font-semibold text-kiiya-dark dark:text-white">
                    {wish.title}
                  </h3>
                  {wish.type && (
                    <p className="truncate text-xs text-gray-400 dark:text-gray-500">{wish.type}</p>
                  )}
                  {wish.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-[#A89EC9]">
                      {wish.description}
                    </p>
                  )}

                  {/* Actions */}
                  {confirmId === wish.id ? (
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-2 dark:bg-red-500/10">
                      <span className="flex-1 text-xs font-medium text-red-600 dark:text-red-400">
                        {t("wishlist.deleteConfirm")}
                      </span>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 transition hover:bg-white dark:border-[#2D2A3E] dark:text-[#A89EC9]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => deleteWish(wish.id)}
                        className="rounded-lg bg-red-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => openEdit(wish)}
                        aria-label={t("eventDetail.edit")}
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-purple-100 text-kiiya-dark/70 transition hover:border-kiiya-primary/40 dark:border-[#2D2A3E] dark:text-[#A89EC9]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {planned ? (
                        <button
                          onClick={() => router.push(`/dashboard/events/${wish.converted_event_id}`)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-purple-100 px-3 py-2 text-sm font-semibold text-kiiya-primary transition hover:bg-purple-50 dark:border-[#2D2A3E] dark:hover:bg-[#221F32]"
                        >
                          {t("wishlist.viewEvent")} <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => startConvert(wish)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-kiiya-primary px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                          {t("wishlist.convert")}
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmId(wish.id)}
                        aria-label="Delete"
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-purple-100 text-red-400 transition hover:border-red-300 hover:bg-red-50 dark:border-[#2D2A3E] dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit wish modal */}
      <WishModal
        isOpen={modalOpen}
        wish={editingWish}
        onClose={() => setModalOpen(false)}
        onSave={saveWish}
      />

      {/* Convert → new event */}
      <NewEventModal
        isOpen={showNewEvent}
        initialValues={convertValues}
        onClose={() => {
          setShowNewEvent(false);
          setConverting(null);
        }}
        onSuccess={onEventCreated}
        createEvent={createEvent}
      />
    </>
  );
}
