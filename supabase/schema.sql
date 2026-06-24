-- ═══════════════════════════════════════
-- EXTENSIONS
-- ═══════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════
-- HELPER: updated_at trigger
-- ═══════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════
-- TABLE: profiles
-- Auto-created saat user register
-- ═══════════════════════════════════════
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  preferred_lang TEXT DEFAULT 'en' CHECK (preferred_lang IN ('en', 'id')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile saat user register
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════
-- TABLE: events
-- Core table untuk semua life events
-- ═══════════════════════════════════════
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trip', 'wedding', 'anniversary', 'babymoon', 'graduation', 'custom')),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'archived')),
  description TEXT,
  cover_emoji TEXT DEFAULT '✨',
  cover_image_url TEXT,
  start_date DATE,
  end_date DATE,
  location TEXT,
  budget BIGINT DEFAULT 0,
  currency TEXT DEFAULT 'IDR',
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════
-- TABLE: event_members
-- Kolaborasi: invite anggota ke event
-- ═══════════════════════════════════════
CREATE TABLE event_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER event_members_updated_at
  BEFORE UPDATE ON event_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE event_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view event members"
  ON event_members FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM events WHERE id = event_id
      UNION
      SELECT user_id FROM event_members em WHERE em.event_id = event_members.event_id
    )
  );

CREATE POLICY "Event owners can manage members"
  ON event_members FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM events WHERE id = event_id
    )
  );

-- ═══════════════════════════════════════
-- TABLE: itinerary_days
-- Hari-hari dalam event
-- ═══════════════════════════════════════
CREATE TABLE itinerary_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE,
  title TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, day_number)
);

CREATE TRIGGER itinerary_days_updated_at
  BEFORE UPDATE ON itinerary_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own itinerary days"
  ON itinerary_days FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM events WHERE id = event_id
    )
  );

-- ═══════════════════════════════════════
-- TABLE: itinerary_activities
-- Aktivitas per hari
-- ═══════════════════════════════════════
CREATE TABLE itinerary_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_id UUID NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIME,
  end_time TIME,
  category TEXT DEFAULT 'general' CHECK (category IN ('transport', 'accommodation', 'food', 'activity', 'shopping', 'other', 'general')),
  estimated_cost BIGINT DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER itinerary_activities_updated_at
  BEFORE UPDATE ON itinerary_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE itinerary_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own activities"
  ON itinerary_activities FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM events WHERE id = event_id
    )
  );

-- ═══════════════════════════════════════
-- TABLE: expenses
-- Pengeluaran real-time per event
-- ═══════════════════════════════════════
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES itinerary_activities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'other' CHECK (category IN ('transport', 'accommodation', 'food', 'activity', 'shopping', 'other')),
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view event expenses"
  ON expenses FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM events WHERE id = event_id
    )
  );

CREATE POLICY "Users can manage own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════
-- TABLE: checklists
-- Packing list / to-do per event
-- ═══════════════════════════════════════
CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER checklists_updated_at
  BEFORE UPDATE ON checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own checklists"
  ON checklists FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM events WHERE id = event_id
    )
  );

-- ═══════════════════════════════════════
-- INDEXES untuk performance
-- ═══════════════════════════════════════
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_itinerary_days_event_id ON itinerary_days(event_id);
CREATE INDEX idx_itinerary_activities_day_id ON itinerary_activities(day_id);
CREATE INDEX idx_expenses_event_id ON expenses(event_id);
CREATE INDEX idx_checklists_event_id ON checklists(event_id);
CREATE INDEX idx_event_members_event_id ON event_members(event_id);
