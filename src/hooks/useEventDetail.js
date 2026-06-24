"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/Toast";
import {
  checkBudgetAchievement,
  checkItineraryAchievement,
  checkChecklistAchievement,
} from "@/utils/achievements";

/**
 * Loads everything needed by the Event Detail page and exposes the CRUD
 * helpers used by the Itinerary / Budget / Checklist tabs.
 *
 * Follows the same shape as useEvents: a stable client ref + useState +
 * useEffect with loading / error states.
 */
export function useEventDetail(eventId) {
  const [event, setEvent] = useState(null);
  const [itineraryDays, setItineraryDays] = useState([]); // each day has .activities[]
  const [expenses, setExpenses] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stable client across renders so callbacks don't need it in their deps.
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }
  const supabase = supabaseRef.current;

  // ── Fetchers ────────────────────────────────────────────────
  const fetchEvent = useCallback(
    async (id) => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    [supabase]
  );

  const fetchItinerary = useCallback(
    async (id) => {
      const { data: days, error: daysErr } = await supabase
        .from("itinerary_days")
        .select("*")
        .eq("event_id", id)
        .order("day_number", { ascending: true });
      if (daysErr) throw daysErr;

      const { data: activities, error: actErr } = await supabase
        .from("itinerary_activities")
        .select("*")
        .eq("event_id", id)
        .order("start_time", { ascending: true, nullsFirst: true })
        .order("sort_order", { ascending: true });
      if (actErr) throw actErr;

      // Nest activities under their day.
      return (days || []).map((day) => ({
        ...day,
        activities: (activities || []).filter((a) => a.day_id === day.id),
      }));
    },
    [supabase]
  );

  const fetchExpenses = useCallback(
    async (id) => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("event_id", id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    [supabase]
  );

  const fetchChecklist = useCallback(
    async (id) => {
      const { data, error } = await supabase
        .from("checklists")
        .select("*")
        .eq("event_id", id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    [supabase]
  );

  const fetchMembers = useCallback(
    async (id) => {
      const { data, error } = await supabase
        .from("event_members")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    [supabase]
  );

  const loadAll = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const [ev, days, exp, chk, mem] = await Promise.all([
        fetchEvent(eventId),
        fetchItinerary(eventId),
        fetchExpenses(eventId),
        fetchChecklist(eventId),
        fetchMembers(eventId),
      ]);
      setEvent(ev);
      setItineraryDays(days);
      setExpenses(exp);
      setChecklist(chk);
      setMembers(mem);
    } catch (err) {
      setError(err.message || "Failed to load event");
    } finally {
      setLoading(false);
    }
  }, [
    eventId,
    fetchEvent,
    fetchItinerary,
    fetchExpenses,
    fetchChecklist,
    fetchMembers,
  ]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Derived ─────────────────────────────────────────────────
  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses]
  );

  // ── Event mutation ──────────────────────────────────────────
  const updateEvent = useCallback(
    async (updates) => {
      const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", eventId)
        .select()
        .single();
      if (error) throw error;
      setEvent(data);
      return data;
    },
    [supabase, eventId]
  );

  // ── Itinerary mutations ─────────────────────────────────────
  const addDay = useCallback(async () => {
    const maxDay = itineraryDays.reduce(
      (max, d) => Math.max(max, d.day_number),
      0
    );
    // Date defaults to start_date + N days when the event has a start.
    let date = null;
    if (event?.start_date) {
      const d = new Date(event.start_date);
      d.setDate(d.getDate() + maxDay);
      date = d.toISOString().slice(0, 10);
    }
    const { data, error } = await supabase
      .from("itinerary_days")
      .insert([{ event_id: eventId, day_number: maxDay + 1, date }])
      .select()
      .single();
    if (error) throw error;
    setItineraryDays((prev) => [...prev, { ...data, activities: [] }]);
    toast.success("Day added!");
  }, [supabase, eventId, itineraryDays, event]);

  const addActivity = useCallback(
    async (dayId, payload) => {
      const { data, error } = await supabase
        .from("itinerary_activities")
        .insert([{ ...payload, day_id: dayId, event_id: eventId }])
        .select()
        .single();
      if (error) throw error;
      let total = 0;
      setItineraryDays((prev) => {
        const next = prev.map((d) =>
          d.id === dayId ? { ...d, activities: [...d.activities, data] } : d
        );
        total = next.reduce((s, d) => s + d.activities.length, 0);
        return next;
      });
      // "Planner Pro" — 5+ activities in the itinerary.
      checkItineraryAchievement(total);
      return data;
    },
    [supabase, eventId]
  );

  // Generic field patch for an activity (title, time, cost, category, etc.).
  const updateActivity = useCallback(
    async (dayId, activityId, updates) => {
      setItineraryDays((prev) =>
        prev.map((d) =>
          d.id === dayId
            ? {
                ...d,
                activities: d.activities.map((a) =>
                  a.id === activityId ? { ...a, ...updates } : a
                ),
              }
            : d
        )
      );
      const { error } = await supabase
        .from("itinerary_activities")
        .update(updates)
        .eq("id", activityId);
      if (error) throw error;
    },
    [supabase]
  );

  const updateDay = useCallback(
    async (dayId, updates) => {
      setItineraryDays((prev) =>
        prev.map((d) => (d.id === dayId ? { ...d, ...updates } : d))
      );
      const { error } = await supabase
        .from("itinerary_days")
        .update(updates)
        .eq("id", dayId);
      if (error) throw error;
    },
    [supabase]
  );

  const deleteDay = useCallback(
    async (dayId) => {
      const { error } = await supabase
        .from("itinerary_days")
        .delete()
        .eq("id", dayId);
      if (error) throw error;
      setItineraryDays((prev) => prev.filter((d) => d.id !== dayId));
      toast.success("Day deleted.");
    },
    [supabase]
  );

  const toggleActivity = useCallback(
    async (dayId, activityId, isCompleted) => {
      // Optimistic update.
      setItineraryDays((prev) =>
        prev.map((d) =>
          d.id === dayId
            ? {
                ...d,
                activities: d.activities.map((a) =>
                  a.id === activityId ? { ...a, is_completed: isCompleted } : a
                ),
              }
            : d
        )
      );
      const { error } = await supabase
        .from("itinerary_activities")
        .update({ is_completed: isCompleted })
        .eq("id", activityId);
      if (error) {
        // Roll back on failure.
        setItineraryDays((prev) =>
          prev.map((d) =>
            d.id === dayId
              ? {
                  ...d,
                  activities: d.activities.map((a) =>
                    a.id === activityId
                      ? { ...a, is_completed: !isCompleted }
                      : a
                  ),
                }
              : d
          )
        );
        throw error;
      }
    },
    [supabase]
  );

  const deleteActivity = useCallback(
    async (dayId, activityId) => {
      const { error } = await supabase
        .from("itinerary_activities")
        .delete()
        .eq("id", activityId);
      if (error) throw error;
      setItineraryDays((prev) =>
        prev.map((d) =>
          d.id === dayId
            ? { ...d, activities: d.activities.filter((a) => a.id !== activityId) }
            : d
        )
      );
    },
    [supabase]
  );

  // ── Expense mutations ───────────────────────────────────────
  const addExpense = useCallback(
    async (payload) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("expenses")
        .insert([{ ...payload, event_id: eventId, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      // Keep sorted by date desc.
      setExpenses((prev) =>
        [data, ...prev].sort((a, b) => (a.date < b.date ? 1 : -1))
      );
      toast.success("Expense added!");
      checkBudgetAchievement(); // "Budget Hero"
      return data;
    },
    [supabase, eventId]
  );

  const updateExpense = useCallback(
    async (id, updates) => {
      setExpenses((prev) =>
        prev
          .map((e) => (e.id === id ? { ...e, ...updates } : e))
          .sort((a, b) => (a.date < b.date ? 1 : -1))
      );
      const { error } = await supabase
        .from("expenses")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    [supabase]
  );

  const deleteExpense = useCallback(
    async (id) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success("Expense removed.");
    },
    [supabase]
  );

  // ── Checklist mutations ─────────────────────────────────────
  const addChecklistItem = useCallback(
    async (title, category) => {
      const sortOrder = checklist.length;
      const { data, error } = await supabase
        .from("checklists")
        .insert([
          {
            event_id: eventId,
            title: title ?? "",
            category: category || "general",
            sort_order: sortOrder,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      setChecklist((prev) => [...prev, data]);
      return data;
    },
    [supabase, eventId, checklist.length]
  );

  const updateChecklistItem = useCallback(
    async (id, updates) => {
      setChecklist((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
      const { error } = await supabase
        .from("checklists")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    [supabase]
  );

  const toggleChecklistItem = useCallback(
    async (id, isCompleted) => {
      // Optimistic update.
      setChecklist((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_completed: isCompleted } : c))
      );
      const { error } = await supabase
        .from("checklists")
        .update({ is_completed: isCompleted })
        .eq("id", id);
      if (error) {
        setChecklist((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, is_completed: !isCompleted } : c
          )
        );
        throw error;
      }
      // "Check Master" — every item complete (use the optimistic next state).
      setChecklist((prev) => {
        checkChecklistAchievement(prev);
        return prev;
      });
    },
    [supabase]
  );

  const deleteChecklistItem = useCallback(
    async (id) => {
      const { error } = await supabase.from("checklists").delete().eq("id", id);
      if (error) throw error;
      setChecklist((prev) => prev.filter((c) => c.id !== id));
    },
    [supabase]
  );

  // ── Member mutations ────────────────────────────────────────
  const addMember = useCallback(
    async (email, role) => {
      const { data, error } = await supabase
        .from("event_members")
        .insert([
          {
            event_id: eventId,
            email: email.trim(),
            role: role || "viewer",
            status: "pending",
          },
        ])
        .select()
        .single();
      if (error) throw error;
      setMembers((prev) => [...prev, data]);
      toast.success("Invitation added.");
      return data;
    },
    [supabase, eventId]
  );

  const removeMember = useCallback(
    async (id) => {
      const { error } = await supabase
        .from("event_members")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast.success("Member removed.");
    },
    [supabase]
  );

  return {
    event,
    itineraryDays,
    expenses,
    checklist,
    members,
    loading,
    error,
    totalSpent,
    refetch: loadAll,
    // explicit fetchers (per spec)
    fetchEvent,
    fetchItinerary,
    fetchExpenses,
    fetchChecklist,
    fetchMembers,
    // event
    updateEvent,
    // itinerary
    addDay,
    addActivity,
    updateActivity,
    toggleActivity,
    deleteActivity,
    updateDay,
    deleteDay,
    // expenses
    addExpense,
    updateExpense,
    deleteExpense,
    // checklist
    addChecklistItem,
    updateChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    // members
    addMember,
    removeMember,
  };
}
