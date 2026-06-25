-- ============================================================
-- Kiiya — Fase 7B migration: Time Capsule
-- Run this in the Supabase SQL Editor (project: tikssidjxhemwavgbbya)
-- Note: "On This Day" and "Annual Wrapped" reuse existing tables
-- (events / expenses / achievements) — no schema changes needed.
-- ============================================================

-- ── Time Capsules (sealed message per event, opens after end_date) ──
CREATE TABLE IF NOT EXISTS time_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  reveal_date DATE NOT NULL, -- same as event end_date, set on create
  opened_at TIMESTAMPTZ, -- null = still sealed
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own time capsules" ON time_capsules;
CREATE POLICY "Users manage own time capsules"
ON time_capsules
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS time_capsules_event_id_idx
  ON time_capsules (event_id);
