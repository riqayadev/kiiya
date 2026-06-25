"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/Toast";
import { checkEventAchievements } from "@/utils/achievements";
import { logger } from "@/utils/logger";

export function useEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stable client across renders so callbacks don't need it in their deps.
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabaseRef.current
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      logger.error("Failed to fetch events", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (eventData) => {
    const {
      data: { user },
    } = await supabaseRef.current.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabaseRef.current
      .from("events")
      .insert([{ ...eventData, user_id: user.id }])
      .select()
      .single();

    if (error) {
      logger.error("Failed to create event", error);
      throw error;
    }
    const next = [data, ...events];
    setEvents(next);
    toast.success("Event created!");
    checkEventAchievements(next);
    return data;
  };

  const updateEvent = async (id, updates) => {
    const { data, error } = await supabaseRef.current
      .from("events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("Failed to update event", error);
      throw error;
    }
    setEvents((prev) => prev.map((e) => (e.id === id ? data : e)));
    toast.success("Changes saved!");
    return data;
  };

  const deleteEvent = async (id) => {
    const { error } = await supabaseRef.current
      .from("events")
      .delete()
      .eq("id", id);

    if (error) {
      logger.error("Failed to delete event", error);
      throw error;
    }
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success("Event deleted.");
  };

  // ── Computed values (memo-free; cheap derivations over a small array) ──
  const upcomingEvents = events
    .filter((e) => e.status === "upcoming")
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const ongoingEvents = events.filter((e) => e.status === "ongoing");

  const completedEvents = events.filter((e) => e.status === "completed");

  const nextEvent = ongoingEvents[0] || upcomingEvents[0] || null;

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);

  const totalBudget = events.reduce((sum, e) => sum + (e.budget || 0), 0);

  const daysUntil = (event) => {
    if (!event?.start_date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(event.start_date);
    target.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
  };

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    upcomingEvents,
    ongoingEvents,
    completedEvents,
    nextEvent,
    recentEvents,
    totalBudget,
    daysUntil,
  };
}
