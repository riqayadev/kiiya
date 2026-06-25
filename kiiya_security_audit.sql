-- ============================================================
-- Kiiya — Security & Stability Audit fixes (DB layer)
-- Run in the Supabase SQL Editor (project: tikssidjxhemwavgbbya).
-- Every statement is idempotent and safe to re-run.
--
-- Sections:
--   1. event_members RLS — fix infinite recursion (SECURITY DEFINER helper)
--   2. Non-negative money constraints (budget / amount / cost)
--   3. Length constraints on free-text fields (anti-abuse / storage)
--   4. expenses INSERT — verify event ownership (not just user_id)
--   5. Explicit WITH CHECK on profiles / events policies (defense in depth)
--   6. Storage bucket "avatars" — per-user folder RLS
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 1. event_members — infinite recursion fix
-- ────────────────────────────────────────────────────────────
-- The original SELECT policy referenced event_members from inside its own
-- USING clause:
--     auth.uid() IN (
--       SELECT user_id FROM events WHERE id = event_id
--       UNION
--       SELECT user_id FROM event_members em WHERE em.event_id = ...
--     )
-- Postgres raises "infinite recursion detected in policy for relation
-- event_members" because evaluating the policy re-triggers the policy. The
-- fix is a SECURITY DEFINER function that reads the table with RLS bypassed,
-- so the membership lookup does not recurse.
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_event_member(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    EXISTS (SELECT 1 FROM events WHERE id = p_event_id AND user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM event_members WHERE event_id = p_event_id AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION is_event_owner(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events WHERE id = p_event_id AND user_id = auth.uid()
  );
$$;

-- View: owner or any member of the event.
DROP POLICY IF EXISTS "Members can view event members" ON event_members;
CREATE POLICY "Members can view event members"
  ON event_members FOR SELECT
  USING (is_event_member(event_id));

-- Manage (insert/update/delete): only the event owner.
DROP POLICY IF EXISTS "Event owners can manage members" ON event_members;
CREATE POLICY "Event owners can manage members"
  ON event_members FOR ALL
  USING (is_event_owner(event_id))
  WITH CHECK (is_event_owner(event_id));


-- ════════════════════════════════════════════════════════════
-- 2. Non-negative money constraints
-- ────────────────────────────────────────────────────────────
-- BIGINT columns accepted negative values (UI min="0" is only a hint and is
-- bypassable). Enforce >= 0 at the database.
-- ════════════════════════════════════════════════════════════

DO $$ BEGIN
  ALTER TABLE events
    ADD CONSTRAINT events_budget_nonneg CHECK (budget >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE expenses
    ADD CONSTRAINT expenses_amount_nonneg CHECK (amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE itinerary_activities
    ADD CONSTRAINT activities_cost_nonneg CHECK (estimated_cost >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ════════════════════════════════════════════════════════════
-- 3. Length constraints on free-text fields
-- ────────────────────────────────────────────────────────────
-- No upper bound existed on titles, types, descriptions, notes or capsule
-- messages. Cap them so a single row cannot be used to store megabytes or to
-- break layouts. Limits are generous; tune as needed.
-- ════════════════════════════════════════════════════════════

DO $$ BEGIN
  ALTER TABLE events ADD CONSTRAINT events_title_len
    CHECK (char_length(title) <= 200);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE events ADD CONSTRAINT events_type_len
    CHECK (type IS NULL OR char_length(type) <= 50);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE events ADD CONSTRAINT events_description_len
    CHECK (description IS NULL OR char_length(description) <= 5000);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE wishes ADD CONSTRAINT wishes_title_len
    CHECK (char_length(title) <= 200);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE wishes ADD CONSTRAINT wishes_type_len
    CHECK (type IS NULL OR char_length(type) <= 50);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE wishes ADD CONSTRAINT wishes_description_len
    CHECK (description IS NULL OR char_length(description) <= 5000);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE time_capsules ADD CONSTRAINT time_capsules_message_len
    CHECK (char_length(message) <= 5000);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE mood_board_items ADD CONSTRAINT mood_content_len
    CHECK (char_length(content) <= 4000);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE mood_board_items ADD CONSTRAINT mood_label_len
    CHECK (label IS NULL OR char_length(label) <= 200);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE checklists ADD CONSTRAINT checklists_title_len
    CHECK (char_length(title) <= 500);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT profiles_bio_len
    CHECK (bio IS NULL OR char_length(bio) <= 500);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT profiles_username_len
    CHECK (username IS NULL OR char_length(username) <= 40);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ════════════════════════════════════════════════════════════
-- 4. expenses INSERT — verify event ownership
-- ────────────────────────────────────────────────────────────
-- The old INSERT policy only checked user_id = auth.uid(). A user could
-- therefore insert rows referencing an event_id they do not own (the row is
-- invisible to them on read, but it pollutes the real owner's budget view).
-- Require ownership of the parent event as well.
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can manage own expenses" ON expenses;
CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_event_owner(event_id));


-- ════════════════════════════════════════════════════════════
-- 5. Explicit WITH CHECK on profiles / events update policies
-- ────────────────────────────────────────────────────────────
-- When WITH CHECK is omitted Postgres falls back to the USING expression, so
-- these were not exploitable — but stating WITH CHECK explicitly documents the
-- intent and prevents a future edit to USING from silently widening writes.
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own events" ON events;
CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════
-- 6. Storage bucket "avatars" — per-user folder RLS
-- ────────────────────────────────────────────────────────────
-- Avatars are uploaded to "<auth.uid>/<timestamp>.<ext>" with upsert=true.
-- Without object-level policies, any authenticated user could upload to (and
-- overwrite) another user's path. Scope writes to the folder named after the
-- caller's UID. Reads stay public (the bucket is public for display).
-- ════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;
CREATE POLICY "Avatar images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- End of audit fixes.
-- ============================================================
