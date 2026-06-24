"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

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

    if (error) throw error;
    setEvents((prev) => [data, ...prev]);
    return data;
  };

  const updateEvent = async (id, updates) => {
    const { data, error } = await supabaseRef.current
      .from("events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    setEvents((prev) => prev.map((e) => (e.id === id ? data : e)));
    return data;
  };

  const deleteEvent = async (id) => {
    const { error } = await supabaseRef.current
      .from("events")
      .delete()
      .eq("id", id);

    if (error) throw error;
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
