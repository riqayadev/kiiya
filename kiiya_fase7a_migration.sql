-- ============================================================
-- Kiiya — Fase 7A migration: Mood Board + Wish List
-- Run this in the Supabase SQL Editor (project: tikssidjxhemwavgbbya)
-- ============================================================

-- ── Mood Board items (per event) ──────────────────────────
CREATE TABLE IF NOT EXISTS mood_board_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'color', 'link', 'note')),
  content TEXT NOT NULL, -- URL for image/link, hex for color, text for note
  label TEXT,
  source TEXT, -- 'unsplash', 'url', 'manual'
  unsplash_author TEXT,
  unsplash_author_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mood_board_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own mood board items" ON mood_board_items;
CREATE POLICY "Users manage own mood board items"
ON mood_board_items
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS mood_board_items_event_id_idx
  ON mood_board_items (event_id, sort_order);

-- ── Wishes (bucket list → convert to event) ───────────────
CREATE TABLE IF NOT EXISTS wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT,
  cover_emoji TEXT DEFAULT '✨',
  cover_image_url TEXT,
  description TEXT,
  priority INT DEFAULT 2 CHECK (priority IN (1,2,3)), -- 1=high, 2=medium, 3=low
  converted_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own wishes" ON wishes;
CREATE POLICY "Users manage own wishes"
ON wishes
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS wishes_user_id_idx ON wishes (user_id, created_at DESC);
