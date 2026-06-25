-- ============================================================
-- Kiiya — Indexes + RPC functions
-- Run in the Supabase SQL Editor (project: tikssidjxhemwavgbbya).
-- Idempotent: IF NOT EXISTS / CREATE OR REPLACE throughout.
--
-- Postgres auto-indexes primary keys but NOT foreign keys or filter columns,
-- so every column we filter/sort/join on gets an explicit index here.
-- ============================================================

-- ── events ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
-- Composite for the planning tab filters (WHERE user_id = ? AND status = ?).
CREATE INDEX IF NOT EXISTS idx_events_user_status ON events(user_id, status);
-- Composite for wrapped / on-this-day (WHERE user_id = ? AND start_date range).
CREATE INDEX IF NOT EXISTS idx_events_user_start_date ON events(user_id, start_date);

-- ── expenses ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_expenses_event_id ON expenses(event_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
-- Composite for wrapped (WHERE user_id = ? AND date range).
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);

-- ── checklists ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_checklists_event_id ON checklists(event_id);

-- ── itinerary_days ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_itinerary_days_event_id ON itinerary_days(event_id);

-- ── itinerary_activities ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_itinerary_activities_day_id ON itinerary_activities(day_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_activities_event_id ON itinerary_activities(event_id);

-- ── event_members ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_event_members_event_id ON event_members(event_id);
CREATE INDEX IF NOT EXISTS idx_event_members_user_id ON event_members(user_id);

-- ── mood_board_items ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mood_board_items_event_id ON mood_board_items(event_id);
CREATE INDEX IF NOT EXISTS idx_mood_board_items_sort ON mood_board_items(event_id, sort_order);

-- ── wishes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wishes_user_id ON wishes(user_id);
CREATE INDEX IF NOT EXISTS idx_wishes_priority ON wishes(user_id, priority);
-- The list orders by created_at desc within a user.
CREATE INDEX IF NOT EXISTS idx_wishes_user_created ON wishes(user_id, created_at DESC);

-- ── time_capsules ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_time_capsules_event_id ON time_capsules(event_id);
CREATE INDEX IF NOT EXISTS idx_time_capsules_reveal_date ON time_capsules(reveal_date);

-- ── profiles ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);


-- ============================================================
-- RPC: events grouped by month for a given user + year (Annual Wrapped).
-- Replaces fetching every event just to count per-month on the client.
-- SECURITY INVOKER → runs as the caller, so RLS still applies.
-- ============================================================
CREATE OR REPLACE FUNCTION get_events_by_month(p_user_id UUID, p_year INT)
RETURNS TABLE(month INT, count BIGINT)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    EXTRACT(MONTH FROM start_date)::INT AS month,
    COUNT(*) AS count
  FROM events
  WHERE user_id = p_user_id
    AND EXTRACT(YEAR FROM start_date) = p_year
    AND start_date IS NOT NULL
  GROUP BY month
  ORDER BY month;
$$;


-- ============================================================
-- RPC: events whose start OR end date falls on a given month+day in a
-- previous year ("On This Day"). Replaces a broad fetch + client filter.
-- ============================================================
CREATE OR REPLACE FUNCTION get_on_this_day(p_user_id UUID, p_month INT, p_day INT)
RETURNS TABLE(
  id UUID, title TEXT, type TEXT, cover_emoji TEXT,
  cover_image_url TEXT, start_date DATE, end_date DATE
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT id, title, type, cover_emoji, cover_image_url, start_date, end_date
  FROM events
  WHERE user_id = p_user_id
    AND EXTRACT(YEAR FROM start_date) < EXTRACT(YEAR FROM CURRENT_DATE)
    AND (
      (EXTRACT(MONTH FROM start_date) = p_month AND EXTRACT(DAY FROM start_date) = p_day)
      OR
      (EXTRACT(MONTH FROM end_date) = p_month AND EXTRACT(DAY FROM end_date) = p_day)
    )
  ORDER BY start_date DESC
  LIMIT 10;
$$;
